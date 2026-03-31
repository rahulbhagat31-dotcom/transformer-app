/**
 * Customer Filter Middleware
 * Automatically filters data by customer for multi-tenant isolation
 */

/**
 * Add customer filter to request
 * Ensures users can only access their own customer's data
 */
function customerFilter(req, res, next) {
    if (req.user && req.user.customerId) {
        // Add customer filter to request
        req.customerFilter = { customerId: req.user.customerId };

        // Add helper function to check if user can access customer data
        req.canAccessCustomer = (customerId) => {
            // Admin can access all customers
            if (req.user.role === 'admin') {
                return true;
            }
            // Regular users can only access their own customer
            return req.user.customerId === customerId;
        };
    }
    next();
}

/**
 * Enforce customer filter on data operations
 * Use this middleware on routes that need strict customer isolation
 */
function enforceCustomerFilter(req, res, next) {
    if (!req.user || !req.user.customerId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    // Add customer filter
    req.customerFilter = { customerId: req.user.customerId };
    next();
}

/**
 * Validate customer access
 * Checks if user can access the specified customer's data
 */
function validateCustomerAccess(req, res, next) {
    const { customerId } = req.params;

    if (!customerId) {
        return next();
    }

    // Admin can access all customers
    if (req.user.role === 'admin') {
        return next();
    }

    // Check if user belongs to this customer
    if (req.user.customerId !== customerId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied. You can only access your own customer data.'
        });
    }

    next();
}

module.exports = {
    customerFilter,
    enforceCustomerFilter,
    validateCustomerAccess
};
