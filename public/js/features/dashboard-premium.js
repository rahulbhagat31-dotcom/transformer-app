/**
 * ================================================
 * PREMIUM DASHBOARD - JAVASCRIPT
 * Modern, data-driven dashboard with real-time KPIs
 * ================================================
 */

// Stage constants are defined in digital-twin.js (loaded before this file)
// No need to redeclare them here

// Stage icons — canonical keys matching backend STAGE_ORDER in stageControl.js
const STAGE_ICONS = {
    design: '📐',
    winding: '🔧',
    vpd: '🔬',
    coreCoil: '⚙️',
    tanking: '🛢️',
    tankFilling: '💧',
    testing: '⚡',
    completed: '✅'
};

// Stage colors — canonical keys
const STAGE_COLORS = {
    design: 'var(--stage-design, #667eea)',
    winding: 'var(--stage-winding, #3498db)',
    vpd: 'var(--stage-vpd, #9b59b6)',
    coreCoil: 'var(--stage-core, #e67e22)',
    tanking: 'var(--stage-tanking, #16a085)',
    tankFilling: 'var(--stage-tankfilling, #2874a6)',
    testing: 'var(--stage-testing, #f39c12)',
    completed: 'var(--stage-complete, #27ae60)'
};

// Dashboard state
const dashboardState = {
    user: null,
    transformers: [],
    pendingQA: [],
    delayed: [],
    auditLogs: []
};

/**
 * Initialize Premium Dashboard
 */
async function initPremiumDashboard() {
    try {
        // Get current user from session
        dashboardState.user = window.currentUser || JSON.parse(localStorage.getItem('user'));

        if (!dashboardState.user) {
            console.error('No user found');
            return;
        }

        console.log('🚀 Initializing Premium Dashboard for:', dashboardState.user.role);

        // Show loading skeletons
        showLoadingSkeletons();

        // Load data from existing APIs
        await Promise.all([
            loadTransformers(),
            loadPendingQA(),
            loadDelayedStages(),
            loadAuditLogs()
        ]);

        // Render KPI cards
        renderKPICards();

        // Render Manufacturing Timeline
        renderManufacturingTimeline();

        // Render Pending Actions Panel
        renderPendingActions();

        // Render Activity Stream
        renderActivityStream();

        // Apply role-based visibility
        applyRoleBasedVisibility();

        console.log('✅ Premium Dashboard loaded');

    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showErrorState();
    }
}

/**
 * Load transformers from existing API
 * API: GET /api/transformers
 * Server-side filtering by customerId for customers
 */
async function loadTransformers() {
    try {
        const result = await apiRequest('/api/transformers');
        if (result.success) {
            dashboardState.transformers = result.data || [];
            console.log(`📊 Loaded ${dashboardState.transformers.length} transformers`);
        }
    } catch (error) {
        console.error('Error loading transformers:', error);
        dashboardState.transformers = [];
    }
}

/**
 * Load pending QA items from existing API
 * API: GET /api/checklist/pending-qa
 * Requires quality+ permission (enforced server-side)
 */
async function loadPendingQA() {
    try {
        if (!['admin', 'quality'].includes(dashboardState.user.role)) return;
        const result = await apiRequest('/api/checklist/pending-qa');
        if (result.success) {
            dashboardState.pendingQA = result.data || [];
            console.log(`⚠️ Loaded ${dashboardState.pendingQA.length} pending QA items`);
        }
    } catch (error) {
        console.error('Error loading pending QA:', error);
        dashboardState.pendingQA = [];
    }
}

/**
 * Load delayed stages from existing API
 * API: GET /api/transformers/delayed
 * Admin/Quality/Production only
 */
async function loadDelayedStages() {
    try {
        if (dashboardState.user.role === 'customer') return;
        const result = await apiRequest('/api/transformers/delayed');
        if (result.success) {
            dashboardState.delayed = result.data || [];
            console.log(`🔴 Loaded ${dashboardState.delayed.length} delayed stages`);
        }
    } catch (error) {
        console.error('Error loading delayed stages:', error);
        dashboardState.delayed = [];
    }
}

/**
 * Load audit logs from existing API
 * API: GET /api/audit/logs?limit=10
 * Requires quality+ permission (enforced server-side)
 */
async function loadAuditLogs() {
    try {
        if (!['admin', 'quality'].includes(dashboardState.user.role)) return;
        const result = await apiRequest('/api/audit/logs?limit=10');
        if (result.success) {
            dashboardState.auditLogs = result.data?.logs || result.data || [];
            console.log(`📜 Loaded ${dashboardState.auditLogs.length} audit logs`);
        }
    } catch (error) {
        console.error('Error loading audit logs:', error);
        dashboardState.auditLogs = [];
    }
}

/**
 * Render KPI Cards with animated counters
 */
function renderKPICards() {
    const kpiGrid = document.getElementById('kpiGrid');
    if (!kpiGrid) return;

    // Calculate KPIs from loaded data
    const kpis = calculateKPIs();

    // Clear loading skeletons
    kpiGrid.innerHTML = '';

    // Render each KPI card
    kpis.forEach((kpi, index) => {
        const card = createKPICard(kpi);
        kpiGrid.appendChild(card);

        // Animate counter with delay
        setTimeout(() => {
            animateCounter(card.querySelector('.kpi-card-value'), kpi.value);
        }, index * 100);
    });
}

/**
 * Render Manufacturing Timeline
 * Uses existing transformer data - no new API calls
 */
function renderManufacturingTimeline() {
    const timelineContainer = document.querySelector('.manufacturing-timeline');
    if (!timelineContainer) return;

    // Calculate stage distribution from existing data
    const stageDistribution = calculateStageDistribution();

    // Zero-state: No transformers
    if (stageDistribution.isEmpty) {
        timelineContainer.innerHTML = `
            <div class="timeline-container fade-in">
                <div class="timeline-header">
                    <div>
                        <h2 class="timeline-title">📈 Manufacturing Flow</h2>
                        <p class="timeline-subtitle">No transformers in production yet</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <p>Stage distribution will appear when transformers are added to the system.</p>
                </div>
            </div>
        `;
        return;
    }

    // Create timeline HTML
    timelineContainer.innerHTML = `
        <div class="timeline-container fade-in">
            <div class="timeline-header">
                <div>
                    <h2 class="timeline-title">📈 Manufacturing Flow</h2>
                    <p class="timeline-subtitle">Live stage distribution across ${stageDistribution.total} transformers</p>
                </div>
            </div>

            <!-- Stage Tracker Visual -->
            <div class="stage-tracker">
                ${renderStageTracker(stageDistribution)}
            </div>

            <!-- Overall Progress Bar -->
            <div class="progress-section">
                <div class="progress-header">
                    <span class="progress-label">Overall Completion</span>
                    <span class="progress-percentage">${stageDistribution.completionPercentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        ${renderProgressSegments(stageDistribution)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Calculate stage distribution from transformer data
 * Client-side calculation - no API calls
 *
 * Completion Percentage Definition:
 * - Completed transformers = dispatch + completed stages
 * - Percentage = (completed / total) * 100
 * - Represents transformers that have finished manufacturing
 */
function calculateStageDistribution() {
    const transformers = dashboardState.transformers;

    // Zero-state handling
    if (!transformers || transformers.length === 0) {
        return {
            stages: STAGE_ORDER,
            distribution: Object.fromEntries(STAGE_ORDER.map(s => [s, 0])),
            total: 0,
            completed: 0,
            completionPercentage: 0,
            isEmpty: true
        };
    }

    // Count transformers in each stage
    const distribution = {};
    STAGE_ORDER.forEach(stage => {
        distribution[stage] = transformers.filter(t => t.stage === stage).length;
    });

    // Calculate completion percentage — only 'completed' stage counts
    const total = transformers.length;
    const completed = distribution.completed || 0;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        stages: STAGE_ORDER,
        distribution,
        total,
        completed,
        completionPercentage,
        isEmpty: false
    };
}

/**
 * Render stage tracker badges
 */
function renderStageTracker(stageDistribution) {
    const { stages, distribution } = stageDistribution;

    return stages.map(stage => {
        const count = distribution[stage] || 0;
        const isActive = count > 0;

        return `
            <div class="stage-item">
                <div class="stage-badge stage-${stage} ${isActive ? 'active' : ''}">
                    ${STAGE_ICONS[stage]}
                    ${count > 0 ? `<span class="stage-count">${count}</span>` : ''}
                </div>
                <div class="stage-label">${STAGE_LABELS[stage]}</div>
                <div class="stage-units">${count} units</div>
            </div>
        `;
    }).join('');
}

/**
 * Render progress bar segments
 */
function renderProgressSegments(stageDistribution) {
    const { stages, distribution, total } = stageDistribution;

    if (total === 0) {
        return '<div class="progress-segment" style="width: 100%; background: var(--bg-tertiary);"></div>';
    }

    return stages.map(stage => {
        const count = distribution[stage] || 0;
        if (count === 0) return '';

        const percentage = (count / total) * 100;
        return `
            <div class="progress-segment"
                 style="width: ${percentage}%; background: ${STAGE_COLORS[stage]};"
                 data-label="${count} ${stage}"
                 title="${count} transformers in ${stage}">
            </div>
        `;
    }).join('');
}

/**
 * Calculate KPIs from dashboard data
 * Client-side calculation from API responses
 */
function calculateKPIs() {
    const transformers = dashboardState.transformers;
    const user = dashboardState.user;

    // Total Transformers
    const total = transformers.length;

    // In Production (not completed)
    const inProduction = transformers.filter(t =>
        t.stage !== 'completed'
    ).length;

    // Completed
    const completed = transformers.filter(t =>
        t.stage === 'completed'
    ).length;

    // Role-specific 4th KPI
    let fourthKPI;
    if (user.role === 'quality' || user.role === 'admin') {
        // Pending QA for quality roles
        fourthKPI = {
            title: 'Pending QA',
            value: dashboardState.pendingQA.length,
            icon: '⚠️',
            variant: 'warning',
            change: { value: 0, type: 'neutral' }
        };
    } else if (user.role === 'production') {
        // Delayed stages for production
        fourthKPI = {
            title: 'Delayed',
            value: dashboardState.delayed.length,
            icon: '🔴',
            variant: 'danger',
            change: { value: 0, type: 'neutral' }
        };
    } else {
        // On-time percentage for customers
        const onTime = total > 0 ? Math.round((total - dashboardState.delayed.length) / total * 100) : 100;
        fourthKPI = {
            title: 'On Time',
            value: `${onTime}%`,
            icon: '✅',
            variant: 'success',
            change: { value: 0, type: 'neutral' }
        };
    }

    return [
        {
            title: 'Total',
            value: total,
            icon: '📊',
            variant: 'primary',
            change: { value: 8, type: 'positive' }
        },
        {
            title: 'In Production',
            value: inProduction,
            icon: '⚙️',
            variant: 'primary',
            change: { value: 3, type: 'negative' }
        },
        {
            title: 'Completed',
            value: completed,
            icon: '✅',
            variant: 'success',
            change: { value: 5, type: 'positive' }
        },
        fourthKPI
    ];
}

/**
 * Create KPI Card Element
 */
function createKPICard(kpi) {
    const card = document.createElement('div');
    card.className = `kpi-card variant-${kpi.variant} fade-in`;

    card.innerHTML = `
        <div class="kpi-card-header">
            <h3 class="kpi-card-title">${kpi.title}</h3>
            <span class="kpi-card-icon">${kpi.icon}</span>
        </div>
        <div class="kpi-card-value" data-target="${kpi.value}">0</div>
        ${kpi.change ? `
            <div class="kpi-card-change ${kpi.change.type}">
                <span class="kpi-card-change-icon">${kpi.change.type === 'positive' ? '▲' : kpi.change.type === 'negative' ? '▼' : '●'}</span>
                <span>${kpi.change.value > 0 ? '+' : ''}${kpi.change.value} (${Math.abs(kpi.change.value)}%)</span>
            </div>
        ` : ''}
    `;

    return card;
}

/**
 * Animate counter from 0 to target value
 */
function animateCounter(element, target) {
    if (!element) return;

    // Handle percentage values
    const isPercentage = typeof target === 'string' && target.includes('%');
    const numericTarget = isPercentage ? parseInt(target) : target;

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = numericTarget / steps;
    const stepDuration = duration / steps;

    let current = 0;

    const timer = setInterval(() => {
        current += increment;

        if (current >= numericTarget) {
            current = numericTarget;
            clearInterval(timer);
        }

        element.textContent = isPercentage
            ? `${Math.round(current)}%`
            : Math.round(current);

        element.classList.add('counting');
        setTimeout(() => element.classList.remove('counting'), 100);
    }, stepDuration);
}

/**
 * Show loading skeletons
 */
function showLoadingSkeletons() {
    const kpiGrid = document.getElementById('kpiGrid');
    if (!kpiGrid) return;

    kpiGrid.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'kpi-card loading';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-value"></div>
            <div class="skeleton skeleton-change"></div>
        `;
        kpiGrid.appendChild(skeleton);
    }
}

/**
 * Apply role-based visibility (UX-only, not security)
 * Server-side permissions remain authoritative
 */
function applyRoleBasedVisibility() {
    const user = dashboardState.user;

    // Hide manufacturing timeline for customers (UX convenience)
    if (user.role === 'customer' || user.role.includes('customer')) {
        hideElement('.manufacturing-timeline');
        hideElement('.pending-actions-panel');
    }

    // Hide audit stream for non-quality roles (UX convenience)
    if (!['admin', 'quality'].includes(user.role)) {
        hideElement('.activity-stream');
    }

    console.log(`👁️ Applied role-based visibility for: ${user.role}`);
}

/**
 * Utility: Hide element
 */
function hideElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('hidden');
    }
}

/**
 * Show error state
 */
function showErrorState() {
    const kpiGrid = document.getElementById('kpiGrid');
    if (!kpiGrid) return;

    kpiGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h3>Failed to load dashboard</h3>
            <p>Please refresh the page or contact support.</p>
        </div>
    `;
}

// Export for use by main app (called when dashboard section becomes active)
window.initPremiumDashboard = initPremiumDashboard;

console.log('📊 Premium Dashboard script loaded');
