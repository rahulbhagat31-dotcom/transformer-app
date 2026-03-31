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

/* ===============================
   LOGIN HANDLER
================================ */
async function handleLogin(userId, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        });

        const result = await response.json();

        // Server returns {success: true, data: {token, user: {...}}}
        if (response.ok && result.success && result.data) {
            const { token, user } = result.data;

            // Store JWT token in localStorage (both keys for compatibility)
            localStorage.setItem('authToken', token);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Set global user state
            window.currentUserRole = user.role;
            window.currentUserName = user.name;
            window.currentUserId = user.userId;
            window.currentCustomerId = user.customerId;
            window.currentCustomerName = user.customerName || 'Unknown';

            console.log(`✅ Login successful: ${user.name} (${user.role})`);
            console.log('🔑 Token stored in localStorage');
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
    const isAdmin      = role === 'admin';
    const isQuality    = role === 'quality';
    const isProduction = role === 'production';
    const isCustomer   = role === 'customer';
    const isInternal   = isAdmin || isQuality || isProduction; // not customer

    // ─── Helper ───────────────────────────────────────────
    function show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
    function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

    // ─── 1. Role Badge ─────────────────────────────────────
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.className = `role-badge role-${role}`;
        const roleNames = {
            admin:      '&#x1F451; Admin',
            quality:    '&#x1F52C; Quality Engineer',
            production: '&#x1F3ED; Production Engineer',
            customer:   '&#x1F4BC; Customer'
        };
        roleBadge.innerHTML = roleNames[role] || role;
    }

    // ─── 2. Sidebar Navigation ─────────────────────────────
    // Dashboard — everyone sees it
    show('nav-dashboard');

    // Transformer Master — everyone sees it (customers: view-only enforced below)
    show('nav-transformer');

    // Documents — everyone sees it (upload hidden for customer/production below)
    show('nav-documents');

    // Manufacturing Checklist — everyone
    show('nav-checklist');

    // IEC Calculator — admin, quality, production YES | customer NO
    if (isCustomer) {
        hide('nav-calculator');
    } else {
        show('nav-calculator');
    }

    // Digital Twin — everyone
    show('nav-digital-twin');

    // Questions Bank — admin ONLY
    if (isAdmin) {
        show('questionsNav');
    } else {
        hide('questionsNav');
    }

    // MCQ Exam — admin, quality, production YES | customer NO
    if (isCustomer) {
        hide('nav-exam');
        hide('examSubmenu');
    } else {
        show('nav-exam');
    }

    // Analytics (inside dashboard tab) — admin, quality YES | production, customer NO
    const analyticsNav = document.getElementById('nav-analytics');
    if (analyticsNav) {
        (isAdmin || isQuality) ? show('nav-analytics') : hide('nav-analytics');
    }

    // Audit Log (inside dashboard tab) — admin, quality YES | production, customer NO
    const auditNav = document.getElementById('nav-audit');
    if (auditNav) {
        (isAdmin || isQuality) ? show('nav-audit') : hide('nav-audit');
    }

    // ─── 3. Transformer Master — Add/Edit/Delete ───────────
    // Only admin & quality can add/delete
    const canEdit = isAdmin || isQuality;
    const addCard = document.getElementById('addTransformerCard');
    if (addCard) addCard.style.display = canEdit ? '' : 'none';

    // Edit/Delete buttons in table — hide for production & customer
    document.querySelectorAll('.btn-edit-transformer, .btn-delete-transformer').forEach(btn => {
        btn.style.display = canEdit ? '' : 'none';
    });

    // ─── 4. BOM & Documents Upload ─────────────────────────
    // Admin & quality can upload; production & customer view only
    const bomUploadSection  = document.getElementById('bomUploadSection');
    const docUploadSection  = document.getElementById('docUploadSection');
    if (bomUploadSection)  bomUploadSection.style.display  = canEdit ? '' : 'none';
    if (docUploadSection)  docUploadSection.style.display  = canEdit ? '' : 'none';

    // ─── 5. Manufacturing Checklist ─────────────────────────
    // Customer: read-only notice shown, inputs disabled
    if (isCustomer) {
        const editNotice = document.getElementById('checklistEditNotice');
        if (editNotice) editNotice.style.display = 'block';
        // Disable all checklist inputs
        document.querySelectorAll('#stageContent input, #stageContent select, #stageContent textarea').forEach(el => {
            el.disabled = true;
        });
    }

    // Bulk sign-off button: only admin & quality
    const bulkBtn = document.getElementById('bulkSignOffBtn');
    if (bulkBtn) bulkBtn.style.display = canEdit ? '' : 'none';

    // Stage lock/unlock controls: admin & quality only
    document.querySelectorAll('.btn-lock-stage, .btn-unlock-stage').forEach(btn => {
        btn.style.display = canEdit ? '' : 'none';
    });

    // ─── 6. Design Calculations ─────────────────────────────
    // Customer: sees simplified summary view only
    const customerCalcView  = document.getElementById('customerCalcView');
    const engineerCalcView  = document.getElementById('engineerCalcView');
    if (isCustomer) {
        if (customerCalcView)  customerCalcView.style.display  = 'block';
        if (engineerCalcView)  engineerCalcView.style.display  = 'none';
        if (typeof loadCustomerCalculations === 'function') loadCustomerCalculations();
    } else {
        if (customerCalcView)  customerCalcView.style.display  = 'none';
        if (engineerCalcView)  engineerCalcView.style.display  = 'block';
    }

    // ─── 7. Analytics Dashboard Tabs ───────────────────────
    // Hide analytics section entirely for production & customer
    const analyticsSection = document.getElementById('analyticsSection') ||
                             document.querySelector('[data-section="analytics"]');
    if (analyticsSection && (isProduction || isCustomer)) {
        analyticsSection.style.display = 'none';
    }

    // ─── 8. Audit Log ─────────────────────────────────────
    // Hide audit section for production & customer
    const auditSection = document.getElementById('auditSection') ||
                         document.querySelector('[data-section="audit"]');
    if (auditSection && (isProduction || isCustomer)) {
        auditSection.style.display = 'none';
    }

    // ─── 9. Customer Notice on Home ────────────────────────
    const customerNotice = document.getElementById('customerNotice');
    if (customerNotice) customerNotice.style.display = isCustomer ? 'block' : 'none';

    // ─── 10. Customer label in header ──────────────────────
    const customerLabel = document.getElementById('customerLabel');
    if (customerLabel && window.currentCustomerName && isCustomer) {
        customerLabel.innerHTML = '&#x1F3E2; ' + window.currentCustomerName;
        customerLabel.style.display = 'block';
    }

    // ─── 11. User Management nav ──────────────────────────
    // Admin only
    if (isAdmin) {
        show('nav-users');
    } else {
        hide('nav-users');
    }

    console.log(`&#x1F512; RBAC applied for role: ${role}`);
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