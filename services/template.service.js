/**
 * TemplateService — versioned checklist template management.
 * Extracted from ChecklistService to isolate template concerns (Issue 4).
 *
 * Issue 3 fix: syncTemplateToWOs() wraps the full WO-loop inside a single
 * db.transaction(), cutting N*3 individual round-trips down to one commit.
 */
const db = require('../config/database');

class TemplateService {
    /**
     * Create a new checklist template (auto-increments version per name).
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
     * Get all templates, optionally filtered by stage.
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
     * Get a specific template by numeric id.
     */
    getTemplate(id) {
        const tpl = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(id);
        if (tpl) {
            tpl.items = tpl.items ? JSON.parse(tpl.items) : [];
        }
        return tpl;
    }

    /**
     * Get the latest version of a template by name.
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
     * Create a new version of an existing template.
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
        `).run(current.name, current.stage, version,
            description || current.description, JSON.stringify(items), createdBy);

        const tpl = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(result.lastInsertRowid);
        tpl.items = tpl.items ? JSON.parse(tpl.items) : [];
        return tpl;
    }

    /**
     * Delete a template and all its versions.
     */
    deleteTemplate(name) {
        return db.prepare('DELETE FROM checklist_templates WHERE name = ?').run(name).changes > 0;
    }

    /**
     * Sync a template to all WOs (or a specific subset) for its stage.
     *
     * Issue 3 fix: the entire WO-loop is now wrapped in a single SQLite
     * transaction, converting N*3 individual commits into one atomic batch.
     *
     * @param {ChecklistService} checklistService — injected to avoid circular dep
     * @param {RevisionService}  revisionService  — injected to avoid circular dep
     */
    syncTemplateToWOs(templateId, woList = null, createdBy, checklistService, revisionService) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const wos = woList && woList.length > 0
            ? woList
            : db.prepare('SELECT DISTINCT wo FROM checklists WHERE stage = ?').all(template.stage).map(r => r.wo);

        const affected = [];

        // Issue 3: wrap entire loop in a single transaction to batch all DB writes
        db.transaction(() => {
            for (const wo of wos) {
                const existing = checklistService.getChecklist(wo, template.stage);
                const itemsToSave = existing
                    ? this._mergeItems(existing.items, template.items)
                    : [...template.items];

                checklistService.saveChecklist(wo, template.stage, itemsToSave, { completedBy: createdBy });
                revisionService.saveRevision(
                    wo, template.stage, itemsToSave,
                    `Synced from template "${template.name}" v${template.version}`,
                    createdBy
                );
                affected.push(wo);
            }
        })();

        return affected;
    }

    /**
     * Merge existing checklist items with template items.
     * Preserves sign-off and fill data from the existing items wherever rowId matches.
     */
    _mergeItems(existingItems, templateItems) {
        const existingMap = Object.fromEntries(
            existingItems.filter(i => i.rowId).map(i => [i.rowId, i])
        );

        return templateItems.map(tplItem => {
            const existing = existingMap[tplItem.rowId];
            if (!existing) {
                return { ...tplItem };
            }
            return {
                ...tplItem,
                actualValue:          existing.actualValue,
                technician:           existing.technician,
                shopSupervisor:       existing.shopSupervisor,
                qaSupervisor:         existing.qaSupervisor,
                remark:               existing.remark,
                locked:               existing.locked,
                lockedBy:             existing.lockedBy,
                lockedAt:             existing.lockedAt,
                techSignedOff:        existing.techSignedOff,
                techSignedOffBy:      existing.techSignedOffBy,
                techSignedOffAt:      existing.techSignedOffAt,
                supervisorSignedOff:  existing.supervisorSignedOff,
                supervisorSignedOffBy:existing.supervisorSignedOffBy,
                supervisorSignedOffAt:existing.supervisorSignedOffAt,
                supervisorNotes:      existing.supervisorNotes,
                qaSignedOff:          existing.qaSignedOff,
                qaSignedOffBy:        existing.qaSignedOffBy,
                qaSignedOffAt:        existing.qaSignedOffAt,
                qaStatus:             existing.qaStatus,
                qaNotes:              existing.qaNotes,
                productionStatus:     existing.productionStatus,
                productionEngineer:   existing.productionEngineer,
                productionNotes:      existing.productionNotes,
                productionShift:      existing.productionShift
            };
        });
    }
}

module.exports = new TemplateService();
