/**
 * Standard success response helper
 */
function successResponse(data, message = 'Success') {
    return { success: true, message, data };
}

/**
 * Standard error response helper
 */
function errorResponse(error, _statusCode = 500) {
    return {
        success: false,
        error: error.message || error,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
}

module.exports = {
    successResponse,
    errorResponse
};