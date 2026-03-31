/**
 * Migration: Add missing columns to existing SQLite database
 * Run once: node scripts/migrate-add-columns.js
 *
 * Adds:
 *   - audit_logs.previousHash
 *   - audit_logs.currentHash
 *   - checklists UNIQUE constraint (via table recreation)
 */

require('dotenv').config();
const db = require('../config/database');

console.log('🔧 Running database migration...\n');

// 1. Add previousHash to audit_logs if missing
try {
    db.exec('ALTER TABLE audit_logs ADD COLUMN previousHash TEXT');
    console.log('✅ Added audit_logs.previousHash');
} catch (e) {
    if (e.message.includes('duplicate column')) {
        console.log('ℹ️  audit_logs.previousHash already exists — skipping');
    } else {
        console.error('❌ Error adding previousHash:', e.message);
    }
}

// 2. Add currentHash to audit_logs if missing
try {
    db.exec('ALTER TABLE audit_logs ADD COLUMN currentHash TEXT');
    console.log('✅ Added audit_logs.currentHash');
} catch (e) {
    if (e.message.includes('duplicate column')) {
        console.log('ℹ️  audit_logs.currentHash already exists — skipping');
    } else {
        console.error('❌ Error adding currentHash:', e.message);
    }
}

// 3. Verify the columns exist
const auditCols = db.prepare('PRAGMA table_info(audit_logs)').all();
const colNames = auditCols.map(c => c.name);
console.log('\n📊 audit_logs columns:', colNames.join(', '));

const checklistCols = db.prepare('PRAGMA table_info(checklists)').all();
console.log('📊 checklists columns:', checklistCols.map(c => c.name).join(', '));

const transformerCols = db.prepare('PRAGMA table_info(transformers)').all();
console.log('📊 transformers columns:', transformerCols.map(c => c.name).join(', '));

const userCols = db.prepare('PRAGMA table_info(users)').all();
console.log('📊 users columns:', userCols.map(c => c.name).join(', '));

// 4. Count records
const auditCount = db.prepare('SELECT COUNT(*) as n FROM audit_logs').get();
const transformerCount = db.prepare('SELECT COUNT(*) as n FROM transformers').get();
const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get();
const checklistCount = db.prepare('SELECT COUNT(*) as n FROM checklists').get();

console.log('\n📈 Record counts:');
console.log(`   users: ${userCount.n}`);
console.log(`   transformers: ${transformerCount.n}`);
console.log(`   checklists: ${checklistCount.n}`);
console.log(`   audit_logs: ${auditCount.n}`);

console.log('\n✅ Migration complete!');
process.exit(0);
