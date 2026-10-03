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
['js/data/scenarios.js', 'js/grounding.js', 'js/detection.js', 'js/tier2.js', 'js/simulation.js', 'js/policy.js', 'js/loadTest.js'].forEach(loadFile);

(async () => {
    console.log("--- Task 3 Verification ---");
    context.controlPlane = new context.ControlPlaneEngine();
    if (context.GroundingEngine && context.GroundingEngine.buildIndex) {
        await context.GroundingEngine.buildIndex();
    }
    
    const results = await context.LoadTest.run(1000);
    console.log("Load Test Results:", results);
})();
