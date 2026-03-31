const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('PRE-FLIGHT RESOURCE HEADROOM CHECK');
console.log('='.repeat(60));
console.log('');

const report = {
    timestamp: new Date().toISOString(),
    checks: [],
    passed: true
};

// 1. System memory headroom ≥ 50%
const totalMem = os.totalmem();
const freeMem = os.freemem();
const memHeadroom = (freeMem / totalMem) * 100;
const memCheck = memHeadroom >= 50;

report.checks.push({
    name: 'Memory Headroom',
    required: '≥ 50%',
    actual: `${memHeadroom.toFixed(1)}%`,
    details: {
        total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`
    },
    passed: memCheck
});

console.log(`Memory Headroom: ${memHeadroom.toFixed(1)}% ${memCheck ? '✓' : '✗'}`);
console.log(`  Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`  Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log('');

if (!memCheck) {
    report.passed = false;
}

// 2. Disk free space ≥ 20GB
let diskCheck = false;
let diskFreeGB = 0;

try {
    if (os.platform() === 'win32') {
        const drive = path.parse(__dirname).root;
        const output = execSync(`wmic logicaldisk where "DeviceID='${drive.replace('\\', '')}'" get FreeSpace /format:csv`, { encoding: 'utf8' });
        const lines = output.trim().split('\n').filter(l => l.trim());
        if (lines.length >= 2) {
            const freeBytes = parseInt(lines[1].split(',')[1]);
            diskFreeGB = freeBytes / 1024 / 1024 / 1024;
        }
    } else {
        const output = execSync(`df -k ${__dirname}`, { encoding: 'utf8' });
        const lines = output.trim().split('\n');
        if (lines.length >= 2) {
            const parts = lines[1].trim().split(/\s+/);
            diskFreeGB = parseInt(parts[3]) / 1024 / 1024; // KB to GB
        }
    }

    diskCheck = diskFreeGB >= 20;
} catch (error) {
    console.error('Failed to check disk space:', error.message);
}

report.checks.push({
    name: 'Disk Free Space',
    required: '≥ 20 GB',
    actual: `${diskFreeGB.toFixed(2)} GB`,
    passed: diskCheck
});

console.log(`Disk Free Space: ${diskFreeGB.toFixed(2)} GB ${diskCheck ? '✓' : '✗'}`);
console.log('');

if (!diskCheck) {
    report.passed = false;
}

// 3. CPU idle ≥ 40%
const cpus = os.cpus();
const cpuBusy = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total);
}, 0) / cpus.length * 100;

const cpuIdle = 100 - cpuBusy;
const cpuCheck = cpuIdle >= 40;

report.checks.push({
    name: 'CPU Idle',
    required: '≥ 40%',
    actual: `${cpuIdle.toFixed(1)}%`,
    details: {
        cpus: cpus.length,
        busy: `${cpuBusy.toFixed(1)}%`
    },
    passed: cpuCheck
});

console.log(`CPU Idle: ${cpuIdle.toFixed(1)}% ${cpuCheck ? '✓' : '✗'}`);
console.log(`  CPUs: ${cpus.length}`);
console.log(`  Busy: ${cpuBusy.toFixed(1)}%`);
console.log('');

if (!cpuCheck) {
    report.passed = false;
}

// 4. No other high CPU processes running
const highCPUProcesses = [];

try {
    if (os.platform() === 'win32') {
        // Get top CPU processes on Windows
        const output = execSync('wmic path Win32_PerfFormattedData_PerfProc_Process get Name,PercentProcessorTime /format:csv', { encoding: 'utf8', timeout: 5000 });
        const lines = output.trim().split('\n').filter(l => l.trim());

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 3) {
                const name = parts[1];
                const cpu = parseInt(parts[2]);

                if (cpu > 20 && !name.includes('Idle') && !name.includes('_Total')) {
                    highCPUProcesses.push({ name, cpu });
                }
            }
        }
    } else {
        // Get top CPU processes on Linux/macOS
        const output = execSync('ps aux --sort=-%cpu | head -n 6', { encoding: 'utf8', timeout: 5000 });
        const lines = output.trim().split('\n');

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            const cpu = parseFloat(parts[2]);
            const name = parts[10];

            if (cpu > 20) {
                highCPUProcesses.push({ name, cpu });
            }
        }
    }
} catch (error) {
    console.error('Failed to check high CPU processes:', error.message);
}

const processCheck = highCPUProcesses.length === 0;

report.checks.push({
    name: 'No High CPU Processes',
    required: 'No processes > 20% CPU',
    actual: highCPUProcesses.length === 0 ? 'None found' : `${highCPUProcesses.length} found`,
    details: highCPUProcesses,
    passed: processCheck
});

console.log(`High CPU Processes (>20%): ${highCPUProcesses.length} ${processCheck ? '✓' : '✗'}`);
if (highCPUProcesses.length > 0) {
    highCPUProcesses.forEach(p => {
        console.log(`  ${p.name}: ${p.cpu}%`);
    });
}
console.log('');

if (!processCheck) {
    report.passed = false;
}

// Final result
console.log('='.repeat(60));
console.log(`OVERALL STATUS: ${report.passed ? 'READY ✓' : 'NOT READY ✗'}`);
console.log('='.repeat(60));
console.log('');

// Save report
const reportPath = path.join(__dirname, 'pre-flight-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`Report saved to: ${reportPath}`);

if (!report.passed) {
    console.error('\nPre-flight checks FAILED. Do not proceed with soak test.');
    process.exit(1);
}

console.log('\nPre-flight checks PASSED. System ready for soak test.');
