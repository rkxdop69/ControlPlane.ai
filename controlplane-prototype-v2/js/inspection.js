// Inspection View Logic — Phase 0.1 unified
// Reads all data from result.dimensions (DetectionEngine output).
// Uses result.redactedResponse instead of hardcoded string replacement.
// Applies escapeHtml to all user-controlled text (Phase 0.5).

const InspectionView = {
    currentData: null,

    render: () => {
        if (!InspectionView.currentData) {
            return `
                <div class="view-section active">
                    <div style="text-align:center; padding:100px; color:var(--text-tertiary);">
                        <span class="material-icons-round" style="font-size:48px; margin-bottom:16px;">search_off</span>
                        <h2>No Interaction Selected</h2>
                        <p>Go to Live Traffic and select an event to inspect.</p>
                        <button class="btn btn-primary" onclick="window.app.navigate('dashboard')" style="margin-top:20px;">Return to Dashboard</button>
                    </div>
                </div>
            `;
        }

        const { scenario, result } = InspectionView.currentData;
        const d = result.dimensions;

        let iconColor = 'var(--status-success)';
        let decisionIcon = 'check_circle';
        if (result.action === 'WARN') { iconColor = 'var(--status-warning)'; decisionIcon = 'warning'; }
        if (result.action === 'BLOCK') { iconColor = 'var(--status-danger)'; decisionIcon = 'cancel'; }
        if (result.action === 'REVIEW') { iconColor = 'var(--status-neutral)'; decisionIcon = 'rate_review'; }

        // Build PII-highlighted response using real detected spans
        let displayResponse = escapeHtml(scenario.response);
        if (d.responsibility.pii.findings.length > 0) {
            // Apply highlighting to detected PII values
            d.responsibility.pii.findings.forEach(finding => {
                if (finding.value) {
                    const escaped = escapeHtml(finding.value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    displayResponse = displayResponse.replace(
                        new RegExp(escaped, 'g'),
                        `<span class="highlight-danger" title="${escapeHtml(finding.type)} (${finding.validated ? 'Validated: ' + finding.validationMethod : 'Unvalidated'})">${escapeHtml(finding.value)}</span>`
                    );
                }
            });
        }

        // Score helper
        const scoreClass = (val, thresh) => val > thresh ? 'text-danger' : 'text-success';
        const pctStr = (val) => (val * 100).toFixed(0) + '%';

        // Build findings list HTML
        const buildFindings = (items, labelKey, detailKey) => {
            if (!items || items.length === 0) return '<span class="text-muted" style="font-size:13px;">No issues detected ✓</span>';
            return items.map(item => {
                const sev = item.severity || 'INFO';
                const sevClass = sev === 'CRITICAL' ? 'block' : sev === 'HIGH' ? 'warn' : 'pass';
                return `
                    <div class="finding-item">
                        <span class="finding-badge ${sevClass}">${escapeHtml(sev)}</span>
                        <div class="finding-text">
                            <strong>${escapeHtml(item[labelKey] || item.type)}</strong>
                            <span class="text-muted">${escapeHtml(item[detailKey] || item.detail || item.value || '')}</span>
                            ${item.validationMethod ? '<span class="text-muted" style="font-size:11px;">[' + escapeHtml(item.validationMethod) + ']</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        };

        // Fallback HTML
        let fallbackHtml = '';
        if (result.fallbackMessage) {
            fallbackHtml = `
                <div class="fallback-section" style="margin-top:16px;">
                    <h3 style="font-size:14px; display:flex; align-items:center; gap:8px; margin-bottom:8px; color:var(--status-neutral);">
                        <span class="material-icons-round" style="font-size:18px;">swap_horiz</span> Safe Fallback
                    </h3>
                    <div class="fallback-message" style="padding:12px; background:rgba(59,130,246,0.05); border:1px dashed rgba(59,130,246,0.3); border-radius:6px; font-size:13px; color:var(--text-secondary); font-style:italic;">
                        ${escapeHtml(result.fallbackMessage)}
                    </div>
                </div>
            `;
        }

        // Redacted response HTML
        let redactedHtml = '';
        if (result.redactedResponse && result.redactedResponse !== scenario.response) {
            redactedHtml = `
                <div style="margin-top:16px;">
                    <div class="msg-label"><span class="material-icons-round" style="font-size:14px;">visibility_off</span> Auto-Redacted Output</div>
                    <div class="msg-bubble" style="background:rgba(245,158,11,0.05); border:1px dashed rgba(245,158,11,0.3); font-family:monospace; font-size:12px; white-space:pre-wrap;">${escapeHtml(result.redactedResponse)}</div>
                </div>
            `;
        }

        return `
            <div class="view-section active">
                <div class="panel-header">
                    <h3>
                        <span class="material-icons-round">${escapeHtml(scenario.useCase.icon)}</span> 
                        ${escapeHtml(scenario.useCase.name)} 
                        <span class="text-muted" style="margin-left:8px; font-weight:normal; font-size:14px;">Event ID: ${escapeHtml(scenario.id)}</span>
                    </h3>
                    <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">
                        <span class="material-icons-round">arrow_back</span> Back to Stream
                    </button>
                </div>

                <div class="inspection-layout">
                    <!-- Left: Interaction Viewer -->
                    <div class="interaction-viewer">
                        <div class="message msg-user">
                            <div class="msg-label"><span class="material-icons-round" style="font-size:14px;">person</span> User Input</div>
                            <div class="msg-bubble">${escapeHtml(scenario.prompt)}</div>
                        </div>
                        
                        <div style="text-align:center; color:var(--text-tertiary); font-size:12px; margin: 8px 0;">
                            &#8595; Processed by AI Model &#8595;
                        </div>

                        <div class="message msg-ai">
                            <div class="msg-label"><span class="material-icons-round" style="font-size:14px;">smart_toy</span> AI Output (Intercepted)</div>
                            <div class="msg-bubble">${displayResponse}</div>
                        </div>

                        ${redactedHtml}
                        ${fallbackHtml}
                    </div>

                    <!-- Right: Analysis Panel -->
                    <div class="analysis-panel">
                        <div class="routing-decision">
                            <div class="decision-info">
                                <h2 style="color: ${iconColor}">${result.action}</h2>
                                <p>${escapeHtml(result.reason)}</p>
                                <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
                                    <span class="badge" style="background:var(--bg-base); border:1px solid var(--border-subtle); color:var(--text-secondary);">
                                        Latency: +${result.latency}ms
                                    </span>
                                    <span class="badge" style="background:var(--bg-base); border:1px solid var(--border-subtle); color:var(--text-secondary);">
                                        ${result.routing.replace('_', ' ')}
                                    </span>
                                    <span class="badge" style="background:var(--bg-base); border:1px solid var(--border-subtle); color:var(--text-secondary);">
                                        Confidence: ${result.confidence}
                                    </span>
                                </div>
                            </div>
                            <div class="decision-icon" style="color: ${iconColor}">
                                <span class="material-icons-round" style="font-size: 48px;">${decisionIcon}</span>
                            </div>
                        </div>

                        <!-- Phase 4.2: Request Human Review Resolution -->
                        ${result.action === 'REVIEW' ? `
                        <div class="dimension-card" style="border: 1px solid var(--status-neutral); background: rgba(148,163,184,0.05); margin-bottom: 20px;">
                            <div style="padding: 16px;">
                                <h4 style="margin: 0 0 8px 0; color: var(--text-primary);"><span class="material-icons-round" style="font-size: 16px; vertical-align: middle;">how_to_reg</span> Human Review Required</h4>
                                <p style="margin: 0 0 16px 0; color: var(--text-secondary); font-size: 13px;">This response requires human verification before it can be delivered to the user.</p>
                                
                                <div style="margin-bottom: 12px;">
                                    <label style="display:block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">Reviewer Justification ("Why?"):</label>
                                    <input type="text" id="review-justification" style="width: 100%; padding: 8px; border: 1px solid var(--border-strong); border-radius: 4px; background: var(--bg-surface); color: var(--text-primary);" placeholder="Enter reason for approval or block..." onkeyup="document.getElementById('btn-approve').disabled = !this.value.trim(); document.getElementById('btn-block').disabled = !this.value.trim();">
                                </div>

                                <div style="display: flex; gap: 12px;">
                                    <button id="btn-approve" class="btn btn-primary" onclick="InspectionView.resolveReview('Approve')" disabled style="flex: 1; background: var(--status-success); border-color: var(--status-success);">Approve to Send</button>
                                    <button id="btn-block" class="btn btn-primary" onclick="InspectionView.resolveReview('Block')" disabled style="flex: 1; background: var(--status-danger); border-color: var(--status-danger);">Confirm Block</button>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Tier 2 Judge Output -->
                        ${result.judgeOutput && Object.keys(result.judgeOutput).length > 0 ? `
                        <div class="dimension-card" style="border: 1px solid var(--status-warning);">
                            <div class="dim-header" style="background: rgba(245,158,11,0.1);">
                                <h4><span class="material-icons-round text-warning">gavel</span> Tier 2 LLM Judge</h4>
                                <span class="dim-status text-warning">Context Evaluated</span>
                            </div>
                            <div class="dim-body" style="background: var(--bg-surface);">
                                <div style="font-family: monospace; font-size: 11px; white-space: pre-wrap; color: var(--text-secondary);">${escapeHtml(JSON.stringify(result.judgeOutput, null, 2))}</div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Performance -->
                        <div class="dimension-card">
                            <div class="dim-header">
                                <h4><span class="material-icons-round text-neutral">speed</span> Performance</h4>
                                <span class="dim-status ${scoreClass(d.performance.score, 0.5)}">${d.performance.score > 0.5 ? 'High Risk' : 'Clear'}</span>
                            </div>
                            <div class="dim-body">
                                <div class="check-item">
                                    <span class="check-name">Hallucination Risk</span>
                                    <span class="check-value ${scoreClass(d.performance.score, 0.5)}">Risk: ${pctStr(d.performance.score)}</span>
                                </div>
                                <div class="check-item">
                                    <span class="check-name">Confidence Language</span>
                                    <span class="check-value">${pctStr(d.performance.confidenceScore)}</span>
                                </div>
                                <div class="check-item">
                                    <span class="check-name">Grounding Failure</span>
                                    <span class="check-value ${scoreClass(d.performance.groundingScore, 0.5)}">${pctStr(d.performance.groundingScore)}</span>
                                </div>
                                ${d.performance.groundingAnalysis ? `
                                <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-subtle); font-size:12px;">
                                    <strong>Corpus Verification:</strong> ${escapeHtml(d.performance.groundingAnalysis.summary)}
                                    <div style="display:flex; gap:8px; margin-top:4px;">
                                        <span class="badge pass" style="font-size:10px;">Supported: ${d.performance.groundingAnalysis.supportedCount}</span>
                                        <span class="badge ${d.performance.groundingAnalysis.contradictedCount > 0 ? 'block' : 'pass'}" style="font-size:10px;">Contradicted: ${d.performance.groundingAnalysis.contradictedCount}</span>
                                        <span class="badge ${d.performance.groundingAnalysis.unsupportedRatio > 0.5 ? 'warn' : 'pass'}" style="font-size:10px;">Unsupported: ${d.performance.groundingAnalysis.unsupportedCount}</span>
                                    </div>
                                </div>
                                ` : ''}
                                ${d.performance.signals.length > 0 ? '<div style="margin-top:8px; border-top:1px dashed var(--border-subtle); padding-top:8px;">' + buildFindings(d.performance.signals, 'type', 'detail') + '</div>' : ''}
                            </div>
                        </div>

                        <!-- Responsibility -->
                        <div class="dimension-card">
                            <div class="dim-header">
                                <h4><span class="material-icons-round text-neutral">shield</span> Responsibility</h4>
                                <span class="dim-status ${(d.responsibility.pii.score > 0.5 || d.responsibility.bias.score > 0.5 || d.responsibility.toxicity.score > 0.5) ? 'text-danger' : 'text-success'}">
                                    ${(d.responsibility.pii.score > 0.5 || d.responsibility.bias.score > 0.5 || d.responsibility.toxicity.score > 0.5) ? 'Violation Detected' : 'Clear'}
                                </span>
                            </div>
                            <div class="dim-body">
                                <div class="check-item">
                                    <span class="check-name">PII Leakage ${d.responsibility.pii.hasCritical ? '⚠ CRITICAL' : ''}</span>
                                    <span class="check-value ${scoreClass(d.responsibility.pii.score, 0.5)}">Risk: ${pctStr(d.responsibility.pii.score)}</span>
                                </div>
                                ${d.responsibility.pii.findings.length > 0 ? '<div style="margin:4px 0 8px 0;">' + buildFindings(d.responsibility.pii.findings, 'type', 'value') + '</div>' : ''}
                                <div class="check-item">
                                    <span class="check-name">Toxicity ${d.responsibility.toxicity.hasCritical ? '⚠ CRITICAL' : ''}</span>
                                    <span class="check-value ${scoreClass(d.responsibility.toxicity.score, 0.5)}">${pctStr(d.responsibility.toxicity.score)}</span>
                                </div>
                                ${d.responsibility.toxicity.signals.length > 0 ? '<div style="margin:4px 0 8px 0;">' + buildFindings(d.responsibility.toxicity.signals, 'type', 'detail') + '</div>' : ''}
                                <div class="check-item">
                                    <span class="check-name">Bias ${d.responsibility.bias.isEducational ? '(Educational)' : ''}</span>
                                    <span class="check-value ${scoreClass(d.responsibility.bias.score, 0.5)}">${pctStr(d.responsibility.bias.score)}</span>
                                </div>
                                ${d.responsibility.bias.signals.length > 0 ? '<div style="margin:4px 0 8px 0;">' + buildFindings(d.responsibility.bias.signals, 'type', 'detail') + '</div>' : ''}
                            </div>
                        </div>

                        <!-- High-Stakes -->
                        ${d.responsibility.highStakes.score > 0 ? `
                        <div class="dimension-card">
                            <div class="dim-header">
                                <h4><span class="material-icons-round text-neutral">gavel</span> High-Stakes Decisions</h4>
                                <span class="dim-status text-danger">Detected</span>
                            </div>
                            <div class="dim-body">
                                ${buildFindings(d.responsibility.highStakes.signals, 'type', 'detail')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Cost -->
                        <div class="dimension-card">
                            <div class="dim-header">
                                <h4><span class="material-icons-round text-neutral">payments</span> Cost & Efficiency</h4>
                                <span class="dim-status ${d.cost.score > 0.4 ? 'text-warning' : 'text-success'}">${d.cost.score > 0.4 ? 'Anomaly Detected' : 'Normal'}</span>
                            </div>
                            <div class="dim-body">
                                <div class="check-item">
                                    <span class="check-name">Cost Risk</span>
                                    <span class="check-value ${d.cost.score > 0.4 ? 'text-warning' : ''}">Risk: ${pctStr(d.cost.score)}</span>
                                </div>
                                <div class="check-item">
                                    <span class="check-name">Tokens</span>
                                    <span class="check-value">${d.cost.meta.promptTokens} in / ${d.cost.meta.responseTokens} out</span>
                                </div>
                                <div class="check-item">
                                    <span class="check-name">Est. Cost</span>
                                    <span class="check-value">$${d.cost.meta.estimatedCost}</span>
                                </div>
                                ${d.cost.signals.length > 0 ? '<div style="margin-top:8px; border-top:1px dashed var(--border-subtle); padding-top:8px;">' + buildFindings(d.cost.signals, 'type', 'detail') + '</div>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    resolveReview: (decision) => {
        if (!InspectionView.currentData) return;
        
        const justInput = document.getElementById('review-justification');
        const reviewerNote = justInput ? justInput.value.trim() : '';

        // Update local state for UI
        InspectionView.currentData.result.action = decision === 'Approve' ? 'PASS' : 'BLOCK';
        InspectionView.currentData.result.reason = `Human reviewer selected: ${decision === 'Approve' ? 'Approved for delivery' : 'Confirmed block'}`;
        
        // A.8: Persist to Audit Log
        if (typeof controlPlane !== 'undefined' && controlPlane.auditLog) {
            const auditEvent = controlPlane.auditLog.find(e => e.requestId === InspectionView.currentData.scenario.id);
            if (auditEvent) {
                auditEvent.humanReview = {
                    decision: decision,
                    timestamp: new Date().toISOString(),
                    reviewerNote: reviewerNote
                };
            }
            
            // Update history array as well so the dashboard badge shows up
            const historyEvent = controlPlane.stats.history.find(h => h.scenario.id === InspectionView.currentData.scenario.id);
            if (historyEvent) {
                historyEvent.data.humanReview = auditEvent.humanReview;
            }

            // Task 1: Feedback Loop implementation
            const useCaseId = InspectionView.currentData.scenario.useCase.id;
            const reason = InspectionView.currentData.result.reason;
            let dimensionKey = null;

            if (reason.includes("PII")) dimensionKey = "resp_pii_block";
            else if (reason.includes("hallucination") || reason.includes("Grounding")) dimensionKey = "perf_hallucination_block";
            else if (reason.includes("bias")) dimensionKey = "resp_bias_block";
            else dimensionKey = "perf_hallucination_block"; // fallback

            const overrides = controlPlane.stats.humanOverrides;
            const trackerKey = `${useCaseId}_${dimensionKey}`;
            if (!overrides[trackerKey]) overrides[trackerKey] = 0;

            if (decision === 'Approve') {
                overrides[trackerKey]++;
            } else {
                overrides[trackerKey]--;
            }

            if (Math.abs(overrides[trackerKey]) >= 3) {
                const policy = controlPlane.policies[useCaseId];
                if (policy && policy[dimensionKey] !== undefined) {
                    const direction = overrides[trackerKey] > 0 ? 0.1 : -0.1;
                    const warnKey = dimensionKey.replace('_block', '_warn');
                    const warnThresh = policy[warnKey] || 0.1;
                    
                    let newThresh = policy[dimensionKey] + direction;
                    newThresh = Math.max(warnThresh + 0.01, Math.min(1.0, newThresh)); // clamp
                    
                    policy[dimensionKey] = newThresh;
                    
                    controlPlane.auditLog.push({
                        requestId: 'SYS-' + Date.now(),
                        timestamp: new Date().toISOString(),
                        useCaseId: useCaseId,
                        event: 'POLICY_AUTO_ADJUST',
                        detail: `Auto-adjusted ${dimensionKey} to ${newThresh.toFixed(2)} due to ${Math.abs(overrides[trackerKey])} consecutive human ${direction > 0 ? 'approvals' : 'blocks'}.`
                    });
                    
                    overrides[trackerKey] = 0; // reset
                    
                    // Force UI update if PolicyView is active
                    if (window.app && window.app.currentView === 'policy' && typeof PolicyView !== 'undefined') {
                        if (PolicyView.currentTab === useCaseId) {
                            PolicyView.renderTabContent(useCaseId);
                        }
                    }
                }
            }
        }

        // Re-render the view with the new state
        window.app.navigate('inspection');
    },

    init: () => {
        // Post-render logic if needed
    }
};
