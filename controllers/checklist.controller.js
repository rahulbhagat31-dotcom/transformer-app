const checklistService = require('../services/checklist.service');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../utils/audit');
const { canAccessStage } = require('../utils/stageControl');

/**
 * Get checklist items for a stage and work order
 * GET /checklist/:stage/:wo
 */
exports.getChecklist = (req, res) => {
    try {
        const { stage, wo } = req.params;

        const access = canAccessStage(wo, stage);
        if (!access.allowed) {
            return res.status(403).json(errorResponse(access.reason, 'ACCESS_DENIED', { locked: true }));
        }

        const checklist = checklistService.getChecklist(wo, stage);
        if (!checklist) {
            return res.json(successResponse({ wo, stage, items: [], locked: false }, 'Checklist loaded (empty)'));
        }

        res.json(successResponse(checklist, 'Checklist loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Save/update checklist item (Tier 1 — Technician auto-sign)
 * POST /checklist/save
 */
exports.saveItem = (req, res) => {
    try {
        const { wo, stage, itemNumber, rowId, actualValue, updatedAt, technician } = req.body;

        const access = canAccessStage(wo, stage);
        if (!access.allowed) {
            return res.status(403).json(errorResponse(access.reason));
        }

        const existing = checklistService.getChecklist(wo, stage);

        if (existing && existing.locked) {
            return res.status(403).json(errorResponse('Checklist is locked and immutable. Contact admin to reopen.'));
        }

        const items = existing ? [...(existing.items || [])] : [];
        const existingItemIndex = items.findIndex(i => i.rowId === rowId);

        const now = new Date().toISOString();

        const newItem = {
            rowId,
            itemNumber,
            actualValue: actualValue || '',
            technician: technician || req.user.username,
            updatedAt: now,
            updatedBy: req.user.id,
            // ── Tier 1: Technician sign-off (auto on save) ──
            techSignedOff: true,
            techSignedOffBy: req.user.username,
            techSignedOffAt: now,
            // ── Tier 2 & 3 preserved or initialized ──
            supervisorSignedOff: false,
            supervisorSignedOffBy: null,
            supervisorSignedOffAt: null,
            supervisorNotes: null,
            qaSignedOff: false,
            qaSignedOffBy: null,
            qaSignedOffAt: null,
            qaStatus: null,
            qaNotes: null
        };

        // Concurrency check
        if (existingItemIndex !== -1 && updatedAt && items[existingItemIndex].updatedAt &&
            updatedAt !== items[existingItemIndex].updatedAt) {
            return res.status(409).json(errorResponse(
                'Item was modified by another user. Please refresh.',
                'CONCURRENCY_ERROR',
                { current: items[existingItemIndex] }
            ));
        }

        if (existingItemIndex !== -1) {
            const prev = items[existingItemIndex];
            // Once supervisor or QA signed off, technician cannot re-edit
            if (prev.supervisorSignedOff || prev.qaSignedOff) {
                return res.status(403).json(errorResponse('Item has a supervisor/QA sign-off and cannot be re-edited.'));
            }
            items[existingItemIndex] = { ...prev, ...newItem };
        } else {
            items.push({ ...newItem, createdAt: now });
        }

        const savedChecklist = checklistService.saveChecklist(wo, stage, items, {
            completedBy: req.user.username
        });

        logAudit(req.user.id, req.user.username, req.user.role,
            existingItemIndex !== -1 ? 'UPDATE' : 'CREATE',
            'checklist', rowId, { wo, stage, actualValue, tier: 'TECHNICIAN' });

        res.json(successResponse(savedChecklist, 'Item saved — Technician sign-off recorded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Supervisor sign-off on a checklist item (Tier 2)
 * POST /checklist/row/:itemId/supervisor-signoff
 */
exports.supervisorSignOff = (req, res) => {
    try {
        const { itemId } = req.params;
        const { status, notes, wo, stage } = req.body;

        if (!wo || !stage) {
            return res.status(400).json(errorResponse('wo and stage are required'));
        }

        const checklist = checklistService.getChecklist(wo, stage);
        if (!checklist) {
            return res.status(404).json(errorResponse('Checklist not found'));
        }

        const items = [...(checklist.items || [])];
        const itemIndex = items.findIndex(i => i.rowId === itemId);
        if (itemIndex === -1) {
            return res.status(404).json(errorResponse('Item not found'));
        }

        const item = items[itemIndex];

        // Gate: technician must have signed off first
        if (!item.techSignedOff) {
            return res.status(409).json(errorResponse(
                'Technician must complete sign-off before supervisor can sign.',
                'TIER_ORDER_VIOLATION'
            ));
        }

        if (item.supervisorSignedOff) {
            return res.status(409).json(errorResponse('Item already has supervisor sign-off'));
        }

        const now = new Date().toISOString();
        items[itemIndex] = {
            ...item,
            supervisorSignedOff: true,
            supervisorSignedOffBy: req.user.username,
            supervisorSignedOffAt: now,
            supervisorStatus: status || 'approved',
            supervisorNotes: notes || null
        };

        const savedChecklist = checklistService.saveChecklist(wo, stage, items, {
            completedBy: checklist.completedBy
        });

        // Check if ALL items now have supervisor sign-off → mark checklist-level
        const allSupervisorDone = items.every(i => i.supervisorSignedOff);
        if (allSupervisorDone) {
            checklistService.markSupervisorApproved(wo, stage, req.user.username);
        }

        logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId, {
            action: 'SUPERVISOR_SIGN_OFF', status, notes, wo, stage
        });

        res.json(successResponse(savedChecklist, 'Supervisor sign-off recorded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * QA sign-off checklist item (Tier 3)
 * POST /checklist/row/:itemId/signoff
 */
exports.signOffItem = (req, res) => {
    try {
        const { itemId } = req.params;
        const { status, notes, wo, stage } = req.body;

        if (!wo || !stage) {
            return res.status(400).json(errorResponse('wo and stage are required in request body'));
        }

        const checklist = checklistService.getChecklist(wo, stage);
        if (!checklist) {
            return res.status(404).json(errorResponse('Checklist not found'));
        }

        const items = [...(checklist.items || [])];
        const itemIndex = items.findIndex(i => i.rowId === itemId);
        if (itemIndex === -1) {
            return res.status(404).json(errorResponse('Item not found'));
        }

        const item = items[itemIndex];

        // Gate: supervisor must have signed off first
        if (!item.supervisorSignedOff) {
            return res.status(409).json(errorResponse(
                'Supervisor must complete sign-off before QA can sign.',
                'TIER_ORDER_VIOLATION'
            ));
        }

        if (item.qaSignedOff) {
            return res.status(409).json(errorResponse('Item already QA signed-off'));
        }

        const now = new Date().toISOString();
        items[itemIndex] = {
            ...item,
            // Backward-compat fields
            signedOff: true,
            signOffStatus: status,
            signedOffBy: req.user.username,
            signedOffAt: now,
            signOffNotes: notes || null,
            // Tier 3 fields
            qaSignedOff: true,
            qaSignedOffBy: req.user.username,
            qaSignedOffAt: now,
            qaStatus: status,
            qaNotes: notes || null
        };

        const savedChecklist = checklistService.saveChecklist(wo, stage, items, {
            completedBy: checklist.completedBy
        });

        logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId, {
            action: 'QA_SIGN_OFF', status, notes, wo, stage
        });

        res.json(successResponse(savedChecklist, 'QA sign-off recorded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Lock/Unlock checklist row (Admin only)
 * POST /checklist/row/:itemId/lock|unlock
 */
exports.toggleLock = (req, res) => {
    try {
        const { itemId } = req.params;
        const { reason, lock, wo, stage } = req.body;

        if (!wo || !stage) {
            return res.status(400).json(errorResponse('wo and stage are required in request body'));
        }

        const checklist = checklistService.getChecklist(wo, stage);
        if (!checklist) {
            return res.status(404).json(errorResponse('Checklist not found'));
        }

        const items = [...(checklist.items || [])];
        const itemIndex = items.findIndex(i => i.rowId === itemId);
        if (itemIndex === -1) {
            return res.status(404).json(errorResponse('Item not found'));
        }

        items[itemIndex] = {
            ...items[itemIndex],
            locked: lock,
            [lock ? 'lockedBy' : 'unlockedBy']: req.user.username,
            [lock ? 'lockedAt' : 'unlockedAt']: new Date().toISOString(),
            [lock ? 'lockReason' : 'unlockReason']: reason
        };

        const savedChecklist = checklistService.saveChecklist(wo, stage, items);

        logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist', itemId, {
            action: lock ? 'LOCK_ROW' : 'UNLOCK_ROW', reason, wo, stage
        });

        res.json(successResponse(savedChecklist, `Row ${lock ? 'locked' : 'unlocked'} successfully`));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Get pending QA items
 * GET /checklist/pending-qa
 */
exports.getPendingQA = (req, res) => {
    try {
        const db = require('../config/database');
        const rows = db.prepare('SELECT * FROM checklists').all();

        const pendingItems = [];
        rows.forEach(row => {
            const items = row.items ? JSON.parse(row.items) : [];
            items.forEach(item => {
                if (item.supervisorSignedOff && !item.qaSignedOff) {
                    pendingItems.push({ ...item, wo: row.wo, stage: row.stage });
                }
            });
        });

        res.json(successResponse(pendingItems, 'Pending QA items loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Get pending Supervisor items
 * GET /checklist/pending-supervisor
 */
exports.getPendingSupervisor = (req, res) => {
    try {
        const db = require('../config/database');
        const rows = db.prepare('SELECT * FROM checklists').all();

        const pendingItems = [];
        rows.forEach(row => {
            const items = row.items ? JSON.parse(row.items) : [];
            items.forEach(item => {
                if (item.techSignedOff && !item.supervisorSignedOff) {
                    pendingItems.push({ ...item, wo: row.wo, stage: row.stage });
                }
            });
        });

        res.json(successResponse(pendingItems, 'Pending supervisor items loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Get sign-off summary for a checklist
 * GET /checklist/:stage/:wo/summary
 */
exports.getChecklistSummary = (req, res) => {
    try {
        const { stage, wo } = req.params;
        const summary = checklistService.getChecklistSummary(wo, stage);
        res.json(successResponse(summary, 'Summary loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Clear stage checklist (admin only)
 * DELETE /checklist/clear/:stage/:wo
 */
exports.clearStage = (req, res) => {
    try {
        const { stage, wo } = req.params;
        const deleted = checklistService.clearChecklist(wo, stage);

        logAudit(req.user.id, req.user.username, req.user.role, 'DELETE', 'checklist', `${stage}-${wo}`, {
            action: 'CLEAR_STAGE'
        });

        res.json(successResponse(null, deleted ? `Stage ${stage} checklist cleared` : 'Nothing to clear'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Get all checklists (admin/quality)
 * GET /checklist/all
 */
exports.getAllChecklists = (req, res) => {
    try {
        const db = require('../config/database');
        const rows = db.prepare('SELECT * FROM checklists ORDER BY lastUpdated DESC').all();
        const checklists = rows.map(r => ({
            ...r,
            items: r.items ? JSON.parse(r.items) : []
        }));
        res.json(successResponse(checklists, 'All checklists loaded'));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Save production work completion
 * POST /checklist/production/save
 */
exports.saveProductionWork = (req, res) => {
    try {
        const { wo, stage, itemNumber, rowId, productionNotes, shift, timestamp } = req.body;

        const access = canAccessStage(wo, stage);
        if (!access.allowed) {
            return res.status(403).json(errorResponse(access.reason));
        }

        const existing = checklistService.getChecklist(wo, stage);
        const items = existing ? [...(existing.items || [])] : [];

        const itemIndex = items.findIndex(i => i.rowId === rowId);
        const productionData = {
            productionStatus: 'completed',
            productionEngineer: req.user?.username || 'Unknown',
            productionNotes: productionNotes || '',
            productionShift: shift || 'Morning',
            productionTimestamp: timestamp || new Date().toISOString(),
            productionUserId: req.user?.id || 'unknown'
        };

        if (itemIndex !== -1) {
            items[itemIndex] = { ...items[itemIndex], ...productionData };
        } else {
            items.push({ rowId, itemNumber, wo, stage, ...productionData, createdAt: new Date().toISOString() });
        }

        const savedChecklist = checklistService.saveChecklist(wo, stage, items, {
            completedBy: req.user.username
        });

        logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE', 'checklist',
            `${stage}-${itemNumber}-${wo}`, productionData);

        res.json(successResponse(savedChecklist, `Production work completed for Item ${itemNumber}`));
    } catch (error) {
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Export checklist as PDF (3-tier sign-off report)
 * GET /checklist/:stage/:wo/pdf
 */
exports.exportChecklistPDF = (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const { stage, wo } = req.params;

        const checklist = checklistService.getChecklist(wo, stage);
        if (!checklist) {
            return res.status(404).json(errorResponse('Checklist not found'));
        }

        const items = checklist.items || [];
        const summary = checklistService.getChecklistSummary(wo, stage);

        const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="checklist-${wo}-${stage}.pdf"`);
        doc.pipe(res);

        // ── HEADER ─────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 70).fill('#1a3a5c');
        doc.fillColor('white')
            .font('Helvetica-Bold').fontSize(18)
            .text('TRANSFORMER MANUFACTURING SYSTEM', 36, 14);
        doc.font('Helvetica').fontSize(11)
            .text(`3-Tier Quality Checklist  •  Stage: ${stage.toUpperCase()}  •  W.O.: ${wo}`, 36, 38);
        doc.fillColor('white').fontSize(9)
            .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 36, 54);

        doc.fillColor('black').moveDown(3);

        // ── SUMMARY BADGES ─────────────────────────────────────
        const startY = 85;
        const badges = [
            { label: 'Total Items', value: summary.total, color: '#2c3e50' },
            { label: '✅ Tech Signed', value: summary.techDone, color: '#27ae60' },
            { label: '✅ Supervisor Signed', value: summary.supervisorDone, color: '#2980b9' },
            { label: '✅ QA Signed', value: summary.qaDone, color: '#8e44ad' }
        ];
        const badgeW = 160, badgeH = 42, badgeGap = 16;
        badges.forEach((b, i) => {
            const bx = 36 + i * (badgeW + badgeGap);
            doc.rect(bx, startY, badgeW, badgeH).fill(b.color);
            doc.fillColor('white').font('Helvetica-Bold').fontSize(20)
                .text(String(b.value), bx, startY + 4, { width: badgeW, align: 'center' });
            doc.font('Helvetica').fontSize(8)
                .text(b.label, bx, startY + 26, { width: badgeW, align: 'center' });
        });

        doc.fillColor('black').y = startY + badgeH + 16;

        // ── TABLE HEADER ───────────────────────────────────────
        const tableTop = startY + badgeH + 20;
        const colX = { num: 36, item: 60, actual: 210, tech: 330, sup: 455, qa: 575, status: 695 };
        const rowH = 28;
        const tableWidth = doc.page.width - 72;

        doc.rect(36, tableTop, tableWidth, rowH).fill('#1a3a5c');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
        doc.text('#', colX.num, tableTop + 9, { width: 20, align: 'center' });
        doc.text('Checklist Item / Description', colX.item, tableTop + 9, { width: 145 });
        doc.text('Actual Value', colX.actual, tableTop + 9, { width: 115 });
        doc.text('Technician', colX.tech, tableTop + 9, { width: 120 });
        doc.text('Supervisor', colX.sup, tableTop + 9, { width: 115 });
        doc.text('QA Sign-off', colX.qa, tableTop + 9, { width: 115 });
        doc.text('Status', colX.status, tableTop + 9, { width: 80, align: 'center' });

        // ── TABLE ROWS ─────────────────────────────────────────
        let y = tableTop + rowH;
        const signText = (name, at) => {
            if (!name) {
                return '—';
            }
            const d = at ? new Date(at).toLocaleDateString('en-IN') : '';
            return `${name}\n${d}`;
        };

        items.forEach((item, idx) => {
            // Page break check
            if (y + rowH > doc.page.height - 80) {
                doc.addPage({ margin: 36, size: 'A4', layout: 'landscape' });
                y = 36;
                // Repeat header
                doc.rect(36, y, tableWidth, rowH).fill('#1a3a5c');
                doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
                doc.text('#', colX.num, y + 9, { width: 20, align: 'center' });
                doc.text('Checklist Item / Description', colX.item, y + 9, { width: 145 });
                doc.text('Actual Value', colX.actual, y + 9, { width: 115 });
                doc.text('Technician', colX.tech, y + 9, { width: 120 });
                doc.text('Supervisor', colX.sup, y + 9, { width: 115 });
                doc.text('QA Sign-off', colX.qa, y + 9, { width: 115 });
                doc.text('Status', colX.status, y + 9, { width: 80, align: 'center' });
                y += rowH;
            }

            const rowH2 = 36;
            const bg = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
            doc.rect(36, y, tableWidth, rowH2).fill(bg).stroke('#dee2e6');

            // Determine status
            let statusText = 'Pending';
            let statusColor = '#e74c3c';
            if (item.qaSignedOff) {
                statusText = item.qaStatus === 'rejected' ? 'Rejected' : 'QA Done'; statusColor = item.qaStatus === 'rejected' ? '#e67e22' : '#27ae60';
            } else if (item.supervisorSignedOff) {
                statusText = 'Sup Done'; statusColor = '#2980b9';
            } else if (item.techSignedOff) {
                statusText = 'Tech Done'; statusColor = '#f39c12';
            }

            doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(8)
                .text(String(item.itemNumber || idx + 1), colX.num, y + 6, { width: 20, align: 'center' });

            doc.font('Helvetica').fontSize(7)
                .text(item.rowId || `Item ${item.itemNumber}`, colX.item, y + 6, { width: 145, lineBreak: false })
                .text(item.actualValue || '—', colX.actual, y + 6, { width: 115 });

            // Tech column
            doc.fillColor(item.techSignedOff ? '#27ae60' : '#95a5a6').fontSize(7)
                .text(signText(item.techSignedOffBy, item.techSignedOffAt), colX.tech, y + 4, { width: 120 });

            // Supervisor column
            doc.fillColor(item.supervisorSignedOff ? '#2980b9' : '#95a5a6').fontSize(7)
                .text(signText(item.supervisorSignedOffBy, item.supervisorSignedOffAt), colX.sup, y + 4, { width: 115 });

            // QA column
            doc.fillColor(item.qaSignedOff ? (item.qaStatus === 'rejected' ? '#e74c3c' : '#8e44ad') : '#95a5a6').fontSize(7)
                .text(signText(item.qaSignedOffBy, item.qaSignedOffAt), colX.qa, y + 4, { width: 115 });

            // Status pill
            doc.roundedRect(colX.status, y + 6, 80, 18, 4).fill(statusColor);
            doc.fillColor('white').font('Helvetica-Bold').fontSize(7)
                .text(statusText, colX.status, y + 11, { width: 80, align: 'center' });

            y += rowH2;
        });

        // ── SIGNATURE BLOCK ────────────────────────────────────
        if (y + 100 > doc.page.height - 36) {
            doc.addPage({ margin: 36, size: 'A4', layout: 'landscape' });
            y = 36;
        }

        y += 30;
        doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(10)
            .text('OFFICIAL SIGN-OFF BLOCK', 36, y);
        y += 18;

        const sigW = (doc.page.width - 72 - 40) / 3;
        const sigBoxes = [
            { label: 'TECHNICIAN / OPERATOR', role: 'Technology Department' },
            { label: 'PRODUCTION SUPERVISOR', role: 'Production & Quality Dept.' },
            { label: 'QA ENGINEER', role: 'Quality Assurance Department' }
        ];

        sigBoxes.forEach((s, i) => {
            const bx = 36 + i * (sigW + 20);
            doc.rect(bx, y, sigW, 80).stroke('#2c3e50');
            doc.fillColor('#1a3a5c').font('Helvetica-Bold').fontSize(8)
                .text(s.label, bx + 8, y + 8, { width: sigW - 16 });
            doc.fillColor('#666').font('Helvetica').fontSize(7)
                .text(s.role, bx + 8, y + 22, { width: sigW - 16 });
            doc.fillColor('#999').fontSize(7)
                .text('Name: ________________________', bx + 8, y + 40)
                .text('Signature: ___________________', bx + 8, y + 54)
                .text('Date: _______________________', bx + 8, y + 68);
        });

        // ── FOOTER ─────────────────────────────────────────────
        const footerY = doc.page.height - 30;
        doc.rect(0, footerY - 6, doc.page.width, 36).fill('#f8f9fa');
        doc.fillColor('#666').font('Helvetica').fontSize(7)
            .text(`W.O.: ${wo}  |  Stage: ${stage}  |  Tech: ${summary.techDone}/${summary.total}  |  Supervisor: ${summary.supervisorDone}/${summary.total}  |  QA: ${summary.qaDone}/${summary.total}  |  Printed: ${new Date().toLocaleString('en-IN')}`,
                36, footerY, { width: doc.page.width - 72, align: 'center' });

        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'PDF generation failed: ' + error.message });
        }
    }
};
