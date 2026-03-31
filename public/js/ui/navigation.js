/* ===============================
   ✨ SIDEBAR TOGGLE & BROWSER NAVIGATION
================================ */

// ✅ SIDEBAR TOGGLE FUNCTION
function toggleSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (sidebar && toggleBtn) {
        sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('active');

        // Toggle body class for main content adjustment
        document.body.classList.toggle('sidebar-collapsed');

        // Save state to localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
}

// ✅ Restore sidebar state on page load
document.addEventListener('DOMContentLoaded', () => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        const sidebar = document.getElementById('mainSidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        if (sidebar) sidebar.classList.add('collapsed');
        if (toggleBtn) toggleBtn.classList.add('active');
        document.body.classList.add('sidebar-collapsed');
    }
});

// ✅ Export to window immediately
window.toggleSidebar = toggleSidebar;

console.log('✅ Navigation module loaded - toggleSidebar available');

/* ===============================
   ✨ BROWSER HISTORY NAVIGATION (NEW)
================================ */
// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section) {
        const sectionId = event.state.section;
        const section = document.getElementById(sectionId);
        if (section) {
            // Find the nav button for this section
            const navBtn = document.querySelector('[onclick*="showTab(\'' + sectionId + '\'"]');
            // Set flag to prevent adding to history again
            window._skipHistoryPush = true;
            showTab(sectionId, navBtn);
            window._skipHistoryPush = false;
        }
    } else {
        // No state, check hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            const section = document.getElementById(hash);
            if (section) {
                const navBtn = document.querySelector('[onclick*="showTab(\'' + hash + '\'"]');
                window._skipHistoryPush = true;
                showTab(hash, navBtn);
                window._skipHistoryPush = false;
            }
        }
    }
});

// Wrap showTab to add history
const originalShowTab = window.showTab;
window.showTab = function (id, btn) {
    // Add to browser history
    if (window.history && window.history.pushState && !window._skipHistoryPush) {
        window.history.pushState({ section: id }, '', '#' + id);
    }
    // Call original
    originalShowTab.call(this, id, btn);
};

console.log('✅ Browser navigation enabled');
