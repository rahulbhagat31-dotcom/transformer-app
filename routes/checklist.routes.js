const express = require('express');
const { body } = require('express-validator');
const { authenticate, checkPermission, requireRole } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const { errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const checklistService = require('../services/checklist.service');
const templateService  = require('../services/template.service');
const revisionService  = require('../services/revision.service');
const assignmentService = require('../services/assignment.service');

/**
 * Middleware: enforce per-WO assignment for non-admin/non-quality roles.
 * Extracts `wo` from req.body or req.params and checks user_assignments.
 */
function requireWOAccess(req, res, next) {
    const wo = req.body?.wo || req.params?.wo;
    if (!wo) return next(); // let body validation handle missing wo
    if (assignmentService.isAuthorised(req.user.id, req.user.role, wo)) return next();
    return res.status(403).json({
        success: false,
        error: `You are not assigned to Work Order '${wo}'. Contact an administrator to request access.`
    });
}

const router = express.Router();

// Apply authentication to ALL checklist routes
router.use(authenticate);

/* ─────────────────────────────────────────────────────────────────────────
 * LOCAL SHORTHANDS — all data access is delegated to checklistService
 * ───────────────────────────────────────────────────────────────────────── */
const getItems         = (wo, stage)                   => checklistService.getItems(wo, stage);
const setItems         = (wo, stage, items, by)        => checklistService.setItems(wo, stage, items, by);
const withTransaction  = (fn)                          => checklistService.withTransaction(fn);

/* ─────────────────────────────────────────────────────────────────────────
 * ROW-LEVEL LOCK / UNLOCK  (admin only)
 * MUST be declared before the generic /:stage/:wo route to avoid conflicts
 * ───────────────────────────────────────────────────────────────────────── */

/** POST /checklist/row/:itemId/unlock */
router.post('/row/:itemId/unlock',
    requireRole(['admin']),
    [body('reason').trim().notEmpty().isLength({ min: 3, max: 200 })],
    handleValidationErrors,
    (req, res) => {
        try {
            const { itemId } = req.params;
            const { reason, wo, stage } = req.body;

            if (!wo || !stage) {
                return res.status(400).json({ success: false, error: 'wo and stage required in body' });
            }

            // Issue 6: itemId format is 'row_<stage>_<num>' — cross-validate embedded stage against body
            // e.g. itemId='row_winding1_3' means stage should be 'winding1'
            const embeddedStage = itemId.startsWith('row_') ? itemId.split('_').slice(1, -1).join('_') : null;
            if (embeddedStage && embeddedStage !== stage) {
                return res.status(400).json({
                    success: false,
                    error: `Stage mismatch: itemId '${itemId}' belongs to stage '${embeddedStage}', but body stage is '${stage}'`
                });
            }

            // Transaction returns updated item; res.json() fires AFTER commit is guaranteed
            const updatedItem = withTransaction(({ getItems, setItems }) => {
                const items = getItems(wo, stage);
                const idx = items.findIndex(i => i.rowId === itemId || i.id === itemId);
                if (idx === -1) {
                    throw { status: 404, message: 'Checklist item not found' };
                }

                items[idx].locked = false;
                items[idx].unlockedBy = req.user.username;
                items[idx].unlockedAt = new Date().toISOString();
                items[idx].unlockReason = reason;

                setItems(wo, stage, items);

                logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId,
                    { action: 'UNLOCK_ROW', reason });

                return items[idx];
            });

            res.json({ success: true, message: 'Row unlocked successfully', data: updatedItem });
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ success: false, error: error.message });
            }
            console.error('Error unlocking checklist row:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/** POST /checklist/row/:itemId/lock */
router.post('/row/:itemId/lock',
    requireRole(['admin', 'quality', 'production']),
    [body('reason').trim().notEmpty().isLength({ min: 3, max: 200 })],
    handleValidationErrors,
    (req, res) => {
        try {
            const { itemId } = req.params;
            const { reason, wo, stage } = req.body;

            if (!wo || !stage) {
                return res.status(400).json({ success: false, error: 'wo and stage required in body' });
            }

            // Issue 6: cross-validate stage embedded in itemId against body stage
            const embeddedStage = itemId.startsWith('row_') ? itemId.split('_').slice(1, -1).join('_') : null;
            if (embeddedStage && embeddedStage !== stage) {
                return res.status(400).json({
                    success: false,
                    error: `Stage mismatch: itemId '${itemId}' belongs to stage '${embeddedStage}', but body stage is '${stage}'`
                });
            }

            // Transaction returns locked item; res.json() fires AFTER commit is guaranteed
            const lockedItem = withTransaction(({ getItems, setItems }) => {
                const items = getItems(wo, stage);
                const idx = items.findIndex(i => i.rowId === itemId || i.id === itemId);
                if (idx === -1) {
                    throw { status: 404, message: 'Checklist item not found' };
                }

                items[idx].locked = true;
                items[idx].lockedBy = req.user.username;
                items[idx].lockedAt = new Date().toISOString();
                items[idx].lockReason = reason;

                setItems(wo, stage, items);

                logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId,
                    { action: 'LOCK_ROW', reason });

                return items[idx];
            });

            res.json({ success: true, message: 'Row locked successfully', data: lockedItem });
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ success: false, error: error.message });
            }
            console.error('Error locking checklist row:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/* ─────────────────────────────────────────────────────────────────────────
 * ANALYTICS / ADMIN ENDPOINTS
 * ───────────────────────────────────────────────────────────────────────── */

/** GET /checklist/all */
router.get('/all', checkPermission('quality'), (req, res) => {
    try {
        res.json({ success: true, data: checklistService.getAllChecklists() });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** GET /checklist/pending-qa */
router.get('/pending-qa', checkPermission('quality'), (req, res) => {
    try {
        res.json({ success: true, data: checklistService.getPendingQA() });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** GET /checklist/pending-supervisor */
router.get('/pending-supervisor', checkPermission('production'), (req, res) => {
    try {
        res.json({ success: true, data: checklistService.getPendingSupervisor() });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/* ─────────────────────────────────────────────────────────────────────────
 * SAVE CHECKLIST ITEM  (POST /checklist/save)
 * Called for each row save from the frontend checklist form.
 * ───────────────────────────────────────────────────────────────────────── */
router.post('/save',
    [
        body('wo').trim().notEmpty().withMessage('W.O. number required'),
        body('stage').notEmpty().isIn([
            'winding1', 'winding2', 'winding3', 'winding4', 'winding5',
            'vpd', 'coreCoil', 'tanking', 'tankFilling', 'spa', 'coreBuilding'
        ]).withMessage('Invalid stage'),
        body('actualValue').trim().notEmpty().withMessage('Actual value required'),
        body('technician').trim().notEmpty().withMessage('Technician selection required'),
        body('itemNumber').isInt({ min: 1 }).withMessage('Valid item number required')
    ],
    handleValidationErrors,
    checkPermission('production'),
    requireWOAccess,          // Assignment guard: production users must be assigned to the WO
    (req, res) => {

        try {
            const {
                wo, stage, customerId, customer, itemNumber, rowId,
                actualValue, technician, shopSupervisor, qaSupervisor,
                remark, timestamp, userId, userName, userRole, updatedAt
            } = req.body;

            if (!wo || !stage || !itemNumber || !rowId) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }

            // Issue 2: verify the WO exists before allowing any modification
            const transformer = checklistService.findTransformer(wo);
            if (!transformer) {
                return res.status(404).json({ success: false, error: `Work Order '${wo}' not found` });
            }

            // Transaction returns { actionType, rowId }; res.json() fires AFTER commit is guaranteed
            let txResult;
            try {
                txResult = withTransaction(({ getItems, setItems }) => {
                    const items = getItems(wo, stage);
                    const existingIdx = items.findIndex(i => i.rowId === rowId);

                    const itemData = {
                        rowId: String(rowId),
                        itemNumber: Number(itemNumber),
                        actualValue: actualValue || '',
                        technician: technician || '',
                        shopSupervisor: shopSupervisor || '',
                        qaSupervisor: qaSupervisor || '',
                        remark: remark || '',
                        timestamp: timestamp || new Date().toLocaleString('en-IN'),
                        userId: userId || req.user?.id || 'unknown',
                        userName: userName || req.user?.name || 'Unknown',
                        userRole: userRole || req.user?.role || 'unknown',
                        locked: true,
                        lockedBy: req.user?.username || 'unknown',
                        lockedAt: new Date().toISOString()
                    };

                    let actionType;

                    if (existingIdx >= 0) {
                        const dbItem = items[existingIdx];
                        if (updatedAt && dbItem.updatedAt && updatedAt !== dbItem.updatedAt) {
                            throw { status: 409, message: 'Item was modified by another user. Please refresh and try again.', current: dbItem };
                        }
                        if (items[existingIdx].unlockedBy) {
                            itemData.previousUnlock = {
                                unlockedBy: items[existingIdx].unlockedBy,
                                unlockedAt: items[existingIdx].unlockedAt,
                                unlockReason: items[existingIdx].unlockReason
                            };
                        }
                        items[existingIdx] = { ...items[existingIdx], ...itemData, updatedAt: new Date().toISOString() };
                        actionType = 'UPDATE';
                    } else {
                        items.push({ id: Date.now().toString(), wo, customerId, customer, stage, ...itemData, createdAt: new Date().toISOString() });
                        actionType = 'CREATE';
                    }

                    setItems(wo, stage, items, req.user?.username);

                    try {
                        checklistService.saveRevision(wo, stage, items, `${actionType} item ${itemNumber}`, req.user?.username || 'unknown');
                    } catch (revErr) {
                        console.warn('Revision save warning:', revErr.message);
                    }

                    logAudit(
                        req.user.id, req.user.username, req.user.role,
                        actionType, 'checklist',
                        `${stage}-${itemNumber}-${wo}`,
                        { itemNumber, rowId, wo, stage }
                    );

                    return { actionType, rowId }; // return data — DO NOT call res.json() inside the transaction
                });
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ success: false, error: error.message, current: error.current });
                }
                throw error;
            }

            // Send response only after transaction has fully committed
            res.json({ success: true, message: `${txResult.actionType} successful`, rowId: txResult.rowId });
        } catch (error) {
            console.error('❌ Error saving checklist:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/* ─────────────────────────────────────────────────────────────────────────
 * PRODUCTION SAVE  (POST /checklist/production/save)
 * ───────────────────────────────────────────────────────────────────────── */
router.post('/production/save', checkPermission('production'), requireWOAccess, (req, res) => {
    try {
        const { wo, customerId, customer, stage, itemNumber, rowId, productionNotes, shift, timestamp } = req.body;

        if (!wo || !stage || !itemNumber || !rowId) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Issue 2: verify the WO exists before allowing any modification
        const transformer = checklistService.findTransformer(wo);
        if (!transformer) {
            return res.status(404).json({ success: false, error: `Work Order '${wo}' not found` });
        }

        const items = getItems(wo, stage);
        const existingIdx = items.findIndex(i => i.rowId === rowId);

        const productionData = {
            productionStatus: 'completed',
            productionEngineer: req.user?.name || 'Unknown',
            productionNotes: productionNotes || '',
            productionShift: shift || 'Morning',
            productionTimestamp: timestamp || new Date().toISOString(),
            productionUserId: req.user?.id || 'unknown',
            updatedAt: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            items[existingIdx] = { ...items[existingIdx], ...productionData };
        } else {
            items.push({
                id: Date.now().toString(),
                wo, customerId, customer, stage, itemNumber, rowId,
                ...productionData,
                createdAt: new Date().toISOString()
            });
        }

        setItems(wo, stage, items, req.user?.username);

        logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist',
            `${stage}-${itemNumber}-${wo}`, productionData);

        res.json({ success: true, message: `Production work completed for Item ${itemNumber}` });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/* ─────────────────────────────────────────────────────────────────────────
 * GET CHECKLIST ITEMS FOR A STAGE + WO  (GET /checklist/:stage/:wo)
 * Returns flat array of items (same format as the JSON-file deep source).
 * MUST be after all specific routes to not hijack /all, /pending-*, /row/*
 * ───────────────────────────────────────────────────────────────────────── */
router.get('/:stage/:wo', (req, res) => {
    try {
        const { stage, wo } = req.params;

        // Issue 3: verify WO exists before returning data (prevents IDOR fishing)
        const transformer = checklistService.findTransformer(wo);
        if (!transformer) {
            return res.status(404).json({ success: false, error: `Work Order '${wo}' not found` });
        }

        // Customer role: additionally verify the WO is marked visible for customers
        if (req.user?.role === 'customer') {
            if (!transformer.customerVisible) {
                return res.status(403).json({ success: false, error: 'Access denied to this Work Order' });
            }
        }

        // Admin: full access with audit trail
        if (req.user?.role === 'admin') {
            logAudit(req.user.id, req.user.username, req.user.role, 'READ', 'checklist',
                `${stage}-${wo}`, { action: 'ADMIN_STAGE_ACCESS', stage, wo });
        }

        let items = getItems(wo, stage);

        // Customer isolation: only show items belonging to this customer
        if (req.user?.role === 'customer') {
            items = items.filter(i => i.customerId === req.user.customerId);
        }

        res.json(items);
    } catch (error) {
        console.error('❌ Error loading checklist:', error);
        res.status(500).json(errorResponse(error));
    }
});

/* ─────────────────────────────────────────────────────────────────────────
 * CLEAR CHECKLIST  (DELETE /checklist/clear/:stage/:wo)
 * ───────────────────────────────────────────────────────────────────────── */
router.delete('/clear/:stage/:wo', checkPermission('admin'), (req, res) => {
    try {
        const { stage, wo } = req.params;

        const before = getItems(wo, stage).length;
        setItems(wo, stage, [], req.user?.username);

        logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'checklist',
            `${stage}-${wo}`, { action: 'CLEAR_STAGE', deletedCount: before });

        console.log(`🗑️ Cleared ${before} items from ${stage} for W.O. ${wo}`);

        res.json({ success: true, message: `Cleared ${before} items from ${stage} checklist`, deletedCount: before });
    } catch (error) {
        console.error('❌ Error clearing checklist:', error);
        res.status(500).json(errorResponse(error));
    }
});

/* ═══════════════════════════════════════════════════════════════════
 * TEMPLATE ENDPOINTS (Versioned checklist templates)
 * ═══════════════════════════════════════════════════════════════════ */

/** POST /checklist/template/create — Create a new template */
router.post('/template/create',
    checkPermission('admin'),
    [
        body('name').trim().notEmpty().withMessage('Template name required'),
        body('stage').notEmpty().isIn([
            'winding1', 'winding2', 'winding3', 'winding4', 'winding5',
            'vpd', 'coreCoil', 'tanking', 'tankFilling', 'spa', 'coreBuilding'
        ]).withMessage('Invalid stage'),
        body('items').isArray({ min: 1 }).withMessage('Items array required')
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { name, stage, description, items } = req.body;
            const template = templateService.createTemplate({
                name, stage, description, items,
                createdBy: req.user.username
            });

            logAudit(req.user.id, req.user.username, req.user.role,
                'CREATE', 'checklist_template', name, { stage, version: template.version });

            res.json({ success: true, message: `Template "${name}" v${template.version} created`, data: template });
        } catch (error) {
            console.error('❌ Error creating template:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/** GET /checklist/templates — List all templates */
router.get('/templates', (req, res) => {
    try {
        const { stage } = req.query;
        const templates = templateService.getTemplates(stage || null);
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** GET /checklist/template/:id — Get specific template */
router.get('/template/:id', (req, res) => {
    try {
        const template = templateService.getTemplate(parseInt(req.params.id));
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** POST /checklist/template/:id/update — Create new version of template */
router.post('/template/:id/update',
    checkPermission('admin'),
    [body('items').isArray({ min: 1 }).withMessage('Items array required')],
    handleValidationErrors,
    (req, res) => {
        try {
            const { description, items } = req.body;
            const template = templateService.updateTemplate(
                parseInt(req.params.id),
                { description, items, createdBy: req.user.username }
            );

            logAudit(req.user.id, req.user.username, req.user.role,
                'UPDATE', 'checklist_template', template.name, { version: template.version });

            res.json({ success: true, message: `Template "${template.name}" v${template.version} created`, data: template });
        } catch (error) {
            console.error('❌ Error updating template:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/** DELETE /checklist/template/:name — Delete template and all versions */
router.delete('/template/:name', checkPermission('admin'), (req, res) => {
    try {
        const deleted = templateService.deleteTemplate(req.params.name);

        logAudit(req.user.id, req.user.username, req.user.role,
            'DELETE', 'checklist_template', req.params.name, { action: 'DELETE_ALL_VERSIONS' });

        res.json({ success: true, message: deleted ? 'Template deleted' : 'Template not found' });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** POST /checklist/sync-template — Sync a template to WOs */
router.post('/sync-template',
    checkPermission('admin'),
    [
        body('templateId').isInt({ min: 1 }).withMessage('Valid template ID required')
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { templateId, woList } = req.body;
            // Issue 3 fix: syncTemplateToWOs now batches all DB writes in one transaction.
            // checklistService and revisionService are injected to avoid circular deps in TemplateService.
            const affected = templateService.syncTemplateToWOs(
                templateId,
                woList || null,
                req.user.username,
                checklistService,
                revisionService
            );

            logAudit(req.user.id, req.user.username, req.user.role,
                'SYNC', 'checklist_template', String(templateId), { affectedWOs: affected });

            res.json({
                success: true,
                message: `Template synced to ${affected.length} work order(s)`,
                data: { affectedWOs: affected }
            });
        } catch (error) {
            console.error('❌ Error syncing template:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/* ═══════════════════════════════════════════════════════════════════
 * REVISION ENDPOINTS (Per-WO revision history)
 * ═══════════════════════════════════════════════════════════════════ */

/** GET /checklist/:stage/:wo/revisions — List all revisions for a WO+stage */
router.get('/:stage/:wo/revisions', (req, res) => {
    try {
        const { stage, wo } = req.params;
        const revisions = checklistService.getRevisions(wo, stage);
        res.json({ success: true, data: revisions });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** GET /checklist/:stage/:wo/revision/:rev — Get a specific revision */
router.get('/:stage/:wo/revision/:rev', (req, res) => {
    try {
        const { stage, wo, rev } = req.params;
        const revision = checklistService.getRevision(wo, stage, parseInt(rev));
        if (!revision) {
            return res.status(404).json({ success: false, error: 'Revision not found' });
        }
        res.json({ success: true, data: revision });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** POST /checklist/:stage/:wo/restore/:rev — Restore a checklist to a specific revision */
router.post('/:stage/:wo/restore/:rev',
    checkPermission('admin'),
    (req, res) => {
        try {
            const { stage, wo, rev } = req.params;
            const restored = checklistService.restoreRevision(wo, stage, parseInt(rev), req.user.username);

            logAudit(req.user.id, req.user.username, req.user.role,
                'RESTORE', 'checklist', `${stage}-${wo}`, { revision: parseInt(rev) });

            res.json({ success: true, message: `Restored to revision ${rev}`, data: restored });
        } catch (error) {
            console.error('❌ Error restoring revision:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/** POST /checklist/compare — Compare two template versions */
router.post('/compare', (req, res) => {
    try {
        const { templateIdA, templateIdB } = req.body;
        const tplA = templateService.getTemplate(templateIdA);
        const tplB = templateService.getTemplate(templateIdB);

        if (!tplA || !tplB) {
            return res.status(404).json({ success: false, error: 'One or both templates not found' });
        }

        const diff = revisionService.compareVersions(tplA.items, tplB.items);
        res.json({ success: true, data: { templateA: tplA.name + ' v' + tplA.version, templateB: tplB.name + ' v' + tplB.version, diff } });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /checklist/summary/:wo
 * Batch endpoint: returns techDone / supervisorDone / qaDone counts
 * for EVERY stage of a WO in a single request.
 *
 * NOTE on field names: the /save route stores technician/shopSupervisor/qaSupervisor
 * (string names), not techSignedOff/supervisorSignedOff/qaSignedOff (boolean flags).
 * This summary uses the same fields as /save to ensure counts are accurate.
 * If a sign-off boolean workflow is added in future, update both /save and here together.
 */
router.get('/summary/:wo', (req, res) => {
    try {
        const { wo } = req.params;

        // HIGH security fix (kluster P3): verify WO exists and is accessible before aggregating
        const transformer = checklistService.findTransformer(wo);
        if (!transformer) {
            return res.status(404).json({ success: false, error: `Work Order '${wo}' not found` });
        }
        if (req.user?.role === 'customer' && !transformer.customerVisible) {
            return res.status(403).json({ success: false, error: 'Access denied to this Work Order' });
        }

        // All active stages — winding is split into 5 sub-stages in the DB
        const STAGES = [
            'winding1', 'winding2', 'winding3', 'winding4', 'winding5',
            'vpd', 'coreCoil', 'tanking', 'tankFilling', 'spa', 'coreBuilding'
        ];

        const summary = {};


        for (const stage of STAGES) {
            let items = getItems(wo, stage);

            // Customer isolation: restrict counts to their assigned customerId
            if (req.user && req.user.role === 'customer' && req.user.customerId) {
                items = items.filter(i => i.customerId === req.user.customerId);
            }

            summary[stage] = {
                total:          items.length,
                techDone:       items.filter(i => i.technician).length,
                supervisorDone: items.filter(i => i.shopSupervisor).length,
                qaDone:         items.filter(i => i.qaSupervisor).length
            };
        }

        // Also expose a rolled-up 'winding' group for the sidebar badge engine
        const windingStages = ['winding1','winding2','winding3','winding4','winding5'];
        summary['winding'] = {
            total:          windingStages.reduce((n, s) => n + summary[s].total, 0),
            techDone:       windingStages.reduce((n, s) => n + summary[s].techDone, 0),
            supervisorDone: windingStages.reduce((n, s) => n + summary[s].supervisorDone, 0),
            qaDone:         windingStages.reduce((n, s) => n + summary[s].qaDone, 0)
        };

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching checklist batch summary:', error);
        res.status(500).json(errorResponse(error));
    }
});
module.exports = router;