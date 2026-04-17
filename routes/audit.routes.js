const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middlewares/auth');
const auditService = require('../services/audit.service');
const { successResponse, errorResponse } = require('../utils/response');

// All audit routes require authentication
router.use(authenticate);

/**
 * GET /audit
 * Retrieves recent audit logs (default: last 100)
 */
router.get('/', checkPermission('quality'), (req, res) => {
    try {
        const result = auditService.getLogs({ limit: 100, offset: 0 });
        res.json(successResponse(result.data, `Retrieved ${result.data.length} audit log entries`));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /audit/logs
 * Retrieve audit logs with optional filters and pagination.
 * Supports ?wo= (used by Digital Twin) as alias for ?entityId=
 */
router.get('/logs', checkPermission('quality'), (req, res) => {
    try {
        const {
            entity,
            entityId,
            wo,          // Digital Twin passes ?wo=WO-XXXX — treat as entityId
            userId,
            limit = 100,
            skip = 0
        } = req.query;

        const numLimit = Math.min(parseInt(limit) || 100, 1000);
        const numSkip = parseInt(skip) || 0;

        const filters = {
            limit: numLimit,
            offset: numSkip
        };
        if (entity) {
            filters.entityType = entity;
        }
        // Support both ?entityId= and ?wo= (Digital Twin uses ?wo=)
        if (entityId || wo) {
            filters.entityId = entityId || wo;
        }
        if (userId) {
            filters.userId = userId;
        }

        const result = auditService.getLogs(filters);

        const logs = result.data.map(log => {
            let parsedDetails = null;
            if (log.details) {
                if (typeof log.details === 'string') {
                    try {
                        parsedDetails = JSON.parse(log.details);
                    } catch {
                        parsedDetails = log.details;
                    }
                } else {
                    parsedDetails = log.details;
                }
            }
            return {
                ...log,
                entity: log.entityType,  // backward-compat alias
                changes: parsedDetails
            };
        });

        res.json(successResponse(
            {
                logs,
                pagination: {
                    total: result.total,
                    returned: logs.length,
                    skip: numSkip,
                    limit: numLimit
                }
            },
            `Retrieved ${logs.length} audit log entries`
        ));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /audit/stats
 * Get audit statistics
 */
router.get('/stats', checkPermission('quality'), (req, res) => {
    try {
        const result = auditService.getLogs({ limit: 10000, offset: 0 });
        const allLogs = result.data;

        const stats = {
            totalEvents: result.total,
            byAction: {},
            byEntity: {},
            byUser: {}
        };

        allLogs.forEach(log => {
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
            stats.byEntity[log.entityType] = (stats.byEntity[log.entityType] || 0) + 1;
            stats.byUser[log.username || log.userId] = (stats.byUser[log.username || log.userId] || 0) + 1;
        });

        res.json(successResponse(stats, 'Audit statistics retrieved'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /audit/verify
 * Verify hash chain integrity (admin only)
 */
router.get('/verify', checkPermission('admin'), (req, res) => {
    try {
        const result = auditService.verifyChain();
        res.json(successResponse(result, result.valid ? 'Hash chain is intact' : 'Hash chain integrity FAILED'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

module.exports = router;