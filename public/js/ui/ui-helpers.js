/**
 * ================================================
 * UI HELPERS  — ui-helpers.js
 * Extracted from index.html inline scripts.
 * Contains: BOM drag-drop, file preview, Documents
 * tab switcher, Dashboard audit panel toggle,
 * progress bar, and home hero clock.
 * ================================================
 */

/* ═══════════════════════════════════
   BOM / DESIGN-DOCS — Drag & Drop
═══════════════════════════════════ */
function buDragOver(e, zoneId) {
    e.preventDefault();
    document.getElementById(zoneId)?.classList.add('bu-drag-over');
}
window.buDragOver = buDragOver;

function buDragLeave(zoneId) {
    document.getElementById(zoneId)?.classList.remove('bu-drag-over');
}
window.buDragLeave = buDragLeave;

function buDrop(e, inputId, zoneId) {
    e.preventDefault();
    document.getElementById(zoneId)?.classList.remove('bu-drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}
window.buDrop = buDrop;

/* ─── File preview ─── */
function buFileSelected(inputId, previewId) {
    const input   = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview || !input.files?.length) return;
    const file   = input.files[0];
    const ext    = file.name.split('.').pop().toUpperCase();
    const sizeKb = (file.size / 1024).toFixed(1);
    const icons  = { PDF: '📕', XLSX: '📗', XLS: '📗', DWG: '📘', DXF: '📘' };
    preview.style.display = 'flex';
    preview.innerHTML = `
        <span class="bu-file-icon">${icons[ext] || '📄'}</span>
        <span class="bu-file-name">${file.name}</span>
        <span class="bu-file-size">${sizeKb} KB</span>
        <button class="bu-file-remove" onclick="buClearFile('${inputId}','${previewId}')" title="Remove">✕</button>`;
}
window.buFileSelected = buFileSelected;

function buClearFile(inputId, previewId) {
    const input = document.getElementById(inputId);
    if (input) input.value = '';
    const preview = document.getElementById(previewId);
    if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
}
window.buClearFile = buClearFile;

/* ═══════════════════════════════════
   DOCUMENTS — Tab Switcher
   Styles controlled by .doc-tab / .doc-tab-active in design-tokens.css
═══════════════════════════════════ */
function switchDocTab(tab) {
    const panels = { bom: 'docPanel-bom', design: 'docPanel-design' };
    const tabs   = { bom: 'docTab-bom',   design: 'docTab-design'   };
    Object.keys(panels).forEach(key => {
        const panel = document.getElementById(panels[key]);
        const btn   = document.getElementById(tabs[key]);
        if (!panel || !btn) return;
        const active = (key === tab);
        panel.style.display = active ? '' : 'none';
        btn.classList.toggle('doc-tab-active', active);
    });
}
window.switchDocTab = switchDocTab;

/* ═══════════════════════════════════
   DASHBOARD — Audit Log Panel Toggle
═══════════════════════════════════ */
let _auditPanelLoaded = false;

function toggleAuditPanel() {
    const panel   = document.getElementById('auditPanel');
    const chevron = document.getElementById('auditPanelChevron');
    if (!panel) return;
    const opening = panel.style.display === 'none' || panel.style.display === '';
    panel.style.display = opening ? 'block' : 'none';
    if (chevron) chevron.style.transform = opening ? 'rotate(180deg)' : '';
    if (!opening || _auditPanelLoaded) return;
    _auditPanelLoaded = true;
    const container = document.getElementById('auditLogContent');
    if (!container) return;
    container.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:20px 0;">⏳ Loading audit log…</p>';
    const fetchFn = typeof apiCall === 'function'
        ? () => apiCall('/audit')
        : () => fetch('/api/audit', {
            credentials: 'include'
        }).then(r => r.ok ? r.json() : Promise.reject(r.status));
    fetchFn()
        .then(data => {
            const logs = Array.isArray(data) ? data : (data.logs || data.data || []);
            if (!logs.length) {
                container.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:20px 0;">No audit logs found.</p>';
                return;
            }
            container.innerHTML = logs.slice(0, 50).map(log => `
                <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:20px;flex-shrink:0;">📋</span>
                    <div>
                        <div style="font-weight:600;font-size:13px;color:#2c3e50;">${log.action || log.event || 'Action'}</div>
                        <div style="font-size:12px;color:#7f8c8d;margin-top:2px;">${log.user || log.userId || ''} &bull; ${log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</div>
                        ${log.details ? `<div style="font-size:12px;color:#95a5a6;margin-top:2px;">${log.details}</div>` : ''}
                    </div>
                </div>`).join('');
        })
        .catch(err => {
            container.innerHTML = `<p style="color:#e74c3c;font-size:13px;text-align:center;padding:20px 0;">⚠️ Could not load audit log (${err}).</p>`;
            _auditPanelLoaded = false; // allow retry on next open
        });
}
window.toggleAuditPanel = toggleAuditPanel;

/* ═══════════════════════════════════
   BOM — Animated Progress Bar
═══════════════════════════════════ */
function buShowProgress(barId, wrapId, label) {
    const wrap = document.getElementById(wrapId);
    const bar  = document.getElementById(barId);
    if (!wrap || !bar) return;
    const lbl = wrap.querySelector('.bu-progress-label');
    if (lbl && label) lbl.textContent = label;
    wrap.style.display = 'block';
    bar.style.width = '0%';
    let pct = 0;
    const iv = setInterval(() => {
        pct = Math.min(pct + Math.random() * 18, 88);
        bar.style.width = pct + '%';
        if (pct >= 88) clearInterval(iv);
    }, 160);
    return iv;
}
window.buShowProgress = buShowProgress;

function buCompleteProgress(barId, wrapId, iv) {
    clearInterval(iv);
    const bar = document.getElementById(barId);
    if (bar) bar.style.width = '100%';
    setTimeout(() => {
        const wrap = document.getElementById(wrapId);
        if (wrap) wrap.style.display = 'none';
        if (bar) bar.style.width = '0%';
    }, 800);
}
window.buCompleteProgress = buCompleteProgress;

/* ═══════════════════════════════════
   HOME HERO — Live Clock & Greeting
═══════════════════════════════════ */
(function initHomeClock() {
    function updateHomeClock() {
        const now      = new Date();
        const clock    = document.getElementById('homeClock');
        const dateEl   = document.getElementById('homeDate');
        const greeting = document.getElementById('homeGreeting');
        if (clock) {
            clock.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        if (greeting) {
            const h = now.getHours();
            const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
            greeting.textContent = g + ' 👋';
        }
    }
    updateHomeClock();
    setInterval(updateHomeClock, 1000);
})();

console.log('✅ UI Helpers loaded');
