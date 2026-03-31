const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('='.repeat(60));
console.log('PRE-SOAK BASELINE CAPTURE');
console.log('='.repeat(60));
console.log('');

// Database paths
const dbPath = path.join(__dirname, '..', 'data', 'transformer.db');
const walPath = dbPath + '-wal';
const shmPath = dbPath + '-shm';

// Capture baseline
const baseline = {
    timestamp: new Date().toISOString(),
    system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        nodeVersion: process.version
    },
    database: {
        dbSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
        walSize: fs.existsSync(walPath) ? fs.statSync(walPath).size : 0,
        shmSize: fs.existsSync(shmPath) ? fs.statSync(shmPath).size : 0
    },
    records: {},
    integrity: {}
};

// Database record counts
try {
    const db = new Database(dbPath, { readonly: true });

    baseline.records = {
        users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
        transformers: db.prepare('SELECT COUNT(*) as c FROM transformers').get().c,
        revisions: db.prepare('SELECT COUNT(*) as c FROM design_revisions').get().c,
        audits: db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c,
        checklists: db.prepare('SELECT COUNT(*) as c FROM checklists').get().c
    };

    // Integrity check
    const integrityResult = db.pragma('integrity_check', { simple: true });
    baseline.integrity.dbCheck = integrityResult;

    // WAL info
    const walInfo = db.pragma('wal_checkpoint(PASSIVE)');
    baseline.database.walCheckpoint = walInfo;

    db.close();

    baseline.integrity.status = 'PASS';
} catch (error) {
    baseline.integrity.status = 'FAIL';
    baseline.integrity.error = error.message;
}

// Audit chain verification
try {
    const auditService = require('../services/audit.service');
    const chainResult = auditService.verifyChain();
    baseline.integrity.auditChain = chainResult.valid ? 'VALID' : 'INVALID';
    baseline.integrity.auditChainDetails = chainResult;
} catch (error) {
    baseline.integrity.auditChain = 'ERROR';
    baseline.integrity.auditChainError = error.message;
}

// Display baseline
console.log('SYSTEM:');
console.log(`  Platform: ${baseline.system.platform} ${baseline.system.arch}`);
console.log(`  CPUs: ${baseline.system.cpus}`);
console.log(`  Total Memory: ${(baseline.system.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`  Free Memory: ${(baseline.system.freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`  Node Version: ${baseline.system.nodeVersion}`);
console.log('');

console.log('DATABASE:');
console.log(`  DB Size: ${(baseline.database.dbSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  WAL Size: ${(baseline.database.walSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  SHM Size: ${(baseline.database.shmSize / 1024 / 1024).toFixed(2)} MB`);
console.log('');

console.log('RECORDS:');
console.log(`  Users: ${baseline.records.users}`);
console.log(`  Transformers: ${baseline.records.transformers}`);
console.log(`  Revisions: ${baseline.records.revisions}`);
console.log(`  Audits: ${baseline.records.audits}`);
console.log(`  Checklists: ${baseline.records.checklists}`);
console.log('');

console.log('INTEGRITY:');
console.log(`  Status: ${baseline.integrity.status}`);
console.log(`  DB Check: ${baseline.integrity.dbCheck}`);
console.log(`  Audit Chain: ${baseline.integrity.auditChain}`);
console.log('');

// Save baseline
const baselinePath = path.join(__dirname, 'baseline-report.json');
fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

console.log('='.repeat(60));
console.log(`Baseline saved to: ${baselinePath}`);
console.log('='.repeat(60));
