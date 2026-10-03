// Policy Engine View Logic

const PolicyView = {
    currentTab: 'cs_bot', // Default

    render: () => {
        return `
            <div class="view-section active policy-layout">
                <div class="policy-tabs">
                    <button class="tab-btn active" data-tab="cs_bot" onclick="PolicyView.switchTab('cs_bot')">Customer Support Bot</button>
                    <button class="tab-btn" data-tab="int_kb" onclick="PolicyView.switchTab('int_kb')">Internal Knowledge Base</button>
                    <button class="tab-btn" data-tab="reg_tool" onclick="PolicyView.switchTab('reg_tool')">Regulatory Decision Tool</button>
                </div>

                <div class="policy-content" id="policy-content-area">
                    <!-- Injected by JS based on selected tab -->
                </div>
                
                <div style="margin-top:24px; padding:16px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:8px; display:flex; gap:16px;">
                    <span class="material-icons-round text-primary" style="color:var(--accent-primary);">info</span>
                    <div>
                        <h4 style="font-size:14px; margin-bottom:4px; color:var(--text-primary);">Real-time Policy Enforcement</h4>
                        <p style="font-size:13px; color:var(--text-secondary);">Changes made here instantly affect how ControlPlane routes traffic. Try tightening the Hallucination threshold for the Support Bot, then watch the live traffic stream.</p>
                    </div>
                </div>
            </div>
        `;
    },

    init: () => {
        PolicyView.renderTabContent(PolicyView.currentTab);
    },

    switchTab: (tabId) => {
        PolicyView.currentTab = tabId;
        
        // Update UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        PolicyView.renderTabContent(tabId);
    },

    renderTabContent: (tabId) => {
        const container = document.getElementById('policy-content-area');
        if (!container) return;

        const policy = controlPlane.policies[tabId];
        const useCase = Object.values(USE_CASES).find(u => u.id === tabId);

        container.innerHTML = `
            <div class="policy-card">
                <div class="policy-header">
                    <div>
                        <h3>Performance & Hallucination</h3>
                        <p class="policy-desc">Determine at what confidence level a claim is routed for secondary review or blocked entirely.</p>
                    </div>
                </div>
                
                <div class="config-group">
                    <div class="config-item">
                        <div>
                            <span class="config-label">Tier 2 Review Threshold</span>
                            <span class="config-desc">Trigger LLM Judge if hallucination probability exceeds:</span>
                        </div>
                        <input type="range" id="slider_perf_warn" min="0" max="100" value="${policy.perf_hallucination_warn * 100}" 
                               oninput="document.getElementById('val_perf_warn').innerText = this.value + '%'; PolicyView.updatePolicy('${tabId}', 'perf_hallucination_warn', this.value/100)">
                        <span class="range-value text-warning" id="val_perf_warn">${(policy.perf_hallucination_warn * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div class="config-item">
                        <div>
                            <span class="config-label">Auto-Block Threshold</span>
                            <span class="config-desc">Block request immediately if hallucination probability exceeds:</span>
                        </div>
                        <input type="range" id="slider_perf_block" min="0" max="100" value="${policy.perf_hallucination_block * 100}"
                               oninput="document.getElementById('val_perf_block').innerText = this.value + '%'; PolicyView.updatePolicy('${tabId}', 'perf_hallucination_block', this.value/100)">
                        <span class="range-value text-danger" id="val_perf_block">${(policy.perf_hallucination_block * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            <div class="policy-card">
                <div class="policy-header">
                    <div>
                        <h3>Responsibility & Safety</h3>
                        <p class="policy-desc">Strict controls for PII leakage, toxicity, and biased reasoning.</p>
                    </div>
                </div>
                
                <div class="config-group">
                    <div class="config-item">
                        <div>
                            <span class="config-label">PII Block Threshold</span>
                            <span class="config-desc">Strictness of PII detection (lower means more sensitive):</span>
                        </div>
                        <input type="range" id="slider_resp_pii" min="0" max="100" value="${policy.resp_pii_block * 100}"
                               oninput="document.getElementById('val_resp_pii').innerText = this.value + '%'; PolicyView.updatePolicy('${tabId}', 'resp_pii_block', this.value/100)">
                        <span class="range-value text-danger" id="val_resp_pii">${(policy.resp_pii_block * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div class="config-item" style="border-top:1px dashed var(--border-subtle); padding-top:20px;">
                        <div>
                            <span class="config-label">Regulatory Profile</span>
                            <span class="config-desc">Apply jurisdiction-specific compliance rules (e.g. GDPR, HIPAA)</span>
                        </div>
                        <div style="grid-column: 2 / span 2; display: flex; justify-content: flex-end;">
                            <select onchange="PolicyView.updateRegulatory('${tabId}', this.value)" style="padding:4px 8px; border-radius:4px; border:1px solid var(--border-subtle); background:var(--bg-main); color:var(--text-primary);">
                                <option value="NONE" ${policy.regulatory_profile === 'NONE' ? 'selected' : ''}>None (Baseline)</option>
                                <option value="GDPR" ${policy.regulatory_profile === 'GDPR' ? 'selected' : ''}>GDPR (EU Data Privacy)</option>
                                <option value="HIPAA" ${policy.regulatory_profile === 'HIPAA' ? 'selected' : ''}>HIPAA (US Health Privacy)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    updatePolicy: (useCaseId, dimension, value) => {
        controlPlane.updatePolicy(useCaseId, dimension, parseFloat(value));
    },

    updateRegulatory: (useCaseId, profile) => {
        if (typeof controlPlane !== 'undefined' && controlPlane.updateRegulatoryProfile) {
            controlPlane.updateRegulatoryProfile(useCaseId, profile);
        } else {
            // Fallback if not fully implemented in simulator
            if (!controlPlane.policies[useCaseId]) return;
            controlPlane.policies[useCaseId].regulatory_profile = profile;
        }
        
        // Apply side effects if needed (e.g. tightening PII for HIPAA)
        if (profile === 'HIPAA') {
            controlPlane.policies[useCaseId].resp_pii_block = Math.min(controlPlane.policies[useCaseId].resp_pii_block, 0.3);
        }
        
        PolicyView.renderTabContent(useCaseId);
    }
};
