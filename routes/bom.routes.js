const express = require('express');
const fs = require('fs');
const { authenticate, checkPermission } = require('../middlewares/auth');
const { successResponse, errorResponse } = require('../utils/response');
const { upload } = require('../utils/fileUpload');
const { logAudit } = require('../utils/audit');
const bomService = require('../services/bom.service');

const router = express.Router();

// All BOM routes require authentication
router.use(authenticate);

/**
 * POST /api/bom/upload
 */
router.post('/upload', checkPermission('quality'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(errorResponse('No file uploaded'));
        }

        const { wo, customerId } = req.body;
        if (!wo) {
            return res.status(400).json(errorResponse('Work order (wo) is required'));
        }

        const newBOM = bomService.create({
            wo,
            customerId: customerId || req.user.customerId || null,
            filename: req.file.originalname,
            filepath: req.file.path,
            uploadedBy: req.user.id,
            uploadedAt: new Date().toISOString()
        });

        logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'bom', String(newBOM.id), {
            wo,
            filename: req.file.originalname
        });

        res.json(successResponse(newBOM, 'BOM uploaded successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/bom/:wo
 */
router.get('/:wo', (req, res) => {
    try {
        let boms = bomService.findByWO(req.params.wo);

        // Customers only see their own BOMs
        if (req.user.role === 'customer') {
            boms = boms.filter(b => b.customerId === req.user.customerId);
        }

        res.json(successResponse(boms, 'BOMs loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * DELETE /api/bom/:id
 */
router.delete('/:id', checkPermission('admin'), (req, res) => {
    try {
        const bom = bomService.findById(parseInt(req.params.id));
        if (!bom) {
            return res.status(404).json(errorResponse('BOM not found'));
        }

        // Delete physical file if it exists
        if (bom.filepath && fs.existsSync(bom.filepath)) {
            fs.unlinkSync(bom.filepath);
        }

        bomService.remove(parseInt(req.params.id));

        logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'bom', String(bom.id), {
            filename: bom.filename,
            wo: bom.wo
        });

        res.json(successResponse(null, 'BOM deleted successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

module.exports = router;
