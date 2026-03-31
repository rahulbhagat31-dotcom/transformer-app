const path = require('path');
const fs = require('fs');

// Write server PID for monitoring
const pidFile = path.join(__dirname, 'data', 'server.pid');
fs.writeFileSync(pidFile, process.pid.toString());

console.log(`Server PID: ${process.pid} (written to ${pidFile})`);

// Cleanup on exit
process.on('exit', () => {
    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
});
