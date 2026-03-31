const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation');
const { successResponse, errorResponse } = require('../utils/response');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /auth/login
 * Authenticate user credentials and return JWT token
 */
router.post('/login', [
    body('userId').trim().notEmpty().withMessage('User ID is required'),
    body('password').trim().notEmpty().withMessage('Password is required')
], handleValidationErrors, async (req, res) => {
    const { userId, password } = req.body;

    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔐 [AUTH] Login attempt for user: "${userId}"`);
        }

        const user = userService.findByUserId(userId);

        if (!user) {
            logger.warn(`Login attempt for non-existent user: "${userId}"`);
            return res.status(401).json(errorResponse('Invalid credentials'));
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            logger.info(`Login successful for user: "${userId}"`);

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.userId,
                    role: user.role,
                    name: user.name
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY || '8h' }
            );

            res.json(successResponse({
                token,
                user: {
                    userId: user.userId,
                    name: user.name,
                    role: user.role,
                    department: user.department || null,
                    customerId: user.customerId || null,
                    customerName: user.customerName || null,
                    email: user.email,
                    permissions: user.permissions || []
                }
            }, 'Login successful'));
        } else {
            logger.warn(`Password mismatch for user: "${userId}"`);
            res.status(401).json(errorResponse('Invalid credentials'));
        }
    } catch (error) {
        logger.error('Auth error:', error);
        res.status(500).json(errorResponse('Authentication failed'));
    }
});

module.exports = router;
