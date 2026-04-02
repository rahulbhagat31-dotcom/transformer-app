const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

// Simple in-memory token blacklist for session invalidation on logout
const tokenBlacklist = new Set();
function invalidateToken(token) {
    if (token) {
        tokenBlacklist.add(token);
        // Remove token from RAM after 8h (its natural expiration) to prevent memory leak
        // TODO: Move to a distributed store like Redis for horizontal scaling
        setTimeout(() => tokenBlacklist.delete(token), 8 * 60 * 60 * 1000);
    }
}

/**
 * Middleware to authenticate JWT token.
 * Priority:
 *  1. HttpOnly cookie `authToken`  (browser sessions — XSS-safe)
 *  2. Authorization: Bearer header (API clients / Postman / integrations)
 */
async function authenticate(req, res, next) {
    // 1. Try HttpOnly cookie (preferred — invisible to JS)
    let token = req.cookies && req.cookies.authToken;

    // 2. Fall back to Bearer header (backward-compatible for API clients)
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided. Please log in.'
        });
    }

    if (tokenBlacklist.has(token)) {
        return res.status(401).json({
            success: false,
            error: 'Session has been logged out. Please log in again.'
        });
    }


    try {
        // Verify JWT token - NO FALLBACK for security
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Re-validate user exists in database
        const user = await userService.findByUserIdWithPassword(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found. Please log in again.'
            });
        }

        // Attach user to request
        req.user = {
            id: user.userId,
            userId: user.userId,
            username: user.name || user.userId,
            role: user.role,
            department: user.department,
            customerId: user.customerId
        };

        if (process.env.NODE_ENV !== 'production') {
            logger.debug(`User: ${req.user.id} (${req.user.role})`);
        }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please log in again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Please log in again.'
            });
        }

        console.error('❌ Error authenticating:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * Middleware to check if user has required permission level
 */
function checkPermission(requiredRole) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ success: false, error: 'Please log in' });
        }

        const roleHierarchy = {
            'admin': 3,
            'quality': 2,
            'production': 1,
            'customer': 0
        };

        if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
            next();
        } else {
            res.status(403).json({ success: false, error: 'Access denied' });
        }
    };
}

/**
 * Middleware to check if user has one of the allowed roles (exact match)
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ success: false, error: 'Please log in' });
        }

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }
    };
}

module.exports = {
    authenticate,
    checkPermission,
    requireRole,
    invalidateToken
};
