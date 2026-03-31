const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Setup
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'transformer.db');
const db = new Database(dbPath);

// Initialize schema
const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Enable WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('============================================');
console.log('1️⃣ EXACT SQL TRIGGER DEFINITIONS');
console.log('============================================\n');

const triggers = db.prepare('SELECT sql FROM sqlite_master WHERE type=\'trigger\'').all();

triggers.forEach(t => {
    console.log(t.sql);
    console.log('\n');
});

console.log('============================================');
console.log('2️⃣ SAMPLE OUTPUT: SELECT sql FROM sqlite_master WHERE type=\'trigger\'');
console.log('============================================\n');

console.log(JSON.stringify(triggers, null, 2));

console.log('\n============================================');
console.log('3️⃣ DEMONSTRATION: IMMUTABILITY ENFORCEMENT');
console.log('============================================\n');

console.log('-- Inserting frozen revision --');
db.prepare(`
    INSERT INTO design_revisions (
        wo, revision, designData, calculationHash, 
        validationStatus, calculatorVersion, engineVersion, createdBy, frozen
    )
    VALUES ('DEMO-001', 1, '{"mva": 10}', 'abc123', 'PASS', '2.0.0', 'IEC-2024', 'admin', 1)
`).run();
console.log('✓ Inserted: wo=DEMO-001, revision=1, frozen=1\n');

console.log('-- Attempting UPDATE on frozen revision --');
try {
    db.prepare('UPDATE design_revisions SET notes = ? WHERE wo = ?').run('Modified notes', 'DEMO-001');
    console.log('ERROR: Update was allowed (should have failed)\n');
} catch (error) {
    console.log('Error:', error.message);
    console.log('✓ UPDATE blocked as expected\n');
}

console.log('-- Attempting DELETE on frozen revision --');
try {
    db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('DEMO-001');
    console.log('ERROR: Delete was allowed (should have failed)\n');
} catch (error) {
    console.log('Error:', error.message);
    console.log('✓ DELETE blocked as expected\n');
}

db.prepare('UPDATE design_revisions SET frozen = 0 WHERE wo = ?').run('DEMO-001');
db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('DEMO-001');

console.log('============================================');
console.log('4️⃣ AUDIT HASH VERIFICATION');
console.log('============================================\n');

db.prepare('DELETE FROM audit_logs').run();

console.log('-- Inserting 3 audit logs --\n');

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
        INSERT INTO audit_logs (timestamp, userId, action, entityType, entityId, previousHash, currentHash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(timestamp, userId, action, 'transformer', entityId, previousHash, currentHash);

    const count = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
    console.log(`Log ${count}:`);
    console.log(`  previousHash: ${previousHash.substring(0, 16)}...`);
    console.log(`  currentHash:  ${currentHash.substring(0, 16)}...`);
    console.log('');

    return currentHash;
}

insertAuditLog('admin', 'CREATE', 'T-001');
insertAuditLog('admin', 'UPDATE', 'T-001');
insertAuditLog('quality', 'APPROVE', 'T-001');

console.log('-- Full hash values --\n');
const logs = db.prepare('SELECT id, previousHash, currentHash FROM audit_logs ORDER BY id').all();
logs.forEach(l => {
    console.log(`Log ${l.id}:`);
    console.log(`  previousHash: ${l.previousHash}`);
    console.log(`  currentHash:  ${l.currentHash}`);
    console.log('');
});

console.log('-- Running verification logic --\n');

let valid = true;
let expectedPreviousHash = '0'.repeat(64);

const allLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id').all();
for (const l of allLogs) {
    if (l.previousHash !== expectedPreviousHash) {
        console.log(`FAIL: Hash chain broken at log ${l.id}`);
        valid = false;
        break;
    }

    const dataToHash = JSON.stringify({
        timestamp: l.timestamp,
        userId: l.userId,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        previousHash: l.previousHash
    });

    const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    if (calculatedHash !== l.currentHash) {
        console.log(`FAIL: Hash mismatch at log ${l.id}`);
        valid = false;
        break;
    }

    expectedPreviousHash = l.currentHash;
}

console.log(`Verification result: ${valid ? 'PASS' : 'FAIL'}`);
console.log(`Total logs verified: ${allLogs.length}\n`);

console.log('============================================');
console.log('5️⃣ CALCULATION HASH VERIFICATION');
console.log('============================================\n');

const designData = { mva: 10, hv: 33, lv: 11, frequency: 50 };
const designDataJson = JSON.stringify(designData);
const calculationHash = crypto.createHash('sha256').update(designDataJson).digest('hex');

console.log('-- Inserting revision --');
console.log('designData:', designDataJson);
console.log('calculationHash (stored):', calculationHash);
console.log('');

db.prepare(`
    INSERT INTO design_revisions (
        wo, revision, designData, calculationHash, 
        validationStatus, calculatorVersion, engineVersion, createdBy, frozen
    )
    VALUES ('HASH-001', 1, ?, ?, 'PASS', '2.0.0', 'IEC-2024', 'admin', 1)
`).run(designDataJson, calculationHash);

console.log('-- Recalculating SHA-256 manually --');
const retrieved = db.prepare('SELECT designData, calculationHash FROM design_revisions WHERE wo = ?').get('HASH-001');
const recalculatedHash = crypto.createHash('sha256').update(retrieved.designData).digest('hex');

console.log('calculationHash (recalculated):', recalculatedHash);
console.log('');

console.log('-- Verification --');
console.log('Stored hash:      ', retrieved.calculationHash);
console.log('Recalculated hash:', recalculatedHash);
console.log('Match:', retrieved.calculationHash === recalculatedHash ? 'YES' : 'NO');
console.log('Status:', retrieved.calculationHash === recalculatedHash ? 'VERIFIED' : 'TAMPERED');
console.log('');

db.prepare('UPDATE design_revisions SET frozen = 0 WHERE wo = ?').run('HASH-001');
db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('HASH-001');

console.log('============================================');
console.log('VERIFICATION COMPLETE');
console.log('============================================');

db.close();
