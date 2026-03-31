/**
 * Sidebar Toggle — Responsive (mobile + tablet)
 * Off-canvas below 1024px, collapsible on desktop.
 */

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
        console.log('✅ Sidebar toggle initialized (breakpoint ' + TABLET_BREAKPOINT + 'px)');
    }

    /* ── Public toggle (called by the hamburger button) ── */
    window.toggleSidebar = function () {
        const sidebar = document.querySelector('aside.sidebar');
        const mainContent = document.querySelector('main.main-content');
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.querySelector('.sidebar-overlay');

        if (isTabletOrMobile()) {
            // Off-canvas slide
            const isOpen = sidebar.classList.toggle('mobile-open');
            if (overlay) overlay.classList.toggle('active', isOpen);
            if (toggleBtn) toggleBtn.classList.toggle('active', isOpen);
        } else {
            // Desktop collapse
            const isCollapsed = sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded', isCollapsed);
            if (toggleBtn) toggleBtn.classList.toggle('active', isCollapsed);
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    };

    /* ── Close sidebar (overlay click or nav item tap) ── */
    function closeSidebar() {
        const sidebar = document.querySelector('aside.sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.querySelector('.sidebar-overlay');

        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        if (toggleBtn) toggleBtn.classList.remove('active');
    }

    // Also expose globally so nav items can close sidebar on tap
    window.closeSidebarOnMobile = function () {
        if (isTabletOrMobile()) closeSidebar();
    };

    /* ── Resize handler ── */
    function handleResize() {
        const sidebar = document.querySelector('aside.sidebar');
        const mainContent = document.querySelector('main.main-content');
        const toggleBtn = document.getElementById('sidebarToggle');
        const overlay = document.querySelector('.sidebar-overlay');

        if (isTabletOrMobile()) {
            // Switching to tablet/mobile: close if open
            sidebar.classList.remove('mobile-open', 'collapsed');
            mainContent.classList.remove('expanded');
            if (overlay) overlay.classList.remove('active');
            if (toggleBtn) toggleBtn.classList.remove('active');
        } else {
            // Switching to desktop: clean up mobile state, restore saved
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
