/* ===================================================
   WO HISTORY / TIMELINE — JavaScript

   APIs used:
     GET /api/transformer/          → all WOs list
     GET /api/stage/:wo             → stage statuses + progress
     GET /api/checklist/:stage/:wo/summary  → tier counts per stage
     GET /api/audit/logs?entityId=:wo&limit=200  → event log
=================================================== */

(function () {
    'use strict';

    const STAGES = ['winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling'];
    const STAGE_LABELS = {
        winding: 'Winding', vpd: 'VPD', coreCoil: 'Core Coil',
        tanking: 'Tanking', tankFilling: 'Tank Filling'
    };

    let _currentWO = '';
    let _allEvents = [];
    let _filterType = 'all';
    let _searchQ = '';
    let _pageSize = 30;
    let _page = 1;

    // ─────────────────────────────────────────────────
    //   INIT — called when user navigates to the section
    // ─────────────────────────────────────────────────
    async function initTimeline() {
        await populateWODropdown();
        attachFilterListeners();

        // If there's already a WO selected globally, pre-load it
        const globalWO = window.currentWO || '';
        if (globalWO) {
            const sel = document.getElementById('tlWOSelect');
            if (sel) sel.value = globalWO;
            await loadTimeline(globalWO);
        } else {
            showEmpty('Select a Work Order above to view its history.');
        }
    }

    // ─────────────────────────────────────────────────
    //   POPULATE WO DROPDOWN
    // ─────────────────────────────────────────────────
    async function populateWODropdown() {
        const sel = document.getElementById('tlWOSelect');
        if (!sel) return;

        try {
            const res = await fetch('/transformers', {
                credentials: 'include'
            });
            const data = await res.json();
            const transformers = data.data || data || [];

            sel.innerHTML = '<option value="">— Select W.O. —</option>' +
                transformers.map(t =>
                    `<option value="${escHtml(t.woNumber || t.wo || t.id)}">${escHtml(t.woNumber || t.wo || t.id)} — ${escHtml(t.customerName || t.customer || '')}</option>`
                ).join('');
        } catch (e) {
            console.warn('⚠️ WO dropdown load failed:', e.message);
        }
    }

    // ─────────────────────────────────────────────────
    //   FILTER LISTENERS
    // ─────────────────────────────────────────────────
    function attachFilterListeners() {
        const sel = document.getElementById('tlWOSelect');
        if (sel) sel.addEventListener('change', async e => {
            _currentWO = e.target.value;
            _page = 1;
            if (_currentWO) await loadTimeline(_currentWO);
            else showEmpty('Select a Work Order above to view its history.');
        });

        const typeFilter = document.getElementById('tlTypeFilter');
        if (typeFilter) typeFilter.addEventListener('change', e => {
            _filterType = e.target.value;
            _page = 1;
            renderEvents();
        });

        const search = document.getElementById('tlSearch');
        if (search) search.addEventListener('input', e => {
            _searchQ = e.target.value.toLowerCase();
            _page = 1;
            renderEvents();
        });

        const loadMoreBtn = document.getElementById('tlLoadMoreBtn');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => {
            _page++;
            renderEvents();
        });
    }

    // ─────────────────────────────────────────────────
    //   MAIN LOAD
    // ─────────────────────────────────────────────────
    async function loadTimeline(wo) {
        showSkeleton();

        try {
            // Fetch stage status + audit events in parallel
            const [stageData, auditData] = await Promise.all([
                fetchStageStatus(wo),
                fetchAuditEvents(wo)
            ]);

            renderStageStrip(stageData, wo);
            renderSummaryRow(auditData.events);

            _allEvents = auditData.events;
            _page = 1;

            if (auditData.restricted) {
                showEmpty('📋 Stage progress loaded. Full event history requires Quality or Admin role.');
            } else {
                renderEvents();
            }
        } catch (err) {
            console.error('❌ Timeline load error:', err);
            showEmpty('Failed to load timeline. Check your connection and permissions.');
        }
    }

    // ─────────────────────────────────────────────────
    //   FETCH HELPERS
    // ─────────────────────────────────────────────────
    async function fetchStageStatus(wo) {
        const r = await fetch(`/stage/${encodeURIComponent(wo)}`, {
            credentials: 'include'
        });
        const d = await r.json();
        return d.data || d || {};
    }

    async function fetchAuditEvents(wo) {
        const url = `/audit/logs?entityId=${encodeURIComponent(wo)}&limit=500`;
        const r = await fetch(url, { credentials: 'include' });

        // 403 = user doesn't have quality permission — return empty gracefully
        if (r.status === 403) {
            return { events: [], restricted: true };
        }
        const d = await r.json();
        const logs = d.data?.logs || d.logs || d.data || [];
        const sorted = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { events: sorted, restricted: false };
    }

    // ─────────────────────────────────────────────────
    //   STAGE PROGRESS STRIP
    // ─────────────────────────────────────────────────
    function renderStageStrip(stageStatus, _wo) {
        const strip = document.getElementById('tlStageStrip');
        if (!strip) return;

        strip.innerHTML = STAGES.map(stage => {
            const info = stageStatus[stage] || {};
            const pct = info.completionPercentage || (info.status === 'completed' ? 100 : 0);
            const statusClass = info.locked && info.status === 'completed' ? 'status-locked'
                : info.status === 'completed' ? 'status-completed'
                    : info.status === 'in-progress' ? 'status-in-progress'
                        : 'status-pending';
            const icon = statusClass === 'status-locked' ? '🔒'
                : statusClass === 'status-completed' ? '✅'
                    : statusClass === 'status-in-progress' ? '🔄'
                        : '⬜';

            return `<div class="stage-chip ${statusClass}">
                <span class="chip-label">${icon} ${STAGE_LABELS[stage]}</span>
                <span class="chip-pct">${Math.round(pct)}%</span>
            </div>`;
        }).join('');
    }

    // ─────────────────────────────────────────────────
    //   SUMMARY ROW
    // ─────────────────────────────────────────────────
    function renderSummaryRow(events) {
        const row = document.getElementById('tlSummaryRow');
        if (!row) return;

        const saves = events.filter(e => classifyEvent(e) === 'evt-save').length;
        const sups = events.filter(e => classifyEvent(e) === 'evt-supervisor').length;
        const qas = events.filter(e => ['evt-qa-ok', 'evt-qa-rej'].includes(classifyEvent(e))).length;
        const unlks = events.filter(e => classifyEvent(e) === 'evt-unlock').length;

        row.innerHTML = [
            { num: events.length, lbl: 'Total Events', color: '#3498db' },
            { num: saves, lbl: 'Saves', color: '#27ae60' },
            { num: sups, lbl: 'Supervisor Sign-Offs', color: '#f39c12' },
            { num: qas, lbl: 'QA Actions', color: '#8e44ad' },
            { num: unlks, lbl: 'Unlocks', color: '#e67e22' }
        ].map(c => `
            <div class="tl-summary-chip" style="--chip-color:${c.color}">
                <span class="chip-num" style="color:${c.color}">${c.num}</span>
                <span class="chip-lbl">${c.lbl}</span>
            </div>
        `).join('');
    }

    // ─────────────────────────────────────────────────
    //   RENDER / FILTER EVENTS
    // ─────────────────────────────────────────────────
    function renderEvents() {
        const container = document.getElementById('tlEventList');
        const loadMoreBtn = document.getElementById('tlLoadMoreBtn');
        if (!container) return;

        // Filter
        let filtered = _allEvents.filter(evt => {
            const cls = classifyEvent(evt);
            if (_filterType !== 'all' && cls !== `evt-${_filterType}`) return false;
            if (_searchQ) {
                const hay = [
                    evt.action, evt.username, evt.entityType, evt.entityId,
                    evt.details, evt.notes
                ].join(' ').toLowerCase();
                if (!hay.includes(_searchQ)) return false;
            }
            return true;
        });

        const total = filtered.length;
        const visible = filtered.slice(0, _page * _pageSize);

        if (visible.length === 0) {
            container.innerHTML = '';
            showEmpty(total === 0 ? 'No events found for this filter.' : 'No events found.');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        document.getElementById('tlEmptyState').style.display = 'none';
        document.getElementById('tlSkeletonState').style.display = 'none';

        // Group by day
        const days = {};
        visible.forEach(evt => {
            const day = formatDay(evt.timestamp);
            if (!days[day]) days[day] = [];
            days[day].push(evt);
        });

        container.innerHTML = Object.entries(days).map(([day, evts]) => `
            <div class="tl-day-separator">${day}</div>
            ${evts.map(e => renderEvent(e)).join('')}
        `).join('');

        // Load more button
        if (loadMoreBtn) {
            loadMoreBtn.style.display = visible.length < total ? 'block' : 'none';
            loadMoreBtn.textContent = `Load more (${total - visible.length} remaining)`;
        }
    }

    // ─────────────────────────────────────────────────
    //   EVENT CARD RENDERING
    // ─────────────────────────────────────────────────
    function classifyEvent(evt) {
        const action = (evt.action || '').toLowerCase();
        if (action.includes('qa') && action.includes('reject')) return 'evt-qa-rej';
        if (action.includes('qa')) return 'evt-qa-ok';
        if (action.includes('supervisor')) return 'evt-supervisor';
        if (action.includes('unlock')) return 'evt-unlock';
        if (action.includes('lock')) return 'evt-lock';
        if (action.includes('save') || action.includes('update') || action.includes('enter'))
            return 'evt-save';
        if (action.includes('stage') || action.includes('complete')) return 'evt-stage';
        if (action.includes('create') || action.includes('add')) return 'evt-create';
        return 'evt-other';
    }

    function eventIcon(cls) {
        const map = {
            'evt-save': '💾', 'evt-lock': '🔒', 'evt-supervisor': '✍️',
            'evt-qa-ok': '✅', 'evt-qa-rej': '❌', 'evt-unlock': '🔓',
            'evt-stage': '🏭', 'evt-create': '🆕', 'evt-other': '📝'
        };
        return map[cls] || '📝';
    }

    function renderEvent(evt) {
        const cls = classifyEvent(evt);
        const icon = eventIcon(cls);
        const time = formatTime(evt.timestamp);
        const by = evt.username || evt.userId || '?';
        const stage = evt.stage || (evt.entityType === 'checklist' ? evt.entityId : '') || '';
        const notes = evt.notes || (evt.changes?.notes) || '';

        let actionLabel = escHtml(evt.action || 'Event');
        // Make action more readable
        actionLabel = actionLabel
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        return `<div class="tl-event ${cls}">
            <div class="tl-card">
                <div class="tl-card-top">
                    <span class="tl-action">${icon} ${actionLabel}</span>
                    <span class="tl-time" title="${escHtml(evt.timestamp)}">${time}</span>
                </div>
                <div class="tl-meta">
                    <span class="tl-badge by-user">👤 ${escHtml(by)}</span>
                    ${stage ? `<span class="tl-badge by-stage">📂 ${escHtml(stage)}</span>` : ''}
                    ${evt.role ? `<span class="tl-badge by-role">${escHtml(evt.role)}</span>` : ''}
                </div>
                ${notes ? `<div class="tl-detail">${escHtml(notes)}</div>` : ''}
            </div>
        </div>`;
    }

    // ─────────────────────────────────────────────────
    //   STATE HELPERS
    // ─────────────────────────────────────────────────
    function showSkeleton() {
        const sk = document.getElementById('tlSkeletonState');
        const em = document.getElementById('tlEmptyState');
        const ev = document.getElementById('tlEventList');
        if (sk) { sk.style.display = 'block'; sk.innerHTML = Array(4).fill('<div class="tl-skeleton"></div>').join(''); }
        if (em) em.style.display = 'none';
        if (ev) ev.innerHTML = '';
    }

    function showEmpty(msg) {
        const sk = document.getElementById('tlSkeletonState');
        const em = document.getElementById('tlEmptyState');
        const ev = document.getElementById('tlEventList');
        if (sk) sk.style.display = 'none';
        if (ev) ev.innerHTML = '';
        if (em) {
            em.style.display = 'block';
            em.innerHTML = `<div class="tl-empty">
                <span class="tl-empty-icon">📋</span>
                <p>${escHtml(msg)}</p>
            </div>`;
        }
    }

    // ─────────────────────────────────────────────────
    //   DATE FORMATTING
    // ─────────────────────────────────────────────────
    function formatDay(ts) {
        if (!ts) return 'Unknown Date';
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

        if (sameDay(d, today)) return 'Today';
        if (sameDay(d, yesterday)) return 'Yesterday';
        return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function formatTime(ts) {
        if (!ts) return '';
        try {
            const d = new Date(ts);
            return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } catch { return ts; }
    }

    function sameDay(a, b) {
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─────────────────────────────────────────────────
    //   PUBLIC API
    // ─────────────────────────────────────────────────
    window.WOTimeline = { init: initTimeline, reload: () => loadTimeline(_currentWO) };

})();
