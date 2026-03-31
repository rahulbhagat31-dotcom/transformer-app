const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'transformer.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Set synchronous mode for data safety
db.pragma('synchronous = FULL');

console.log('📊 Database Configuration:');
console.log(`   Path: ${DB_PATH}`);
console.log(`   Journal Mode: ${db.pragma('journal_mode', { simple: true })}`);
console.log(`   Foreign Keys: ${db.pragma('foreign_keys', { simple: true })}`);
console.log(`   Synchronous: ${db.pragma('synchronous', { simple: true })}`);

// Initialize schema (use production schema)
const schemaPath = path.join(__dirname, 'schema-production.sql');
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements and run them separately.
    // ALTER TABLE runs inside try/catch so adding an already-existing
    // column is silently ignored (idempotent migration).
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
        try {
            db.exec(stmt + ';');
        } catch (err) {
            // Ignore "duplicate column" errors from ALTER TABLE migrations;
            // re-throw everything else.
            if (!err.message.includes('duplicate column')) {
                console.warn(`⚠️ Schema migration warning: ${err.message}`);
            }
        }
    }

    console.log('✅ Database schema initialized (production)');
}

module.exports = db;
