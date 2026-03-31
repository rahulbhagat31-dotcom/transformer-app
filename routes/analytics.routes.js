const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middlewares/auth');
const analyticsController = require('../controllers/analytics.controller');

// All analytics routes require authentication
router.use(authenticate);

// GET /analytics/stats
router.get('/stats', checkPermission('production'), analyticsController.getStats);

module.exports = router;
