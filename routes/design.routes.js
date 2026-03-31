const express = require('express');
const { body } = require('express-validator');
const { authenticate, checkPermission } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const designRevisionService = require('../services/design-revision.service');
const db = require('../config/database');

const router = express.Router();

// Protect ALL design routes with JWT authentication
router.use(authenticate);

/**
 * POST /api/design/calculate
 * Validate calculation inputs (actual math is done client-side)
 */
router.post('/calculate', (req, res) => {
    try {
        const inputs = req.body;
        if (!inputs.mva || !inputs.hv || !inputs.lv) {
            return res.status(400).json(errorResponse('Missing required parameters: mva, hv, lv'));
        }
        res.json(successResponse({ message: 'Calculation endpoint ready', inputs }));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/design/stats/summary
 * Must be before /:wo to avoid route conflict
 */
router.get('/stats/summary', checkPermission('quality'), (req, res) => {
    try {
        const total = db.prepare('SELECT COUNT(*) as n FROM design_revisions').get().n;
        const frozen = db.prepare('SELECT COUNT(*) as n FROM design_revisions WHERE frozen = 1').get().n;
        const byWO = db.prepare(
            'SELECT wo, COUNT(*) as revisions FROM design_revisions GROUP BY wo ORDER BY revisions DESC LIMIT 10'
        ).all();

        res.json(successResponse({
            total,
            frozen,
            draft: total - frozen,
            byWO
        }, 'Design statistics loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /api/design/save
 */
router.post('/save', [
    body('designName').trim().notEmpty().withMessage('Design name required'),
    body('inputs').isObject().withMessage('Design inputs required'),
    body('results').isObject().withMessage('Design results required')
], handleValidationErrors, checkPermission('production'), (req, res) => {
    try {
        const wo = req.body.wo || null;
        const designData = {
            designName: req.body.designName,
            inputs: req.body.inputs,
            results: req.body.results,
            customerId: req.user.customerId || null,
            status: 'draft',
            createdAt: new Date().toISOString()
        };

        const saved = designRevisionService.createRevision(wo, designData, {
            createdBy: req.user.id || req.user.userId || 'system',
            notes: req.body.notes || null,
            validationStatus: req.body.validationStatus || 'PASS',
            validationErrors: req.body.validationErrors || null,
            validationWarnings: req.body.validationWarnings || null,
            warningsAcknowledgedBy: req.body.warningsAcknowledgedBy || null,
            warningsAcknowledgedAt: req.body.warningsAcknowledgedAt || null,
            calculatorVersion: req.body.calculatorVersion || '2.0.0',
            engineVersion: req.body.engineVersion || 'IEC-60076-2024'
        });

        logAudit(req.user.id, req.user.username, req.user.role, 'CREATE', 'design', `${wo}:${saved.revision}`, {
            designName: designData.designName,
            wo,
            revision: saved.revision,
            calculationHash: saved.calculationHash
        });

        res.json(successResponse(saved, 'Design saved successfully'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/design
 * List all revisions for a WO, or all designs for admin
 */
router.get('/', (req, res) => {
    try {
        if (req.query.wo) {
            const revisions = designRevisionService.getRevisions(req.query.wo);
            return res.json(successResponse(revisions, 'Revisions loaded'));
        }

        // Admin/quality: list all WOs with their latest revision
        const rows = db.prepare(`
            SELECT dr.*, MAX(dr.revision) as latestRevision
            FROM design_revisions dr
            GROUP BY dr.wo
            ORDER BY dr.createdAt DESC
        `).all();

        const designs = rows.map(row => ({
            ...row,
            designData: row.designData ? JSON.parse(row.designData) : {}
        }));

        res.json(successResponse(designs, 'Designs loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/design/:wo/revisions
 * Get all revisions for a specific WO
 */
router.get('/:wo/revisions', (req, res) => {
    try {
        const revisions = designRevisionService.getRevisions(req.params.wo);
        res.json(successResponse(revisions, 'Revisions loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/design/:wo/:revision
 * Get a specific revision
 */
router.get('/:wo/:revision', (req, res) => {
    try {
        const revision = designRevisionService.getRevision(req.params.wo, parseInt(req.params.revision));
        if (!revision) {
            return res.status(404).json(errorResponse('Design revision not found'));
        }

        if (req.user.role === 'customer' && revision.designData?.customerId !== req.user.customerId) {
            return res.status(403).json(errorResponse('Access denied'));
        }

        res.json(successResponse(revision, 'Design revision loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * GET /api/design/:wo/:revision/export-pdf
 * Real PDF export using pdfkit
 */
router.get('/:wo/:revision/export-pdf', (req, res) => {
    try {
        const revision = designRevisionService.getRevision(req.params.wo, parseInt(req.params.revision));
        if (!revision) {
            return res.status(404).json(errorResponse('Design revision not found'));
        }

        if (req.user.role === 'customer' && revision.designData?.customerId !== req.user.customerId) {
            return res.status(403).json(errorResponse('Access denied'));
        }

        let PDFDocument;
        try {
            PDFDocument = require('pdfkit');
        } catch {
            return res.json(successResponse({
                revision,
                exportedAt: new Date().toISOString(),
                exportedBy: req.user.id
            }, 'Design data ready for PDF export'));
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `design-${revision.wo}-rev${revision.revision}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        const d = revision.designData || {};
        const inputs = d.inputs || {};
        const results = d.results || {};

        // Header
        doc.fontSize(20).font('Helvetica-Bold')
            .text('Transformer Design Report', { align: 'center' });
        doc.fontSize(11).font('Helvetica')
            .text(`Design: ${d.designName || 'Unnamed'}  |  WO: ${revision.wo}  |  Rev: ${revision.revision}`, { align: 'center' })
            .text(`Generated: ${new Date().toLocaleString()}  |  Hash: ${revision.calculationHash?.slice(0, 16)}...`, { align: 'center' });

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Input Parameters
        doc.fontSize(13).font('Helvetica-Bold').text('Input Parameters');
        doc.moveDown(0.5);
        renderTable(doc, ['Parameter', 'Value'], [
            ['Rating (MVA)', inputs.mva || '—'],
            ['HV Voltage (kV)', inputs.hv || '—'],
            ['LV Voltage (kV)', inputs.lv || '—'],
            ['Frequency (Hz)', inputs.frequency || '50'],
            ['Cooling Type', inputs.cooling || 'ONAN'],
            ['Vector Group', inputs.vectorGroup || 'Dyn11'],
            ['Impedance (%)', inputs.impedance || '—'],
            ['Ambient Temp (°C)', inputs.ambientTemp || '40']
        ]);
        doc.moveDown(1);

        // Results
        doc.fontSize(13).font('Helvetica-Bold').text('Calculation Results');
        doc.moveDown(0.5);
        const losses = results.losses || {};
        const core = results.core || {};
        const winding = results.winding || {};
        renderTable(doc, ['Parameter', 'Value'], [
            ['Core Loss (W)', losses.coreLoss || '—'],
            ['Copper Loss (W)', losses.copperLoss || '—'],
            ['Total Loss (W)', losses.totalLoss || '—'],
            ['Efficiency (%)', losses.efficiency || '—'],
            ['Core Weight (kg)', core.weight || '—'],
            ['Core Diameter (mm)', core.diameter || '—'],
            ['HV Turns', winding.hvTurns || '—'],
            ['LV Turns', winding.lvTurns || '—'],
            ['Impedance (%)', results.impedance?.percent || '—']
        ]);
        doc.moveDown(1);

        // IEC Compliance
        doc.fontSize(13).font('Helvetica-Bold').text('IEC 60076 Compliance');
        doc.moveDown(0.5);
        const compliance = results.compliance || {};
        const compRows = Object.entries(compliance).map(([k, v]) => [k, v ? '✓ Pass' : '✗ Fail']);
        if (compRows.length > 0) {
            renderTable(doc, ['Check', 'Status'], compRows);
        } else {
            doc.fontSize(10).font('Helvetica').fillColor('#888').text('No compliance data available.');
            doc.fillColor('black');
        }

        // Validation status
        if (revision.validationStatus) {
            doc.moveDown(1);
            doc.fontSize(11).font('Helvetica-Bold')
                .text(`Validation: ${revision.validationStatus}  |  Engine: ${revision.engineVersion || 'IEC-60076-2024'}`);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(9).font('Helvetica').fillColor('#666')
            .text('Generated by Transformer Manufacturing System — Confidential', { align: 'center' });

        doc.end();

        logAudit(req.user.id, req.user.username, req.user.role, 'EXPORT_PDF', 'design',
            `${revision.wo}:${revision.revision}`, { designName: d.designName });

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json(errorResponse(error));
        }
    }
});

/**
 * GET /api/design/:wo/:revision/verify
 * Verify calculation hash integrity
 */
router.get('/:wo/:revision/verify', checkPermission('quality'), (req, res) => {
    try {
        const result = designRevisionService.verifyCalculationHash(
            req.params.wo,
            parseInt(req.params.revision)
        );
        res.json(successResponse(result, 'Hash verification complete'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

/**
 * POST /api/design/:wo/:revision/approve
 * Freeze a revision (QA approval)
 */
router.post('/:wo/:revision/approve', checkPermission('quality'), (req, res) => {
    try {
        const revision = designRevisionService.getRevision(req.params.wo, parseInt(req.params.revision));
        if (!revision) {
            return res.status(404).json(errorResponse('Design revision not found'));
        }

        // Freeze by updating the frozen flag
        db.prepare('UPDATE design_revisions SET frozen = 1 WHERE wo = ? AND revision = ? AND frozen = 0')
            .run(req.params.wo, parseInt(req.params.revision));

        logAudit(req.user.id, req.user.username, req.user.role, 'APPROVE', 'design',
            `${req.params.wo}:${req.params.revision}`, {
                designName: revision.designData?.designName,
                approvedAt: new Date().toISOString()
            });

        res.json(successResponse({ wo: req.params.wo, revision: parseInt(req.params.revision), frozen: true },
            'Design approved and frozen'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
});

// Helper: render a 2-column table in PDFKit
function renderTable(doc, headers, rows) {
    const colWidths = [280, 215];
    const rowHeight = 22;
    const startX = 50;
    let y = doc.y;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b');
    doc.rect(startX, y, colWidths[0] + colWidths[1], rowHeight).fill('#e2e8f0').stroke('#cbd5e1');
    doc.fillColor('#1e293b')
        .text(headers[0], startX + 6, y + 6, { width: colWidths[0] - 12 })
        .text(headers[1], startX + colWidths[0] + 6, y + 6, { width: colWidths[1] - 12 });
    y += rowHeight;

    doc.font('Helvetica').fontSize(10);
    rows.forEach((row, i) => {
        const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(startX, y, colWidths[0] + colWidths[1], rowHeight).fill(bg).stroke('#e2e8f0');
        doc.fillColor('#334155')
            .text(String(row[0]), startX + 6, y + 6, { width: colWidths[0] - 12 })
            .text(String(row[1]), startX + colWidths[0] + 6, y + 6, { width: colWidths[1] - 12 });
        y += rowHeight;
    });

    doc.y = y;
    doc.fillColor('black');
}

module.exports = router;
