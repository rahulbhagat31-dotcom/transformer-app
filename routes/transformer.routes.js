const express = require('express');
const { body } = require('express-validator');
const { authenticate, checkPermission, requireRole } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const { logAudit } = require('../utils/audit');
const { successResponse, errorResponse } = require('../utils/response');
const controller = require('../controllers/transformer.controller');
const transformerService = require('../services/transformer.service');

const router = express.Router();

// All transformer routes require authentication
router.use(authenticate);

/**
 * GET /transformers/delayed
 */
router.get('/delayed', controller.getDelayedTransformers);

/**
 * GET /transformers/customers
 */
router.get('/customers', controller.getCustomers);

/**
 * GET /transformers
 */
router.get('/', controller.getTransformers);

/**
 * POST /transformers
 */
router.post('/', [
    body('customerId').trim().notEmpty().withMessage('Customer ID required'),
    body('wo').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('W.O. No must be 3-50 characters'),
    body('rating').optional().isNumeric().withMessage('Rating must be numeric'),
    body('hv').optional().isNumeric().withMessage('HV must be numeric'),
    body('lv').optional().isNumeric().withMessage('LV must be numeric')
], handleValidationErrors, checkPermission('quality'), controller.createTransformer);

/**
 * PUT /transformers/:id
 */
router.put('/:id', checkPermission('quality'), controller.updateTransformer);

/**
 * DELETE /transformers/:id
 */
router.delete('/:id', checkPermission('admin'), controller.deleteTransformer);

/**
 * POST /transformers/:id/stage
 * Update transformer stage with history tracking
 */
router.post('/:id/stage', checkPermission('production'), controller.updateTransformerStage);

/**
 * PUT /transformers/:wo/customer-visibility
 * Toggle whether a transformer's checklist is visible to the customer.
 * Admin and quality only.
 */
router.put('/:wo/customer-visibility',
    requireRole(['admin', 'quality']),
    [body('visible').isBoolean().withMessage('visible must be true or false')],
    handleValidationErrors,
    (req, res) => {
        try {
            const { wo } = req.params;
            const visible = req.body.visible === true || req.body.visible === 'true';

            const transformer = transformerService.setCustomerVisible(wo, visible, req.user.username);
            if (!transformer) {
                return res.status(404).json({ success: false, error: 'Transformer not found' });
            }

            logAudit(
                req.user.id, req.user.username, req.user.role,
                'UPDATE', 'transformer', wo,
                { action: 'CUSTOMER_VISIBILITY_TOGGLE', visible, updatedBy: req.user.username }
            );

            console.log(`👁️ Customer visibility for WO ${wo} set to ${visible} by ${req.user.username}`);
            res.json(successResponse(
                { wo, customerVisible: transformer.customerVisible },
                `Checklist ${visible ? 'shared with' : 'hidden from'} customer`
            ));
        } catch (error) {
            console.error('❌ Error toggling customer visibility:', error);
            res.status(500).json(errorResponse(error));
        }
    }
);

module.exports = router;