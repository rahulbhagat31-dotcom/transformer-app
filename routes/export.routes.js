const express = require('express');
const router = express.Router();
const { exportChecklistToExcel, exportTransformersToExcel, exportAuditLogsToExcel } = require('../utils/excelExport');
const logger = require('../utils/logger');
const transformerService = require('../services/transformer.service');
const checklistService = require('../services/checklist.service');
const auditService = require('../services/audit.service');
const { authenticate, checkPermission } = require('../middlewares/auth');

// All export routes require authentication
router.use(authenticate);

/**
 * Export checklist to Excel
 * GET /export/checklist/:stage/:wo
 */
router.get('/checklist/:stage/:wo', checkPermission('production'), async (req, res) => {
    try {
        const { stage, wo } = req.params;

        // Load checklist data from SQLite
        const checklist = checklistService.getChecklist(wo, stage);
        const items = checklist ? checklist.items : [];

        if (!items || items.length === 0) {
            return res.status(404).json({ success: false, message: 'No checklist items found' });
        }

        // Generate Excel
        const buffer = await exportChecklistToExcel(items.map(i => ({ ...i, wo, stage })), wo, stage);

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=checklist_${stage}_${wo.replace(/\//g, '-')}.xlsx`);
        res.send(buffer);

        logger.info('Checklist exported', { stage, wo, user: req.user?.userId });
    } catch (error) {
        logger.logError(error, { context: 'exportChecklist', params: req.params });
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
});

/**
 * Export all transformers to Excel
 * GET /export/transformers
 */
router.get('/transformers', checkPermission('production'), async (req, res) => {
    try {
        // Load transformer data from SQLite
        const filters = {};
        if (req.user?.customerId && req.user.role !== 'admin') {
            filters.customerId = req.user.customerId;
        }
        const transformers = transformerService.findAll(filters);

        // Generate Excel
        const buffer = await exportTransformersToExcel(transformers);

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=transformers_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);

        logger.info('Transformers exported', { count: transformers.length, user: req.user?.userId });
    } catch (error) {
        logger.logError(error, { context: 'exportTransformers' });
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
});

/**
 * Export audit logs to Excel
 * GET /export/audit
 */
router.get('/audit', checkPermission('quality'), async (req, res) => {
    try {
        // Build filters
        const filters = { limit: 10000, offset: 0 };
        if (req.query.startDate || req.query.endDate) {
            filters.startDate = req.query.startDate;
            filters.endDate = req.query.endDate;
        }

        // Load audit logs from SQLite
        const { data: logs } = auditService.getLogs(filters);

        // Apply date range filter if provided (auditService doesn't have date filtering natively)
        let filteredLogs = logs;
        if (req.query.startDate || req.query.endDate) {
            const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            filteredLogs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= startDate && logDate <= endDate;
            });
        }

        // Generate Excel
        const buffer = await exportAuditLogsToExcel(filteredLogs);

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);

        logger.info('Audit logs exported', { count: filteredLogs.length, user: req.user?.userId });
    } catch (error) {
        logger.logError(error, { context: 'exportAuditLogs' });
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
});

/**
 * Export all checklists for a work order
 * GET /export/wo/:wo
 */
router.get('/wo/:wo', checkPermission('production'), async (req, res) => {
    try {
        const { wo } = req.params;
        const ExcelJS = require('exceljs');

        // Load checklist data from SQLite
        const allChecklists = checklistService.getChecklistsByWO(wo);

        if (!allChecklists || allChecklists.length === 0) {
            return res.status(404).json({ success: false, message: 'No checklist items found' });
        }

        // Create workbook with multiple sheets
        const workbook = new ExcelJS.Workbook();
        const stages = ['winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling', 'testing'];

        for (const stage of stages) {
            const stageChecklist = allChecklists.find(c => c.stage === stage);
            if (!stageChecklist || !stageChecklist.items || stageChecklist.items.length === 0) {
                continue;
            }

            const worksheet = workbook.addWorksheet(stage.toUpperCase());

            // Add columns
            worksheet.columns = [
                { header: 'SR.NO', key: 'srNo', width: 8 },
                { header: 'Row ID', key: 'rowId', width: 20 },
                { header: 'Actual Value', key: 'actualValue', width: 25 },
                { header: 'Technician', key: 'technician', width: 20 },
                { header: 'Updated At', key: 'updatedAt', width: 25 },
                { header: 'Status', key: 'status', width: 12 }
            ];

            // Style header
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };

            // Add data
            stageChecklist.items.forEach((item, idx) => {
                worksheet.addRow({
                    srNo: idx + 1,
                    rowId: item.rowId,
                    actualValue: item.actualValue || '',
                    technician: item.technician || '',
                    updatedAt: item.updatedAt || '',
                    status: stageChecklist.locked ? 'Locked' : 'Open'
                });
            });
        }

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=checklist_all_${wo.replace(/\//g, '-')}.xlsx`);
        res.send(buffer);

        logger.info('Full WO checklist exported', { wo, user: req.user?.userId });
    } catch (error) {
        logger.logError(error, { context: 'exportFullWO', params: req.params });
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
});

module.exports = router;
