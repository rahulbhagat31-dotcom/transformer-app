/* ===============================
   📜 AUDIT LOG VIEWER
   Timeline renderer — color-coded by action
================================ */

/* Action type → CSS class + badge class + icon */
const AUDIT_ACTION_MAP = {
    'CREATE': { cls: 'act-create', badge: 'al-badge-create', icon: '✨' },
    'UPDATE': { cls: 'act-update', badge: 'al-badge-update', icon: '✏️' },
    'DELETE': { cls: 'act-delete', badge: 'al-badge-delete', icon: '🗑️' },
    'LOGIN': { cls: 'act-login', badge: 'al-badge-login', icon: '🔑' },
    'LOGOUT': { cls: 'act-logout', badge: 'al-badge-logout', icon: '🚪' },
    'STAGE_CHANGE': { cls: 'act-stage', badge: 'al-badge-stage', icon: '🔄' },
    'LOCK': { cls: 'act-lock', badge: 'al-badge-lock', icon: '🔒' },
    'UNLOCK': { cls: 'act-unlock', badge: 'al-badge-unlock', icon: '🔓' },
    'EXPORT': { cls: 'act-export', badge: 'al-badge-export', icon: '📥' }
};

function getActionMeta(action) {
    return AUDIT_ACTION_MAP[action?.toUpperCase()]
        || { cls: 'act-default', badge: 'al-badge-default', icon: '📋' };
}

/**
 * Load and display audit logs as a color-coded timeline.
 * @param {string} [containerId='auditResults'] - ID of the container element to render into.
 */
async function loadAuditLogs(containerId = 'auditResults') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading skeleton
    container.innerHTML = `
        <div class="al-timeline">
            ${[1, 2, 3, 4, 5].map(i => `
                <div class="al-entry" style="animation-delay:${i * 60}ms">
                    <div class="al-card" style="background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
                        background-size:200% 100%;animation:sk-shimmer 1.4s infinite;height:72px;border:none;">
                    </div>
                </div>`).join('')}
        </div>`;

    try {
        const response = await apiCall('/audit');
        const logs = response.data || response || [];

        // Read filter values
        const entityType = document.getElementById('auditEntity')?.value || '';
        const entityId = document.getElementById('auditEntityId')?.value?.trim() || '';
        const startDate = document.getElementById('auditStartDate')?.value || '';
        const endDate = document.getElementById('auditEndDate')?.value || '';

        // Filter
        let filtered = logs.filter(log => {
            if (entityType && log.entityType !== entityType) return false;
            if (entityId && !(log.entityId || '').toLowerCase().includes(entityId.toLowerCase())) return false;
            if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
            if (endDate && new Date(log.timestamp) > new Date(endDate + 'T23:59:59')) return false;
            return true;
        });

        // Sort newest first
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="al-empty">
                    <span class="al-empty-icon">🔍</span>
                    <h3>No results found</h3>
                    <p>Try adjusting your filters or date range.</p>
                </div>`;
            return;
        }

        // Group by day
        const groups = {};
        filtered.forEach(log => {
            const day = new Date(log.timestamp).toLocaleDateString('en-GB', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            });
            if (!groups[day]) groups[day] = [];
            groups[day].push(log);
        });

        let html = `
            <div class="al-count-bar">
                <span>📋 ${filtered.length} log${filtered.length !== 1 ? 's' : ''} found</span>
            </div>
            <div class="al-timeline">`;

        let entryIndex = 0;
        Object.entries(groups).forEach(([day, entries]) => {
            html += `<div class="al-day-header">${day}</div>`;
            entries.forEach(log => {
                const meta = getActionMeta(log.action);
                const time = new Date(log.timestamp).toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                const resource = log.entityId || log.resource || log.entity || '—';
                const user = log.username || log.userId || 'System';
                const role = log.role || '';
                const detail = log.details
                    ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 0))
                    : '';
                const safeDetail = detail.length > 180 ? detail.substring(0, 180) + '…' : detail;

                html += `
                    <div class="al-entry ${meta.cls}" style="animation-delay:${entryIndex * 40}ms">
                        <div class="al-card">
                            <div class="al-card-top">
                                <span class="al-action-badge ${meta.badge}">${meta.icon} ${log.action || 'EVENT'}</span>
                                <span class="al-card-resource">${escapeHtml(resource)}</span>
                                <span class="al-card-time">🕐 ${time}</span>
                            </div>
                            <div class="al-card-meta">
                                <span class="al-meta-chip user">👤 ${escapeHtml(user)}</span>
                                ${role ? `<span class="al-meta-chip">${escapeHtml(role)}</span>` : ''}
                                ${log.entityType ? `<span class="al-meta-chip entity">${log.entityType}</span>` : ''}
                            </div>
                            ${safeDetail ? `<div class="al-card-detail">${escapeHtml(safeDetail)}</div>` : ''}
                        </div>
                    </div>`;
                entryIndex++;
            });
        });

        html += '</div>';
        container.innerHTML = html;

        console.log(`✅ Audit trail: ${filtered.length} entries rendered`);

    } catch (error) {
        console.error('❌ Error loading audit logs:', error);
        container.innerHTML = `
            <div class="al-empty">
                <span class="al-empty-icon">⚠️</span>
                <h3>Failed to load logs</h3>
                <p>${error.message || 'Network error — please try again.'}</p>
            </div>`;
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Clear all audit filters and reload
 */
function clearAuditFilters() {
    ['auditEntity', 'auditEntityId', 'auditStartDate', 'auditEndDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    loadAuditLogs();
}

/**
 * Export audit logs
 */
async function exportAuditLogs() {
    try {
        window.location.href = '/export/audit';
    } catch (err) {
        console.error('Export failed:', err);
    }
}

// Legacy aliases
window.filterAuditLogs = loadAuditLogs;

// Exports
window.loadAuditLogs = loadAuditLogs;
window.clearAuditFilters = clearAuditFilters;
window.exportAuditLogs = exportAuditLogs;

// Auto-load when section becomes visible (on nav click)
document.addEventListener('DOMContentLoaded', () => {
    const navAudit = document.querySelector('[onclick*="auditLog"]');
    if (navAudit) {
        const orig = navAudit.getAttribute('onclick');
        navAudit.setAttribute('onclick', orig + '; if(typeof loadAuditLogs==="function") loadAuditLogs();');
    }
});

console.log('✅ Audit Trail Module Loaded');
