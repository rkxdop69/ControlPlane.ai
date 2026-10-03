// ControlPlane.ai — Analytics View (Phase 3)
// Renders metrics and charts. Uses Chart.js if available (CDN), otherwise gracefully degrades to vanilla DOM/CSS bar charts for offline demo environments.

const AnalyticsView = {
    _charts: {}, // Store chart instances to destroy/recreate
    
    render: () => {
        return `
            <div class="view-section active">
                <div class="metrics-row" id="analytics-metrics">
                    <!-- Metrics populated by JS -->
                </div>

                <div class="analytics-grid">
                    <div class="chart-card">
                        <h3><span class="material-icons-round text-primary">route</span> Routing Distribution</h3>
                        <div class="chart-container" id="chart-routing-container">
                            <canvas id="chart-routing"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card">
                        <h3><span class="material-icons-round text-warning">gavel</span> Violations by Type</h3>
                        <div class="chart-container" id="chart-violations-container">
                            <canvas id="chart-violations"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card" style="grid-column: 1 / -1;">
                        <h3><span class="material-icons-round text-neutral">speed</span> Latency Distribution (Tier 1 vs Tier 2)</h3>
                        <div class="chart-container" id="chart-latency-container" style="height: 250px;">
                            <canvas id="chart-latency"></canvas>
                        </div>
                    </div>
                </div>

                <!-- A.9: Confusion Matrix Evaluation -->
                <div class="evaluation-section" style="margin-top: 24px;">
                    <div class="chart-card" style="grid-column: 1 / -1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div>
                                <h3><span class="material-icons-round text-primary">analytics</span> Model Performance Evaluation</h3>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 0 0;">Computes precision, recall, and F1 score against static benchmark scenarios.</p>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <button class="btn btn-secondary" onclick="AnalyticsView.exportAuditLog()">
                                    <span class="material-icons-round">download</span> Export Audit Log
                                </button>
                                <button class="btn btn-primary" onclick="AnalyticsView.runEvaluation()">
                                    <span class="material-icons-round">play_arrow</span> Run Evaluation
                                </button>
                            </div>
                        </div>
                        <div id="evaluation-results" style="display: none;">
                            <!-- Filled dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: () => {
        controlPlane.subscribe(AnalyticsView.onNewEvent);
        AnalyticsView.updateDashboard();
    },

    onNewEvent: () => {
        if (window.app.currentView === 'analytics') {
            AnalyticsView.updateDashboard();
        }
    },

    updateDashboard: () => {
        const history = controlPlane.stats.history;
        if (history.length === 0) return;

        // Calculate Metrics
        let totalCostSaved = 0;
        let totalTier2 = 0;
        let blocked = 0;
        
        let piiViolations = 0;
        let biasViolations = 0;
        let toxViolations = 0;
        let halViolations = 0;
        let hsViolations = 0;
        
        const tier1Latencies = [];
        const tier2Latencies = [];
        
        let actionCounts = { PASS: 0, WARN: 0, REVIEW: 0, BLOCK: 0 };

        history.forEach(evt => {
            const result = evt.result;
            const d = result.dimensions;
            
            actionCounts[result.action]++;
            
            if (result.action === 'BLOCK') {
                blocked++;
                // If we blocked it at Tier 1, we saved the cost of the main LLM call.
                // Assuming a simulated main model cost based on prompt tokens
                if (d.cost && d.cost.meta) {
                    totalCostSaved += parseFloat(d.cost.meta.estimatedCost);
                }
            }

            if (result.routing === 'TIER_2') {
                totalTier2++;
                tier2Latencies.push(result.latency);
            } else {
                tier1Latencies.push(result.latency);
            }

            // Count Violations
            if (d.responsibility.pii.hasCritical || d.responsibility.pii.score > 0.5) piiViolations++;
            if (d.responsibility.bias.hasCritical || d.responsibility.bias.score > 0.5) biasViolations++;
            if (d.responsibility.toxicity.hasCritical || d.responsibility.toxicity.score > 0.5) toxViolations++;
            if (d.performance.score > 0.6) halViolations++;
            if (d.responsibility.highStakes.score > 0) hsViolations++;
        });

        // Top Metrics
        const metricsContainer = document.getElementById('analytics-metrics');
        if (metricsContainer) {
            metricsContainer.innerHTML = `
                <div class="metric-card">
                    <div class="metric-title">Interception Rate</div>
                    <div class="metric-value text-danger">${((blocked / history.length) * 100).toFixed(1)}%</div>
                    <div class="metric-subtitle">${blocked} requests blocked</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Tier 2 Escalations</div>
                    <div class="metric-value text-warning">${((totalTier2 / history.length) * 100).toFixed(1)}%</div>
                    <div class="metric-subtitle">Required contextual judge</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Est. Compute Saved</div>
                    <div class="metric-value text-success">$${totalCostSaved.toFixed(4)}</div>
                    <div class="metric-subtitle">Prevented model generation</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Avg Latency (Tier 1)</div>
                    <div class="metric-value text-neutral">${AnalyticsView._getMedian(tier1Latencies)}ms</div>
                    <div class="metric-subtitle">Deterministic overhead</div>
                </div>
            `;
        }

        // Render Charts
        const hasChartJs = typeof Chart !== 'undefined';
        
        const routingData = [actionCounts.PASS, actionCounts.WARN, actionCounts.REVIEW, actionCounts.BLOCK];
        const routingLabels = ['PASS', 'WARN', 'REVIEW', 'BLOCK'];
        const routingColors = ['#10b981', '#f59e0b', '#64748b', '#ef4444'];

        const violationData = [piiViolations, biasViolations, toxViolations, halViolations, hsViolations];
        const violationLabels = ['PII', 'Bias', 'Toxicity', 'Hallucination', 'High Stakes'];
        
        if (hasChartJs) {
            AnalyticsView._renderChartJsDonut('chart-routing', routingLabels, routingData, routingColors);
            AnalyticsView._renderChartJsBar('chart-violations', violationLabels, violationData);
            AnalyticsView._renderChartJsLatency('chart-latency', tier1Latencies, tier2Latencies);
        } else {
            // Offline Fallback
            AnalyticsView._renderFallbackBar('chart-routing-container', routingLabels, routingData, routingColors, 'Routing');
            AnalyticsView._renderFallbackBar('chart-violations-container', violationLabels, violationData, ['#3b82f6'], 'Violations');
            AnalyticsView._renderFallbackLatency('chart-latency-container', tier1Latencies, tier2Latencies);
        }
    },

    _getMedian: (arr) => {
        if (!arr || arr.length === 0) return 0;
        const sorted = arr.slice().sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    },

    exportAuditLog: () => {
        if (!controlPlane.auditLog || controlPlane.auditLog.length === 0) {
            alert('Audit log is empty.');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(controlPlane.auditLog, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "controlplane_audit_log.json");
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    },

    runEvaluation: async () => {
        if (typeof SCENARIOS === 'undefined' || SCENARIOS.length === 0) return;

        const metricsByUseCase = {};
        let totalTP = 0, totalFP = 0, totalTN = 0, totalFN = 0;

        for (const s of SCENARIOS) {
            const expected = s.expectedAction;
            // Run evaluation live against the scenario
            const result = await DetectionEngine.analyzeFullResponse(s.prompt, s.response, s.useCase.id);
            const actual = result.action;
            
            const isExpectedUnsafe = expected === 'BLOCK' || expected === 'WARN' || expected === 'NOT_PASS' || expected === 'REVIEW';
            const isActualUnsafe = actual === 'BLOCK' || actual === 'WARN' || actual === 'REVIEW';

            let tp = 0, fp = 0, tn = 0, fn = 0;
            if (isExpectedUnsafe && isActualUnsafe) tp = 1;
            else if (!isExpectedUnsafe && isActualUnsafe) fp = 1;
            else if (!isExpectedUnsafe && !isActualUnsafe) tn = 1;
            else if (isExpectedUnsafe && !isActualUnsafe) fn = 1;
            
            totalTP += tp; totalFP += fp; totalTN += tn; totalFN += fn;

            if (!metricsByUseCase[s.useCase.name]) {
                metricsByUseCase[s.useCase.name] = { tp: 0, fp: 0, tn: 0, fn: 0 };
            }
            metricsByUseCase[s.useCase.name].tp += tp;
            metricsByUseCase[s.useCase.name].fp += fp;
            metricsByUseCase[s.useCase.name].tn += tn;
            metricsByUseCase[s.useCase.name].fn += fn;
        }

        const calcF1 = (tp, fp, fn) => {
            const precision = tp + fp > 0 ? (tp / (tp + fp)) : 0;
            const recall = tp + fn > 0 ? (tp / (tp + fn)) : 0;
            return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
        };
        const calcPrecision = (tp, fp) => tp + fp > 0 ? (tp / (tp + fp)) : 0;
        const calcRecall = (tp, fn) => tp + fn > 0 ? (tp / (tp + fn)) : 0;

        const f1 = calcF1(totalTP, totalFP, totalFN);
        const precision = calcPrecision(totalTP, totalFP);
        const recall = calcRecall(totalTP, totalFN);

        let breakdownHtml = `<div style="margin-top: 24px;"><h4>Per-Use Case Breakdown</h4><div style="display:flex; gap:16px; margin-top:12px;">`;
        for (const [uc, m] of Object.entries(metricsByUseCase)) {
            const ucF1 = calcF1(m.tp, m.fp, m.fn);
            breakdownHtml += `
                <div style="flex:1; background:var(--bg-surface); padding:12px; border-radius:8px; border:1px solid var(--border-subtle);">
                    <div style="font-weight:bold; font-size:13px; margin-bottom:8px; color:var(--text-primary);">${uc}</div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;"><span style="color:var(--text-secondary);">F1 Score</span> <span>${(ucF1 * 100).toFixed(1)}%</span></div>
                    <div style="display:flex; justify-content:space-between; font-size:12px;"><span style="color:var(--text-secondary);">TP / FP</span> <span>${m.tp} / ${m.fp}</span></div>
                </div>
            `;
        }
        breakdownHtml += `</div></div>`;

        const resEl = document.getElementById('evaluation-results');
        resEl.style.display = 'block';
        resEl.innerHTML = `
            <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--primary); margin-top: 16px; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: var(--text-primary);"><strong>Note:</strong> These metrics are calculated dynamically against a static set of benchmark scenarios to provide a standardized performance baseline across policy configurations.</p>
            </div>
            <div style="display: flex; gap: 24px; margin-top: 16px;">
                <div style="flex: 1; background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; text-align: center;">
                        <thead>
                            <tr style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle);">
                                <th style="padding: 12px; border-right: 1px solid var(--border-subtle);"></th>
                                <th style="padding: 12px; border-right: 1px solid var(--border-subtle);">Predicted Unsafe</th>
                                <th style="padding: 12px;">Predicted Safe</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                <td style="padding: 12px; border-right: 1px solid var(--border-subtle); background: var(--bg-surface); font-weight: bold;">Actual Unsafe</td>
                                <td style="padding: 12px; border-right: 1px solid var(--border-subtle); background: rgba(34,197,94,0.1); color: var(--success); font-weight: bold;">TP: ${totalTP}</td>
                                <td style="padding: 12px; background: rgba(239,68,68,0.1); color: var(--danger); font-weight: bold;">FN: ${totalFN}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-right: 1px solid var(--border-subtle); background: var(--bg-surface); font-weight: bold;">Actual Safe</td>
                                <td style="padding: 12px; border-right: 1px solid var(--border-subtle); background: rgba(245,158,11,0.1); color: var(--warning); font-weight: bold;">FP: ${totalFP}</td>
                                <td style="padding: 12px; background: rgba(34,197,94,0.1); color: var(--success); font-weight: bold;">TN: ${totalTN}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
                    <div style="background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary); font-weight: bold;">Precision</span>
                        <span style="font-size: 18px; color: var(--primary);">${(precision * 100).toFixed(1)}%</span>
                    </div>
                    <div style="background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary); font-weight: bold;">Recall</span>
                        <span style="font-size: 18px; color: var(--primary);">${(recall * 100).toFixed(1)}%</span>
                    </div>
                    <div style="background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary); font-weight: bold;">F1 Score (Overall)</span>
                        <span style="font-size: 18px; color: var(--primary);">${(f1 * 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
            ${breakdownHtml}
        `;
    },

    // =====================================================================
    //  CHART.JS IMPLEMENTATION
    // =====================================================================
    _renderChartJsDonut: (id, labels, data, colors) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        if (AnalyticsView._charts[id]) AnalyticsView._charts[id].destroy();
        
        AnalyticsView._charts[id] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } },
                cutout: '70%'
            }
        });
    },

    _renderChartJsBar: (id, labels, data) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        if (AnalyticsView._charts[id]) AnalyticsView._charts[id].destroy();
        
        AnalyticsView._charts[id] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Count', data, backgroundColor: '#3b82f6', borderRadius: 4 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    },

    _renderChartJsLatency: (id, tier1, tier2) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        if (AnalyticsView._charts[id]) AnalyticsView._charts[id].destroy();
        
        // Group into bins (last 20 events)
        const labels = Array.from({length: Math.min(20, Math.max(tier1.length, tier2.length))}, (_, i) => `T-${20-i}`);
        
        AnalyticsView._charts[id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Tier 1 (Deterministic)', data: tier1.slice(-20), borderColor: '#10b981', tension: 0.4, borderWidth: 2 },
                    { label: 'Tier 2 (LLM Judge)', data: tier2.slice(-20), borderColor: '#f59e0b', tension: 0.4, borderWidth: 2 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
                scales: {
                    y: { title: { display: true, text: 'Latency (ms)', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { display: false } }
                }
            }
        });
    },

    // =====================================================================
    //  OFFLINE FALLBACK (Vanilla DOM)
    // =====================================================================
    _renderFallbackBar: (containerId, labels, data, colors, title) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const maxVal = Math.max(...data, 1);
        
        let barsHtml = data.map((val, i) => {
            const heightPct = (val / maxVal) * 100;
            const color = colors.length > 1 ? colors[i] : colors[0];
            return `
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="height:200px; display:flex; align-items:flex-end;">
                        <div class="fallback-bar" style="height:${heightPct}%; background:${color};">${val > 0 ? val : ''}</div>
                    </div>
                    <div class="fallback-label" style="margin-top:8px;">${labels[i]}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="fallback-chart">
                <div class="offline-notice"><span class="material-icons-round" style="font-size:12px;">wifi_off</span> Offline Fallback</div>
                <div style="display:flex; justify-content:space-around; width:100%; padding:0 20px;">
                    ${barsHtml}
                </div>
            </div>
        `;
    },

    _renderFallbackLatency: (containerId, tier1, tier2) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const t1Med = AnalyticsView._getMedian(tier1);
        const t2Med = AnalyticsView._getMedian(tier2);

        container.innerHTML = `
            <div class="fallback-chart" style="justify-content:center; gap:20px;">
                <div class="offline-notice"><span class="material-icons-round" style="font-size:12px;">wifi_off</span> Offline Fallback</div>
                <div style="display:flex; align-items:center; gap:20px; width:80%; border:1px solid var(--border-strong); border-radius:8px; padding:20px;">
                    <div style="flex:1; text-align:center;">
                        <div style="color:var(--status-success); font-size:32px; font-weight:bold;">${t1Med}ms</div>
                        <div class="text-muted" style="font-size:12px;">Tier 1 Median</div>
                    </div>
                    <div style="width:2px; height:50px; background:var(--border-strong);"></div>
                    <div style="flex:1; text-align:center;">
                        <div style="color:var(--status-warning); font-size:32px; font-weight:bold;">${t2Med > 0 ? t2Med : '--'}ms</div>
                        <div class="text-muted" style="font-size:12px;">Tier 2 Median</div>
                    </div>
                </div>
            </div>
        `;
    }
};
