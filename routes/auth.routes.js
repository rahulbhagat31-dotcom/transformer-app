const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation');
const { successResponse, errorResponse } = require('../utils/response');
const { authenticate, invalidateToken } = require('../middlewares/auth');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

const router = express.Router();

const IS_PROD = process.env.NODE_ENV === 'production';

// Cookie options — HttpOnly prevents JS access (XSS protection)
// SameSite: Strict prevents CSRF; secure: true enforced in production
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'Strict',
    secure: IS_PROD,
    maxAge: 8 * 60 * 60 * 1000 // 8 hours in ms (matches JWT_EXPIRY)
};

/**
 * POST /auth/login
 * Authenticate user credentials, set HttpOnly JWT cookie
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

        const user = userService.findByUserIdWithPassword(userId);

        if (!user) {
            logger.warn(`Login attempt for non-existent user: "${userId}"`);
            return res.status(401).json(errorResponse('Invalid credentials'));
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            logger.warn(`Password mismatch for user: "${userId}"`);
            return res.status(401).json(errorResponse('Invalid credentials'));
        }

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

        // Set token as HttpOnly cookie — JS cannot read this (XSS-safe)
        res.cookie('authToken', token, COOKIE_OPTIONS);

        // Return user info only — raw token NEVER sent to client
        res.json(successResponse({
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

    } catch (error) {
        logger.error('Auth error:', error);
        res.status(500).json(errorResponse('Authentication failed'));
    }
});

/**
 * POST /auth/logout
 * Clear the HttpOnly auth cookie and blacklist the JWT
 */
router.post('/logout', authenticate, (req, res) => {
    let token = req.cookies && req.cookies.authToken;
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (token) {
        invalidateToken(token);
        logger.info('Token invalidated on logout');
    }

    res.clearCookie('authToken', {
        httpOnly: true,
        sameSite: 'Strict',
        secure: IS_PROD
    });
    res.json(successResponse(null, 'Logged out successfully'));
});

module.exports = router;
