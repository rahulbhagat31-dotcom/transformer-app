const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middlewares/auth');
const { successResponse, errorResponse } = require('../utils/response');

// All calculation routes require authentication
router.use(authenticate);

/**
 * POST /calculate/winding
 * Handles winding calculations on the server
 */
router.post('/winding', checkPermission('production'), (req, res) => {
    try {
        const { turns, volts } = req.body;

        if (!turns || !volts) {
            return res.status(400).json(errorResponse('Missing parameters'));
        }

        const voltsPerTurn = (volts / turns).toFixed(4);

        res.json(successResponse({
            voltsPerTurn: parseFloat(voltsPerTurn),
            timestamp: new Date().toISOString()
        }, 'Calculation successful'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

module.exports = router;