/**
 * Route Aggregator
 * Centralizes all API routes for cleaner server.js
 */
const express = require('express');
const router = express.Router();

// Import all route modules
router.use('/auth', require('./auth.routes'));
router.use('/transformers', require('./transformer.routes'));
router.use('/calculations', require('./calculation.routes'));
router.use('/design', require('./design.routes'));
router.use('/checklist', require('./checklist.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/export', require('./export.routes'));
router.use('/bom', require('./bom.routes'));
// Keep both singular and plural mounts for backwards compatibility.
router.use('/document', require('./document.routes'));
router.use('/documents', require('./document.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/stage', require('./stage.routes'));
router.use('/customers', require('./customer.routes')); // Customer management
router.use('/exam', require('./exam.routes'));           // MCQ Exam System (SPA tab)
router.use('/questions', require('./questions.routes')); // MCQ Questions API
router.use('/users', require('./users.routes'));          // User Management (admin only)
router.use('/assignments', require('./assignment.routes')); // WO Assignment System (admin only)

module.exports = router;
