/**
 * Migration: Create transformer_stage_status table and migrate from JSON
 * Run once: node scripts/migrate-stage-status.js
 */

require('dotenv').config();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const STAGE_STATUS_JSON = path.join(__dirname, '..', 'data', 'stageStatus.json');

console.log('🔧 Running Stage Status Migration...\n');

// 1. Create Table
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS transformer_stage_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wo TEXT NOT NULL,
            stage TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            completionPercentage INTEGER DEFAULT 0,
            completedAt TEXT,
            completedBy TEXT,
            locked INTEGER DEFAULT 0,
            lockedAt TEXT,
            unlockedBy TEXT,
            unlockedAt TEXT,
            unlockReason TEXT,
            lastUpdated TEXT DEFAULT (datetime('now')),
            UNIQUE(wo, stage),
            FOREIGN KEY (wo) REFERENCES transformers(wo)
        );
        CREATE INDEX IF NOT EXISTS idx_stage_status_wo ON transformer_stage_status(wo);
    `);
    console.log('✅ Table transformer_stage_status created/verified.');
} catch (e) {
    console.error('❌ Error creating table:', e.message);
    process.exit(1);
}

// 2. Migrate JSON Data
if (fs.existsSync(STAGE_STATUS_JSON)) {
    try {
        const rawData = fs.readFileSync(STAGE_STATUS_JSON, 'utf8');
        const jsonData = JSON.parse(rawData);
        const wos = Object.keys(jsonData);

        console.log(`\n📂 Found stageStatus.json with ${wos.length} work orders.`);

        const insert = db.prepare(`
            INSERT OR IGNORE INTO transformer_stage_status (
                wo, stage, status, completionPercentage, completedAt, completedBy, 
                locked, lockedAt, unlockedBy, unlockedAt, unlockReason, lastUpdated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        let migratedCount = 0;

        db.transaction(() => {
            wos.forEach(wo => {
                const stages = jsonData[wo];
                Object.keys(stages).forEach(stage => {
                    const data = stages[stage];
                    insert.run(
                        wo,
                        stage,
                        data.status || 'pending',
                        data.completionPercentage || 0,
                        data.completedAt || null,
                        data.completedBy || null,
                        data.locked ? 1 : 0,
                        data.lockedAt || null,
                        data.unlockedBy || null,
                        data.unlockedAt || null,
                        data.unlockReason || null
                    );
                    migratedCount++;
                });
            });
        })();

        console.log(`✅ Migrated ${migratedCount} stage records from JSON to SQLite.`);

    } catch (e) {
        console.error('❌ Error migrating JSON data:', e.message);
    }
} else {
    console.log('ℹ️  stageStatus.json not found — skipping data migration.');
}

console.log('\n✅ Stage Status Migration complete!');
