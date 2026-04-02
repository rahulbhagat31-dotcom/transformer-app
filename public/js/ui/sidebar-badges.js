/* ===================================================
   SIDEBAR BADGE ENGINE
   Polls the /checklist/pending-signoffs API (or
   derives counts from loaded data) and updates the
   nav badge <span> elements in the sidebar.

   Works for supervisor-role (shows sup-pending counts)
   and quality-role (shows QA-pending counts).
   Admin sees both counts combined.
=================================================== */

(function () {
    'use strict';

    // Guard: sidebar.js already registers window.SidebarBadges with identical logic.
    // If it ran first, skip this legacy file entirely to prevent duplicate polling.
    if (window.SidebarBadges) {
        console.log('ℹ️ sidebar-badges.js: SidebarBadges already registered by sidebar.js — skipping duplicate init.');
        return;
    }

    const STAGES = ['winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling'];
    const POLL_INTERVAL_MS = 45_000; // 45 s — gentle on the server
    let _pollTimer = null;
    let _lastWO = null;

    /* ── Public API ────────────────────────────────── */
    window.SidebarBadges = {
        /** Call whenever the current WO changes */
        refresh,
        /** Call once after login to start auto-polling */
        startPolling,
        /** Clear all badges (e.g. on logout) */
        clear: clearAll
    };

    /* ── Badge renderer ────────────────────────────── */
    function renderBadge(elId, count, type) {
        const el = document.getElementById(elId);
        if (!el) return;

        if (!count || count <= 0) {
            el.textContent = '';
            el.className = '';
            return;
        }

        el.textContent = count > 99 ? '99+' : String(count);
        const isUrgent = count >= 5;
        const cls = ['nav-badge', `badge-${type}`, isUrgent ? 'badge-urgent' : ''].join(' ').trim();
        el.className = cls;
    }

    function clearAll() {
        STAGES.forEach(s => {
            renderBadge(`nav-badge-${s}`, 0, 'supervisor');
        });
        renderBadge('nav-badge-checklist', 0, 'both');
    }

    /* ── Parent (checklist) badge aggregation ─────── */
    function updateParentBadge(stageCounts) {
        const totalSup = stageCounts.reduce((a, s) => a + (s.supPending || 0), 0);
        const totalQA = stageCounts.reduce((a, s) => a + (s.qaPending || 0), 0);
        const total = totalSup + totalQA;

        const parentEl = document.getElementById('nav-badge-checklist');
        if (!parentEl) return;

        if (total <= 0) {
            parentEl.textContent = '';
            parentEl.className = '';
            return;
        }

        parentEl.textContent = total > 99 ? '99+' : String(total);
        // colour logic: both pending → red; only QA → purple; only sup → amber
        const type = (totalSup > 0 && totalQA > 0) ? 'both'
            : (totalQA > 0) ? 'qa'
                : 'supervisor';
        const isUrgent = total >= 5;
        parentEl.className = ['nav-badge', `badge-${type}`, isUrgent ? 'badge-urgent' : ''].join(' ').trim();
    }

    /* ── Derive badges from a /checklist/:stage/:wo/summary response ─ */
    async function fetchStageCounts(wo) {
        const role = window.currentUserRole || '';
        const results = [];

        // Prefer the batch endpoint — 1 request instead of 5
        let batchSummary = null;
        try {
            const batchCall = typeof apiCall === 'function'
                ? () => apiCall(`/checklist/summary/${encodeURIComponent(wo)}`)
                : () => fetch(`/api/checklist/summary/${encodeURIComponent(wo)}`, { credentials: 'include' }).then(r => r.json());
            const batchData = await batchCall();
            batchSummary = batchData.data || null;
        } catch (e) {
            console.warn('SidebarBadges: batch summary failed, falling back to per-stage', e);
        }

        await Promise.all(STAGES.map(async (stage) => {
            try {
                let techDone = 0, supervisorDone = 0, qaDone = 0;

                if (batchSummary && batchSummary[stage]) {
                    ({ techDone, supervisorDone, qaDone } = batchSummary[stage]);
                } else {
                    const call = typeof apiCall === 'function'
                        ? () => apiCall(`/checklist/${stage}/${encodeURIComponent(wo)}/summary`)
                        : () => fetch(`/api/checklist/${stage}/${encodeURIComponent(wo)}/summary`,
                            { credentials: 'include' }).then(r => r.json());
                    const summary = await call();
                    ({ techDone = 0, supervisorDone = 0, qaDone = 0 } = summary || {});
                }

                const supPending = Math.max(0, techDone - supervisorDone);
                const qaPending  = Math.max(0, supervisorDone - qaDone);
                results.push({ stage, supPending, qaPending });

                if (role === 'admin') {
                    const stageTotal = supPending + qaPending;
                    const type = (supPending > 0 && qaPending > 0) ? 'both'
                        : (qaPending > 0) ? 'qa' : 'supervisor';
                    renderBadge(`nav-badge-${stage}`, stageTotal, type);
                } else if (role === 'supervisor' || role === 'production') {
                    renderBadge(`nav-badge-${stage}`, supPending, 'supervisor');
                } else if (role === 'quality') {
                    renderBadge(`nav-badge-${stage}`, qaPending, 'qa');
                } else {
                    renderBadge(`nav-badge-${stage}`, 0, 'supervisor');
                }
            } catch {
                results.push({ stage, supPending: 0, qaPending: 0 });
            }
        }));
        return results;
    }

    /* ── Main refresh ──────────────────────────────── */
    async function refresh(wo) {
        wo = wo || window.currentWO || _lastWO;
        if (!wo) { clearAll(); return; }
        _lastWO = wo;

        try {
            const stageCounts = await fetchStageCounts(wo);
            updateParentBadge(stageCounts);
        } catch (err) {
            console.warn('SidebarBadges: refresh error', err);
        }
    }

    /* ── Polling ───────────────────────────────────── */
    function startPolling() {
        if (_pollTimer) clearInterval(_pollTimer);
        // Initial fetch after a short delay (let page settle)
        setTimeout(() => refresh(), 3000);
        _pollTimer = setInterval(() => refresh(), POLL_INTERVAL_MS);
        console.log('🔔 SidebarBadges polling started');
    }

    /* ── Auto-kick-off after login ─────────────────── */
    // The main app sets window.currentUserRole when login completes.
    // We listen for a custom event OR a role change.
    document.addEventListener('DOMContentLoaded', () => {
        // observe role availability via polling on startup
        let kickoffAttempts = 0;
        const kickoff = setInterval(() => {
            kickoffAttempts++;
            if (window.currentUserRole && window.currentWO) {
                clearInterval(kickoff);
                startPolling();
            } else if (kickoffAttempts > 30) {
                // Still start polling even without a WO — it'll be a no-op
                clearInterval(kickoff);
                startPolling();
            }
        }, 1000);
    });

    // Also hook into WO change so badges refresh immediately
    const _origOnWOChange = window.onWOChange;
    if (typeof _origOnWOChange === 'function') {
        window.onWOChange = function (...args) {
            _origOnWOChange.apply(this, args);
            setTimeout(() => refresh(window.currentWO), 600);
        };
    }

    // Make refresh available globally for post-save / post-signoff calls
    document.addEventListener('checklistSaved', () => refresh());

})();
