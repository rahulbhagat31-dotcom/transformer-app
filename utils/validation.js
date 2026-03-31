const { body, param, validationResult } = require('express-validator');

/**
 * Validation rules for different entities
 */

// User validation
const userValidation = {
    login: [
        body('username')
            .trim()
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
            .escape(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ]
};

// Checklist validation
const checklistValidation = {
    save: [
        body('wo')
            .trim()
            .notEmpty().withMessage('Work order is required')
            .matches(/^[A-Z0-9\/\-]+$/i).withMessage('Invalid work order format')
            .escape(),
        body('stage')
            .trim()
            .notEmpty().withMessage('Stage is required')
            .isIn(['winding', 'coreCoil', 'tanking', 'vpd', 'tankFilling'])
            .withMessage('Invalid stage'),
        body('actualValue')
            .optional()
            .trim()
            .escape(),
        body('remark')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Remark too long')
            .escape(),
        body('technician')
            .optional()
            .trim()
            .escape(),
        body('shopSupervisor')
            .optional()
            .trim()
            .escape(),
        body('qualitySupervisor')
            .optional()
            .trim()
            .escape()
    ],
    lock: [
        param('itemId')
            .trim()
            .notEmpty().withMessage('Item ID is required')
            .escape(),
        body('reason')
            .trim()
            .notEmpty().withMessage('Reason is required')
            .isLength({ min: 3, max: 200 }).withMessage('Reason must be 3-200 characters')
            .escape()
    ]
};

// Transformer validation
const transformerValidation = {
    create: [
        body('woNumber')
            .trim()
            .notEmpty().withMessage('Work order number is required')
            .matches(/^[A-Z0-9\/\-]+$/i).withMessage('Invalid work order format')
            .escape(),
        body('customerId')
            .trim()
            .notEmpty().withMessage('Customer ID is required')
            .escape(),
        body('rating')
            .optional()
            .isNumeric().withMessage('Rating must be a number'),
        body('voltage')
            .optional()
            .trim()
            .escape(),
        body('deliveryDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
    ]
};

// Design validation
const designValidation = {
    save: [
        body('ratedPower')
            .isNumeric().withMessage('Rated power must be a number')
            .isFloat({ min: 0 }).withMessage('Rated power must be positive'),
        body('frequency')
            .isNumeric().withMessage('Frequency must be a number')
            .isIn([50, 60]).withMessage('Frequency must be 50 or 60 Hz'),
        body('fluxDensity')
            .optional()
            .isFloat({ min: 0, max: 2 }).withMessage('Flux density must be 0-2 Tesla'),
        body('currentDensity')
            .optional()
            .isFloat({ min: 0 }).withMessage('Current density must be positive')
    ]
};

/**
 * Middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }

    next();
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            // Remove HTML tags and escape special characters
            sanitized[key] = value
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/[<>'"]/g, (char) => { // Escape special chars
                    const escapeMap = {
                        '<': '&lt;',
                        '>': '&gt;',
                        '\'': '&#x27;',
                        '"': '&quot;'
                    };
                    return escapeMap[char];
                });
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

module.exports = {
    userValidation,
    checklistValidation,
    transformerValidation,
    designValidation,
    handleValidationErrors,
    sanitizeObject
};
