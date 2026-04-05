const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Token blacklist using node-cache for automatic TTL-based garbage collection
// Tokens are automatically removed after 8 hours (JWT expiration time)
const TOKEN_BLACKLIST_TTL = 8 * 60 * 60; // 8 hours in seconds

function invalidateToken(token) {
    if (token) {
        // Store in cache with 8-hour TTL - node-cache will auto-garbage collect
        cache.set('blacklist:' + token, true, TOKEN_BLACKLIST_TTL);
        logger.debug(`Token invalidated, will expire in ${TOKEN_BLACKLIST_TTL}s`);
    }
}

function isTokenBlacklisted(token) {
    if (!token) return false;
    return cache.get('blacklist:' + token) !== undefined;
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

    if (isTokenBlacklisted(token)) {
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
        const userRole = req.user?.role?.toLowerCase();

        if (!userRole) {
            return res.status(401).json({ success: false, error: 'Please log in' });
        }

        const roleHierarchy = {
            'admin': 3,
            'quality': 2,
            'production': 1,
            'customer': 0
        };

        if (roleHierarchy[userRole] >= roleHierarchy[requiredRole.toLowerCase()]) {
            next();
        } else {
            res.status(403).json({ success: false, error: 'Access denied' });
        }
    };
}

/**
 * Middleware to check if user has one of the allowed roles (exact match).
 * Both the stored role and the allowedRoles list are normalised to lowercase
 * so that casing differences in the DB or at call-sites cannot bypass the check.
 */
function requireRole(allowedRoles) {
    // Normalise once at middleware creation time — not per-request
    const normalised = allowedRoles.map(r => r.toLowerCase());

    return (req, res, next) => {
        const userRole = req.user?.role?.toLowerCase();

        if (!userRole) {
            return res.status(401).json({ success: false, error: 'Please log in' });
        }

        // Deny unrecognised roles immediately rather than silently falling through
        const knownRoles = ['admin', 'quality', 'production', 'customer'];
        if (!knownRoles.includes(userRole)) {
            return res.status(403).json({ success: false, error: 'Unrecognised role. Access denied.' });
        }

        if (normalised.includes(userRole)) {
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
