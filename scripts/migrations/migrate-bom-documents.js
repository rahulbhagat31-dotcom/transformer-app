/**
 * Migration: Add bom_files and documents tables to SQLite
 * Also migrates existing data from boms.json and documents.json
 * Safe to run multiple times (idempotent)
 */

const path = require('path');
const fs = require('fs');

// Load database
const db = require('../config/database');

console.log('🔧 Running BOM + Documents migration...\n');

// ── Step 1: Create tables ─────────────────────────────────────────────────────

db.exec(`
    CREATE TABLE IF NOT EXISTS bom_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wo TEXT NOT NULL,
        customerId TEXT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        uploadedBy TEXT NOT NULL,
        uploadedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (wo) REFERENCES transformers(wo)
    );
    CREATE INDEX IF NOT EXISTS idx_bom_wo ON bom_files(wo);

    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wo TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'general',
        customerId TEXT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        uploadedBy TEXT NOT NULL,
        uploadedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (wo) REFERENCES transformers(wo)
    );
    CREATE INDEX IF NOT EXISTS idx_documents_wo ON documents(wo);
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(wo, type);
`);

console.log('✅ Tables created (or already exist)');

// ── Step 2: Migrate boms.json ─────────────────────────────────────────────────

const bomsPath = path.join(__dirname, '../data/boms.json');
if (fs.existsSync(bomsPath)) {
    try {
        const raw = fs.readFileSync(bomsPath, 'utf8').trim();
        const boms = raw && raw !== '[]' ? JSON.parse(raw) : [];

        if (boms.length > 0) {
            const insertBOM = db.prepare(`
                INSERT OR IGNORE INTO bom_files (wo, customerId, filename, filepath, uploadedBy, uploadedAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            let migrated = 0;
            const migrateBOMs = db.transaction(() => {
                for (const b of boms) {
                    insertBOM.run(
                        b.wo || 'UNKNOWN',
                        b.customerId || null,
                        b.filename || 'unknown.file',
                        b.filepath || '',
                        b.uploadedBy || 'migration',
                        b.uploadedAt || new Date().toISOString()
                    );
                    migrated++;
                }
            });
            migrateBOMs();
            console.log(`✅ Migrated ${migrated} BOM records from boms.json`);
        } else {
            console.log('ℹ️  boms.json is empty — nothing to migrate');
        }
    } catch (e) {
        console.warn('⚠️  Could not parse boms.json:', e.message);
    }
} else {
    console.log('ℹ️  boms.json not found — skipping');
}

// ── Step 3: Migrate documents.json ───────────────────────────────────────────

const docsPath = path.join(__dirname, '../data/documents.json');
if (fs.existsSync(docsPath)) {
    try {
        const raw = fs.readFileSync(docsPath, 'utf8').trim();
        const docs = raw && raw !== '[]' ? JSON.parse(raw) : [];

        if (docs.length > 0) {
            const insertDoc = db.prepare(`
                INSERT OR IGNORE INTO documents (wo, type, customerId, filename, filepath, uploadedBy, uploadedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            let migrated = 0;
            const migrateDocs = db.transaction(() => {
                for (const d of docs) {
                    insertDoc.run(
                        d.wo || 'UNKNOWN',
                        d.type || 'general',
                        d.customerId || null,
                        d.filename || 'unknown.file',
                        d.filepath || '',
                        d.uploadedBy || 'migration',
                        d.uploadedAt || new Date().toISOString()
                    );
                    migrated++;
                }
            });
            migrateDocs();
            console.log(`✅ Migrated ${migrated} document records from documents.json`);
        } else {
            console.log('ℹ️  documents.json is empty — nothing to migrate');
        }
    } catch (e) {
        console.warn('⚠️  Could not parse documents.json:', e.message);
    }
} else {
    console.log('ℹ️  documents.json not found — skipping');
}

// ── Step 4: Verify ────────────────────────────────────────────────────────────

const bomCount = db.prepare('SELECT COUNT(*) as n FROM bom_files').get().n;
const docCount = db.prepare('SELECT COUNT(*) as n FROM documents').get().n;

console.log('\n📊 Final counts:');
console.log(`   bom_files:  ${bomCount} records`);
console.log(`   documents:  ${docCount} records`);
console.log('\n✅ Migration complete!\n');
