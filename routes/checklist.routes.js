const express = require('express');
const { body } = require('express-validator');
const { authenticate, checkPermission, requireRole } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const { errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const db = require('../config/database');

const router = express.Router();

// Apply authentication to ALL checklist routes
router.use(authenticate);

/* ─────────────────────────────────────────────────────────────────────────
 * HELPERS: translate between SQLite blob storage ↔ flat-item API
 *
 * SQLite stores items as a JSON array in checklists.items for each wo+stage.
 * The frontend (from "transformer deep") expects a flat array of item objects:
 *   [{ rowId, actualValue, technician, shopSupervisor, qaSupervisor, remark, locked, timestamp }]
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Get the items array for a given wo + stage from the DB.
 * Returns [] if no record exists.
 */
function getItems(wo, stage) {
    const row = db.prepare('SELECT items FROM checklists WHERE wo = ? AND stage = ?').get(wo, stage);
    if (!row) {
        return [];
    }
    try {
        return JSON.parse(row.items) || [];
    } catch {
        return [];
    }
}

/**
 * Persist the items array for a given wo + stage.
 * Upserts the checklists row.
 */
function setItems(wo, stage, items, completedBy = null) {
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
            const { reason } = req.body;

            // itemId format: "row_<stage>_<number>"  e.g. "row_winding1_3"
            // We need wo too — frontend must supply it
            const { wo, stage } = req.body;
            if (!wo || !stage) {
                return res.status(400).json({ success: false, error: 'wo and stage required in body' });
            }

            const items = getItems(wo, stage);
            const idx = items.findIndex(i => i.rowId === itemId || i.id === itemId);
            if (idx === -1) {
                return res.status(404).json({ success: false, error: 'Checklist item not found' });
            }

            items[idx].locked = false;
            items[idx].unlockedBy = req.user.username;
            items[idx].unlockedAt = new Date().toISOString();
            items[idx].unlockReason = reason;

            setItems(wo, stage, items);

            logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId,
                { action: 'UNLOCK_ROW', reason });

            console.log(`🔓 Unlocked checklist row ${itemId} by ${req.user.username}. Reason: ${reason}`);
            res.json({ success: true, message: 'Row unlocked successfully', data: items[idx] });
        } catch (error) {
            console.error('❌ Error unlocking checklist row:', error);
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

            const items = getItems(wo, stage);
            const idx = items.findIndex(i => i.rowId === itemId || i.id === itemId);
            if (idx === -1) {
                return res.status(404).json({ success: false, error: 'Checklist item not found' });
            }

            items[idx].locked = true;
            items[idx].lockedBy = req.user.username;
            items[idx].lockedAt = new Date().toISOString();
            items[idx].lockReason = reason;

            setItems(wo, stage, items);

            logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId,
                { action: 'LOCK_ROW', reason });

            console.log(`🔒 Locked checklist row ${itemId} by ${req.user.username}. Reason: ${reason}`);
            res.json({ success: true, message: 'Row locked successfully', data: items[idx] });
        } catch (error) {
            console.error('❌ Error locking checklist row:', error);
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
        const rows = db.prepare('SELECT * FROM checklists').all();
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** GET /checklist/pending-qa */
router.get('/pending-qa', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM checklists WHERE qaApproved = 0 OR qaApproved IS NULL').all();
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/** GET /checklist/pending-supervisor */
router.get('/pending-supervisor', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM checklists WHERE supervisorApproved = 0 OR supervisorApproved IS NULL').all();
        res.json({ success: true, data: rows });
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
                // Concurrency check: if client sends updatedAt, verify it
                const dbItem = items[existingIdx];
                if (updatedAt && dbItem.updatedAt && updatedAt !== dbItem.updatedAt) {
                    console.log(`⚠️ Conflict: Item ${rowId} was modified. DB: ${dbItem.updatedAt}, Client: ${updatedAt}`);
                    return res.status(409).json({
                        success: false,
                        error: 'Item was modified by another user. Please refresh and try again.',
                        current: dbItem
                    });
                }

                // Preserve previous unlock metadata if present
                if (items[existingIdx].unlockedBy) {
                    itemData.previousUnlock = {
                        unlockedBy: items[existingIdx].unlockedBy,
                        unlockedAt: items[existingIdx].unlockedAt,
                        unlockReason: items[existingIdx].unlockReason
                    };
                }

                items[existingIdx] = { ...items[existingIdx], ...itemData, updatedAt: new Date().toISOString() };
                actionType = 'UPDATE';
                console.log(`📝 Updated checklist item: ${stage} - Item ${itemNumber} - WO: ${wo}`);
            } else {
                const newItem = {
                    id: Date.now().toString(),
                    wo, customerId, customer, stage,
                    ...itemData,
                    createdAt: new Date().toISOString()
                };
                items.push(newItem);
                actionType = 'CREATE';
                console.log(`✅ Saved checklist item: ${stage} - Item ${itemNumber} - WO: ${wo}`);
            }

            setItems(wo, stage, items, req.user?.username);

            logAudit(
                req.user.id, req.user.username, req.user.role,
                actionType, 'checklist',
                `${stage}-${itemNumber}-${wo}`,
                itemData
            );

            const saved = items.find(i => i.rowId === rowId);
            res.json({ success: true, message: `Item ${itemNumber} saved successfully`, item: saved });

        } catch (error) {
            console.error('❌ Error saving checklist:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/* ─────────────────────────────────────────────────────────────────────────
 * PRODUCTION SAVE  (POST /checklist/production/save)
 * ───────────────────────────────────────────────────────────────────────── */
router.post('/production/save', checkPermission('production'), (req, res) => {
    try {
        const { wo, customerId, customer, stage, itemNumber, rowId, productionNotes, shift, timestamp } = req.body;

        if (!wo || !stage || !itemNumber || !rowId) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
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

        // Admin bypass with audit log
        if (req.user?.role === 'admin') {
            logAudit(req.user.id, req.user.username, req.user.role, 'READ', 'checklist',
                `${stage}-${wo}`, { action: 'ADMIN_STAGE_OVERRIDE', stage, wo });
            console.log(`🔑 Admin override: accessing stage ${stage} on WO ${wo}`);
        }

        let items = getItems(wo, stage);

        // Customer isolation: only show items belonging to this customer
        if (req.user?.role === 'customer') {
            items = items.filter(i => i.customerId === req.user.customerId);
        }

        console.log(`📋 Loaded ${items.length} checklist items for ${stage} - WO: ${wo}`);
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

module.exports = router;