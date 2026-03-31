const db = require('../config/database');

class ChecklistService {
    /**
     * Get checklist for a work order and stage
     */
    getChecklist(wo, stage) {
        const checklist = db.prepare(
            'SELECT * FROM checklists WHERE wo = ? AND stage = ?'
        ).get(wo, stage);

        if (!checklist) {
            return null;
        }

        return {
            ...checklist,
            items: checklist.items ? JSON.parse(checklist.items) : []
        };
    }

    /**
     * Get all checklists for a work order
     */
    getChecklistsByWO(wo) {
        const checklists = db.prepare(
            'SELECT * FROM checklists WHERE wo = ?'
        ).all(wo);

        return checklists.map(c => ({
            ...c,
            items: c.items ? JSON.parse(c.items) : []
        }));
    }

    /**
     * Save or update checklist
     */
    saveChecklist(wo, stage, items, metadata = {}) {
        const existing = this.getChecklist(wo, stage);

        if (existing) {
            db.prepare(`
                UPDATE checklists
                SET items = ?, completedBy = ?, lastUpdated = datetime('now')
                WHERE wo = ? AND stage = ?
            `).run(JSON.stringify(items), metadata.completedBy || null, wo, stage);
        } else {
            db.prepare(`
                INSERT INTO checklists (wo, stage, items, completedBy)
                VALUES (?, ?, ?, ?)
            `).run(wo, stage, JSON.stringify(items), metadata.completedBy || null);
        }

        return this.getChecklist(wo, stage);
    }

    /**
     * Lock checklist (QA approval of whole checklist)
     */
    lockChecklist(wo, stage, _userId) {
        const result = db.prepare(`
            UPDATE checklists
            SET locked = 1, qaApproved = 1, lastUpdated = datetime('now')
            WHERE wo = ? AND stage = ?
        `).run(wo, stage);

        if (result.changes === 0) {
            throw new Error('Checklist not found');
        }
        return this.getChecklist(wo, stage);
    }

    /**
     * Mark checklist-level supervisor approval
     */
    markSupervisorApproved(wo, stage, supervisorUsername) {
        const result = db.prepare(`
            UPDATE checklists
            SET supervisorApproved = 1,
                supervisorApprovedBy = ?,
                supervisorApprovedAt = datetime('now'),
                lastUpdated = datetime('now')
            WHERE wo = ? AND stage = ?
        `).run(supervisorUsername, wo, stage);

        if (result.changes === 0) {
            throw new Error('Checklist not found');
        }
        return this.getChecklist(wo, stage);
    }

    /**
     * Reject checklist
     */
    rejectChecklist(wo, stage, reason) {
        const result = db.prepare(`
            UPDATE checklists
            SET qaApproved = 0, rejectionReason = ?, lastUpdated = datetime('now')
            WHERE wo = ? AND stage = ?
        `).run(reason, wo, stage);

        if (result.changes === 0) {
            throw new Error('Checklist not found');
        }
        return this.getChecklist(wo, stage);
    }

    /**
     * Items awaiting supervisor sign-off (tech done, supervisor not done)
     */
    getSupervisorPendingItems(wo, stage) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) {
            return [];
        }
        return (checklist.items || []).filter(i => i.techSignedOff && !i.supervisorSignedOff);
    }

    /**
     * Items awaiting QA sign-off (supervisor done, QA not done)
     */
    getQAPendingItems(wo, stage) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) {
            return [];
        }
        return (checklist.items || []).filter(i => i.supervisorSignedOff && !i.qaSignedOff);
    }

    /**
     * Tier completion summary for a checklist
     */
    getChecklistSummary(wo, stage) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) {
            return { total: 0, techDone: 0, supervisorDone: 0, qaDone: 0 };
        }
        const items = checklist.items || [];
        return {
            total: items.length,
            techDone: items.filter(i => i.techSignedOff).length,
            supervisorDone: items.filter(i => i.supervisorSignedOff).length,
            qaDone: items.filter(i => i.qaSignedOff).length
        };
    }

    /**
     * Clear checklist (admin only)
     */
    clearChecklist(wo, stage) {
        const result = db.prepare('DELETE FROM checklists WHERE wo = ? AND stage = ?').run(wo, stage);
        return result.changes > 0;
    }
}

module.exports = new ChecklistService();
