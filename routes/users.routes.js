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
const db = require('../config/database');

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['admin']));

/* ─── helpers ─────────────────────────────────────────────── */
function sanitizeUser(u) {
    const { password, ...safe } = u;
    return safe;
}

/* ─── GET /api/users ──────────────────────────────────────── */
router.get('/', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
        res.json(successResponse(users.map(sanitizeUser), `${users.length} users loaded`));
    } catch (err) {
        res.status(500).json(errorResponse(err));
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
            const existing = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userId);
            if (existing) {
                return res.status(409).json({ success: false, error: 'User ID already exists' });
            }

            const hashed = await bcrypt.hash(password, 10);

            db.prepare(`
                INSERT INTO users (userId, password, name, email, role, department, customerId, customerName)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(userId, hashed, name, email || null, role, department || null, customerId || null, customerName || null);

            logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'user', userId,
                { name, role, department });

            const created = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
            res.status(201).json(successResponse(sanitizeUser(created), 'User created successfully'));
        } catch (err) {
            res.status(500).json(errorResponse(err));
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
            const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(id);
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });

            // Prevent admin from editing own role (safety)
            if (id === req.user.id && req.body.role && req.body.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Cannot change your own admin role' });
            }

            const updates = {
                name: req.body.name || user.name,
                email: req.body.email !== undefined ? req.body.email : user.email,
                role: req.body.role || user.role,
                department: req.body.department !== undefined ? req.body.department : user.department,
                customerId: req.body.customerId !== undefined ? req.body.customerId : user.customerId,
                customerName: req.body.customerName !== undefined ? req.body.customerName : user.customerName
            };

            if (req.body.password) {
                updates.password = await bcrypt.hash(req.body.password, 10);
                db.prepare(`
                    UPDATE users SET name=?, email=?, role=?, department=?, customerId=?, customerName=?, password=?
                    WHERE userId=?
                `).run(updates.name, updates.email, updates.role, updates.department,
                    updates.customerId, updates.customerName, updates.password, id);
            } else {
                db.prepare(`
                    UPDATE users SET name=?, email=?, role=?, department=?, customerId=?, customerName=?
                    WHERE userId=?
                `).run(updates.name, updates.email, updates.role, updates.department,
                    updates.customerId, updates.customerName, id);
            }

            logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'user', id, updates);

            const updated = db.prepare('SELECT * FROM users WHERE userId = ?').get(id);
            res.json(successResponse(sanitizeUser(updated), 'User updated'));
        } catch (err) {
            res.status(500).json(errorResponse(err));
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
        const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        db.prepare('DELETE FROM users WHERE userId = ?').run(id);
        logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'user', id,
            { name: user.name, role: user.role });

        res.json(successResponse(null, 'User deleted'));
    } catch (err) {
        res.status(500).json(errorResponse(err));
    }
});

module.exports = router;
