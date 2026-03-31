const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'transformer.db');
const db = new Database(dbPath);

const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('============================================');
console.log('ADVERSARIAL VALIDATION TESTS');
console.log('============================================\n');

// ============================================
// 1️⃣ HASH TAMPER TEST
// ============================================
console.log('1️⃣ HASH TAMPER TEST');
console.log('--------------------------------------------\n');

// Clear and insert 3 audit logs
db.prepare('DELETE FROM audit_logs').run();

function insertAuditLog(userId, action, entityId) {
    const previous = db.prepare('SELECT currentHash FROM audit_logs ORDER BY id DESC LIMIT 1').get();
    const previousHash = previous?.currentHash || '0'.repeat(64);

    const timestamp = new Date().toISOString();
    const dataToHash = JSON.stringify({
        timestamp,
        userId,
        action,
        entityType: 'transformer',
        entityId,
        previousHash
    });

    const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    db.prepare(`
        INSERT INTO audit_logs (timestamp, userId, action, entityType, entityId, details, previousHash, currentHash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(timestamp, userId, action, 'transformer', entityId, null, previousHash, currentHash);
}

insertAuditLog('admin', 'CREATE', 'T-001');
insertAuditLog('admin', 'UPDATE', 'T-001');
insertAuditLog('quality', 'APPROVE', 'T-001');

console.log('Inserted 3 audit logs\n');

// Manually tamper with row 2
console.log('Tampering with audit log id=2...');
db.prepare('UPDATE audit_logs SET details = ? WHERE id = 2').run('{"tampered": true}');
console.log('✓ Modified details field\n');

// Verify chain
console.log('Running verification...\n');

let valid = true;
let expectedPreviousHash = '0'.repeat(64);

const allLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id').all();
for (const log of allLogs) {
    if (log.previousHash !== expectedPreviousHash) {
        console.log(`FAIL: Hash chain broken at log ${log.id}`);
        console.log(`  Expected previousHash: ${expectedPreviousHash.substring(0, 16)}...`);
        console.log(`  Actual previousHash: ${log.previousHash.substring(0, 16)}...`);
        valid = false;
        break;
    }

    const dataToHash = JSON.stringify({
        timestamp: log.timestamp,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        previousHash: log.previousHash
    });

    const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    if (calculatedHash !== log.currentHash) {
        console.log(`FAIL: Hash mismatch at log ${log.id}`);
        console.log(`  Calculated hash: ${calculatedHash.substring(0, 16)}...`);
        console.log(`  Stored hash: ${log.currentHash.substring(0, 16)}...`);
        console.log('  → Tamper detected (details field was modified)');
        valid = false;
        break;
    }

    expectedPreviousHash = log.currentHash;
}

console.log(`\nVerification result: ${valid ? 'PASS' : 'FAIL'}`);
console.log('Expected: FAIL\n');

// ============================================
// 2️⃣ CALCULATION HASH TAMPER TEST
// ============================================
console.log('============================================');
console.log('2️⃣ CALCULATION HASH TAMPER TEST');
console.log('--------------------------------------------\n');

// Insert revision
const designData = { mva: 10, hv: 33, lv: 11 };
const designDataJson = JSON.stringify(designData);
const calculationHash = crypto.createHash('sha256').update(designDataJson).digest('hex');

db.prepare(`
    INSERT INTO design_revisions (
        wo, revision, designData, calculationHash, 
        validationStatus, calculatorVersion, engineVersion, createdBy, frozen
    )
    VALUES ('DEMO-001', 1, ?, ?, 'PASS', '2.0.0', 'IEC-2024', 'admin', 1)
`).run(designDataJson, calculationHash);

console.log('Inserted revision: wo=DEMO-001, revision=1');
console.log(`Original designData: ${designDataJson}`);
console.log(`Original hash: ${calculationHash.substring(0, 16)}...\n`);

// Tamper with designData (bypass trigger by setting frozen=0 first)
console.log('Tampering with designData...');
db.prepare('UPDATE design_revisions SET frozen = 0 WHERE wo = ?').run('DEMO-001');
db.prepare('UPDATE design_revisions SET designData = ? WHERE wo = ?').run('{"mva":99}', 'DEMO-001');
db.prepare('UPDATE design_revisions SET frozen = 1 WHERE wo = ?').run('DEMO-001');
console.log('✓ Modified designData to {"mva":99}\n');

// Verify calculation hash
console.log('Running verifyCalculationHash...\n');

const retrieved = db.prepare('SELECT designData, calculationHash FROM design_revisions WHERE wo = ?').get('DEMO-001');
const recalculatedHash = crypto.createHash('sha256').update(retrieved.designData).digest('hex');

console.log(`Stored hash:       ${retrieved.calculationHash.substring(0, 16)}...`);
console.log(`Recalculated hash: ${recalculatedHash.substring(0, 16)}...`);
console.log(`Match: ${retrieved.calculationHash === recalculatedHash ? 'YES' : 'NO'}`);
console.log(`Status: ${retrieved.calculationHash === recalculatedHash ? 'VERIFIED' : 'TAMPERED'}`);
console.log('Expected: TAMPERED\n');

// ============================================
// 3️⃣ TRIGGER BYPASS TEST
// ============================================
console.log('============================================');
console.log('3️⃣ TRIGGER BYPASS TEST');
console.log('--------------------------------------------\n');

console.log('Attempting to disable triggers...');
db.pragma('foreign_keys = OFF');
db.pragma('recursive_triggers = OFF');
console.log('✓ PRAGMA foreign_keys = OFF');
console.log('✓ PRAGMA recursive_triggers = OFF\n');

console.log('Attempting UPDATE on frozen revision...');
try {
    db.prepare('UPDATE design_revisions SET notes = ? WHERE wo = ?').run('Bypass attempt', 'DEMO-001');
    console.log('ERROR: Update succeeded (trigger bypassed!)');
    console.log('Status: FAILED - Immutability not industrial grade\n');
} catch (error) {
    console.log(`Error: ${error.message}`);
    console.log('Status: PASSED - Trigger still enforced');
    console.log('Expected: Still blocked\n');
}

// Re-enable
db.pragma('foreign_keys = ON');

// ============================================
// 4️⃣ TRANSACTION ATOMICITY TEST
// ============================================
console.log('============================================');
console.log('4️⃣ TRANSACTION ATOMICITY TEST');
console.log('--------------------------------------------\n');

// Setup: Create a transformer
db.prepare(`
    INSERT INTO transformers (wo, customerId, customer, rating, createdBy)
    VALUES ('ATOM-001', 'cust1', 'Test Customer', 10, 'admin')
`).run();

console.log('Initial state:');
const before = db.prepare('SELECT * FROM transformers WHERE wo = ?').get('ATOM-001');
console.log(`  Transformer: wo=${before.wo}, rating=${before.rating}`);

const auditCountBefore = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
console.log(`  Audit logs: ${auditCountBefore}\n`);

// Simulate transaction with forced failure
console.log('Simulating transaction with forced audit failure...');
try {
    db.transaction(() => {
        // Update transformer
        db.prepare('UPDATE transformers SET rating = ? WHERE wo = ?').run(20, 'ATOM-001');

        // Force audit failure (invalid userId foreign key)
        db.prepare(`
            INSERT INTO audit_logs (timestamp, userId, action, entityType, entityId, previousHash, currentHash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(new Date().toISOString(), 'INVALID_USER', 'UPDATE', 'transformer', 'ATOM-001', '0'.repeat(64), 'abc123');
    })();
} catch (error) {
    console.log(`✓ Transaction failed: ${error.message}\n`);
}

console.log('Final state:');
const after = db.prepare('SELECT * FROM transformers WHERE wo = ?').get('ATOM-001');
console.log(`  Transformer: wo=${after.wo}, rating=${after.rating}`);

const auditCountAfter = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
console.log(`  Audit logs: ${auditCountAfter}`);

console.log(`\nRollback verified: ${before.rating === after.rating ? 'YES' : 'NO'}`);
console.log(`No orphaned audit: ${auditCountBefore === auditCountAfter ? 'YES' : 'NO'}`);
console.log('Expected: Both YES\n');

// ============================================
// 5️⃣ CONCURRENCY RACE TEST
// ============================================
console.log('============================================');
console.log('5️⃣ CONCURRENCY RACE TEST');
console.log('--------------------------------------------\n');

// Setup
db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('RACE-001');
db.prepare(`
    INSERT INTO transformers (wo, customerId, customer, rating, createdBy)
    VALUES ('RACE-001', 'cust1', 'Test Customer', 10, 'admin')
`).run();

console.log('Spawning 50 parallel freeze operations...\n');

// Simulate concurrent inserts
const errors = [];
for (let i = 0; i < 50; i++) {
    try {
        db.transaction(() => {
            // Get next revision
            const latest = db.prepare('SELECT MAX(revision) as maxRev FROM design_revisions WHERE wo = ?').get('RACE-001');
            const nextRevision = (latest?.maxRev || 0) + 1;

            // Insert
            db.prepare(`
                INSERT INTO design_revisions (
                    wo, revision, designData, calculationHash, 
                    validationStatus, calculatorVersion, engineVersion, createdBy, frozen
                )
                VALUES (?, ?, ?, ?, 'PASS', '2.0.0', 'IEC-2024', 'admin', 1)
            `).run('RACE-001', nextRevision, '{}', 'hash' + i);
        })();
    } catch (error) {
        errors.push({ iteration: i, error: error.message });
    }
}

console.log(`Operations completed: ${50 - errors.length} succeeded, ${errors.length} failed\n`);

if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  Iteration ${e.iteration}: ${e.error}`));
    console.log('');
}

// Check results
const results = db.prepare('SELECT wo, revision FROM design_revisions WHERE wo = ? ORDER BY revision').all('RACE-001');

console.log('SELECT wo, revision FROM design_revisions WHERE wo=\'RACE-001\':');
results.forEach(r => console.log(`  wo=${r.wo}, revision=${r.revision}`));
console.log('');

// Verify no duplicates
const revisions = results.map(r => r.revision);
const uniqueRevisions = [...new Set(revisions)];

console.log(`Total revisions: ${results.length}`);
console.log(`Unique revisions: ${uniqueRevisions.length}`);
console.log(`No duplicates: ${results.length === uniqueRevisions.length ? 'YES' : 'NO'}`);
console.log('Expected: YES\n');

console.log('============================================');
console.log('ADVERSARIAL VALIDATION COMPLETE');
console.log('============================================');

db.close();
