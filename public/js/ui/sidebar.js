/**
 * =====================================================
 * SIDEBAR.JS — Consolidated Sidebar Module
 * Merges: sidebar-toggle.js + sidebar-badges.js
 * =====================================================
 */

/* ═══════════════════════════════════════════════
   PART 1: SIDEBAR TOGGLE (responsive)
═══════════════════════════════════════════════ */
(function () {
    'use strict';

    const TABLET_BREAKPOINT = 1024;

    function isTabletOrMobile() {
        return window.innerWidth <= TABLET_BREAKPOINT;
    }

    document.addEventListener('DOMContentLoaded', function () {
        initializeSidebar();
    });

    function initializeSidebar() {
        const sidebar = document.querySelector('aside.sidebar');
        const mainContent = document.querySelector('main.main-content');
        const toggleBtn = document.getElementById('sidebarToggle');

        if (!sidebar || !mainContent) return;

        // Inject overlay once
        if (!document.querySelector('.sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', closeSidebar);
            document.body.appendChild(overlay);
        }

        // Tablet/mobile: always start off-canvas
        if (isTabletOrMobile()) {
            sidebar.classList.remove('mobile-open');
            mainContent.classList.remove('expanded');
        } else {
            // Desktop: restore last saved state
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                if (toggleBtn) toggleBtn.classList.add('active');
            }
        }

        window.addEventListener('resize', handleResize);
        console.log('✅ Sidebar initialized (breakpoint ' + TABLET_BREAKPOINT + 'px)');
    }

    /* ── Public toggle ── */
    window.toggleSidebar = function () {
        const sidebar = document.querySelector('aside.sidebar');
        const mainContent = document.querySelector('main.main-content');
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.querySelector('.sidebar-overlay');

        if (isTabletOrMobile()) {
            const isOpen = sidebar.classList.toggle('mobile-open');
            if (overlay) overlay.classList.toggle('active', isOpen);
            if (toggleBtn) toggleBtn.classList.toggle('active', isOpen);
        } else {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded', isCollapsed);
            if (toggleBtn) toggleBtn.classList.toggle('active', isCollapsed);
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    };

    function closeSidebar() {
        const sidebar = document.querySelector('aside.sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        if (toggleBtn) toggleBtn.classList.remove('active');
    }

    window.closeSidebarOnMobile = function () {
        if (isTabletOrMobile()) closeSidebar();
    };

    function handleResize() {
        const sidebar = document.querySelector('aside.sidebar');
        const mainContent = document.querySelector('main.main-content');
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.querySelector('.sidebar-overlay');

        if (isTabletOrMobile()) {
            sidebar.classList.remove('mobile-open', 'collapsed');
            mainContent.classList.remove('expanded');
            if (overlay) overlay.classList.remove('active');
            if (toggleBtn) toggleBtn.classList.remove('active');
        } else {
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                if (toggleBtn) toggleBtn.classList.add('active');
            } else {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
                if (toggleBtn) toggleBtn.classList.remove('active');
            }
        }
    }
})();


/* ═══════════════════════════════════════════════
   PART 2: SIDEBAR BADGE ENGINE
═══════════════════════════════════════════════ */
(function () {
    'use strict';

    const STAGES = ['winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling'];
    const POLL_INTERVAL_MS = 45_000; // 45 s
    let _pollTimer = null;
    let _lastWO = null;

    window.SidebarBadges = {
        refresh,
        startPolling,
        clear: clearAll
    };

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
        el.className = ['nav-badge', `badge-${type}`, isUrgent ? 'badge-urgent' : ''].join(' ').trim();
    }

    function clearAll() {
        STAGES.forEach(s => renderBadge(`nav-badge-${s}`, 0, 'supervisor'));
        renderBadge('nav-badge-checklist', 0, 'both');
    }

    function updateParentBadge(stageCounts) {
        const totalSup = stageCounts.reduce((a, s) => a + (s.supPending || 0), 0);
        const totalQA  = stageCounts.reduce((a, s) => a + (s.qaPending  || 0), 0);
        const total    = totalSup + totalQA;
        const parentEl = document.getElementById('nav-badge-checklist');
        if (!parentEl) return;
        if (total <= 0) { parentEl.textContent = ''; parentEl.className = ''; return; }
        parentEl.textContent = total > 99 ? '99+' : String(total);
        const type = (totalSup > 0 && totalQA > 0) ? 'both' : (totalQA > 0) ? 'qa' : 'supervisor';
        parentEl.className = ['nav-badge', `badge-${type}`, total >= 5 ? 'badge-urgent' : ''].join(' ').trim();
    }

    async function fetchStageCounts(wo) {
        const role = window.currentUserRole || '';
        const results = [];
        await Promise.all(STAGES.map(async (stage) => {
            try {
                const call = typeof apiCall === 'function'
                    ? () => apiCall(`/checklist/${stage}/${encodeURIComponent(wo)}/summary`)
                    : () => fetch(`/api/checklist/${stage}/${encodeURIComponent(wo)}/summary`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
                        .then(r => r.json());
                const summary = await call();
                const { techDone = 0, supervisorDone = 0, qaDone = 0 } = summary || {};
                const supPending = Math.max(0, techDone - supervisorDone);
                const qaPending  = Math.max(0, supervisorDone - qaDone);
                results.push({ stage, supPending, qaPending });
                if (role === 'admin') {
                    const stageTotal = supPending + qaPending;
                    const type = (supPending > 0 && qaPending > 0) ? 'both' : (qaPending > 0) ? 'qa' : 'supervisor';
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

    function startPolling() {
        if (_pollTimer) clearInterval(_pollTimer);
        setTimeout(() => refresh(), 3000);
        _pollTimer = setInterval(() => refresh(), POLL_INTERVAL_MS);
        console.log('🔔 SidebarBadges polling started');
    }

    document.addEventListener('DOMContentLoaded', () => {
        let kickoffAttempts = 0;
        const kickoff = setInterval(() => {
            kickoffAttempts++;
            if (window.currentUserRole && window.currentWO) {
                clearInterval(kickoff);
                startPolling();
            } else if (kickoffAttempts > 30) {
                clearInterval(kickoff);
                startPolling();
            }
        }, 1000);
    });

    const _origOnWOChange = window.onWOChange;
    if (typeof _origOnWOChange === 'function') {
        window.onWOChange = function (...args) {
            _origOnWOChange.apply(this, args);
            setTimeout(() => refresh(window.currentWO), 600);
        };
    }

    document.addEventListener('checklistSaved', () => refresh());
})();
