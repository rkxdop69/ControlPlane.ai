// Main Application Logic - View Router & UI State

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.views = {
            dashboard: { title: 'Live Traffic Monitor', render: () => DashboardView.render() },
            inspection: { title: 'Deep Inspection', render: () => InspectionView.render() },
            policy: { title: 'Policy Engine', render: () => PolicyView.render() },
            sandbox: { title: 'Live Sandbox', render: () => SandboxView.render() },
            analytics: { title: 'Analytics & Audit', render: () => AnalyticsView.render() },
            architecture: { title: 'Architecture Explainer', render: () => this.renderArchitecture() }
        };

        this.isSimulating = false;
        this.simTimer = null;

        this.init();
    }

    init() {
        // Setup Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.navigate(view);
            });
        });

        // Setup Simulation Button
        const btnSimulate = document.getElementById('btn-simulate');
        if (btnSimulate) {
            btnSimulate.addEventListener('click', () => {
                this.toggleSimulation();
            });
        }

        // Initial render
        this.navigate(this.currentView);

        // Phase 6.2: Pre-load demo state so dashboard isn't empty
        setTimeout(() => {
            this.preloadDemoState();
        }, 500);
    }

    async preloadDemoState() {
        if (typeof controlPlane !== 'undefined' && typeof SCENARIOS !== 'undefined') {
            if (typeof GroundingEngine !== 'undefined' && GroundingEngine.initPromise) {
                await GroundingEngine.initPromise;
            }
            // Pick a good mix: 2 clean, 2 BLOCK, 1 WARN, 1 REVIEW (if available), pad to 15
            const mix = [];
            const clean = SCENARIOS.filter(s => s.expectedAction === 'PASS');
            const blocks = SCENARIOS.filter(s => s.expectedAction === 'BLOCK');
            const warns = SCENARIOS.filter(s => s.expectedAction === 'WARN');
            const reviews = SCENARIOS.filter(s => s.expectedAction === 'REVIEW');
            
            if (clean.length > 0) mix.push(clean[0 % clean.length], clean[1 % clean.length]);
            if (blocks.length > 0) mix.push(blocks[0 % blocks.length], blocks[1 % blocks.length]);
            if (warns.length > 0) mix.push(warns[0 % warns.length]);
            if (reviews.length > 0) mix.push(reviews[0 % reviews.length]);

            // Pad the rest up to 15
            while (mix.length < 15) {
                mix.push(SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
            }

            // Shuffle slightly so the dashboard isn't perfectly sorted
            mix.sort(() => Math.random() - 0.5);

            for (let i = 0; i < 15; i++) {
                await controlPlane.processRequest(mix[i]);
            }
        }
    }

    navigate(viewName) {
        if (!this.views[viewName]) return;

        // Update nav UI
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update Header
        document.getElementById('view-title').textContent = this.views[viewName].title;

        // Render View
        const container = document.getElementById('view-container');
        container.innerHTML = this.views[viewName].render();

        // Call post-render initialization if it exists
        if (viewName === 'dashboard' && DashboardView.init) DashboardView.init();
        if (viewName === 'inspection' && InspectionView.init) InspectionView.init();
        if (viewName === 'policy' && PolicyView.init) PolicyView.init();
        if (viewName === 'sandbox' && SandboxView.init) SandboxView.init();
        if (viewName === 'analytics' && AnalyticsView.init) AnalyticsView.init();

        this.currentView = viewName;
    }

    toggleSimulation() {
        this.isSimulating = !this.isSimulating;
        const btn = document.getElementById('btn-simulate');
        
        if (this.isSimulating) {
            btn.innerHTML = '<span class="material-icons-round">pause</span> Pause Traffic';
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
            
            // Start pumping data
            this.simTimer = setInterval(async () => {
                const scenario = getRandomScenario();
                await controlPlane.processRequest(scenario);
            }, 2500); // New request every 2.5s
        } else {
            btn.innerHTML = '<span class="material-icons-round">play_arrow</span> Auto-Play Traffic';
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
            
            clearInterval(this.simTimer);
        }
    }

    renderPlaceholder(text) {
        return `
            <div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--text-tertiary);">
                <div style="text-align: center;">
                    <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">construction</span>
                    <h2>${text}</h2>
                    <p style="margin-top: 8px;">Select a different view from the sidebar.</p>
                </div>
            </div>
        `;
    }

    renderArchitecture() {
        return `
            <div class="view-section active" style="padding: 32px; max-width: 1000px; margin: 0 auto;">
                <div style="margin-bottom: 32px; text-align: center;">
                    <h2>ControlPlane.ai Logical Architecture</h2>
                    <p style="color: var(--text-secondary); max-width: 600px; margin: 8px auto 0;">
                        ControlPlane operates as an intelligent proxy between enterprise users and LLM APIs, 
                        analyzing traffic in real-time without requiring access to model internals.
                    </p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 24px;">
                    
                    <div style="display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px;">
                        <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,0.1); border-radius: 8px; color: var(--accent-primary);">
                            <span class="material-icons-round" style="font-size: 32px;">person</span>
                        </div>
                        <div style="flex: 1; margin-left: 24px;">
                            <h3 style="margin-bottom: 8px;">1. User & Prompt (Input Layer)</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                                A user submits a prompt via an enterprise application (e.g., Customer Support, Internal KB). 
                                The prompt is passed to the LLM API, and the response is streamed back. ControlPlane intercepts the final output before delivery.
                            </p>
                            <span style="font-size: 12px; background: var(--bg-main); padding: 4px 8px; border-radius: 4px; color: var(--text-tertiary);">Latency: 0ms (Passthrough)</span>
                        </div>
                    </div>

                    <div style="display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; position: relative;">
                        <div style="position: absolute; top: -24px; left: 60px; height: 24px; width: 2px; background: var(--border-subtle);"></div>
                        <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.1); border-radius: 8px; color: var(--danger);">
                            <span class="material-icons-round" style="font-size: 32px;">speed</span>
                        </div>
                        <div style="flex: 1; margin-left: 24px;">
                            <h3 style="margin-bottom: 8px;">2. Tier 1: Deterministic Engine (Detection)</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                                High-speed, regex and rules-based detection. Checks for PII (with checksum validation like Luhn/Verhoeff), 
                                explicit toxicity, hard-coded biases, and known sensitive attributes in high-stakes contexts.
                                Capable of issuing immediate hard-blocks for critical violations.
                            </p>
                            <span style="font-size: 12px; background: var(--bg-main); padding: 4px 8px; border-radius: 4px; color: var(--text-tertiary);">Cost: Minimal | Latency: ~25-40ms</span>
                        </div>
                    </div>

                    <div style="display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; position: relative;">
                        <div style="position: absolute; top: -24px; left: 60px; height: 24px; width: 2px; background: var(--border-subtle);"></div>
                        <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,0.1); border-radius: 8px; color: var(--success);">
                            <span class="material-icons-round" style="font-size: 32px;">menu_book</span>
                        </div>
                        <div style="flex: 1; margin-left: 24px;">
                            <h3 style="margin-bottom: 8px;">3. Grounding Engine (Verification)</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                                Extracts factual claims from the response and verifies them against the enterprise's trusted data corpus 
                                using TF-IDF matching and similarity scoring. Detects hallucinated legal citations, fabricated URLs, and internal contradictions.
                            </p>
                            <span style="font-size: 12px; background: var(--bg-main); padding: 4px 8px; border-radius: 4px; color: var(--text-tertiary);">Latency: ~50-80ms</span>
                        </div>
                    </div>

                    <div style="display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; position: relative;">
                        <div style="position: absolute; top: -24px; left: 60px; height: 24px; width: 2px; background: var(--border-subtle);"></div>
                        <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,0.1); border-radius: 8px; color: var(--warning);">
                            <span class="material-icons-round" style="font-size: 32px;">psychology</span>
                        </div>
                        <div style="flex: 1; margin-left: 24px;">
                            <h3 style="margin-bottom: 8px;">4. Tier 2: LLM-as-a-Judge (Context Resolution)</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                                Triggered conditionally only when Tier 1 detects ambiguous signals (e.g., borderline hallucination, subtle bias, educational context). 
                                A smaller, specialized LLM evaluates the full context using a strict JSON-schema rubric to finalize the risk score.
                            </p>
                            <span style="font-size: 12px; background: var(--bg-main); padding: 4px 8px; border-radius: 4px; color: var(--text-tertiary);">Cost: Medium | Latency: ~400-800ms (when invoked)</span>
                        </div>
                    </div>

                    <div style="display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; position: relative;">
                        <div style="position: absolute; top: -24px; left: 60px; height: 24px; width: 2px; background: var(--border-subtle);"></div>
                        <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,0.1); border-radius: 8px; color: var(--accent-primary);">
                            <span class="material-icons-round" style="font-size: 32px;">route</span>
                        </div>
                        <div style="flex: 1; margin-left: 24px;">
                            <h3 style="margin-bottom: 8px;">5. Policy Router (Enforcement)</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                                Consolidates signals from all engines and evaluates them against the active, use-case specific policy (e.g., GDPR mode, strict thresholds). 
                                Emits a final decision: PASS, WARN, BLOCK, or REVIEW. PII is automatically redacted before transmission.
                            </p>
                            <span style="font-size: 12px; background: var(--bg-main); padding: 4px 8px; border-radius: 4px; color: var(--text-tertiary);">Latency: &lt;10ms</span>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Add some initial dummy data so dashboard isn't empty on first load
    setTimeout(() => {
        controlPlane.processRequest(SCENARIOS[0]);
        setTimeout(() => controlPlane.processRequest(SCENARIOS[1]), 500);
    }, 500);
});
