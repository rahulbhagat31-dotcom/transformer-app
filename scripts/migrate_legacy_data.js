const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'transformer.db');
const BACKUP_DIR = 'D:/New folder/backup project/transformer2.0/transformer/data';

function migrateLegacyData() {
    console.log('🔄 Starting Legacy Data Migration...');
    const db = new Database(DB_PATH);

    // Disable synchronous to speed up inserts
    db.pragma('synchronous = OFF');
    // We MUST keep foreign keys ON to ensure referential integrity is respected,
    // so we must migrate parent records first!

    // ─── 0. MIGRATE TRANSFORMERS ────────────────────────────
    const transformersPath = path.join(BACKUP_DIR, 'transformers.json');
    if (fs.existsSync(transformersPath)) {
        try {
            const transformers = JSON.parse(fs.readFileSync(transformersPath, 'utf8'));
            console.log(`\n🏭 Found ${transformers.length} transformers in legacy JSON.`);
            
            const insertTransformer = db.prepare(`
                INSERT OR IGNORE INTO transformers (wo, customerId, customer, rating, hv, lv, stage, currentStage)
                VALUES (@wo, @customerId, @customer, @rating, @hv, @lv, @stage, @currentStage)
            `);
            
            let tCount = 0;
            const insertTransformersTx = db.transaction((ts) => {
                for (const t of ts) {
                    if(!t.wo) continue; // Skip bad records
                    const result = insertTransformer.run({
                        wo: t.wo,
                        customerId: t.customerId || 'UNKNOWN',
                        customer: t.customer || 'Unknown',
                        rating: t.rating || 0,
                        hv: t.hv || 0,
                        lv: t.lv || 0,
                        stage: t.stage || 'design',
                        currentStage: t.currentStage || t.stage || 'design'
                    });
                    if (result.changes > 0) tCount++;
                }
            });
            
            insertTransformersTx(transformers);
            console.log(`✅ Successfully inserted/migrated ${tCount} missing transformers into SQLite.`);
        } catch (err) {
            console.error('❌ Error migrating transformers:', err.message);
        }
    }

    // ─── 1. MIGRATE EXAM QUESTIONS ──────────────────────────
    const questionsPath = path.join(BACKUP_DIR, 'questions.json');
    if (fs.existsSync(questionsPath)) {
        try {
            const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
            console.log(`\n📚 Found ${questions.length} questions in legacy JSON.`);
            
            const insertQuestion = db.prepare(`
                INSERT OR IGNORE INTO exam_questions (id, section, text, optionA, optionB, optionC, optionD, correctOption, createdBy)
                VALUES (@id, @section, @text, @optionA, @optionB, @optionC, @optionD, @correctOption, @createdBy)
            `);

            let qCount = 0;
            const insertQuestionsTx = db.transaction((qs) => {
                for (const q of qs) {
                    const result = insertQuestion.run({
                        id: q.id,
                        section: q.section || 'winding', // fallback if empty
                        text: q.text,
                        optionA: q.options && q.options[0] ? q.options[0] : 'N/A',
                        optionB: q.options && q.options[1] ? q.options[1] : 'N/A',
                        optionC: q.options && q.options[2] ? q.options[2] : 'N/A',
                        optionD: q.options && q.options[3] ? q.options[3] : 'N/A',
                        correctOption: q.correctOption,
                        createdBy: q.createdBy || 'system'
                    });
                    if (result.changes > 0) qCount++;
                }
            });

            insertQuestionsTx(questions);
            console.log(`✅ Successfully inserted/migrated ${qCount} missing questions into SQLite.`);
        } catch (err) {
            console.error('❌ Error migrating questions:', err.message);
        }
    }

    // ─── 2. MIGRATE CHECKLISTS ──────────────────────────────
    const checklistsPath = path.join(BACKUP_DIR, 'checklists.json');
    if (fs.existsSync(checklistsPath)) {
        try {
            const checklistRows = JSON.parse(fs.readFileSync(checklistsPath, 'utf8'));
            console.log(`\n📋 Found ${checklistRows.length} checklist row items in legacy JSON.`);
            
            // Group the flat row items into bundled (wo, stage) objects
            const grouped = {};
            for (const row of checklistRows) {
                if (!row.wo || !row.stage) continue;
                const key = `${row.wo}|${row.stage}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        wo: row.wo,
                        stage: row.stage,
                        locked: false,
                        qaApproved: null,
                        supervisorApproved: false,
                        items: []
                    };
                }
                // Determine if parent should be locked/approved based on extreme values across rows
                if (row.locked) grouped[key].locked = true;
                
                // Keep the row intact inside the items array so the new UI can parse it
                grouped[key].items.push(row);
            }

            const bundledChecklists = Object.values(grouped);
            console.log(`📦 Bundled row items into ${bundledChecklists.length} cohesive checklists by (wo, stage).`);

            const insertChecklist = db.prepare(`
                INSERT OR REPLACE INTO checklists 
                (wo, stage, items, locked, qaApproved, rejectionReason, completedBy, supervisorApproved, supervisorApprovedBy, supervisorApprovedAt, lastUpdated)
                VALUES (@wo, @stage, @items, @locked, @qaApproved, @rejectionReason, @completedBy, @supervisorApproved, @supervisorApprovedBy, @supervisorApprovedAt, @lastUpdated)
            `);

            let cCount = 0;
            const insertChecklistsTx = db.transaction((cls) => {
                for (const c of cls) {
                    const result = insertChecklist.run({
                        wo: c.wo,
                        stage: c.stage,
                        items: JSON.stringify(c.items),
                        locked: c.locked ? 1 : 0,
                        qaApproved: c.qaApproved ? 1 : 0,
                        rejectionReason: c.rejectionReason || null,
                        completedBy: c.completedBy || null,
                        supervisorApproved: c.supervisorApproved ? 1 : 0,
                        supervisorApprovedBy: c.supervisorApprovedBy || null,
                        supervisorApprovedAt: c.supervisorApprovedAt || null,
                        lastUpdated: c.lastUpdated || new Date().toISOString()
                    });
                    if (result.changes > 0) cCount++;
                }
            });

            insertChecklistsTx(bundledChecklists);
            console.log(`✅ Successfully inserted/replaced ${cCount} grouped checklists in SQLite.`);
        } catch (err) {
            console.error('❌ Error migrating checklists:', err.message);
        }
    }

    db.close();
    console.log('\n🎉 Migration process completed.');
}

migrateLegacyData();
