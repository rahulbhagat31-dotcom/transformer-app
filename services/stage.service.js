const db = require('../config/database');

class StageService {
    /**
     * Get stage status for a WO and stage
     */
    findByWoAndStage(wo, stage) {
        return db.prepare('SELECT * FROM transformer_stage_status WHERE wo = ? AND stage = ?').get(wo, stage);
    }

    /**
     * Get all stage statuses for a WO
     */
    findAllByWo(wo) {
        return db.prepare('SELECT * FROM transformer_stage_status WHERE wo = ?').all(wo);
    }

    /**
     * Create or update stage status (Upsert)
     */
    upsert(data) {
        const stmt = db.prepare(`
            INSERT INTO transformer_stage_status (
                wo, stage, status, completionPercentage, completedAt, completedBy,
                locked, lockedAt, unlockedBy, unlockedAt, unlockReason,
                approvedBy, approvedAt,
                rejectedBy, rejectedAt, rejectionReason,
                submittedBy, submittedAt,
                lastUpdated
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(wo, stage) DO UPDATE SET
                status = excluded.status,
                completionPercentage = excluded.completionPercentage,
                completedAt = excluded.completedAt,
                completedBy = excluded.completedBy,
                locked = excluded.locked,
                lockedAt = excluded.lockedAt,
                unlockedBy = excluded.unlockedBy,
                unlockedAt = excluded.unlockedAt,
                unlockReason = excluded.unlockReason,
                approvedBy = excluded.approvedBy,
                approvedAt = excluded.approvedAt,
                rejectedBy = excluded.rejectedBy,
                rejectedAt = excluded.rejectedAt,
                rejectionReason = excluded.rejectionReason,
                submittedBy = excluded.submittedBy,
                submittedAt = excluded.submittedAt,
                lastUpdated = datetime('now')
        `);

        stmt.run(
            data.wo,
            data.stage,
            data.status || 'pending',
            data.completionPercentage || 0,
            data.completedAt || null,
            data.completedBy || null,
            data.locked ? 1 : 0,
            data.lockedAt || null,
            data.unlockedBy || null,
            data.unlockedAt || null,
            data.unlockReason || null,
            data.approvedBy || null,
            data.approvedAt || null,
            data.rejectedBy || null,
            data.rejectedAt || null,
            data.rejectionReason || null,
            data.submittedBy || null,
            data.submittedAt || null
        );

        return this.findByWoAndStage(data.wo, data.stage);
    }

    /**
     * Initialize all stages for a WO if they don't exist
     */
    initStages(wo, stages) {
        const insert = db.prepare(`
            INSERT OR IGNORE INTO transformer_stage_status (wo, stage, status, locked)
            VALUES (?, ?, ?, ?)
        `);

        const transaction = db.transaction((wo, stages) => {
            stages.forEach((stage, index) => {
                insert.run(
                    wo,
                    stage,
                    index === 0 ? 'in-progress' : 'pending',
                    index === 0 ? 0 : 1 // Lock all except first
                );
            });
        });

        transaction(wo, stages);
    }
}

module.exports = new StageService();
