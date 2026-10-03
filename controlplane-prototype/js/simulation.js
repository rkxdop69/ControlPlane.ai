// ControlPlane.ai — Simulation Engine v3
// Phase 0.1: Unified engine — all scoring via DetectionEngine.analyzeFullResponse()
// No separate evaluate() path. Audit events populated from real detection results.

class ControlPlaneEngine {
    constructor() {
        this.policyVersion = 'v3.0.0';
        this.policyVersionCounter = 0;

        this.policies = {
            [USE_CASES.CUSTOMER_SUPPORT.id]: {
                perf_hallucination_warn: 0.3,
                perf_hallucination_block: 0.7,
                resp_pii_block: 0.5,
                resp_bias_block: 0.5,
                regulatory_profile: 'NONE',
                hard_block_critical_pii: true,
                hard_block_threats: true,
                require_human_review_high_stakes: true,
            },
            [USE_CASES.INTERNAL_KB.id]: {
                perf_hallucination_warn: 0.4,
                perf_hallucination_block: 0.8,
                resp_pii_block: 0.6,
                resp_bias_block: 0.5,
                regulatory_profile: 'NONE',
                hard_block_critical_pii: true,
                hard_block_threats: true,
                require_human_review_high_stakes: true,
            },
            [USE_CASES.REGULATORY.id]: {
                perf_hallucination_warn: 0.1,
                perf_hallucination_block: 0.3,
                resp_pii_block: 0.4,
                resp_bias_block: 0.4,
                regulatory_profile: 'GDPR',
                hard_block_critical_pii: true,
                hard_block_threats: true,
                require_human_review_high_stakes: true,
            }
        };

        this.stats = {
            total: 0,
            passed: 0,
            warned: 0,
            blocked: 0,
            reviewed: 0,
            history: [],
            latencies: [],
            humanOverrides: {}
        };

        this.sessionRisk = {};
        this.auditLog = [];
        this.subscribers = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers(event) {
        this.subscribers.forEach(cb => cb(event));
    }

    updatePolicy(useCaseId, dimension, value) {
        if (this.policies[useCaseId]) {
            this.policies[useCaseId][dimension] = value;
            this.policyVersionCounter++;
            this.policyVersion = 'v3.0.' + this.policyVersionCounter;
        }
    }

    updateRegulatoryProfile(useCaseId, profile) {
        if (this.policies[useCaseId]) {
            this.policies[useCaseId].regulatory_profile = profile;
            this.policyVersionCounter++;
            this.policyVersion = 'v3.0.' + this.policyVersionCounter;
        }
    }

    // Phase 0.1: Unified — calls DetectionEngine.analyzeFullResponse() for everything
    async processRequest(scenario) {
        this.stats.total++;

        // Run the real detection engine on the scenario text
        const result = await DetectionEngine.analyzeFullResponse(
            scenario.prompt,
            scenario.response,
            scenario.useCase.id
        );

        // Cumulative risk tracking
        const ucId = scenario.useCase.id;
        if (!this.sessionRisk[ucId]) {
            this.sessionRisk[ucId] = { totalFlags: 0, consecutiveFlags: 0, lastAction: 'PASS' };
        }
        
        const d = result.dimensions;
        const isBorderline = d.responsibility.bias.score > 0.1 || d.responsibility.toxicity.score > 0.1 || d.performance.score > 0.2 || d.cost.score > 0.3;
        
        if (result.action !== 'PASS' || isBorderline) {
            this.sessionRisk[ucId].totalFlags++;
            this.sessionRisk[ucId].consecutiveFlags++;
        } else {
            this.sessionRisk[ucId].consecutiveFlags = 0;
        }
        this.sessionRisk[ucId].lastAction = result.action;

        // Engineering escalation on repeated patterns
        if (this.sessionRisk[ucId].consecutiveFlags >= 3) {
            result.engineeringEscalation = true;
            result.escalationReason = `${this.sessionRisk[ucId].consecutiveFlags} consecutive flagged/borderline requests from ${scenario.useCase.name} — pattern requires engineering review`;
            if (result.action === 'PASS' || result.action === 'WARN') {
                result.action = 'REVIEW';
                result.reason = 'Session Risk Escalation: Multiple flagged or borderline interactions detected consecutively.';
            }
        }

        // Update stats (moved after escalation logic so stats reflect final action)
        if (result.action === 'PASS') this.stats.passed++;
        else if (result.action === 'WARN') this.stats.warned++;
        else if (result.action === 'BLOCK') this.stats.blocked++;
        else if (result.action === 'REVIEW') this.stats.reviewed++;

        // Track latency
        this.stats.latencies.push(result.latency);
        if (this.stats.latencies.length > 200) this.stats.latencies.shift();

        // Build audit event with real detection scores
        const auditEvent = {
            timestamp: new Date().toISOString(),
            requestId: scenario.id,
            useCase: scenario.useCase.name,
            useCaseId: ucId,
            policyVersion: this.policyVersion,
            prompt: scenario.prompt,
            response: scenario.response,
            action: result.action,
            routing: result.routing,
            reason: result.reason,
            confidence: result.confidence,
            latency: result.latency,
            riskScores: {
                performance: d.performance.score,
                groundingScore: d.performance.groundingScore,
                confidenceScore: d.performance.confidenceScore,
                pii: d.responsibility.pii.score,
                bias: d.responsibility.bias.score,
                toxicity: d.responsibility.toxicity.score,
                highStakes: d.responsibility.highStakes.score,
                cost: d.cost.score,
            },
            findings: {
                pii: d.responsibility.pii.findings,
                bias: d.responsibility.bias.signals,
                toxicity: d.responsibility.toxicity.signals,
                hallucination: d.performance.signals,
                highStakes: d.responsibility.highStakes.signals,
                cost: d.cost.signals,
            },
            engineeringEscalation: result.engineeringEscalation || false,
            escalationReason: result.escalationReason || null,
            humanReview: null,
        };
        this.auditLog.push(auditEvent);
        if (this.auditLog.length > 500) this.auditLog.shift();

        this.stats.history.push({ scenario, result, auditEvent });
        if (this.stats.history.length > 100) this.stats.history.shift();

        this.notifySubscribers({ type: 'NEW_INTERACTION', data: { scenario, result, auditEvent }, stats: this.stats });

        return result;
    }
}

// Global instance
const controlPlane = new ControlPlaneEngine();
