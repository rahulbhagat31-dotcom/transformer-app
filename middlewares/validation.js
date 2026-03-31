const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors from express-validator
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
}

module.exports = {
    handleValidationErrors
};