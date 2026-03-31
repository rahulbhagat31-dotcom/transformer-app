const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, checkPermission } = require('../middlewares/auth');
const { successResponse, errorResponse } = require('../utils/response');
const { upload, uploadDir } = require('../utils/fileUpload');
const { logAudit } = require('../utils/audit');
const documentService = require('../services/document.service');

const router = express.Router();

// All document routes require authentication
router.use(authenticate);

/**
 * POST /api/document/upload
 */
router.post('/upload', checkPermission('quality'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(errorResponse('No file uploaded'));
        }

        const { wo, type, customerId } = req.body;
        if (!wo) {
            return res.status(400).json(errorResponse('Work order (wo) is required'));
        }

        const newDoc = documentService.create({
            wo,
            type: type || 'general',
            customerId: customerId || req.user.customerId || null,
            filename: req.file.originalname,
            filepath: req.file.path,
            uploadedBy: req.user.id,
            uploadedAt: new Date().toISOString()
        });

        logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'document', String(newDoc.id), {
            wo,
            type: newDoc.type,
            filename: req.file.originalname
        });

        res.json(successResponse(newDoc, 'Document uploaded successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/document/:wo
 */
router.get('/:wo', (req, res) => {
    try {
        let docs = documentService.findByWO(req.params.wo);

        // Customers only see their own documents
        if (req.user.role === 'customer') {
            docs = docs.filter(d => d.customerId === req.user.customerId);
        }

        // Optional type filter
        if (req.query.type) {
            docs = docs.filter(d => d.type === req.query.type);
        }

        res.json(successResponse(docs, 'Documents loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/document/download/:filename
 * Must be before /:wo to avoid route conflict — note: registered as /download/:filename
 */
router.get('/download/:filename', (req, res) => {
    try {
        const safeName = path.basename(req.params.filename);
        const filepath = path.resolve(uploadDir, safeName);

        // Prevent path traversal attacks
        if (!filepath.startsWith(path.resolve(uploadDir))) {
            return res.status(400).json(errorResponse('Invalid filename'));
        }

        if (fs.existsSync(filepath)) {
            res.download(filepath);
        } else {
            res.status(404).json(errorResponse('File not found'));
        }
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * DELETE /api/document/:id
 */
router.delete('/:id', checkPermission('admin'), (req, res) => {
    try {
        const doc = documentService.findById(parseInt(req.params.id));
        if (!doc) {
            return res.status(404).json(errorResponse('Document not found'));
        }

        // Delete physical file if it exists
        if (doc.filepath && fs.existsSync(doc.filepath)) {
            fs.unlinkSync(doc.filepath);
        }

        documentService.remove(parseInt(req.params.id));

        logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'document', String(doc.id), {
            filename: doc.filename,
            wo: doc.wo,
            type: doc.type
        });

        res.json(successResponse(null, 'Document deleted successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

module.exports = router;
