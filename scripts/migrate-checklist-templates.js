/**
 * Migration: Add checklist_templates and checklist_revisions tables
 * Safe to run multiple times (IF NOT EXISTS).
 */
const db = require('../config/database');

console.log('🔄 Running checklist template & revision migration...');

db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        stage TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        items TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        UNIQUE(name, version)
    );
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_templates_stage ON checklist_templates(stage);
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_templates_name ON checklist_templates(name, version DESC);
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wo TEXT NOT NULL,
        stage TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1,
        items TEXT NOT NULL,
        changeReason TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (wo) REFERENCES transformers(wo)
    );
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_revisions_wo_stage ON checklist_revisions(wo, stage, revision DESC);
`);

console.log('✅ Checklist template & revision tables created successfully');
console.log('   - checklist_templates (with name/version unique constraint)');
console.log('   - checklist_revisions (per-WO revision history)');
