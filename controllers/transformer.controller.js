const transformerService = require('../services/transformer.service');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const { STAGE_ORDER } = require('../utils/stageControl');

exports.getTransformers = (req, res) => {
    try {
        const filters = {};

        // Filter by customer for all users (except admin)
        if (req.user?.customerId && req.user.role !== 'admin') {
            filters.customerId = req.user.customerId;
        }

        const transformers = transformerService.findAll(filters);
        res.json(successResponse(transformers, 'Transformers loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

exports.createTransformer = (req, res) => {
    try {
        const transformerData = {
            wo: req.body.wo,
            customerId: req.body.customerId || req.user.customerId,
            customer: req.body.customer,
            rating: req.body.rating,
            hv: req.body.hv,
            lv: req.body.lv,
            stage: req.body.stage || 'design',
            designData: req.body.designData,
            createdBy: req.user.id
        };

        if (!transformerData.customerId) {
            return res.status(400).json(errorResponse('Customer ID is required'));
        }

        const newTransformer = transformerService.create(transformerData);

        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'CREATE',
            'transformer',
            newTransformer.wo,
            newTransformer
        );

        console.log(`✅ Transformer added: ${newTransformer.wo} for customer ${newTransformer.customerId}`);
        res.json(successResponse(newTransformer, 'Transformer added successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

exports.updateTransformer = (req, res) => {
    try {
        const oldTransformer = transformerService.findByWO(req.params.id);
        if (!oldTransformer) {
            return res.status(404).json(errorResponse('Transformer not found'));
        }

        // Check customer access
        if (req.user.customerId && req.user.role !== 'admin') {
            if (oldTransformer.customerId !== req.user.customerId) {
                return res.status(403).json(errorResponse('Access denied. You can only update your own customer\'s transformers.'));
            }
        }

        const updates = {
            ...req.body,
            updatedBy: req.user.id
        };

        const updatedTransformer = transformerService.update(req.params.id, updates);

        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'UPDATE',
            'transformer',
            req.params.id,
            { before: oldTransformer, after: updatedTransformer }
        );

        res.json(successResponse(updatedTransformer, 'Transformer updated successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

exports.deleteTransformer = (req, res) => {
    try {
        const transformerToDelete = transformerService.findByWO(req.params.id);
        if (!transformerToDelete) {
            return res.json(successResponse(null, 'Transformer already deleted or not found'));
        }

        // Check customer access
        if (req.user.customerId && req.user.role !== 'admin') {
            if (transformerToDelete.customerId !== req.user.customerId) {
                return res.status(403).json(errorResponse('Access denied. You can only delete your own customer\'s transformers.'));
            }
        }

        transformerService.delete(req.params.id);

        logAudit(
            req.user.id,
            req.user.username,
            req.user.role,
            'DELETE',
            'transformer',
            req.params.id,
            transformerToDelete
        );

        res.json(successResponse(null, 'Transformer deleted successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

exports.getCustomers = (req, res) => {
    try {
        const transformers = transformerService.findAll();
        const customersMap = new Map();
        transformers.forEach(t => {
            if (t.customerId && t.customer) {
                customersMap.set(t.customerId, t.customer);
            }
        });

        const customers = Array.from(customersMap, ([customerId, name]) => ({ customerId, name }));
        res.json(successResponse(customers, 'Customers loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Get transformers that are behind schedule
 */
exports.getDelayedTransformers = (req, res) => {
    try {
        const transformers = transformerService.findAll();
        const now = new Date();
        const DELAY_THRESHOLD_DAYS = 14;

        const delayed = transformers.filter(t => {
            if (!t.createdAt) {
                return false;
            }

            const createdAt = new Date(t.createdAt);
            const diffTime = Math.abs(now - createdAt);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // If transformer is older than 14 days and still in an early stage
            const isEarlyStage = !t.stage || ['winding', 'vpd', 'coreCoil'].includes(t.stage);

            return diffDays > DELAY_THRESHOLD_DAYS && isEarlyStage;
        });

        console.log(`⏰ Found ${delayed.length} delayed transformers`);
        res.json(successResponse(delayed, 'Delayed transformers loaded'));
    } catch (error) {
        console.error('❌ Error fetching delayed transformers:', error);
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Update transformer stage with history tracking
 * POST /transformers/:id/stage
 */
exports.updateTransformerStage = (req, res) => {
    try {
        const { id } = req.params;
        const { newStage, notes } = req.body;

        const transformer = transformerService.findByWO(id);
        if (!transformer) {
            return res.status(404).json(errorResponse('Transformer not found'));
        }

        // Check customer access
        if (req.user.customerId && req.user.role !== 'admin') {
            if (transformer.customerId !== req.user.customerId) {
                return res.status(403).json(errorResponse('Access denied'));
            }
        }

        // Validate stage using canonical list
        if (!STAGE_ORDER.includes(newStage)) {
            return res.status(400).json(errorResponse(`Invalid stage. Must be one of: ${STAGE_ORDER.join(', ')}`));
        }

        const oldStage = transformer.currentStage || transformer.stage || 'design';
        const now = new Date().toISOString();

        // Initialize stage history if not exists
        const stageHistory = transformer.stageHistory || [];

        // Complete the previous stage
        if (stageHistory.length > 0) {
            const lastStage = stageHistory[stageHistory.length - 1];
            if (!lastStage.completedAt) {
                lastStage.completedAt = now;
                lastStage.completedBy = req.user.id;
                lastStage.notes = notes || '';

                // Calculate duration
                const start = new Date(lastStage.startedAt);
                const end = new Date(now);
                const durationDays = ((end - start) / (1000 * 60 * 60 * 24)).toFixed(1);
                lastStage.duration = `${durationDays} days`;
            }
        } else if (oldStage) {
            // Add initial stage to history if this is the first transition
            stageHistory.push({
                stage: oldStage,
                startedAt: transformer.createdAt || now,
                completedAt: now,
                completedBy: req.user.id,
                duration: 'N/A',
                notes: 'Initial stage'
            });
        }

        // Add new stage to history
        stageHistory.push({
            stage: newStage,
            startedAt: now,
            completedAt: null,
            completedBy: null,
            duration: null,
            notes: ''
        });

        // Save updated transformer
        const updatedTransformer = transformerService.update(id, {
            ...transformer,
            stage: newStage,
            currentStage: newStage,
            stageProgress: 0,
            stageHistory,
            updatedBy: req.user.id
        });

        // Audit log
        logAudit(
            req.user.id,
            req.user.username || req.user.id,
            req.user.role,
            'STAGE_CHANGE',
            'transformer',
            id,
            {
                from: oldStage,
                to: newStage,
                notes: notes || '',
                wo: transformer.wo
            }
        );

        console.log(`✅ Stage updated: ${transformer.wo} from ${oldStage} to ${newStage}`);
        res.json(successResponse(updatedTransformer, 'Stage updated successfully'));
    } catch (error) {
        console.error('❌ Error updating stage:', error);
        res.status(500).json(errorResponse(error));
    }
};
