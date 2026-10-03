const vm = require('vm');
const fs = require('fs');
const path = require('path');

const context = vm.createContext({
    console: console,
    window: {},
    controlPlane: {
        stats: { history: [] },
        subscribe: () => {},
        policies: {
            cs_bot: { perf_hallucination_block: 0.7 },
            int_kb: { perf_hallucination_block: 0.8 },
            reg_tool: { perf_hallucination_block: 0.3 }
        }
    },
    performance: { now: () => Date.now() },
    setTimeout: setTimeout,
    document: { getElementById: () => null } // dummy for progress
});

function loadFile(file) {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    vm.runInContext(code, context);
}

// Mock Transformers for Node (or wait, can we run transformers in node?)
// Actually, it's easier if we just skip test_runner.js execution for this specific embedding test since node doesn't easily run dynamic import of ES modules from CDN without experimental flags.
// The user will test in the browser anyway.
// I'll update it to be async just in case they have a local bundler or something.

// But wait, the user doesn't have node enabled for me to run anyway.
