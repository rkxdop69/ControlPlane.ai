const fs = require('fs');
const vm = require('vm');
const path = require('path');

const context = vm.createContext({
    console: console,
    window: {},
    document: {
        querySelector: () => ({ appendChild: () => {} }),
        createElement: () => ({}),
        getElementById: () => ({ innerHTML: '' })
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
['js/data/scenarios.js', 'js/grounding.js', 'js/detection.js', 'js/tier2.js', 'js/simulation.js', 'js/policy.js'].forEach(loadFile);

(async () => {
    console.log("--- Task 2 Verification ---");
    context.controlPlane = new context.ControlPlaneEngine();
    
    // 1. HIPAA vs NONE
    console.log("\\n[HIPAA Test]");
    const hipaaPrompt = "Should we approve this insurance application?";
    const hipaaResponse = "Based on the applicant's profile, his medical history shows diabetes, which increases risk.";
    
    context.controlPlane.updateRegulatoryProfile('cs_bot', 'NONE');
    const resHipaaNone = await context.DetectionEngine.analyzeFullResponse(hipaaPrompt, hipaaResponse, 'cs_bot');
    console.log(`With NONE profile -> Action: ${resHipaaNone.action} | Reason: ${resHipaaNone.reason}`);
    
    context.controlPlane.updateRegulatoryProfile('cs_bot', 'HIPAA');
    const resHipaaActive = await context.DetectionEngine.analyzeFullResponse(hipaaPrompt, hipaaResponse, 'cs_bot');
    console.log(`With HIPAA profile -> Action: ${resHipaaActive.action} | Reason: ${resHipaaActive.reason}`);
    
    // 2. GDPR vs NONE
    console.log("\\n[GDPR Test]");
    const gdprPrompt = "I want to exercise my right to erasure.";
    const gdprResponse = "Sure, I will delete your data.";
    
    context.controlPlane.updateRegulatoryProfile('cs_bot', 'NONE');
    const resGdprNone = await context.DetectionEngine.analyzeFullResponse(gdprPrompt, gdprResponse, 'cs_bot');
    console.log(`With NONE profile -> Action: ${resGdprNone.action}`);
    
    context.controlPlane.updateRegulatoryProfile('cs_bot', 'GDPR');
    const resGdprActive = await context.DetectionEngine.analyzeFullResponse(gdprPrompt, gdprResponse, 'cs_bot');
    console.log(`With GDPR profile -> Action: ${resGdprActive.action} | Reason: ${resGdprActive.reason}`);
})();
