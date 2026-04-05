/**
 * Assignment Routes — admin management of user-to-WO assignments.
 *
 * All routes require authentication.
 * Write operations (assign, revoke) require admin role.
 */
const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, requireRole } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const { errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const assignmentService = require('../services/assignment.service');

const router = express.Router();
router.use(authenticate);

/* ─────────────────────────────────────────────────────────────────
 * GET /assignments/wo/:wo  — list all users assigned to a WO
 * ───────────────────────────────────────────────────────────────── */
router.get('/wo/:wo', requireRole(['admin', 'quality']), (req, res) => {
    try {
        const assignments = assignmentService.getAssignmentsForWO(req.params.wo);
        res.json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/* ─────────────────────────────────────────────────────────────────
 * GET /assignments/user/:userId  — list all WOs assigned to a user
 * ───────────────────────────────────────────────────────────────── */
router.get('/user/:userId', requireRole(['admin']), (req, res) => {
    try {
        const assignments = assignmentService.getAssignmentsForUser(req.params.userId);
        res.json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/* ─────────────────────────────────────────────────────────────────
 * POST /assignments/assign  — assign a user to a WO
 * ───────────────────────────────────────────────────────────────── */
router.post('/assign',
    requireRole(['admin']),
    [
        body('userId').trim().notEmpty().withMessage('userId required'),
        body('wo').trim().notEmpty().withMessage('Work Order number required'),
        body('expiresAt').optional({ nullable: true }).isISO8601().withMessage('Invalid expiresAt date'),
        body('notes').optional().isString().isLength({ max: 500 })
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { userId, wo, expiresAt, notes } = req.body;
            const assignment = assignmentService.assign(userId, wo, req.user.username, { expiresAt, notes });

            logAudit(req.user.id, req.user.username, req.user.role,
                'CREATE', 'user_assignment', `${userId}:${wo}`,
                { userId, wo, expiresAt, notes });

            res.json({ success: true, message: `${userId} assigned to WO ${wo}`, data: assignment });
        } catch (error) {
            console.error('Error assigning user to WO:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

/* ─────────────────────────────────────────────────────────────────
 * DELETE /assignments/revoke  — remove a user-WO assignment
 * ───────────────────────────────────────────────────────────────── */
router.delete('/revoke',
    requireRole(['admin']),
    [
        body('userId').trim().notEmpty().withMessage('userId required'),
        body('wo').trim().notEmpty().withMessage('Work Order number required')
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { userId, wo } = req.body;
            const removed = assignmentService.revoke(userId, wo);

            if (!removed) {
                return res.status(404).json({ success: false, error: 'Assignment not found' });
            }

            logAudit(req.user.id, req.user.username, req.user.role,
                'DELETE', 'user_assignment', `${userId}:${wo}`, { userId, wo });

            res.json({ success: true, message: `Assignment for ${userId} on WO ${wo} removed` });
        } catch (error) {
            res.status(500).json(errorResponse(error));
        }
    }
);

/* ─────────────────────────────────────────────────────────────────
 * POST /assignments/purge-expired  — admin housekeeping
 * ───────────────────────────────────────────────────────────────── */
router.post('/purge-expired', requireRole(['admin']), (req, res) => {
    try {
        const removed = assignmentService.purgeExpired();
        logAudit(req.user.id, req.user.username, req.user.role,
            'DELETE', 'user_assignment', 'expired', { removed });
        res.json({ success: true, message: `Purged ${removed} expired assignment(s)`, removed });
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

module.exports = router;
