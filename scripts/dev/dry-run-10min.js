const { startMonitoring } = require('./monitor-soak');
const { spawn } = require('child_process');
const path = require('path');

console.log('='.repeat(60));
console.log('10-MINUTE DRY RUN');
console.log('='.repeat(60));
console.log('');

// Ensure server is running
console.log('Starting server...');
const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit'
});

// Wait for server to start
setTimeout(() => {
    console.log('Server started. Beginning monitoring...\n');

    // Start 10-minute monitoring
    startMonitoring(10 * 60 * 1000);

    // Cleanup after monitoring
    setTimeout(() => {
        console.log('\nStopping server...');
        serverProcess.kill();
        process.exit(0);
    }, 11 * 60 * 1000);
}, 5000);
