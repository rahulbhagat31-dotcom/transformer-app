const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'transformer.db');

console.log('='.repeat(60));
console.log('JSON TO SQLITE MIGRATION');
console.log('='.repeat(60));
console.log('');

// Initialize database
const db = new Database(dbPath);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Load and execute simplified schema
const schemaPath = path.join(__dirname, '..', 'config', 'schema-production.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log('✓ Database initialized with production schema');
console.log('');

// Migrate users
const usersPath = path.join(dataDir, 'users.json');
if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO users (userId, password, name, email, role, department, customerId, customerName, permissions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const user of users) {
        stmt.run(
            user.userId,
            user.password,
            user.name,
            user.email || null,
            user.role,
            user.department || null,
            user.customerId || null,
            user.customerName || null,
            user.permissions ? JSON.stringify(user.permissions) : null
        );
        count++;
    }

    console.log(`✓ Migrated ${count} users`);
} else {
    console.log('⚠ users.json not found, skipping');
}

// Migrate transformers
const transformersPath = path.join(dataDir, 'transformers.json');
if (fs.existsSync(transformersPath)) {
    const transformers = JSON.parse(fs.readFileSync(transformersPath, 'utf8'));
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO transformers (wo, customerId, customer, rating, hv, lv, stage, currentStage, stageProgress, stageHistory, designData, actuals, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const t of transformers) {
        stmt.run(
            t.wo,
            t.customerId,
            t.customer,
            t.rating,
            t.hv,
            t.lv,
            t.stage || 'design',
            t.currentStage || null,
            t.stageProgress || 0,
            t.stageHistory ? JSON.stringify(t.stageHistory) : null,
            t.designData ? JSON.stringify(t.designData) : null,
            t.actuals ? JSON.stringify(t.actuals) : null,
            t.createdBy || 'system'
        );
        count++;
    }

    console.log(`✓ Migrated ${count} transformers`);
} else {
    console.log('⚠ transformers.json not found, skipping');
}

// Migrate audit logs
const auditPath = path.join(dataDir, 'auditLogs.json');
if (fs.existsSync(auditPath)) {
    const audits = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    const stmt = db.prepare(`
        INSERT INTO audit_logs (timestamp, userId, username, role, action, entityType, entityId, details, ipAddress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const a of audits) {
        stmt.run(
            a.timestamp,
            a.userId,
            a.username || null,
            a.role || null,
            a.action,
            a.entityType || null,
            a.entityId || null,
            a.details ? JSON.stringify(a.details) : null,
            a.ipAddress || null
        );
        count++;
    }

    console.log(`✓ Migrated ${count} audit logs`);
} else {
    console.log('⚠ auditLogs.json not found, skipping');
}

// Migrate checklists
const checklistsPath = path.join(dataDir, 'checklists.json');
if (fs.existsSync(checklistsPath)) {
    const checklists = JSON.parse(fs.readFileSync(checklistsPath, 'utf8'));
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO checklists (wo, stage, items, locked, qaApproved, rejectionReason, completedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const c of checklists) {
        stmt.run(
            c.wo,
            c.stage,
            c.items ? JSON.stringify(c.items) : null,
            c.locked || 0,
            c.qaApproved || null,
            c.rejectionReason || null,
            c.completedBy || null
        );
        count++;
    }

    console.log(`✓ Migrated ${count} checklists`);
} else {
    console.log('⚠ checklists.json not found, skipping');
}

console.log('');
console.log('='.repeat(60));
console.log('MIGRATION COMPLETE');
console.log('='.repeat(60));
console.log('');

// Verify record counts
console.log('Record counts:');
console.log(`  Users: ${db.prepare('SELECT COUNT(*) as c FROM users').get().c}`);
console.log(`  Transformers: ${db.prepare('SELECT COUNT(*) as c FROM transformers').get().c}`);
console.log(`  Audit Logs: ${db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c}`);
console.log(`  Checklists: ${db.prepare('SELECT COUNT(*) as c FROM checklists').get().c}`);
console.log('');

// Backup JSON files
const backupDir = path.join(dataDir, 'json-backup-' + Date.now());
fs.mkdirSync(backupDir, { recursive: true });

const jsonFiles = ['users.json', 'transformers.json', 'auditLogs.json', 'checklists.json'];
for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, path.join(backupDir, file));
    }
}

console.log(`✓ JSON files backed up to: ${backupDir}`);
console.log('');
console.log('Migration successful! You can now delete JSON files if desired.');

db.close();
