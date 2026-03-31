const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');

// Configuration
const MONITORING_INTERVAL = 60000; // 60 seconds
const METRICS_FILE = path.join(__dirname, 'soak-metrics.jsonl');
const SERVER_PID_FILE = path.join(__dirname, '..', 'data', 'server.pid');
const WAL_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100 MB
const WAL_WARNING_DURATION = 10 * 60 * 1000; // 10 minutes
const HEAP_SNAPSHOT_INTERVALS = [0, 12 * 60 * 60 * 1000, 24 * 60 * 60 * 1000]; // T0, T+12h, T+24h

// State
const metrics = {
    startTime: Date.now(),
    samples: [],
    walWarningStart: null,
    heapSnapshots: [],
    latencyFirstHour: null,
    latencyLastHour: null
};

// Get actual server process metrics (NOT monitoring process)
function getServerProcessMetrics() {
    try {
        if (!fs.existsSync(SERVER_PID_FILE)) {
            console.error('Server PID file not found:', SERVER_PID_FILE);
            return null;
        }

        const serverPid = fs.readFileSync(SERVER_PID_FILE, 'utf8').trim();

        // Validate PID is still running
        try {
            process.kill(serverPid, 0); // Signal 0 checks if process exists
        } catch {
            console.error('Server process not running:', serverPid);
            return null;
        }

        // Platform-specific metrics
        if (os.platform() === 'win32') {
            // Windows: Use wmic
            const output = execSync(
                `wmic process where ProcessId=${serverPid} get WorkingSetSize,UserModeTime,KernelModeTime,HandleCount /format:csv`,
                { encoding: 'utf8', timeout: 5000 }
            );

            const lines = output.trim().split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                return null;
            }

            const parts = lines[1].split(',');

            return {
                pid: serverPid,
                rss: parseInt(parts[4]) || 0, // WorkingSetSize in bytes
                cpuUser: parseInt(parts[3]) || 0, // UserModeTime
                cpuKernel: parseInt(parts[2]) || 0, // KernelModeTime
                handles: parseInt(parts[1]) || 0 // HandleCount (file descriptors equivalent)
            };
        } else {
            // Linux/macOS: Use ps
            const output = execSync(
                `ps -p ${serverPid} -o %cpu,rss,vsz`,
                { encoding: 'utf8', timeout: 5000 }
            );

            const lines = output.trim().split('\n');
            if (lines.length < 2) {
                return null;
            }

            const parts = lines[1].trim().split(/\s+/);

            return {
                pid: serverPid,
                cpu: parseFloat(parts[0]) || 0, // %CPU
                rss: parseInt(parts[1]) * 1024 || 0, // RSS in KB, convert to bytes
                vsz: parseInt(parts[2]) * 1024 || 0 // VSZ in KB, convert to bytes
            };
        }
    } catch (error) {
        console.error('Failed to get server process metrics:', error.message);
        return null;
    }
}

// WAL growth control
function checkWALGrowth(walSize) {
    const now = Date.now();

    if (walSize > WAL_WARNING_THRESHOLD) {
        if (!metrics.walWarningStart) {
            metrics.walWarningStart = now;
            console.warn(`WAL size ${(walSize / 1024 / 1024).toFixed(2)} MB exceeds threshold`);
        } else {
            const warningDuration = now - metrics.walWarningStart;
            if (warningDuration > WAL_WARNING_DURATION) {
                console.warn(`WAL size sustained > 100MB for ${(warningDuration / 1000 / 60).toFixed(1)} minutes`);
                console.warn('Forcing WAL checkpoint...');

                try {
                    const dbPath = path.join(__dirname, '..', 'data', 'transformer.db');
                    const db = new Database(dbPath);

                    const checkpointStart = Date.now();
                    const result = db.pragma('wal_checkpoint(TRUNCATE)');
                    const checkpointDuration = Date.now() - checkpointStart;

                    console.log(`Checkpoint completed in ${checkpointDuration}ms:`, result);

                    db.close();

                    metrics.walWarningStart = null; // Reset warning

                    return { forced: true, duration: checkpointDuration, result };
                } catch (error) {
                    console.error('Failed to force checkpoint:', error.message);
                }
            }
        }
    } else {
        metrics.walWarningStart = null; // Reset if below threshold
    }

    return { forced: false };
}

// GC telemetry and heap snapshot
function captureHeapSnapshot(elapsed) {
    const v8 = require('v8');

    const heapStats = v8.getHeapStatistics();
    const snapshot = {
        timestamp: Date.now(),
        elapsed,
        heap: {
            total: heapStats.total_heap_size,
            used: heapStats.used_heap_size,
            limit: heapStats.heap_size_limit,
            external: heapStats.external_memory,
            percent: (heapStats.used_heap_size / heapStats.heap_size_limit) * 100
        }
    };

    metrics.heapSnapshots.push(snapshot);

    console.log(`Heap snapshot captured at T+${(elapsed / 1000 / 60 / 60).toFixed(1)}h: ${(snapshot.heap.used / 1024 / 1024).toFixed(2)} MB`);

    return snapshot;
}

// Calculate heap growth slope
function calculateHeapSlope() {
    if (metrics.heapSnapshots.length < 2) {
        return 0;
    }

    const first = metrics.heapSnapshots[0];
    const last = metrics.heapSnapshots[metrics.heapSnapshots.length - 1];

    const heapGrowthMB = (last.heap.used - first.heap.used) / 1024 / 1024;
    const timeHours = (last.elapsed - first.elapsed) / 1000 / 60 / 60;

    return heapGrowthMB / timeHours;
}

// Capture comprehensive metrics
function captureMetrics() {
    const timestamp = Date.now();
    const elapsed = timestamp - metrics.startTime;

    // CRITICAL: Server process stats (NOT monitoring process)
    const serverStats = getServerProcessMetrics();

    if (!serverStats) {
        console.error('WARNING: Unable to capture server process metrics');
    }

    // Database stats
    const dbPath = path.join(__dirname, '..', 'data', 'transformer.db');
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';

    const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    const walSize = fs.existsSync(walPath) ? fs.statSync(walPath).size : 0;
    const shmSize = fs.existsSync(shmPath) ? fs.statSync(shmPath).size : 0;

    // WAL growth control
    const walControl = checkWALGrowth(walSize);

    // WAL checkpoint info
    let walCheckpointInfo = null;
    try {
        const db = new Database(dbPath, { readonly: true });
        walCheckpointInfo = db.pragma('wal_checkpoint(PASSIVE)');
        db.close();
    } catch (error) {
        console.error('Failed to get WAL checkpoint info:', error.message);
    }

    // System stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;

    // CPU stats (system-wide)
    const cpus = os.cpus();
    const cpuAvg = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total);
    }, 0) / cpus.length * 100;

    // Heap snapshot at intervals
    const shouldSnapshot = HEAP_SNAPSHOT_INTERVALS.some(interval =>
        Math.abs(elapsed - interval) < MONITORING_INTERVAL / 2
    );

    if (shouldSnapshot && !metrics.heapSnapshots.find(s => Math.abs(s.elapsed - elapsed) < MONITORING_INTERVAL)) {
        captureHeapSnapshot(elapsed);
    }

    // Calculate heap slope
    const heapSlope = calculateHeapSlope();

    const sample = {
        timestamp,
        elapsed,
        server: serverStats ? {
            pid: serverStats.pid,
            rss: serverStats.rss,
            rssMB: serverStats.rss / 1024 / 1024,
            cpu: serverStats.cpu || null,
            cpuUser: serverStats.cpuUser || null,
            cpuKernel: serverStats.cpuKernel || null,
            handles: serverStats.handles || null
        } : null,
        memory: {
            system: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                percent: memPercent
            }
        },
        cpu: {
            system: cpuAvg
        },
        database: {
            dbSize,
            walSize,
            shmSize,
            walCheckpoint: walCheckpointInfo,
            walControl
        },
        heap: {
            slope: heapSlope,
            snapshots: metrics.heapSnapshots.length
        }
    };

    // Append to JSONL file
    fs.appendFileSync(METRICS_FILE, JSON.stringify(sample) + '\n');

    // Store in memory
    metrics.samples.push(sample);

    // Console output
    console.log(`[${new Date(timestamp).toISOString()}] T+${Math.floor(elapsed / 1000 / 60)}m | Server RSS: ${serverStats ? serverStats.rss / 1024 / 1024 : 'N/A'} MB | WAL: ${(walSize / 1024 / 1024).toFixed(2)} MB | Heap Slope: ${heapSlope.toFixed(2)} MB/hr`);

    // Leak detection
    if (heapSlope > 10 && metrics.heapSnapshots.length >= 2) {
        console.warn(`⚠️  POTENTIAL MEMORY LEAK: Heap growth ${heapSlope.toFixed(2)} MB/hr > 10 MB/hr threshold`);
    }

    return sample;
}

// Start monitoring
function startMonitoring(durationMs) {
    console.log('='.repeat(60));
    console.log('SOAK TEST MONITORING - SERVER PROCESS TRACKING');
    console.log('='.repeat(60));
    console.log(`Duration: ${durationMs / 1000}s (${durationMs / 1000 / 60} minutes)`);
    console.log(`Interval: ${MONITORING_INTERVAL / 1000}s`);
    console.log(`Metrics file: ${METRICS_FILE}`);
    console.log(`Server PID file: ${SERVER_PID_FILE}`);
    console.log('='.repeat(60));
    console.log('');

    // Clear previous metrics file
    if (fs.existsSync(METRICS_FILE)) {
        fs.unlinkSync(METRICS_FILE);
    }

    // Initial capture (T0 heap snapshot)
    captureMetrics();

    // Periodic capture
    const interval = setInterval(captureMetrics, MONITORING_INTERVAL);

    // Stop after duration
    setTimeout(() => {
        clearInterval(interval);

        // Final capture
        captureMetrics();

        console.log('');
        console.log('='.repeat(60));
        console.log('MONITORING COMPLETE');
        console.log('='.repeat(60));

        // Generate summary
        generateSummary();
    }, durationMs);
}

// Generate summary report
function generateSummary() {
    const samples = metrics.samples;

    if (samples.length === 0) {
        console.log('No samples collected');
        return;
    }

    const first = samples[0];
    const last = samples[samples.length - 1];

    // Server memory growth
    const serverMemGrowth = last.server && first.server
        ? (last.server.rss - first.server.rss) / 1024 / 1024
        : 0;

    // DB growth
    const dbGrowth = (last.database.dbSize - first.database.dbSize) / 1024 / 1024;
    const walGrowth = (last.database.walSize - first.database.walSize) / 1024 / 1024;

    // Time
    const durationHours = (last.elapsed - first.elapsed) / 1000 / 60 / 60;

    // Heap analysis
    const heapSlope = calculateHeapSlope();

    const summary = {
        duration: {
            ms: last.elapsed - first.elapsed,
            hours: durationHours
        },
        server: {
            memoryGrowth: serverMemGrowth,
            memoryGrowthRate: serverMemGrowth / durationHours,
            finalRSS: last.server ? last.server.rssMB : null
        },
        database: {
            dbGrowth,
            dbGrowthRate: dbGrowth / durationHours,
            walGrowth,
            walGrowthRate: walGrowth / durationHours,
            finalDBSize: last.database.dbSize / 1024 / 1024,
            finalWALSize: last.database.walSize / 1024 / 1024
        },
        heap: {
            slope: heapSlope,
            snapshots: metrics.heapSnapshots,
            leakDetected: heapSlope > 10
        },
        samples: samples.length
    };

    console.log('\nSUMMARY:');
    console.log(JSON.stringify(summary, null, 2));

    // Save summary
    fs.writeFileSync(
        path.join(__dirname, 'soak-summary.json'),
        JSON.stringify(summary, null, 2)
    );
}

// Export for use
module.exports = { startMonitoring, captureMetrics };

// CLI usage
if (require.main === module) {
    const durationMinutes = parseInt(process.argv[2]) || 10;
    const durationMs = durationMinutes * 60 * 1000;

    startMonitoring(durationMs);
}
