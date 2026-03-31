const multer = require('multer');

/**
 * Global error handler middleware
 */
function globalErrorHandler(err, req, res, _next) {
    console.error('❌ Unhandled Error:', err);

    // Handle multer file upload errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large (max 10MB)'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`
        });
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format'
        });
    }

    // Generic error
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
}

module.exports = {
    globalErrorHandler,
    notFoundHandler
};