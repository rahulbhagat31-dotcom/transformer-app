const db = require('../config/database');

// Lazy reference avoids circular dependency (checklist ↔ revision) while keeping
// the dependency explicit and mockable from tests.
let _revisionService = null;
const revSvc = () => { if (!_revisionService) _revisionService = require('./revision.service'); return _revisionService; };

class ChecklistService {
    /**
     * Get checklist for a work order and stage (returns full row + parsed items).
     */
    getChecklist(wo, stage) {
        const checklist = db.prepare(
            'SELECT * FROM checklists WHERE wo = ? AND stage = ?'
        ).get(wo, stage);
        if (!checklist) return null;
        return { ...checklist, items: checklist.items ? JSON.parse(checklist.items) : [] };
    }

    /**
     * Get all checklists for a work order.
     */
    getChecklistsByWO(wo) {
        return db.prepare('SELECT * FROM checklists WHERE wo = ?').all(wo)
            .map(c => ({ ...c, items: c.items ? JSON.parse(c.items) : [] }));
    }

    /* ═══════════════════════════════════════════════════════════════════
     * LOW-LEVEL ITEM HELPERS (Issue 1 separation; Issue 5 deduplication)
     * ═══════════════════════════════════════════════════════════════════ */

    /**
     * Get the flat items array for a wo + stage. Returns [] when no record exists.
     */
    getItems(wo, stage) {
        const row = db.prepare('SELECT items FROM checklists WHERE wo = ? AND stage = ?').get(wo, stage);
        if (!row) return [];
        try { return JSON.parse(row.items) || []; } catch { return []; }
    }

    /**
     * Persist the items array for a wo + stage (upsert).
     * For concurrent-safe updates, use withTransaction() instead.
     */
    setItems(wo, stage, items, completedBy = null) {
        const existing = db.prepare('SELECT id FROM checklists WHERE wo = ? AND stage = ?').get(wo, stage);
        if (existing) {
            db.prepare(`
                UPDATE checklists
                SET items = ?, completedBy = ?, lastUpdated = datetime('now')
                WHERE wo = ? AND stage = ?
            `).run(JSON.stringify(items), completedBy, wo, stage);
        } else {
            db.prepare(`
                INSERT INTO checklists (wo, stage, items, completedBy)
                VALUES (?, ?, ?, ?)
            `).run(wo, stage, JSON.stringify(items), completedBy);
        }
    }

    /**
     * Execute a SQLite transaction for atomic read-modify-write operations.
     *
     * Issue 5 fix: the internal helpers now delegate to this.getItems() /
     * this.setItems() instead of duplicating the SQL.  In better-sqlite3,
     * all db.prepare().run() calls issued inside db.transaction() share the
     * same implicit transaction, so no extra wiring is needed.
     *
     * The callback MUST return its result — the wrapper forwards it to the
     * caller so res.json() can be invoked after the commit is confirmed.
     */
    withTransaction(fn) {
        return db.transaction(() => fn({
            getItems: (wo, stage)            => this.getItems(wo, stage),
            setItems: (wo, stage, items, by) => this.setItems(wo, stage, items, by)
        }))();
    }

    /**
     * Verify a Work Order exists in the transformers table.
     * Used by routes for object-level access control before modifying checklist data.
     */
    findTransformer(wo) {
        return db.prepare(
            'SELECT wo, customerId, stage, customerVisible FROM transformers WHERE wo = ?'
        ).get(wo);
    }

    /* ═══════════════════════════════════════════════════════════════════
     * ADMIN / ANALYTICS QUERIES
     * ═══════════════════════════════════════════════════════════════════ */

    getAllChecklists() {
        return db.prepare('SELECT * FROM checklists ORDER BY lastUpdated DESC').all();
    }

    getPendingQA() {
        return db.prepare(
            'SELECT * FROM checklists WHERE qaApproved = 0 OR qaApproved IS NULL ORDER BY lastUpdated DESC'
        ).all();
    }

    getPendingSupervisor() {
        return db.prepare(
            'SELECT * FROM checklists WHERE supervisorApproved = 0 OR supervisorApproved IS NULL ORDER BY lastUpdated DESC'
        ).all();
    }

    /* ═══════════════════════════════════════════════════════════════════
     * CHECKLIST-LEVEL OPERATIONS
     * ═══════════════════════════════════════════════════════════════════ */

    /**
     * Save or update a checklist row.
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
     * Lock checklist and mark it QA-approved.
     *
     * Issue 1 fix: verifies that the checklist has at least one item and that
     * every item has been filled in (actualValue present) before setting the
     * qaApproved / locked flags, preventing a blank checklist from being
     * rubber-stamped as approved.
     */
    lockChecklist(wo, stage, _userId) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) throw new Error('Checklist not found');

        const items = checklist.items || [];
        if (items.length === 0) {
            throw new Error('Cannot lock an empty checklist — no items have been recorded.');
        }

        const incompleteItems = items.filter(i => !i.actualValue || String(i.actualValue).trim() === '');
        if (incompleteItems.length > 0) {
            throw Object.assign(
                new Error(`Cannot lock checklist: ${incompleteItems.length} item(s) have no recorded value.`),
                { status: 422, incompleteCount: incompleteItems.length }
            );
        }

        const result = db.prepare(`
            UPDATE checklists
            SET locked = 1, qaApproved = 1, lastUpdated = datetime('now')
            WHERE wo = ? AND stage = ?
        `).run(wo, stage);

        if (result.changes === 0) throw new Error('Checklist not found');
        return this.getChecklist(wo, stage);
    }

    /**
     * Mark checklist-level supervisor approval.
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

        if (result.changes === 0) throw new Error('Checklist not found');
        return this.getChecklist(wo, stage);
    }

    /**
     * Reject checklist (clears qaApproved, records reason).
     */
    rejectChecklist(wo, stage, reason) {
        const result = db.prepare(`
            UPDATE checklists
            SET qaApproved = 0, rejectionReason = ?, lastUpdated = datetime('now')
            WHERE wo = ? AND stage = ?
        `).run(reason, wo, stage);

        if (result.changes === 0) throw new Error('Checklist not found');
        return this.getChecklist(wo, stage);
    }

    /**
     * Items awaiting supervisor sign-off (tech done, supervisor not done).
     */
    getSupervisorPendingItems(wo, stage) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) return [];
        return (checklist.items || []).filter(i => i.techSignedOff && !i.supervisorSignedOff);
    }

    /**
     * Items awaiting QA sign-off (supervisor done, QA not done).
     */
    getQAPendingItems(wo, stage) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) return [];
        return (checklist.items || []).filter(i => i.supervisorSignedOff && !i.qaSignedOff);
    }

    /**
     * Tier completion summary for a checklist.
     */
    getChecklistSummary(wo, stage) {
        const checklist = this.getChecklist(wo, stage);
        if (!checklist) return { total: 0, techDone: 0, supervisorDone: 0, qaDone: 0 };
        const items = checklist.items || [];
        return {
            total:          items.length,
            techDone:       items.filter(i => i.techSignedOff).length,
            supervisorDone: items.filter(i => i.supervisorSignedOff).length,
            qaDone:         items.filter(i => i.qaSignedOff).length
        };
    }

    /**
     * Clear checklist (admin only).
     */
    clearChecklist(wo, stage) {
        return db.prepare('DELETE FROM checklists WHERE wo = ? AND stage = ?').run(wo, stage).changes > 0;
    }

    /* ═══════════════════════════════════════════════════════════════════
     * REVISION PASS-THROUGH (convenience — delegates to revisionService)
     * Routes that already import checklistService can call saveRevision /
     * getRevisions / compareVersions on it without a second import.
     * revisionService is resolved lazily on first call to break the circular
     * dependency that would arise from a top-level require.
     * ═══════════════════════════════════════════════════════════════════ */

    saveRevision(wo, stage, items, changeReason = null, createdBy = 'system') {
        return revSvc().saveRevision(wo, stage, items, changeReason, createdBy);
    }

    getRevisions(wo, stage) {
        return revSvc().getRevisions(wo, stage);
    }

    getRevision(wo, stage, revision) {
        return revSvc().getRevision(wo, stage, revision);
    }

    restoreRevision(wo, stage, revision, restoredBy) {
        return revSvc().restoreRevision(wo, stage, revision, restoredBy, this);
    }

    compareVersions(itemsA, itemsB) {
        return revSvc().compareVersions(itemsA, itemsB);
    }
}

module.exports = new ChecklistService();
