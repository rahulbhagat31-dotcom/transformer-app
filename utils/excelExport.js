const ExcelJS = require('exceljs');
const logger = require('./logger');

/**
 * Export checklist to Excel
 * @param {Array} items - Checklist items
 * @param {string} wo - Work order number
 * @param {string} stage - Stage name
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportChecklistToExcel(items, wo, stage) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Checklist');

        // Set worksheet properties
        worksheet.properties.defaultRowHeight = 20;

        // Define columns
        worksheet.columns = [
            { header: 'SR.NO', key: 'srNo', width: 8 },
            { header: 'Inspection Point', key: 'inspectionPoint', width: 50 },
            { header: 'Standard Value', key: 'standardValue', width: 25 },
            { header: 'Actual Value', key: 'actualValue', width: 25 },
            { header: 'Remark', key: 'remark', width: 35 },
            { header: 'Technician', key: 'technician', width: 20 },
            { header: 'Shop Supervisor', key: 'shopSupervisor', width: 20 },
            { header: 'Quality Supervisor', key: 'qualitySupervisor', width: 20 },
            { header: 'Status', key: 'status', width: 12 }
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Add title row
        worksheet.insertRow(1, [`Checklist - ${stage.toUpperCase()} - WO: ${wo}`]);
        worksheet.mergeCells('A1:I1');
        const titleRow = worksheet.getRow(1);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.height = 30;
        titleRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE7E6E6' }
        };

        // Add data rows
        items.forEach((item, index) => {
            const row = worksheet.addRow({
                srNo: item.srNo || index + 1,
                inspectionPoint: item.inspectionPoint || '',
                standardValue: item.standardValue || '',
                actualValue: item.actualValue || '',
                remark: item.remark || '',
                technician: item.technician || '',
                shopSupervisor: item.shopSupervisor || '',
                qualitySupervisor: item.qualitySupervisor || '',
                status: item.locked ? 'Locked' : 'Open'
            });

            // Alternate row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }
                };
            }

            // Highlight locked rows
            if (item.locked) {
                row.getCell('status').fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFC7CE' }
                };
                row.getCell('status').font = { bold: true, color: { argb: 'FF9C0006' } };
            }

            // Wrap text for long cells
            row.getCell('inspectionPoint').alignment = { wrapText: true, vertical: 'top' };
            row.getCell('remark').alignment = { wrapText: true, vertical: 'top' };
        });

        // Add borders to all cells
        worksheet.eachRow((row, _rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        logger.info('Excel export created', { wo, stage, items: items.length });
        return buffer;
    } catch (error) {
        logger.logError(error, { context: 'exportChecklistToExcel', wo, stage });
        throw error;
    }
}

/**
 * Export all transformers to Excel
 * @param {Array} transformers - Transformer list
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportTransformersToExcel(transformers) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transformers');

        // Define columns
        worksheet.columns = [
            { header: 'WO Number', key: 'woNumber', width: 15 },
            { header: 'Customer', key: 'customer', width: 25 },
            { header: 'Rating (kVA)', key: 'rating', width: 15 },
            { header: 'Voltage', key: 'voltage', width: 20 },
            { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Progress', key: 'progress', width: 12 }
        ];

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Add data
        transformers.forEach((t, index) => {
            const row = worksheet.addRow({
                woNumber: t.woNumber,
                customer: t.customerId,
                rating: t.rating,
                voltage: t.voltage,
                deliveryDate: t.deliveryDate ? new Date(t.deliveryDate).toLocaleDateString() : '',
                status: t.status || 'Pending',
                progress: t.progress ? `${t.progress}%` : '0%'
            });

            // Alternate colors
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }
                };
            }
        });

        // Add borders
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        logger.info('Transformers Excel export created', { count: transformers.length });
        return buffer;
    } catch (error) {
        logger.logError(error, { context: 'exportTransformersToExcel' });
        throw error;
    }
}

/**
 * Export audit logs to Excel
 * @param {Array} logs - Audit log entries
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportAuditLogsToExcel(logs) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Audit Logs');

        worksheet.columns = [
            { header: 'Timestamp', key: 'timestamp', width: 20 },
            { header: 'User', key: 'user', width: 15 },
            { header: 'Role', key: 'role', width: 12 },
            { header: 'Action', key: 'action', width: 20 },
            { header: 'Entity', key: 'entity', width: 15 },
            { header: 'Entity ID', key: 'entityId', width: 15 },
            { header: 'Details', key: 'details', width: 40 }
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
        logs.forEach((log, index) => {
            const row = worksheet.addRow({
                timestamp: new Date(log.timestamp).toLocaleString(),
                user: log.userId,
                role: log.userRole,
                action: log.action,
                entity: log.entity,
                entityId: log.entityId,
                details: JSON.stringify(log.details)
            });

            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }
                };
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        logger.info('Audit logs Excel export created', { count: logs.length });
        return buffer;
    } catch (error) {
        logger.logError(error, { context: 'exportAuditLogsToExcel' });
        throw error;
    }
}

module.exports = {
    exportChecklistToExcel,
    exportTransformersToExcel,
    exportAuditLogsToExcel
};
