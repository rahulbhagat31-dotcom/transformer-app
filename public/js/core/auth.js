/* ===============================
   AUTHENTICATION & AUTHORIZATION
   User login, role management, permissions
================================ */

// Global user state
window.currentUserRole = '';
window.currentUserName = '';
window.currentUserId = '';
window.currentCustomerId = '';
window.currentCustomerName = '';

// Centralized role display configuration
const ROLE_DISPLAY_NAMES = {
    admin: '👑 Admin',
    quality: '🔬 Quality Engineer',
    production: '🏭 Production Engineer',
    customer: '💼 Customer'
};

/* ===============================
   LOGIN HANDLER
================================ */
async function handleLogin(userId, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Required to receive & send HttpOnly cookie
            body: JSON.stringify({ userId, password })
        });

        const result = await response.json();

        // Server returns {success: true, data: {user: {...}}}
        if (response.ok && result.success && result.data) {
            const { user } = result.data;

            // Cookie (HttpOnly) is set automatically by server — never touches localStorage
            // Store user profile only (non-sensitive, needed for role/name display)
            localStorage.setItem('user', JSON.stringify(user));

            // Keep rememberedUserId for login-form pre-fill (not a secret)
            localStorage.setItem('rememberedUserId', user.userId);

            // Set global user state
            window.currentUserRole = user.role;
            window.currentUserName = user.name;
            window.currentUserId = user.userId;
            window.currentCustomerId = user.customerId;
            window.currentCustomerName = user.customerName || 'Unknown';

            console.log(`✅ Login successful: ${user.name} (${user.role})`);
            console.log('🍪 Session cookie set by server (HttpOnly — XSS-safe)');
            return { success: true, user };
        } else {
            throw new Error(result.error || result.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}

/* ===============================
   PERMISSION HELPERS
================================ */
function hasPermission(requiredRole) {
    const hierarchy = {
        'admin': 3,
        'quality': 2,
        'production': 1,
        'customer': 0
    };
    return hierarchy[window.currentUserRole] >= hierarchy[requiredRole];
}

function applyRoleRestrictions() {
    const role = window.currentUserRole;
    const permissions = {
        isAdmin: role === 'admin',
        isQuality: role === 'quality',
        isProduction: role === 'production',
        isCustomer: role === 'customer'
    };

    updateRoleBadge(role);
    updateSidebarNavigation(permissions);
    updateTransformerMasterUI(permissions);
    updateDocumentsUI(permissions);
    updateManufacturingChecklist(permissions);
    updateDesignCalculations(permissions);
    updateDashboardUI(permissions);

    console.log(`🔒 RBAC applied for role: ${role}`);
}

function updateRoleBadge(role) {
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.className = `role-badge role-${role}`;
        roleBadge.innerHTML = ROLE_DISPLAY_NAMES[role] || role;
    }

    const customerLabel = document.getElementById('customerLabel');
    if (customerLabel && window.currentCustomerName && role === 'customer') {
        customerLabel.innerHTML = '🏢 ' + window.currentCustomerName;
        customerLabel.style.display = 'block';
    }
}

function updateSidebarNavigation({ isAdmin, isCustomer }) {
    const show = (id) => { const el = document.getElementById(id); if (el) el.style.display = ''; };
    const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };

    show('nav-dashboard');
    show('nav-transformer');
    show('nav-documents');
    show('nav-checklist');
    show('nav-digital-twin');

    isCustomer ? hide('nav-calculator') : show('nav-calculator');
    isAdmin ? show('questionsNav') : hide('questionsNav');

    if (isCustomer) {
        hide('nav-exam');
        hide('examSubmenu');
    } else {
        show('nav-exam');
    }

    isAdmin ? show('nav-users') : hide('nav-users');
}

function updateTransformerMasterUI({ isAdmin, isQuality }) {
    const canEdit = isAdmin || isQuality;
    const addCard = document.getElementById('addTransformerCard');
    if (addCard) addCard.style.display = canEdit ? '' : 'none';

    document.querySelectorAll('.btn-edit-transformer, .btn-delete-transformer').forEach(btn => {
        btn.style.display = canEdit ? '' : 'none';
    });
}

function updateDocumentsUI({ isAdmin, isQuality }) {
    const canEdit = isAdmin || isQuality;
    const bomUploadSection = document.getElementById('bomUploadSection');
    const docUploadSection = document.getElementById('docUploadSection');
    if (bomUploadSection) bomUploadSection.style.display = canEdit ? '' : 'none';
    if (docUploadSection) docUploadSection.style.display = canEdit ? '' : 'none';
}

function updateManufacturingChecklist({ isAdmin, isQuality, isCustomer }) {
    const canEdit = isAdmin || isQuality;

    if (isCustomer) {
        const editNotice = document.getElementById('checklistEditNotice');
        if (editNotice) editNotice.style.display = 'block';
        document.querySelectorAll('#stageContent input, #stageContent select, #stageContent textarea').forEach(el => {
            el.disabled = true;
        });
    }

    const bulkBtn = document.getElementById('bulkSignOffBtn');
    if (bulkBtn) bulkBtn.style.display = canEdit ? '' : 'none';

    document.querySelectorAll('.btn-lock-stage, .btn-unlock-stage').forEach(btn => {
        btn.style.display = canEdit ? '' : 'none';
    });
}

function updateDesignCalculations({ isCustomer }) {
    const customerCalcView = document.getElementById('customerCalcView');
    const engineerCalcView = document.getElementById('engineerCalcView');
    if (isCustomer) {
        if (customerCalcView) customerCalcView.style.display = 'block';
        if (engineerCalcView) engineerCalcView.style.display = 'none';
        if (typeof loadCustomerCalculations === 'function') loadCustomerCalculations();
    } else {
        if (customerCalcView) customerCalcView.style.display = 'none';
        if (engineerCalcView) engineerCalcView.style.display = 'block';
    }
}

function updateDashboardUI({ isAdmin, isQuality, isProduction, isCustomer }) {
    const analyticsSection = document.getElementById('analyticsSection') || document.querySelector('[data-section="analytics"]');
    if (analyticsSection && (isProduction || isCustomer)) {
        analyticsSection.style.display = 'none';
    }

    const auditSection = document.getElementById('auditSection') || document.querySelector('[data-section="audit"]');
    if (auditSection && (isProduction || isCustomer)) {
        auditSection.style.display = 'none';
    }

    const customerNotice = document.getElementById('customerNotice');
    if (customerNotice) customerNotice.style.display = isCustomer ? 'block' : 'none';

    const analyticsNav = document.getElementById('nav-analytics');
    if (analyticsNav) {
        (isAdmin || isQuality) ? analyticsNav.style.display = '' : analyticsNav.style.display = 'none';
    }

    const auditNav = document.getElementById('nav-audit');
    if (auditNav) {
        (isAdmin || isQuality) ? auditNav.style.display = '' : auditNav.style.display = 'none';
    }
}


/* ===============================
   INITIALIZE LOGIN FORM
================================ */
function initializeAuth() {
    const authForm = document.getElementById('authForm');

    // Pre-fill remembered user ID
    const remembered = localStorage.getItem('rememberedUserId');
    if (remembered) {
        const userInput = document.getElementById('userInput');
        if (userInput) userInput.value = remembered;
    }

    if (authForm) {
        authForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const userId = document.getElementById('userInput').value.trim();
            const password = document.getElementById('passInput').value;
            const loginBtn = document.getElementById('loginBtn');
            const loginBtnText = document.getElementById('loginBtnText');
            const loginBtnArrow = document.getElementById('loginBtnArrow');
            const errorDiv = document.getElementById('loginError');

            // Clear previous error
            if (errorDiv) { errorDiv.style.display = 'none'; errorDiv.textContent = ''; }

            // Loading state
            if (loginBtn) { loginBtn.disabled = true; }
            if (loginBtnText) loginBtnText.textContent = 'Signing in…';
            if (loginBtnArrow) loginBtnArrow.style.display = 'none';

            try {
                await handleLogin(userId, password);

                // Remember user ID (not password)
                localStorage.setItem('rememberedUserId', userId);

                // Hide login, show main app
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'flex';
                document.getElementById('uLabel').innerText = window.currentUserName;

                // ── Reset any stale modal state from previous session ──
                ['rowUnlockModal', 'rowLockModal'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.classList.remove('open'); el.style.display = 'none'; }
                });

                // Display customer name if element exists
                const customerLabel = document.getElementById('customerLabel');
                if (customerLabel && window.currentCustomerName) {
                    customerLabel.innerText = window.currentCustomerName;
                    customerLabel.style.display = 'block';
                }

                // Apply role-based restrictions
                applyRoleRestrictions();

                // Start session inactivity timer
                if (typeof startSessionTimer === 'function') startSessionTimer();

                // &#x2705; Initialize audit access for admin/quality users
                initializeAuditAccess();

                // Initialize other modules
                if (typeof loadStageContent === 'function') loadStageContent('winding1');
                if (typeof generateWindingForms === 'function') generateWindingForms();
                if (typeof loadCustomerList === 'function') loadCustomerList();
                if (typeof updateTransformerDropdowns === 'function') updateTransformerDropdowns();
                if (typeof loadChecklistTransformers === 'function') loadChecklistTransformers();

                // Analytics should only load after a user session is confirmed
                if (typeof initAnalytics === 'function' && document.getElementById('dashboardSection')?.classList.contains('active')) {
                    initAnalytics();
                }

            } catch (error) {
                // Show inline error instead of alert
                if (errorDiv) {
                    errorDiv.textContent = '❌ ' + (error.message || 'Login failed. Please check your credentials.');
                    errorDiv.style.display = 'block';
                } else {
                    alert('Login failed: ' + error.message);
                }
            } finally {
                // Restore button state
                if (loginBtn) loginBtn.disabled = false;
                if (loginBtnText) loginBtnText.textContent = 'Sign In';
                if (loginBtnArrow) loginBtnArrow.style.display = '';
            }
        });
    }
}
// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// Export functions
window.handleLogin = handleLogin;
window.hasPermission = hasPermission;
window.applyRoleRestrictions = applyRoleRestrictions;