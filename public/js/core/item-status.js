/**
 * ================================================
 * ITEM STATUS BADGE SYSTEM
 * Single source of truth for all 5 item states.
 * Used by: checklist rows, stage cards, activity feed.
 *
 * States: draft | pending | verified | approved | rejected
 * ================================================
 */

/* ── State derivation ──────────────────────────────────────── */

/**
 * Derive the current status of a checklist item from its data fields.
 * No extra DB field needed — computed from existing sign-off flags.
 *
 * @param {Object} item - checklist item from API
 * @returns {'draft'|'pending'|'verified'|'approved'|'rejected'}
 */
function getItemStatus(item) {
    if (!item) return 'draft';

    // Explicit rejection flag (added when reject flow is built)
    if (item.qaRejected || item.status === 'rejected') return 'rejected';

    // QA has signed off → fully approved
    if (item.qaSignedOff) return 'approved';

    // Supervisor verified → waiting for QA
    if (item.supervisorSignedOff) return 'verified';

    // Tech signed off → waiting for supervisor
    if (item.techSignedOff) return 'pending';

    // Nothing done yet → draft
    return 'draft';
}

/* ── Badge HTML ────────────────────────────────────────────── */

const STATUS_LABELS = {
    draft: 'Draft',
    pending: 'Pending Review',
    verified: 'Verified',
    approved: 'Approved',
    rejected: 'Rejected'
};

/**
 * Render a status badge HTML string.
 * @param {'draft'|'pending'|'verified'|'approved'|'rejected'} status
 * @param {string} [id] - optional element id
 * @returns {string} HTML string
 */
function renderStatusBadge(status, id = '') {
    const s = STATUS_LABELS[status] ? status : 'draft';
    const idAttr = id ? ` id="${id}"` : '';
    return `<span${idAttr} class="item-status-badge item-status--${s}" data-status="${s}">${STATUS_LABELS[s]}</span>`;
}

/**
 * Render a small activity-line chip (even more compact than badge).
 * @param {'draft'|'pending'|'verified'|'approved'|'rejected'} status
 * @returns {string} HTML string
 */
function renderStatusChip(status) {
    const s = STATUS_LABELS[status] ? status : 'draft';
    return `<span class="activity-status-chip chip-${s}">${STATUS_LABELS[s]}</span>`;
}

/* ── Live update (in-place, animated) ─────────────────────── */

/**
 * Update the status badge on an already-rendered checklist row.
 * Animates the state transition: fade out → swap class → fade in.
 *
 * @param {string} rowId  - e.g. 'row_winding1_1'
 * @param {Object} item   - checklist item data from API
 */
function updateRowStatusBadge(rowId, item) {
    const badgeId = `status_${rowId}`;
    const badge = document.getElementById(badgeId);
    if (!badge) return;

    const newStatus = getItemStatus(item);
    const currentStatus = badge.getAttribute('data-status');

    // No change — skip animation
    if (currentStatus === newStatus) return;

    // Fade out
    badge.classList.add('status-updating');

    setTimeout(() => {
        // Swap state
        badge.className = `item-status-badge item-status--${newStatus} status-updated`;
        badge.setAttribute('data-status', newStatus);
        badge.textContent = STATUS_LABELS[newStatus];

        // Fade in (class triggers transition in CSS)
        requestAnimationFrame(() => {
            badge.classList.remove('status-updated');
            badge.classList.add('item-status-badge', `item-status--${newStatus}`);
        });
    }, 100);
}

/**
 * Force-set a badge status without animation (e.g. on initial render).
 * @param {string} rowId
 * @param {'draft'|'pending'|'verified'|'approved'|'rejected'} status
 */
function setRowStatusBadge(rowId, status) {
    const badge = document.getElementById(`status_${rowId}`);
    if (!badge) return;
    const s = STATUS_LABELS[status] ? status : 'draft';
    badge.className = `item-status-badge item-status--${s}`;
    badge.setAttribute('data-status', s);
    badge.textContent = STATUS_LABELS[s];
}

/* ── Stage aggregate counts ────────────────────────────────── */

/**
 * Count items per status across an array of checklist items.
 * @param {Object[]} items
 * @returns {{ draft:number, pending:number, verified:number, approved:number, rejected:number, total:number }}
 */
function getStatusCounts(items) {
    const counts = { draft: 0, pending: 0, verified: 0, approved: 0, rejected: 0, total: 0 };
    if (!Array.isArray(items)) return counts;
    items.forEach(item => {
        const s = getItemStatus(item);
        counts[s]++;
        counts.total++;
    });
    return counts;
}

/**
 * Render a row of aggregate status count pills for a stage card.
 * @param {Object[]} items
 * @returns {string} HTML string
 */
function renderStatusCountRow(items) {
    const c = getStatusCounts(items);
    const pills = [];

    if (c.draft > 0) pills.push(`<span class="count-pill pill-draft">⬜ ${c.draft} Draft</span>`);
    if (c.pending > 0) pills.push(`<span class="count-pill pill-pending">🕐 ${c.pending} Pending</span>`);
    if (c.verified > 0) pills.push(`<span class="count-pill pill-verified">🔵 ${c.verified} Verified</span>`);
    if (c.approved > 0) pills.push(`<span class="count-pill pill-approved">✅ ${c.approved} Approved</span>`);
    if (c.rejected > 0) pills.push(`<span class="count-pill pill-rejected">❌ ${c.rejected} Rejected</span>`);

    if (pills.length === 0) return '';
    return `<div class="stage-status-counts">${pills.join('')}</div>`;
}

/* ── Expose globally ───────────────────────────────────────── */
window.getItemStatus = getItemStatus;
window.renderStatusBadge = renderStatusBadge;
window.renderStatusChip = renderStatusChip;
window.updateRowStatusBadge = updateRowStatusBadge;
window.setRowStatusBadge = setRowStatusBadge;
window.getStatusCounts = getStatusCounts;
window.renderStatusCountRow = renderStatusCountRow;

console.log('✅ Item Status Badge System loaded');
