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

    /* ═══════════════════════════════════════════════════════════════════
     * LOW-LEVEL ITEM HELPERS
     * Moved from route layer so all DB access is centralised here.
     * ═══════════════════════════════════════════════════════════════════ */

    /**
     * Get the flat items array for a wo + stage.
     * Returns [] when no record exists.
     */
    getItems(wo, stage) {
        const row = db.prepare('SELECT items FROM checklists WHERE wo = ? AND stage = ?').get(wo, stage);
        if (!row) return [];
        try { return JSON.parse(row.items) || []; } catch { return []; }
    }

    /**
     * Persist the items array for a wo + stage (upsert).
     * For concurrent-safe updates use withTransaction() instead.
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
     * The callback receives scoped { getItems, setItems } helpers and MUST
     * return its result — the wrapper forwards it to the caller so
     * res.json() can be called after the commit is guaranteed.
     */
    withTransaction(fn) {
        return db.transaction(() => {
            const getItemsTx = (wo, stage) => {
                const row = db.prepare('SELECT items FROM checklists WHERE wo = ? AND stage = ?').get(wo, stage);
                if (!row) return [];
                try { return JSON.parse(row.items) || []; } catch { return []; }
            };
            const setItemsTx = (wo, stage, items, completedBy = null) => {
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
            };
            return fn({ getItems: getItemsTx, setItems: setItemsTx });
        })();
    }

    /**
     * Verify a Work Order exists in the transformers table.
     * Used by routes for object-level access control before modifying checklist data.
     * Returns the transformer row or null.
     */
    findTransformer(wo) {
        return db.prepare('SELECT wo, customerId, stage, customerVisible FROM transformers WHERE wo = ?').get(wo);
    }

    /* ═══════════════════════════════════════════════════════════════════
     * ADMIN / ANALYTICS QUERIES
     * ═══════════════════════════════════════════════════════════════════ */

    /**
     * Get all checklists (admin / quality view — no WO filter)
     */
    getAllChecklists() {
        return db.prepare('SELECT * FROM checklists ORDER BY lastUpdated DESC').all();
    }

    /**
     * Checklists awaiting QA approval
     */
    getPendingQA() {
        return db.prepare(
            'SELECT * FROM checklists WHERE qaApproved = 0 OR qaApproved IS NULL ORDER BY lastUpdated DESC'
        ).all();
    }

    /**
     * Checklists awaiting supervisor approval
     */
    getPendingSupervisor() {
        return db.prepare(
            'SELECT * FROM checklists WHERE supervisorApproved = 0 OR supervisorApproved IS NULL ORDER BY lastUpdated DESC'
        ).all();
    }

    /* ═══════════════════════════════════════════════════════════════════
     * CHECKLIST-LEVEL OPERATIONS
     * ═══════════════════════════════════════════════════════════════════ */

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

    /* ═══════════════════════════════════════════════════════════════════
     * TEMPLATE METHODS (Versioned checklist templates)
     * ═══════════════════════════════════════════════════════════════════ */

    /**
     * Create a new checklist template
     */
    createTemplate({ name, stage, description, items, createdBy }) {
        const existing = db.prepare(
            'SELECT MAX(version) as maxVer FROM checklist_templates WHERE name = ?'
        ).get(name);
        const version = (existing?.maxVer || 0) + 1;

        const result = db.prepare(`
            INSERT INTO checklist_templates (name, stage, version, description, items, createdBy)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, stage, version, description || null, JSON.stringify(items), createdBy);

        const tpl = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(result.lastInsertRowid);
        tpl.items = tpl.items ? JSON.parse(tpl.items) : [];
        return tpl;
    }

    /**
     * Get all templates, optionally filtered by stage
     */
    getTemplates(stage = null) {
        if (stage) {
            return db.prepare(
                'SELECT * FROM checklist_templates WHERE stage = ? ORDER BY name, version DESC'
            ).all(stage);
        }
        return db.prepare(
            'SELECT * FROM checklist_templates ORDER BY name, version DESC'
        ).all();
    }

    /**
     * Get a specific template by id
     */
    getTemplate(id) {
        const tpl = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(id);
        if (tpl) {
            tpl.items = tpl.items ? JSON.parse(tpl.items) : [];
        }
        return tpl;
    }

    /**
     * Get the latest version of a template by name
     */
    getLatestTemplate(name) {
        const tpl = db.prepare(
            'SELECT * FROM checklist_templates WHERE name = ? ORDER BY version DESC LIMIT 1'
        ).get(name);
        if (tpl) {
            tpl.items = tpl.items ? JSON.parse(tpl.items) : [];
        }
        return tpl;
    }

    /**
     * Create a new version of an existing template (merge/updated)
     */
    updateTemplate(id, { description, items, createdBy }) {
        const current = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(id);
        if (!current) {
            throw new Error('Template not found');
        }

        const version = current.version + 1;

        const result = db.prepare(`
            INSERT INTO checklist_templates (name, stage, version, description, items, createdBy)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(current.name, current.stage, version, description || current.description,
            JSON.stringify(items), createdBy);

        const tpl = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(result.lastInsertRowid);
        tpl.items = tpl.items ? JSON.parse(tpl.items) : [];
        return tpl;
    }

    /**
     * Delete a template (and all its versions)
     */
    deleteTemplate(name) {
        const result = db.prepare('DELETE FROM checklist_templates WHERE name = ?').run(name);
        return result.changes > 0;
    }

    /**
     * Sync a template to all WOs (or specific WOs) for a given stage
     * Returns list of affected WOs
     */
    syncTemplateToWOs(templateId, woList = null, createdBy) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        let wos;
        if (woList && woList.length > 0) {
            wos = woList;
        } else {
            // Get all WOs that have this stage
            const rows = db.prepare(
                'SELECT DISTINCT wo FROM checklists WHERE stage = ?'
            ).all(template.stage);
            wos = rows.map(r => r.wo);
        }

        const affected = [];

        for (const wo of wos) {
            const existing = this.getChecklist(wo, template.stage);

            if (existing) {
                // Update items — preserve sign-off data from existing items where possible
                const mergedItems = this._mergeItems(existing.items, template.items);
                this.saveChecklist(wo, template.stage, mergedItems, { completedBy: createdBy });
            } else {
                // Create new checklist from template
                this.saveChecklist(wo, template.stage, [...template.items], { completedBy: createdBy });
            }

            // Save revision
            this.saveRevision(wo, template.stage, template.items, `Synced from template "${template.name}" v${template.version}`, createdBy);

            affected.push(wo);
        }

        return affected;
    }

    /**
     * Merge existing checklist items with template items.
     * Preserves sign-off data from existing items that match by rowId.
     */
    _mergeItems(existingItems, templateItems) {
        const existingMap = {};
        for (const item of existingItems) {
            if (item.rowId) {
                existingMap[item.rowId] = item;
            }
        }

        return templateItems.map(tplItem => {
            const existing = existingMap[tplItem.rowId];
            if (existing) {
                // Keep sign-off data from existing, use template for structure
                return {
                    ...tplItem,
                    actualValue: existing.actualValue,
                    technician: existing.technician,
                    shopSupervisor: existing.shopSupervisor,
                    qaSupervisor: existing.qaSupervisor,
                    remark: existing.remark,
                    locked: existing.locked,
                    lockedBy: existing.lockedBy,
                    lockedAt: existing.lockedAt,
                    techSignedOff: existing.techSignedOff,
                    techSignedOffBy: existing.techSignedOffBy,
                    techSignedOffAt: existing.techSignedOffAt,
                    supervisorSignedOff: existing.supervisorSignedOff,
                    supervisorSignedOffBy: existing.supervisorSignedOffBy,
                    supervisorSignedOffAt: existing.supervisorSignedOffAt,
                    supervisorNotes: existing.supervisorNotes,
                    qaSignedOff: existing.qaSignedOff,
                    qaSignedOffBy: existing.qaSignedOffBy,
                    qaSignedOffAt: existing.qaSignedOffAt,
                    qaStatus: existing.qaStatus,
                    qaNotes: existing.qaNotes,
                    productionStatus: existing.productionStatus,
                    productionEngineer: existing.productionEngineer,
                    productionNotes: existing.productionNotes,
                    productionShift: existing.productionShift
                };
            }
            return { ...tplItem };
        });
    }

    /* ═══════════════════════════════════════════════════════════════════
     * REVISION METHODS (Per-WO revision history)
     * ═══════════════════════════════════════════════════════════════════ */

    /**
     * Save a revision snapshot for a WO+stage
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
     * Get all revisions for a WO+stage
     */
    getRevisions(wo, stage) {
        const revisions = db.prepare(
            'SELECT * FROM checklist_revisions WHERE wo = ? AND stage = ? ORDER BY revision DESC'
        ).all(wo, stage);

        return revisions.map(r => ({
            ...r,
            items: r.items ? JSON.parse(r.items) : []
        }));
    }

    /**
     * Get a specific revision
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
     * Restore a checklist to a specific revision
     */
    restoreRevision(wo, stage, revision, restoredBy) {
        const rev = this.getRevision(wo, stage, revision);
        if (!rev) {
            throw new Error('Revision not found');
        }

        this.saveChecklist(wo, stage, rev.items, { completedBy: restoredBy });
        this.saveRevision(wo, stage, rev.items, `Restored from revision ${revision}`, restoredBy);

        return this.getChecklist(wo, stage);
    }

    /**
     * Compare two versions of a checklist — returns diff
     */
    compareVersions(itemsA, itemsB) {
        const mapA = {};
        const mapB = {};

        for (const item of itemsA) {
            if (item.rowId) {
                mapA[item.rowId] = item;
            }
        }
        for (const item of itemsB) {
            if (item.rowId) {
                mapB[item.rowId] = item;
            }
        }

        const added = itemsB.filter(b => !mapA[b.rowId]);
        const removed = itemsA.filter(a => !mapB[a.rowId]);
        const modified = [];

        for (const rowId of Object.keys(mapA)) {
            if (mapB[rowId]) {
                const a = mapA[rowId];
                const b = mapB[rowId];
                const changes = {};
                for (const key of Object.keys(b)) {
                    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
                        changes[key] = { from: a[key], to: b[key] };
                    }
                }
                if (Object.keys(changes).length > 0) {
                    modified.push({ rowId, changes });
                }
            }
        }

        return { added, removed, modified };
    }
}

module.exports = new ChecklistService();
