const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats
} = require('../controllers/customer.controller');

// All routes require authentication
router.use(authenticate);

// Customer routes
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/:id/stats', getCustomerStats);

module.exports = router;
