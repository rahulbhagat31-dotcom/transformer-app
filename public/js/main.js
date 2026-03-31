/**
 * ================================================
 * VOLTRASUITE - MAIN APPLICATION CONTROLLER
 * Handles Navigation, Sidebar, and Global State
 * ================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 VoltraSuite Main Controller Loaded');

    // Initialize default view
    // check authentication here if needed
});

/**
 * Navigate to Digital Twin page for specific transformer
 * @param {string} wo - Work order number
 */
window.showDigitalTwin = function (wo) {
    console.log(`🔧 Opening Digital Twin for: ${wo}`);

    // Show Digital Twin section
    showTab('digitalTwin');

    // Initialize Digital Twin with work order
    if (typeof initDigitalTwin === 'function') {
        initDigitalTwin(wo);
    } else {
        console.error('Digital Twin not loaded');
    }
};

/**
 * Load Digital Twin from the embedded input field
 */
window.loadDigitalTwinFromInput = function () {
    const woInput = document.getElementById('woInput');
    const wo = woInput ? woInput.value.trim() : '';
    if (!wo) {
        alert('Please enter a Work Order number');
        return;
    }

    const loading = document.getElementById('dtLoadingState');
    const error = document.getElementById('dtErrorState');
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';

    if (typeof initDigitalTwin === 'function') {
        initDigitalTwin(wo);
    } else {
        if (loading) loading.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            document.getElementById('dtErrorMessage').textContent = 'Digital Twin module not loaded.';
        }
    }
};

/**
 * Alias for backward compatibility with dashboard
 */
window.showSection = function (sectionId) {
    showTab(sectionId === 'home' ? 'home' : sectionId);
};

/**
 * Navigate to the Manufacturing Checklist section and activate a specific stage tab.
 * Called from sidebar sub-nav items (Winding, VPD, Core Coil, Tanking, Tank Filling).
 * @param {string} stage  - e.g. 'winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling'
 * @param {HTMLElement} [el] - the clicked nav element (for active-state highlight)
 */
window.showChecklistStage = function (stage, el) {
    // 1. Navigate to the checklist section
    showTab('manufacturingChecklist');

    // 2. Mark the sidebar sub-item as active
    document.querySelectorAll('.nav-subitem').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');

    // 3. Activate the correct stage tab
    setTimeout(() => {
        if (typeof window.setChecklistStage === 'function') {
            window.setChecklistStage(stage);
        } else {
            window.showMainStage(stage, null);
        }
    }, 50);
};

// NOTE: window.showMainStage and window.switchStage are defined in
// /js/features/checklist.js — do NOT redefine them here.
// They render checklist rows via buildChecklistRow() and CHECKLIST_SCHEMA.


console.log('✅ Main.js loaded with Digital Twin support');

// ========== LAZY LOADING ==========
const loadedScripts = new Set();
const tabScripts = {
    'digitalTwin': '/js/features/digital-twin.js',
    'woTimeline': '/js/features/wo-timeline.js',
    'auditLog': '/js/features/audit.js',
    'analytics': '/js/features/analytics.js',
    'transformerProfile': '/js/features/transformer-profile.js'
    // Add more as needed
};

async function loadScriptIfNeeded(tabId) {
    const scriptPath = tabScripts[tabId];
    if (!scriptPath || loadedScripts.has(tabId)) return;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => {
            loadedScripts.add(tabId);
            console.log(`✅ Loaded script for ${tabId}`);
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ========== NAVIGATION ==========
window.showTab = async function (tabId) {
    console.log(`Navigate to: ${tabId}`);

    // Lazy load script if needed
    try {
        await loadScriptIfNeeded(tabId);
    } catch (error) {
        console.error(`Failed to load script for ${tabId}:`, error);
        // Continue anyway, some tabs might work without script
    }

    // Hide all sections
    document.querySelectorAll('.section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show target section
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    } else {
        console.error(`Section not found: ${tabId}`);
        return;
    }

    // Update Sidebar State
    updateActiveNavItem(tabId);

    // Update Title
    updatePageTitle(tabId);

    // ── Per-section refresh hooks ─────────────────────────
    setTimeout(() => {
        if (tabId === 'manufacturingChecklist') {
            if (typeof loadChecklistTransformers === 'function') loadChecklistTransformers();
        }
        // documentsSection covers both BOM Upload and Design Documents tabs
        if (tabId === 'documentsSection' || tabId === 'designDocuments' || tabId === 'bomUpload') {
            if (typeof updateTransformerDropdowns === 'function') updateTransformerDropdowns();
        }
        if (tabId === 'digitalTwin') {
            if (typeof populateDTWODropdown === 'function') populateDTWODropdown();
        }
        if (tabId === 'transformerMaster') {
            if (typeof loadCustomerList === 'function') loadCustomerList();
            if (typeof updateTransformerDropdowns === 'function') updateTransformerDropdowns();
        }
        if (tabId === 'dashboardSection') {
            if (typeof initAnalytics === 'function') initAnalytics();
        }
    }, 50);
};

function updateActiveNavItem(tabId) {
    const actualTab = tabId === 'home' ? 'dashboardSection' : 
                      (tabId === 'designDocuments' || tabId === 'bomUpload') ? 'documentsSection' : tabId;

    const navItems = document.querySelectorAll('.sidebar .nav-item, .sidebar .nav-subitem');
    navItems.forEach(el => {
        el.classList.remove('active');
        const onclickAttr = el.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${actualTab}'`) || onclickAttr.includes(`"${actualTab}"`)) {
            el.classList.add('active');
        }
    });
}

function updatePageTitle(tabId) {
    const titles = {
        'home':                   'Home',
        'dashboardSection':       'Analytics Dashboard',
        'transformerMaster':      'Transformer Master Registry',
        'documentsSection':       'Documents',
        'bomUpload':              'BOM Upload',          // legacy
        'designDocuments':        'Design Documents',    // legacy
        'manufacturingChecklist': 'Manufacturing Checklist',
        'designCalculations':     'IEC 60076 Calculator',
        'digitalTwin':            'Digital Twin',
        'woTimeline':             'WO Timeline',
        'exam':                   'Training & Exam',
        'auditLog':               'Audit Log',
        'usersSection':           'User Management',
        'questions':              'Question Bank'
    };

    const titleEl = document.getElementById('viewTitle');
    if (titleEl) {
        titleEl.innerText = titles[tabId] || titleEl.innerText;
    }

    // Update breadcrumbs
    const breadcrumbs = document.getElementById('breadcrumbs');
    const breadcrumbCurrent = breadcrumbs?.querySelector('.breadcrumb-current');
    if (breadcrumbs && breadcrumbCurrent) {
        if (tabId === 'home' || tabId === 'dashboardSection') {
            breadcrumbs.style.display = 'none';
        } else {
            breadcrumbs.style.display = 'flex';
            breadcrumbCurrent.textContent = titles[tabId] || tabId;
        }
    }
}

// ========== SUBMENU TOGGLE ==========
window.toggleSubmenu = function (element) {
    const submenu = element.nextElementSibling;
    if (submenu && submenu.classList.contains('nav-submenu')) {
        submenu.classList.toggle('active');
        element.classList.toggle('active');
    }
};

// ========== THEME HANDLING ==========
// Check local storage for theme preference
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Update button text
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
};

// ========== GLOBAL UTILS ==========
window.formatCurrency = function (amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Audit log filter/clear are provided by features/audit.js (uses auditEntity, auditStartDate, auditEndDate, auditResults).
