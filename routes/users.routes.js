/**
 * User Management Routes — admin only
 * GET    /api/users          — list all users
 * POST   /api/users          — create user
 * PUT    /api/users/:id      — update user
 * DELETE /api/users/:id      — delete user
 */
const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['admin']));

/* ─── helpers ─────────────────────────────────────────────── */
function sanitizeUser(u) {
    const { password: _password, ...safe } = u;
    return safe;
}

/* ─── GET /api/users ──────────────────────────────────────── */
router.get('/', (req, res) => {
    try {
        const users = userService.findAll();
        res.json(successResponse(users.map(sanitizeUser), `${users.length} users loaded`));
    } catch (err) {
        logger.error('GET /users error', err);
        res.status(500).json(errorResponse('Failed to retrieve users'));
    }
});

/* ─── POST /api/users ─────────────────────────────────────── */
router.post('/',
    [
        body('userId').trim().notEmpty().isLength({ min: 3, max: 30 }).withMessage('User ID: 3-30 chars'),
        body('name').trim().notEmpty().withMessage('Name required'),
        body('role').isIn(['admin', 'quality', 'production', 'customer']).withMessage('Invalid role'),
        body('password').isLength({ min: 6 }).withMessage('Password: min 6 chars'),
        body('email').optional().isEmail().withMessage('Invalid email'),
        body('department').optional().trim(),
        body('customerId').optional().trim()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { userId, name, role, password, email, department, customerId, customerName } = req.body;

            // Check duplicate
            const existing = userService.findByUserId(userId);
            if (existing) {
                return res.status(409).json({ success: false, error: 'User ID already exists' });
            }

            const hashed = await bcrypt.hash(password, 10);
            const created = userService.create({ userId, password: hashed, name, email, role, department, customerId, customerName });

            logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'user', userId, { name, role, department });
            res.status(201).json(successResponse(sanitizeUser(created), 'User created successfully'));
        } catch (err) {
            logger.error('POST /users error', err);
            res.status(500).json(errorResponse('Failed to create user'));
        }
    }
);

/* ─── PUT /api/users/:id ──────────────────────────────────── */
router.put('/:id',
    [
        body('name').optional().trim().notEmpty(),
        body('role').optional().isIn(['admin', 'quality', 'production', 'customer']),
        body('email').optional().isEmail(),
        body('department').optional().trim(),
        body('customerId').optional().trim(),
        body('password').optional().isLength({ min: 6 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const user = userService.findByUserId(id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Prevent admin from editing own role (safety)
            if (id === req.user.id && req.body.role && req.body.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Cannot change your own admin role' });
            }

            // Use consistent ternary checks for ALL fields so explicit values (including empty/null) are respected
            const updates = {
                name: req.body.name !== undefined ? req.body.name : user.name,
                email: req.body.email !== undefined ? req.body.email : user.email,
                role: req.body.role !== undefined ? req.body.role : user.role,
                department: req.body.department !== undefined ? req.body.department : user.department,
                customerId: req.body.customerId !== undefined ? req.body.customerId : user.customerId,
                customerName: req.body.customerName !== undefined ? req.body.customerName : user.customerName
            };

            // Password change handled separately via dedicated service method
            if (req.body.password) {
                const hashed = await bcrypt.hash(req.body.password, 10);
                userService.changePassword(id, hashed);
            }

            const updated = userService.update(id, updates);
            logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'user', id, updates);
            res.json(successResponse(sanitizeUser(updated), 'User updated'));
        } catch (err) {
            logger.error('PUT /users/:id error', err);
            res.status(500).json(errorResponse('Failed to update user'));
        }
    }
);

/* ─── DELETE /api/users/:id ───────────────────────────────── */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(403).json({ success: false, error: 'Cannot delete your own account' });
        }
        const user = userService.findByUserId(id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        userService.delete(id);
        logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'user', id, { name: user.name, role: user.role });
        res.json(successResponse(null, 'User deleted'));
    } catch (err) {
        logger.error('DELETE /users/:id error', err);
        res.status(500).json(errorResponse('Failed to delete user'));
    }
});

module.exports = router;
