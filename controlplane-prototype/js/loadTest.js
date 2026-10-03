// Scale/Throughput Load Test
// Proves the DetectionEngine can handle thousands of requests seamlessly.

const LoadTest = {
    run: async (iterations = 1000) => {
        if (typeof SCENARIOS === 'undefined' || typeof DetectionEngine === 'undefined') {
            console.error("Dependencies missing for LoadTest");
            return null;
        }
        
        console.log(`Starting synthetic load test: ${iterations} requests...`);
        const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        
        const results = {
            PASS: 0,
            WARN: 0,
            BLOCK: 0,
            REVIEW: 0
        };

        // We run these sequentially to accurately measure raw single-thread throughput.
        // We use analyzeFullResponse directly to avoid multi-turn session escalation state
        // skewing the results (stateless detection throughput).
        for (let i = 0; i < iterations; i++) {
            const scenario = SCENARIOS[i % SCENARIOS.length];
            const res = await DetectionEngine.analyzeFullResponse(
                scenario.prompt, 
                scenario.response, 
                scenario.useCase.id
            );
            results[res.action] = (results[res.action] || 0) + 1;
        }

        const endMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const durationSec = (endMs - startMs) / 1000;
        const rps = iterations / (durationSec || 0.001);

        return {
            totalRequests: iterations,
            durationSeconds: durationSec.toFixed(2),
            requestsPerSecond: rps.toFixed(0),
            distribution: results
        };
    }
};

if (typeof module !== 'undefined') module.exports = LoadTest;
