const express = require('express');
const { authenticate, checkPermission, requireRole } = require('../middlewares/auth');
const { successResponse, errorResponse } = require('../utils/response');
const {
    getStageStatus,
    canAccessStage,
    updateStageProgress,
    completeStage,
    approveStage,
    rejectStage,
    readyForQA,
    unlockStage
} = require('../utils/stageControl');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Apply authentication to ALL stage routes
router.use(authenticate);

/**
 * GET /stage/:wo
 * Get stage status for a specific work order
 * Accessible to all authenticated users
 */
router.get('/:wo', (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Please log in' });
        }

        const { wo } = req.params;
        const status = getStageStatus(wo);

        // Enforce customer data isolation: verify the WO belongs to this customer
        if (req.user.role === 'customer') {
            const transformerService = require('../services/transformer.service');
            const transformer = transformerService.findByWO(wo);
            if (!transformer) {
                return res.status(404).json({ success: false, error: 'Work order not found' });
            }
            if (transformer.customerId !== req.user.customerId) {
                return res.status(403).json({ success: false, error: 'Access denied. This work order does not belong to your account.' });
            }
        }

        res.json(successResponse(status, 'Stage status loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/check-access
 * Check if user can access a specific stage
 * Used by frontend to validate before loading stage
 */
router.post('/:wo/check-access', (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Please log in' });
        }

        const { wo } = req.params;
        const { stage } = req.body;

        if (!stage) {
            return res.status(400).json({ success: false, error: 'Stage is required' });
        }

        const access = canAccessStage(wo, stage);
        res.json(successResponse(access, access.allowed ? 'Access granted' : 'Access denied'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/update-progress
 * Update stage completion percentage
 * Requires production+ permission
 */
router.post('/:wo/update-progress', checkPermission('production'), (req, res) => {
    try {
        const { wo } = req.params;
        const { stage, percentage } = req.body;

        if (!stage || percentage === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Stage and percentage are required'
            });
        }

        if (percentage < 0 || percentage > 100) {
            return res.status(400).json({
                success: false,
                error: 'Percentage must be between 0 and 100'
            });
        }

        const stageStatus = updateStageProgress(wo, stage, percentage);

        // Log progress update
        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'UPDATE',
            'stage_progress',
            `${wo}_${stage}`,
            {
                stage,
                percentage,
                currentStatus: stageStatus.status
            }
        );

        res.json(successResponse(stageStatus, 'Stage progress updated'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/complete
 * Mark a stage as complete (auto-locks it)
 * Requires production+ permission
 */
router.post('/:wo/complete', checkPermission('production'), (req, res) => {
    try {
        const { wo } = req.params;
        const { stage } = req.body;

        if (!stage) {
            return res.status(400).json({ success: false, error: 'Stage is required' });
        }

        // Check if user can access stage first
        const access = canAccessStage(wo, stage);
        if (!access.allowed) {
            return res.status(403).json({ success: false, error: access.reason });
        }

        const result = completeStage(wo, stage, req.user.id, req.user.username);

        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        // Log stage completion
        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'COMPLETE',
            'stage',
            `${wo}_${stage}`,
            {
                stage,
                status: result.status[stage]
            }
        );

        console.log(`✅ Stage completed and locked: ${stage} for WO ${wo}`);
        res.json(successResponse(result.status, 'Stage completed and locked'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/unlock
 * Unlock a stage (admin only)
 * Requires admin permission
 */
router.post('/:wo/unlock', requireRole(['admin']), (req, res) => {
    try {
        const { wo } = req.params;
        const { stage, reason } = req.body;

        if (!stage || !reason) {
            return res.status(400).json({
                success: false,
                error: 'Stage and reason are required'
            });
        }

        if (reason.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a detailed reason (min 10 characters)'
            });
        }

        const result = unlockStage(wo, stage, reason, req.user.id, req.user.username);

        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        // Log admin unlock action
        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'UNLOCK',
            'stage',
            `${wo}_${stage}`,
            {
                stage,
                reason,
                unlockReason: reason
            }
        );

        console.log(`🔓 Stage unlocked by admin: ${stage} for WO ${wo}`);
        res.json(successResponse(result.status, 'Stage unlocked by admin'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/approve
 * QA approval of a completed stage → marks it 'approved', unlocks next stage
 * Requires quality or admin role
 */
router.post('/:wo/approve', requireRole(['quality', 'admin']), (req, res) => {
    try {
        const { wo } = req.params;
        const { stage } = req.body;

        if (!stage) {
            return res.status(400).json({ success: false, error: 'Stage is required' });
        }

        const result = approveStage(wo, stage, req.user.id, req.user.username);

        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        // Log QA approval to audit trail
        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'APPROVE',
            'stage',
            `${wo}_${stage}`,
            {
                stage,
                approvedBy: req.user.username,
                approvedAt: new Date().toISOString()
            }
        );

        console.log(`✅ Stage approved by ${req.user.role}: ${stage} for WO ${wo}`);
        res.json(successResponse(result.status, `Stage '${stage}' approved successfully`));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/reject
 * QA rejection of a submitted stage — reverts to in-progress with a reason
 * Requires quality or admin role
 */
router.post('/:wo/reject', requireRole(['quality', 'admin']), (req, res) => {
    try {
        const { wo } = req.params;
        const { stage, reason } = req.body;

        if (!stage || !reason) {
            return res.status(400).json({ success: false, error: 'Stage and reason are required' });
        }

        if (reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Rejection reason must be at least 10 characters'
            });
        }

        const result = rejectStage(wo, stage, reason, req.user.id, req.user.username);

        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        // Log QA rejection to audit trail
        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'REJECT',
            'stage',
            `${wo}_${stage}`,
            {
                stage,
                reason,
                rejectedBy: req.user.username,
                rejectedAt: new Date().toISOString()
            }
        );

        console.log(`❌ Stage rejected by ${req.user.role}: ${stage} for WO ${wo}`);
        res.json(successResponse(result.status, `Stage '${stage}' rejected — returned to production`));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /stage/:wo/ready-for-qa
 * Production engineer submits stage for QA review
 * Sets status → awaiting_qa, locks the stage
 * Requires production or admin role
 */
router.post('/:wo/ready-for-qa', checkPermission('production'), (req, res) => {
    try {
        const { wo } = req.params;
        const { stage } = req.body;

        if (!stage) {
            return res.status(400).json({ success: false, error: 'Stage is required' });
        }

        const result = readyForQA(wo, stage, req.user.id, req.user.username);

        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'SUBMIT_FOR_QA',
            'stage',
            `${wo}_${stage}`,
            { stage, submittedBy: req.user.username, submittedAt: new Date().toISOString() }
        );

        console.log(`📋 Stage submitted for QA: ${stage} for WO ${wo} by ${req.user.username}`);
        res.json(successResponse(result.status, `Stage '${stage}' submitted for QA review`));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

module.exports = router;
