/* ================================================
   STATUS BADGE SYSTEM
   Week 1 of product maturity plan
   — Row-level status badges (Pending / Submitted / Verified / Approved / Rejected / Locked)
   — Stage-tab status badges (Pending / In Progress / Completed / Approved)
   — Save button label update (Submit Inspection)
   ================================================ */

/* ── Badge config ─────────────────────────────── */
const STATUS_CONFIG = {
    pending: { label: '⏳ Awaiting', cls: 'item-status--pending' },
    submitted: { label: '✅ Submitted', cls: 'item-status--verified' },
    verified: { label: '🔍 Verified', cls: 'item-status--verified' },
    approved: { label: '✔ Approved', cls: 'item-status--approved' },
    rejected: { label: '✗ Rejected', cls: 'item-status--rejected' },
    locked: { label: '🔒 Submitted', cls: 'item-status--approved' },
    draft: { label: '✏ Draft', cls: 'item-status--draft' }
};

const STAGE_STATUS_CONFIG = {
    pending: { label: '⏳ Pending', cls: 'stage-tab-pending' },
    'in-progress': { label: '🔵 In Progress', cls: 'stage-tab-inprogress' },
    awaiting_qa: { label: '📋 Awaiting QA', cls: 'stage-tab-awaiting' },
    completed: { label: '✅ Completed', cls: 'stage-tab-completed' },
    approved: { label: '✔ Approved', cls: 'stage-tab-approved' },
    rejected: { label: '✗ Rejected', cls: 'stage-tab-rejected' }
};

/* ── Derive status from item data ─────────────── */
function deriveItemStatus(item) {
    if (!item) return 'draft';
    if (item.status) return item.status; // explicit status field
    if (item.locked) return 'locked';
    if (item.actualValue || item.technician) return 'submitted';
    return 'pending';
}

/* ── Render / update a single row badge ──────── */
function renderRowStatusBadge(rowId, item) {
    const status = deriveItemStatus(item);
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

    // Find or create badge element
    let badge = document.getElementById(`status-badge-${rowId}`);
    if (!badge) {
        // Try to inject next to the save button, or at start of row header
        const row = document.getElementById(rowId);
        if (!row) return;

        badge = document.createElement('span');
        badge.id = `status-badge-${rowId}`;
        badge.className = `item-status-badge ${config.cls}`;
        badge.textContent = config.label;

        // Inject into the row — look for a .row-actions or .save-area div
        // Fallback: prepend to the row itself
        const actionsArea = row.querySelector('.row-actions, .btn-area, .save-area, td:last-child');
        if (actionsArea) {
            actionsArea.prepend(badge);
        } else {
            // Inject as first child of row
            row.prepend(badge);
        }
        return;
    }

    // Badge exists — animate status change
    if (badge.dataset.status === status) return; // no change

    badge.classList.add('status-updating');
    setTimeout(() => {
        badge.className = `item-status-badge ${config.cls}`;
        badge.textContent = config.label;
        badge.dataset.status = status;
        badge.classList.add('status-updated');
        setTimeout(() => badge.classList.remove('status-updated'), 200);
    }, 100);
}

/* ── Batch-update all rows for a stage ────────── */
function updateAllRowBadges(items) {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
        if (item.rowId) renderRowStatusBadge(item.rowId, item);
    });
}

/* ── Stage-tab badge ──────────────────────────── */
function updateStageTabBadge(stageKey, stageStatus) {
    // Stage buttons are rendered as .stage-btn elements
    // Match by onclick text or data-stage attribute
    const buttons = document.querySelectorAll('.stage-btn, .nav-subitem');
    buttons.forEach(btn => {
        const text = btn.textContent || '';
        const dataStage = btn.dataset.stage || '';
        const matchesStage =
            dataStage === stageKey ||
            text.toLowerCase().includes(stageKey.replace(/([A-Z])/g, ' $1').toLowerCase().trim());

        if (!matchesStage) return;

        // Remove existing stage status badge if any
        const existing = btn.querySelector('.stage-tab-badge');
        if (existing) existing.remove();

        const cfg = STAGE_STATUS_CONFIG[stageStatus] || STAGE_STATUS_CONFIG.pending;
        const badge = document.createElement('span');
        badge.className = 'stage-tab-badge';
        badge.textContent = cfg.label;
        badge.style.cssText = `
            display: inline-block;
            margin-left: 6px;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 3px;
            vertical-align: middle;
            letter-spacing: 0.04em;
        `;

        // Colour by status
        const colours = {
            pending: 'background:#f0f2f5; color:#5a6474;',
            'in-progress': 'background:#d5e8fb; color:#0d3d6b;',
            completed: 'background:#eafaf0; color:#1a4d2e;',
            approved: 'background:#27ae60; color:#fff;',
            rejected: 'background:#fdf3f3; color:#7b1d1d;'
        };
        badge.style.cssText += colours[stageStatus] || colours.pending;

        btn.appendChild(badge);
        btn.dataset.stageStatus = stageStatus;
    });
}

/* ── Update all stage tab badges from stageStatus API response ── */
function updateAllStageTabBadges(stageStatusData) {
    if (!stageStatusData) return;

    // stageStatusData is the object returned by GET /stage/:wo
    // shape: { winding: { status: 'completed', ... }, core: { status: 'pending', ... }, ... }
    Object.entries(stageStatusData).forEach(([stage, data]) => {
        const stageStatus = data.status || 'pending';
        updateStageTabBadge(stage, stageStatus);
    });
}

/* ── Update save button label → "Submit Inspection" ─ */
function updateSaveButtonLabel(rowId, item) {
    const btn = document.getElementById(`save_${rowId}`);
    if (!btn) return;

    if (item.locked && window.currentUserRole !== 'admin') {
        btn.innerHTML = '🔒 Locked';
        btn.disabled = true;
        btn.style.background = '#95a5a6';
    } else if (item.locked && window.currentUserRole === 'admin') {
        btn.innerHTML = '🔒 Update';
        btn.style.background = '#3498db';
        btn.disabled = false;
    } else {
        // WEEK 2 rename: Save → Submit Inspection
        btn.innerHTML = '✅ Submit';
        btn.style.background = '#27ae60';
        btn.disabled = false;
    }
}

/* ── Stage summary count pills ────────────────── */
function renderStageSummaryPills(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(items)) return;

    const counts = { pending: 0, submitted: 0, verified: 0, approved: 0, rejected: 0 };
    items.forEach(item => {
        const s = deriveItemStatus(item);
        if (s in counts) counts[s]++;
        else counts.pending++;
    });

    container.innerHTML = Object.entries(counts)
        .filter(([, n]) => n > 0)
        .map(([status, n]) => {
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
            return `<span class="count-pill pill-${status}">${cfg.label} <strong>${n}</strong></span>`;
        }).join('');
}

/* ── Exports ──────────────────────────────────── */
window.renderRowStatusBadge = renderRowStatusBadge;
window.updateAllRowBadges = updateAllRowBadges;
window.updateStageTabBadge = updateStageTabBadge;
window.updateAllStageTabBadges = updateAllStageTabBadges;
window.updateSaveButtonLabel = updateSaveButtonLabel;
window.renderStageSummaryPills = renderStageSummaryPills;
window.deriveItemStatus = deriveItemStatus;

console.log('✅ Status Badge System loaded');
