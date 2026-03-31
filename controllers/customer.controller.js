const customerService = require('../services/customer.service');
const { logAudit } = require('../utils/audit');
const transformerService = require('../services/transformer.service');
const userService = require('../services/user.service');

/**
 * Get all customers
 */
async function getAllCustomers(req, res) {
    try {
        // Only admin can see all customers
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin only.'
            });
        }

        const customers = customerService.findAll();

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error getting customers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve customers'
        });
    }
}

/**
 * Get customer by ID
 */
async function getCustomerById(req, res) {
    try {
        const { id } = req.params;
        const customer = customerService.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Users can only see their own customer
        if (req.user.role !== 'admin' && req.user.customerId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error getting customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve customer'
        });
    }
}

/**
 * Create new customer
 */
async function createCustomer(req, res) {
    try {
        // Only admin can create customers
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin only.'
            });
        }

        const customerData = {
            id: `cust_${Date.now()}`,
            name: req.body.name,
            displayName: req.body.displayName,
            logo: req.body.logo || null,
            primaryColor: req.body.primaryColor || '#3498db',
            secondaryColor: req.body.secondaryColor || '#2c3e50',
            status: 'active',
            plan: req.body.plan || 'basic',
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            address: req.body.address,
            website: req.body.website || null,
            createdAt: new Date().toISOString(),
            settings: {
                allowMultipleUsers: true,
                maxUsers: req.body.maxUsers || 10,
                maxTransformers: req.body.maxTransformers || 100,
                features: req.body.features || ['calculations', 'checklist', 'export'],
                notifications: {
                    email: req.body.emailNotifications !== false,
                    sms: req.body.smsNotifications || false
                }
            },
            subscription: {
                tier: req.body.plan || 'basic',
                startDate: new Date().toISOString().split('T')[0],
                renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'active'
            }
        };

        const newCustomer = customerService.create(customerData);

        logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'customer', String(newCustomer.id), {
            customerName: newCustomer.name
        });

        res.status(201).json({
            success: true,
            data: newCustomer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create customer'
        });
    }
}

/**
 * Update customer
 */
async function updateCustomer(req, res) {
    try {
        const { id } = req.params;

        // Only admin or customer admin can update
        if (req.user.role !== 'admin' && req.user.customerId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const customer = customerService.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Allowed updates
        const updates = {};
        const allowedUpdates = ['displayName', 'logo', 'primaryColor', 'secondaryColor',
            'contactEmail', 'contactPhone', 'address', 'website'];

        // Admin can update more
        if (req.user.role === 'admin') {
            allowedUpdates.push('name', 'status', 'plan', 'settings', 'subscription');
        }

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const updatedCustomer = customerService.update(id, updates);

        logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'customer', String(id), {
            customerName: updatedCustomer.name
        });

        res.json({
            success: true,
            data: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update customer'
        });
    }
}

/**
 * Delete customer
 */
async function deleteCustomer(req, res) {
    try {
        const { id } = req.params;

        // Only admin can delete customers
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin only.'
            });
        }

        const customer = customerService.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        const success = customerService.delete(id);

        if (success) {
            logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'customer', String(id), {
                customerName: customer.name
            });

            res.json({
                success: true,
                message: 'Customer deleted successfully'
            });
        } else {
            throw new Error('Delete operation failed');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete customer'
        });
    }
}

/**
 * Get customer statistics
 */
async function getCustomerStats(req, res) {
    try {
        const { id } = req.params;

        // Users can only see their own customer stats
        if (req.user.role !== 'admin' && req.user.customerId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Get transformer and user counts from SQLite
        const customerTransformers = transformerService.findAll().filter(t => t.customerId === id);
        const allUsers = userService.findAll();
        const customerUsers = allUsers.filter(u => u.customerId === id);

        const stats = {
            totalTransformers: customerTransformers.length,
            totalUsers: customerUsers.length,
            activeTransformers: customerTransformers.filter(t => t.stage !== 'completed').length,
            completedTransformers: customerTransformers.filter(t => t.stage === 'completed').length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting customer stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve customer statistics'
        });
    }
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats
};
