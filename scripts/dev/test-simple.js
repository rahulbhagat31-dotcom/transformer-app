const db = require('../config/database');

console.log('Starting verification...');

try {
    // Test 1: Check tables
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
    console.log('\nTables:', tables.map(t => t.name));

    // Test 2: Check triggers
    const triggers = db.prepare('SELECT name FROM sqlite_master WHERE type=\'trigger\'').all();
    console.log('Triggers:', triggers.map(t => t.name));

    // Test 3: Test immutability
    console.log('\nTesting immutability...');
    db.prepare(`
        INSERT INTO design_revisions (
            wo, revision, designData, calculationHash, 
            validationStatus, calculatorVersion, engineVersion, createdBy, frozen
        )
        VALUES ('TEST-001', 1, '{}', 'hash123', 'PASS', '2.0.0', 'IEC-2024', 'admin', 1)
    `).run();

    try {
        db.prepare('UPDATE design_revisions SET notes = ? WHERE wo = ?').run('test', 'TEST-001');
        console.log('ERROR: Update allowed');
    } catch (e) {
        console.log('✓ Update blocked:', e.message);
    }

    // Cleanup
    db.prepare('UPDATE design_revisions SET frozen = 0 WHERE wo = ?').run('TEST-001');
    db.prepare('DELETE FROM design_revisions WHERE wo = ?').run('TEST-001');

    console.log('\nVerification complete');

} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
}

db.close();
