// Dashboard View Logic — Phase 0.1 unified
// All risk display now reads from result.dimensions (DetectionEngine output)

const DashboardView = {
    render: () => {
        return `
            <div class="view-section active">
                <div id="dash-alerts-container"></div>
                <div class="stats-row" id="dash-stats">
                    <!-- Injected by JS -->
                </div>
                
                <div class="dashboard-grid">
                    <div class="traffic-stream-container">
                        <div class="stream-header">
                            <h2><span class="material-icons-round text-success">stream</span> Live Event Stream</h2>
                            <span class="badge text-muted" id="stream-count">0 Events</span>
                        </div>
                        <div class="stream-list" id="stream-list">
                            <div style="text-align: center; color: var(--text-tertiary); padding: 40px;">
                                Waiting for traffic...
                            </div>
                        </div>
                    </div>
                    
                    <div class="arch-overview">
                        <h2>ControlPlane Architecture</h2>
                        <div class="pipeline-viz">
                            <div class="pipeline-node active">
                                <div class="node-icon"><span class="material-icons-round">person</span></div>
                                <div class="node-info"><h4>User Request</h4><p>Intercepted before model</p></div>
                            </div>
                            <div class="pipeline-node active">
                                <div class="node-icon"><span class="material-icons-round">smart_toy</span></div>
                                <div class="node-info"><h4>AI Model</h4><p>Generates raw response</p></div>
                            </div>
                            <div class="pipeline-node active" style="border-left: 2px solid var(--accent-primary); padding-left: 14px; margin-left: 20px;">
                                <div class="node-icon" style="width: 32px; height: 32px;"><span class="material-icons-round" style="font-size: 16px;">bolt</span></div>
                                <div class="node-info"><h4>Tier 1 Checks</h4><p>Hard-block deterministic rules</p></div>
                            </div>
                            <div class="pipeline-node" style="border-left: 2px dashed var(--border-strong); padding-left: 14px; margin-left: 20px;" id="viz-grounding">
                                <div class="node-icon" style="width: 32px; height: 32px; background: rgba(59,130,246,0.1); color: var(--accent-primary);"><span class="material-icons-round" style="font-size: 16px;">library_books</span></div>
                                <div class="node-info"><h4>Corpus Grounding</h4><p>TF-IDF Retrieval & Claim Check</p></div>
                            </div>
                            <div class="pipeline-node" style="border-left: 2px dashed var(--border-strong); padding-left: 14px; margin-left: 20px;" id="viz-tier2">
                                <div class="node-icon" style="width: 32px; height: 32px; background: rgba(245,158,11,0.1); color: var(--status-warning);"><span class="material-icons-round" style="font-size: 16px;">gavel</span></div>
                                <div class="node-info"><h4>Tier 2 LLM Judge</h4><p>Contextual Ambiguity Resolution</p></div>
                            </div>
                            <div class="pipeline-node active">
                                <div class="node-icon"><span class="material-icons-round">route</span></div>
                                <div class="node-info"><h4>Routing Engine</h4><p>Pass, Warn, Review, Block</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: () => {
        DashboardView.updateStats(controlPlane.stats);
        DashboardView.renderHistory(controlPlane.stats.history);
        controlPlane.subscribe(DashboardView.onNewEvent);
    },

    updateStats: (stats) => {
        const statsRow = document.getElementById('dash-stats');
        if (!statsRow) return;

        const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
        // Real measured p50 latency from stats
        const avgLatency = stats.latencies.length > 0
            ? Math.round(stats.latencies.slice().sort((a, b) => a - b)[Math.floor(stats.latencies.length / 2)])
            : 0;

        statsRow.innerHTML = `
            <div class="stat-card">
                <span class="stat-title">Total Processed</span>
                <span class="stat-value">${stats.total}</span>
                <span class="stat-trend text-success"><span class="material-icons-round" style="font-size:14px">trending_up</span> Live</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Pass Rate</span>
                <span class="stat-value">${passRate}%</span>
                <span class="stat-trend text-muted">Cleared Tier 1 silently</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Blocked Outputs</span>
                <span class="stat-value text-danger">${stats.blocked}</span>
                <span class="stat-trend text-danger">Threats neutralized</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Avg Latency (p50)</span>
                <span class="stat-value text-neutral">${avgLatency}ms</span>
                <span class="stat-trend text-muted">Measured across all tiers</span>
            </div>
        `;
    },

    renderHistory: (history) => {
        const list = document.getElementById('stream-list');
        if (!list || history.length === 0) return;
        
        list.innerHTML = '';
        history.slice().reverse().forEach(evt => {
            DashboardView.appendEventCard(evt, list, false);
        });
        
        document.getElementById('stream-count').textContent = `${history.length} Events`;
    },

    onNewEvent: (evt) => {
        if (window.app.currentView !== 'dashboard') return;
        
        DashboardView.updateStats(evt.stats);
        
        const list = document.getElementById('stream-list');
        if (list) {
            if (list.children.length === 1 && list.children[0].tagName === 'DIV' && list.children[0].style.textAlign === 'center') {
                list.innerHTML = '';
            }
            
            DashboardView.appendEventCard(evt.data, list, true);
            document.getElementById('stream-count').textContent = `${evt.stats.history.length} Events`;

            // Phase 4.1: Systemic Drift Alerts
            DashboardView.checkSystemicDrift(evt.data.scenario.useCase.id, evt.stats.history);
        }
    },

    checkSystemicDrift: (useCaseId, history) => {
        // Find recent events for this use case
        const recent = history.filter(h => h.scenario.useCase.id === useCaseId).slice(-3);
        
        const container = document.getElementById('dash-alerts-container');
        if (!container) return;

        // Clean up old alerts
        container.innerHTML = '';

        if (recent.length === 3 && recent.every(h => h.result.action === 'BLOCK' || h.result.action === 'REVIEW')) {
            const useCaseName = recent[0].scenario.useCase.name;
            container.innerHTML = `
                <div style="background: rgba(239,68,68,0.1); border: 1px solid var(--status-danger); border-radius: 8px; padding: 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 12px;">
                    <span class="material-icons-round text-danger" style="font-size: 24px;">warning</span>
                    <div>
                        <h4 style="margin: 0 0 4px 0; color: var(--status-danger);">Engineering Escalation: Systemic Drift Detected</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">The <strong>${escapeHtml(useCaseName)}</strong> model has generated 3 consecutive unsafe responses requiring intervention (BLOCK/REVIEW). Immediate retraining or prompt engineering review is recommended.</p>
                    </div>
                </div>
            `;
        }
    },

    // Phase 0.1: Read from result.dimensions, not scenario.riskScores
    appendEventCard: (data, container, animate) => {
        const { scenario, result } = data;
        const icon = scenario.useCase.icon;
        const d = result.dimensions;
        
        let actionBadge = '';
        if (result.action === 'PASS') actionBadge = '<span class="badge pass">PASS</span>';
        if (result.action === 'WARN') actionBadge = '<span class="badge warn">WARN</span>';
        if (result.action === 'BLOCK') actionBadge = '<span class="badge block">BLOCK</span>';
        if (result.action === 'REVIEW') actionBadge = '<span class="badge review">REVIEW</span>';

        // Risk dots from real detection results
        const perfClass = d.performance.score > 0.5 ? 'block' : (d.performance.score > 0.2 ? 'warn' : 'pass');
        const costClass = d.cost.score > 0.5 ? 'block' : 'pass';
        const respClass = (d.responsibility.pii.score > 0.5 || d.responsibility.bias.score > 0.5 || d.responsibility.toxicity.score > 0.5) ? 'block' : 'pass';

        const card = document.createElement('div');
        card.className = 'interaction-card' + (animate ? ' card-enter' : '');
        card.onclick = () => {
            InspectionView.currentData = data;
            window.app.navigate('inspection');
        };

        let reviewBadge = '';
        if (data.humanReview) {
            reviewBadge = `<span class="badge" style="background: var(--bg-main); color: var(--text-secondary); border: 1px solid var(--border-subtle);">
                <span class="material-icons-round" style="font-size: 12px; margin-right: 2px;">done_all</span> Reviewed
            </span>`;
        }

        card.innerHTML = `
            <div class="ic-usecase">
                <span class="material-icons-round">${escapeHtml(icon)}</span>
            </div>
            <div class="ic-content">
                <div class="ic-top">
                    <span class="ic-title">${escapeHtml(scenario.useCase.name)}</span>
                    <div style="display:flex; gap:8px; align-items:center;">
                        ${reviewBadge}
                        ${actionBadge}
                    </div>
                </div>
                <div class="ic-text">"${escapeHtml(scenario.prompt)}"</div>
                <div class="ic-meta">
                    <span style="display:flex; align-items:center; gap:4px;"><span class="material-icons-round" style="font-size:14px;">timer</span> +${result.latency}ms</span>
                    <span style="display:flex; align-items:center; gap:4px;"><span class="material-icons-round" style="font-size:14px;">route</span> ${result.routing.replace('_', ' ')}</span>
                </div>
                <div class="ic-scores">
                    <div class="score-pip"><div class="score-dot ${perfClass}"></div> PERF</div>
                    <div class="score-pip"><div class="score-dot ${costClass}"></div> COST</div>
                    <div class="score-pip"><div class="score-dot ${respClass}"></div> RESP</div>
                </div>
            </div>
        `;

        container.insertBefore(card, container.firstChild);
        if (container.children.length > 50) {
            container.removeChild(container.lastChild);
        }
    }
};
