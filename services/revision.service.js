/**
 * RevisionService — per-WO checklist revision history and version comparison.
 * Extracted from ChecklistService to isolate revision management concerns (Issue 4).
 */
const db = require('../config/database');

class RevisionService {
    /**
     * Save a revision snapshot for a WO+stage.
     * Called after every checklist write to maintain an immutable audit trail.
     */
    saveRevision(wo, stage, items, changeReason = null, createdBy = 'system') {
        const existing = db.prepare(
            'SELECT MAX(revision) as maxRev FROM checklist_revisions WHERE wo = ? AND stage = ?'
        ).get(wo, stage);
        const revision = (existing?.maxRev || 0) + 1;

        db.prepare(`
            INSERT INTO checklist_revisions (wo, stage, revision, items, changeReason, createdBy)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(wo, stage, revision, JSON.stringify(items), changeReason, createdBy);

        return { wo, stage, revision };
    }

    /**
     * Get all revisions for a WO+stage, latest first.
     */
    getRevisions(wo, stage) {
        return db.prepare(
            'SELECT * FROM checklist_revisions WHERE wo = ? AND stage = ? ORDER BY revision DESC'
        ).all(wo, stage).map(r => ({
            ...r,
            items: r.items ? JSON.parse(r.items) : []
        }));
    }

    /**
     * Get a specific revision by number.
     */
    getRevision(wo, stage, revision) {
        const rev = db.prepare(
            'SELECT * FROM checklist_revisions WHERE wo = ? AND stage = ? AND revision = ?'
        ).get(wo, stage, revision);
        if (rev) {
            rev.items = rev.items ? JSON.parse(rev.items) : [];
        }
        return rev;
    }

    /**
     * Restore a checklist to a specific revision.
     * Delegates the actual write back to checklistService to avoid circular dep.
     * @param {ChecklistService} checklistService
     */
    restoreRevision(wo, stage, revision, restoredBy, checklistService) {
        const rev = this.getRevision(wo, stage, revision);
        if (!rev) {
            throw new Error('Revision not found');
        }
        checklistService.saveChecklist(wo, stage, rev.items, { completedBy: restoredBy });
        this.saveRevision(wo, stage, rev.items, `Restored from revision ${revision}`, restoredBy);
        return checklistService.getChecklist(wo, stage);
    }

    /**
     * Compare two arrays of checklist items and return a structured diff.
     *
     * Issue 2 fix: comparisons now use stableStringify() which sorts object keys
     * before serialising, preventing false-positive "modified" entries caused by
     * objects that have identical data but different key insertion order.
     */
    compareVersions(itemsA, itemsB) {
        /**
         * Deterministic serialisation: recursively sort object keys at every level
         * so that { b: 1, a: 2 } and { a: 2, b: 1 } produce the same string.
         * Arrays are left in their original order (order matters for lists).
         */
        const stableStringify = (val) => {
            if (val === null || typeof val !== 'object') return JSON.stringify(val);
            if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
            const sortedPairs = Object.keys(val).sort()
                .map(k => JSON.stringify(k) + ':' + stableStringify(val[k]));
            return '{' + sortedPairs.join(',') + '}';
        };

        const mapA = Object.fromEntries(itemsA.filter(i => i.rowId).map(i => [i.rowId, i]));
        const mapB = Object.fromEntries(itemsB.filter(i => i.rowId).map(i => [i.rowId, i]));

        const added    = itemsB.filter(b => !mapA[b.rowId]);
        const removed  = itemsA.filter(a => !mapB[a.rowId]);
        const modified = [];

        for (const rowId of Object.keys(mapA)) {
            if (!mapB[rowId]) continue;
            const a = mapA[rowId];
            const b = mapB[rowId];
            const changes = {};
            for (const key of Object.keys(b)) {
                if (stableStringify(a[key]) !== stableStringify(b[key])) {
                    changes[key] = { from: a[key], to: b[key] };
                }
            }
            if (Object.keys(changes).length > 0) {
                modified.push({ rowId, changes });
            }
        }

        return { added, removed, modified };
    }
}

module.exports = new RevisionService();
