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
['js/data/corpus.js', 'js/data/scenarios.js', 'js/grounding.js', 'js/detection.js', 'js/tier2.js', 'js/simulation.js', 'js/policy.js'].forEach(loadFile);

(async () => {
    console.log("--- Task 4 Verification ---");
    context.controlPlane = new context.ControlPlaneEngine();
    await context.GroundingEngine.buildIndex();
    
    // 1. New Conflict Scenario
    console.log("\\n[Corpus Ambiguity Test]");
    const prompt = "When do loyalty points expire?";
    const response = "Loyalty points expire after 12 months.";
    const result = await context.GroundingEngine.analyzeGrounding(prompt, response, 'cs_bot');
    const claimRes = result.claimResults[0];
    
    console.log(`Grounding Verdict: ${claimRes.verdict}`);
    console.log(`Detail: ${claimRes.detail}`);

    // 2. Full Regression Suite (to prove nothing broke)
    console.log("\\n[Regression Suite Check]");
    let passedTests = 0;
    
    for (const s of context.SCENARIOS) {
        const res = await context.DetectionEngine.analyzeFullResponse(s.prompt, s.response, s.useCase.id);
        const passed = res.action === s.expectedAction;
        if (passed) {
            passedTests++;
        } else {
            console.log(`\\nFAIL: ${s.id} expected ${s.expectedAction}, got ${res.action}. Reason: ${res.reason}`);
        }
    }
    
    console.log(`\\nRegression Score: ${passedTests} / ${context.SCENARIOS.length} scenarios passed.`);
})();
