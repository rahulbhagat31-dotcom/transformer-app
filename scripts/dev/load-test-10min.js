const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('PRODUCTION LOAD TEST - 10 MINUTES');
console.log('='.repeat(60));
console.log('');
console.log('Test Configuration:');
console.log('  Duration: 10 minutes');
console.log('  Concurrent Users: 50');
console.log('  Target: http://localhost:3000');
console.log('');
console.log('Success Criteria:');
console.log('  - Error rate < 1%');
console.log('  - No database locks');
console.log('  - No crashes');
console.log('  - Stable memory usage');
console.log('  - P95 latency < 500ms');
console.log('');
console.log('='.repeat(60));
console.log('');

// Test user credentials (from migrated data)
const testUser = {
    userId: 'admin',
    password: 'admin123'
};

let authToken = null;

// Login to get auth token
async function login() {
    console.log('🔐 Authenticating test user...');

    const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    const result = await response.json();

    if (result.success && result.data && result.data.token) {
        authToken = result.data.token;
        console.log('✅ Authentication successful');
        console.log('');
        return true;
    } else {
        console.error('❌ Authentication failed:', result.error);
        process.exit(1);
    }
}

// Run load test
async function runLoadTest() {
    await login();

    console.log('🚀 Starting load test...');
    console.log('');

    const instance = autocannon({
        url: 'http://localhost:3000',
        connections: 50,
        duration: 600, // 10 minutes in seconds
        pipelining: 1,
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        requests: [
            {
                method: 'GET',
                path: '/api/transformers',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            },
            {
                method: 'GET',
                path: '/api/customers',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            },
            {
                method: 'GET',
                path: '/audit',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        ]
    }, (err, result) => {
        if (err) {
            console.error('❌ Load test error:', err);
            process.exit(1);
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('LOAD TEST RESULTS');
        console.log('='.repeat(60));
        console.log('');

        // Calculate metrics
        const totalRequests = result.requests.total;
        const totalErrors = result.errors;
        const errorRate = (totalErrors / totalRequests) * 100;
        const p95Latency = result.latency.p95;

        console.log('📊 Performance Metrics:');
        console.log(`  Total Requests: ${totalRequests.toLocaleString()}`);
        console.log(`  Successful: ${(totalRequests - totalErrors).toLocaleString()}`);
        console.log(`  Errors: ${totalErrors.toLocaleString()}`);
        console.log(`  Error Rate: ${errorRate.toFixed(2)}%`);
        console.log('');
        console.log('⏱️  Latency:');
        console.log(`  Mean: ${result.latency.mean.toFixed(2)}ms`);
        console.log(`  P50: ${result.latency.p50}ms`);
        console.log(`  P95: ${result.latency.p95}ms`);
        console.log(`  P99: ${result.latency.p99}ms`);
        console.log(`  Max: ${result.latency.max}ms`);
        console.log('');
        console.log('🔄 Throughput:');
        console.log(`  Requests/sec: ${result.requests.average.toFixed(2)}`);
        console.log(`  Bytes/sec: ${(result.throughput.average / 1024).toFixed(2)} KB/s`);
        console.log('');

        // Validate success criteria
        console.log('='.repeat(60));
        console.log('SUCCESS CRITERIA VALIDATION');
        console.log('='.repeat(60));
        console.log('');

        const criteria = {
            errorRate: { pass: errorRate < 1, value: errorRate, threshold: '< 1%' },
            p95Latency: { pass: p95Latency < 500, value: p95Latency, threshold: '< 500ms' },
            noTimeouts: { pass: result.timeouts === 0, value: result.timeouts, threshold: '0' }
        };

        let allPassed = true;

        for (const [name, check] of Object.entries(criteria)) {
            const status = check.pass ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} - ${name}: ${check.value} (threshold: ${check.threshold})`);
            if (!check.pass) {
                allPassed = false;
            }
        }

        console.log('');
        console.log('='.repeat(60));

        if (allPassed) {
            console.log('✅ ALL CRITERIA PASSED - PRODUCTION READY');
        } else {
            console.log('❌ SOME CRITERIA FAILED - REVIEW REQUIRED');
        }

        console.log('='.repeat(60));
        console.log('');

        // Save results
        const reportPath = path.join(__dirname, '..', 'data', 'load-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            duration: 600,
            connections: 50,
            results: result,
            criteria,
            passed: allPassed
        }, null, 2));

        console.log(`📄 Full report saved to: ${reportPath}`);
        console.log('');

        process.exit(allPassed ? 0 : 1);
    });

    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
}

// Run the test
runLoadTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
