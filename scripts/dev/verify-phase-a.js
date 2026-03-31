const db = require('../config/database');
const auditService = require('../services/audit.service');
const designRevisionService = require('../services/design-revision.service');

console.log('\n' + '='.repeat(60));
console.log('SQL VERIFICATION - Phase A Core Enforcement');
console.log('='.repeat(60) + '\n');

// Test 1: Verify schema
console.log('1. Verifying schema...');
const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
`).all();

console.log('   Tables:', tables.map(t => t.name).join(', '));

// Test 2: Verify triggers
console.log('\n2. Verifying triggers...');
const triggers = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='trigger'
`).all();

console.log('   Triggers:', triggers.map(t => t.name).join(', '));

// Test 3: Test immutability enforcement
console.log('\n3. Testing immutability enforcement...');
try {
    // Insert test revision
    db.prepare(`
        INSERT INTO design_revisions (
            wo, revision, designData, calculationHash, 
            validationStatus, calculatorVersion, engineVersion, createdBy, frozen
        )
        VALUES ('TEST-001', 1, '{"test": true}', 'hash123', 'PASS', '2.0.0', 'IEC-2024', 'admin', 1)
    `).run();

    console.log('   ✓ Inserted test revision');

    // Try to update (should fail)
    try {
        db.prepare('UPDATE design_revisions SET notes = ? WHERE wo = ?')
            .run('Modified', 'TEST-001');
        console.log('   ❌ FAILED: Update was allowed (should be blocked)');
    } catch (error) {
        console.log('   ✓ Update blocked:', error.message);
    }

    // Try to delete (should fail)
    try {
        db.prepare('DELETE FROM design_revisions WHERE wo = ?')
            .run('TEST-001');
        console.log('   ❌ FAILED: Delete was allowed (should be blocked)');
    } catch (error) {
        console.log('   ✓ Delete blocked:', error.message);
    }

    // Cleanup
    db.prepare('UPDATE design_revisions SET frozen = 0 WHERE wo = ?').run('TEST-001');
    db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('TEST-001');

} catch (error) {
    console.log('   ❌ Test failed:', error.message);
}

// Test 4: Test calculation hash
console.log('\n4. Testing calculation hash...');
try {
    const testData = { mva: 10, hv: 33, lv: 11 };
    const result = designRevisionService.createRevision('TEST-002', testData, {
        validationStatus: 'PASS',
        calculatorVersion: '2.0.0',
        engineVersion: 'IEC-2024',
        createdBy: 'admin'
    });

    console.log('   ✓ Created revision:', result.revision);
    console.log('   ✓ Calculation hash:', result.calculationHash.substring(0, 16) + '...');

    // Verify hash
    const verification = designRevisionService.verifyCalculationHash('TEST-002', result.revision);
    console.log('   ✓ Hash verification:', verification.status);

    // Cleanup
    db.prepare('UPDATE design_revisions SET frozen = 0 WHERE wo = ?').run('TEST-002');
    db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('TEST-002');

} catch (error) {
    console.log('   ❌ Test failed:', error.message);
}

// Test 5: Test audit hash chain
console.log('\n5. Testing audit hash chain...');
try {
    // Log 3 audit entries
    const hash1 = auditService.log({
        userId: 'admin',
        action: 'CREATE',
        entityType: 'transformer',
        entityId: 'TEST-003'
    });
    console.log('   ✓ Log 1 hash:', hash1.substring(0, 16) + '...');

    const hash2 = auditService.log({
        userId: 'admin',
        action: 'UPDATE',
        entityType: 'transformer',
        entityId: 'TEST-003'
    });
    console.log('   ✓ Log 2 hash:', hash2.substring(0, 16) + '...');

    const hash3 = auditService.log({
        userId: 'admin',
        action: 'DELETE',
        entityType: 'transformer',
        entityId: 'TEST-003'
    });
    console.log('   ✓ Log 3 hash:', hash3.substring(0, 16) + '...');

    // Verify chain
    const chainVerification = auditService.verifyChain();
    console.log('   ✓ Chain verification:', chainVerification.valid ? 'VALID' : 'INVALID');
    console.log('   ✓ Total logs:', chainVerification.total);

} catch (error) {
    console.log('   ❌ Test failed:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(60) + '\n');

db.close();
