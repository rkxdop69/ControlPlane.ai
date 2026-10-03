const fs = require('fs');
const vm = require('vm');
const path = require('path');

const context = vm.createContext({
    console: console,
    window: {},
    document: {
        querySelector: () => ({ appendChild: () => {} }),
        createElement: () => ({}),
        getElementById: () => ({ innerHTML: '', value: 'Mock justification' })
    },
    performance: { now: () => Date.now() },
    setTimeout: setTimeout,
    require: require
});

function loadFile(file) {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    vm.runInContext(code, context);
}

// Load scripts
['js/data/scenarios.js', 'js/grounding.js', 'js/detection.js', 'js/tier2.js', 'js/simulation.js', 'js/policy.js', 'js/inspection.js', 'js/app.js'].forEach(loadFile);

(async () => {
    console.log("--- Task 1 Verification ---");
    
    // Initialize
    context.controlPlane = new context.ControlPlaneEngine();
    context.window.app = { navigate: () => {}, currentView: 'none' };
    
    const initialThresh = context.controlPlane.policies['cs_bot'].resp_pii_block;
    console.log(`Initial PII block threshold for cs_bot: ${initialThresh}`);

    // Create a mock currentData state for inspection view
    context.InspectionView.currentData = {
        scenario: {
            id: 'mock-1',
            useCase: { id: 'cs_bot' }
        },
        result: {
            reason: 'Critical PII detected',
            action: 'REVIEW'
        }
    };

    // Simulate 3 approvals
    console.log("Simulating 3 human approvals for false positive PII blocks...");
    context.InspectionView.resolveReview('Approve');
    console.log("Overrides tracker:", context.controlPlane.stats.humanOverrides['cs_bot_resp_pii_block']);
    
    context.InspectionView.resolveReview('Approve');
    console.log("Overrides tracker:", context.controlPlane.stats.humanOverrides['cs_bot_resp_pii_block']);

    context.InspectionView.resolveReview('Approve');
    
    const newThresh = context.controlPlane.policies['cs_bot'].resp_pii_block;
    console.log(`New PII block threshold for cs_bot: ${newThresh}`);
    
    const auditEvent = context.controlPlane.auditLog.find(e => e.event === 'POLICY_AUTO_ADJUST');
    console.log("Audit log entry created:", auditEvent ? auditEvent.detail : "None");
})();
