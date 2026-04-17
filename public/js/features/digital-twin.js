/**
 * ================================================
 * DIGITAL TWIN - JAVASCRIPT
 * Read-only transformer profile using existing APIs
 * ================================================
 */

// Lightweight HTML sanitizer for XSS prevention
var sanitizeHTML = (function() {
    function _sanitize(str) {
        if (str == null) return '';
        if (typeof str !== 'string') return String(str);
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    return _sanitize;
})();

// Canonical stage order — must match backend STAGE_ORDER in stageControl.js
if (typeof STAGE_ORDER === 'undefined') {
    var STAGE_ORDER = ['design', 'winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling', 'testing', 'completed'];
}
if (typeof STAGE_LABELS === 'undefined') {
    var STAGE_LABELS = {
        design: 'Design',
        winding: 'Winding',
        vpd: 'VPD',
        coreCoil: 'Core/Coil',
        tanking: 'Tanking',
        tankFilling: 'Tank Filling',
        testing: 'Testing',
        completed: 'Completed'
    };
}

// Digital Twin state
const digitalTwinState = {
    selectedWO: null,
    transformer: null,
    user: null,
    isLoading: false,
    error: null,
    dropdownPopulated: false,

    // Data for future phases
    checklist: null,      // DT-2, DT-3
    documents: null,      // DT-4
    auditLogs: null       // DT-4
};

const DigitalTwinAPI = {
    async fetchWithAuth(url, options = {}) {
        const headers = { ...options.headers };
        const res = await fetch(url, { ...options, credentials: 'include', headers });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    getLocalDB(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};

const DigitalTwinOrchestrator = {
    async loadAllData(wo) {
        // Critical dependency
        await loadTransformerData(wo);
        // Optional metadata
        const results = await Promise.allSettled([
            loadChecklistData(wo),
            loadAuditLogs(wo)
        ]);
        results.forEach((res, index) => {
            if (res.status === 'rejected') {
                console.warn(`[Orchestrator] Optional metadata dataset ${index} failed:`, res.reason);
            }
        });
    },
    renderAllUI() {
        renderDTNavigation();
        renderDTHeader();
        renderLifecycleTimeline();
        renderCurrentStageSnapshot();
        renderManufacturingHistory();
        renderDocuments();
        renderAuditTimeline();
    }
};

/**
 * Update UI state functions for Digital Twin (Hoisted)
 */
function showDTContent() {
    const emptyState = document.getElementById('dtEmptyState');
    const dtNav = document.getElementById('dtNav');
    const dtContent = document.getElementById('dtContent');
    if (emptyState) emptyState.style.display = 'none';
    if (dtNav) dtNav.style.display = 'block';
    if (dtContent) dtContent.style.display = 'block';
}

function showDTEmptyState() {
    const emptyState = document.getElementById('dtEmptyState');
    const dtNav = document.getElementById('dtNav');
    const dtContent = document.getElementById('dtContent');
    if (emptyState) emptyState.style.display = 'block';
    if (dtNav) dtNav.style.display = 'none';
    if (dtContent) dtContent.style.display = 'none';
}

function showDTError(msg) {
    if (typeof showNotification === 'function') {
        showNotification(msg, 'error');
    } else {
        console.error('DT Error:', msg);
    }
}

// Expose UI functions to the global scope under DigitalTwinUI namespace
window.DigitalTwinUI = window.DigitalTwinUI || {};
window.DigitalTwinUI.showDTContent = showDTContent;
window.DigitalTwinUI.showDTEmptyState = showDTEmptyState;
window.DigitalTwinUI.showDTError = showDTError;
window.DigitalTwinUI.toggleStageSection = toggleStageSection;
window.toggleStageSection = toggleStageSection; // Alias for direct onclick usage

/**
 * Initialize Digital Twin page
 * @param {string} wo - Work order number
 */
async function initDigitalTwin(wo) {
    digitalTwinState.selectedWO = wo;
    digitalTwinState.user = window.currentUser || JSON.parse(localStorage.getItem('user'));

    if (!digitalTwinState.user) {
        console.error('No user found');
        showDTError('Please log in to view this page');
        return;
    }

    console.log(`🔧 Initializing Digital Twin for: ${wo}`);

    try {
        digitalTwinState.isLoading = true;

        await DigitalTwinOrchestrator.loadAllData(wo);
        DigitalTwinOrchestrator.renderAllUI();

        // Apply role-based visibility
        if (typeof applyDigitalTwinVisibility === 'function') {
            applyDigitalTwinVisibility(digitalTwinState.user.role);
        }

        digitalTwinState.isLoading = false;
        console.log('✅ Digital Twin loaded');
        if (typeof window.DigitalTwinUI.showDTContent === 'function') window.DigitalTwinUI.showDTContent();

    } catch (error) {
        console.error('❌ Digital Twin initialization error:', error);
        digitalTwinState.isLoading = false;
        if (typeof window.DigitalTwinUI.showDTError === 'function') window.DigitalTwinUI.showDTError(error.message || 'Failed to load transformer data');
        if (typeof window.DigitalTwinUI.showDTEmptyState === 'function') window.DigitalTwinUI.showDTEmptyState();
    }
}

/**
 * Load transformer data
 * Priority:
 * 1. Local Database 'transformer_db' (Real-time Engineering Handover)
 * 2. API /api/transformers (Backend Mock)
 */
async function loadTransformerData(wo) {
    try {
        console.log(`🔍 Searching for WO: ${wo}`);
        let transformer = null;

        // 1. Try LocalStorage (Phase 3 Integration)
        const db = DigitalTwinAPI.getLocalDB('transformer_db');
        if (db) {
            const localMatch = db.find(t => t.wo === wo);
            if (localMatch) {
                console.log('✅ Found in Engineering Handover DB (localStorage)');
                transformer = localMatch;

                // Ensure actuals exist (Mock generation if missing)
                if (!transformer.actuals && transformer.designData) {
                    transformer.actuals = generateMockActuals(transformer.designData);
                }
            }
        }

        // 2. Fallback to API if not found locally
        if (!transformer) {
            console.log('🌐 Local not found, fetching from API...');
            const result = await DigitalTwinAPI.fetchWithAuth(`/transformers?wo=${encodeURIComponent(wo)}`);
            if (result.success && result.data) {
                const dataArray = Array.isArray(result.data) ? result.data : [result.data];
                transformer = dataArray.find(t => t.wo === wo);
            } else {
                throw new Error(result.message || 'API fetch failed');
            }
        }

        if (transformer) {
            digitalTwinState.transformer = transformer;
            console.log(`📊 Loaded transformer: ${transformer.wo}`);
            return transformer;
        } else {
            throw new Error(`Transformer ${wo} not found in System or Engineering DB`);
        }
    } catch (error) {
        console.error('Error loading transformer data:', error);
        throw error;
    }
}

/**
 * Generate Mock "Actual" Manufacturing Data for Comparison
 * (Simulates manufacturing deviations)
 */
function generateMockActuals(design) {
    const d = design.calculations;
    if (!d) return null;

    // Helper: Add random deviation +/- percentage
    const deviate = (val, percent) => {
        const factor = 1 + (Math.random() * percent * 2 - percent) / 100;
        return val * factor;
    };

    return {
        core: {
            noLoadLoss: deviate(d.losses.coreLoss, 5), // +/- 5%
            weight: deviate(d.dimensions.weights.core, 2)
        },
        winding: {
            loadLoss: deviate(d.losses.copperLoss.total, 3),
            resistance: deviate(0.5, 2) // Placeholder
        },
        testing: {
            efficiency: deviate(d.losses.efficiency, 0.1),
            impedance: deviate(d.impedance.percentImpedance, 4)
        }
    };
}

/**
 * Load checklist data for current stage
 * API: GET /api/checklist
 */
async function loadChecklistData(wo) {
    try {
        const result = await DigitalTwinAPI.fetchWithAuth(`/checklist/all?wo=${encodeURIComponent(wo)}`);

        if (result.success) {
            // Filter checklists for this work order
            const checklists = result.data.filter(c => c.wo === wo);
            digitalTwinState.checklist = checklists;
            console.log(`📋 Loaded ${checklists.length} checklist(s) for ${wo}`);
        } else {
            // Non-critical: checklist data is optional
            console.warn('Failed to load checklist data:', result.message);
            digitalTwinState.checklist = [];
        }
    } catch (error) {
        // Non-critical: checklist data is optional
        console.warn('Error loading checklist data:', error);
        digitalTwinState.checklist = [];
    }
}

/**
 * Load audit logs for this transformer
 * API: GET /api/audit/logs
 */
async function loadAuditLogs(wo) {
    // Client-side guard for Role-Based Visibility
    if (digitalTwinState.user && digitalTwinState.user.role === 'customer') {
        digitalTwinState.auditLogs = [];
        return;
    }

    try {
        const result = await DigitalTwinAPI.fetchWithAuth(`/audit/logs?wo=${encodeURIComponent(wo)}`);

        if (result.success) {
            // Filter audit logs for this work order
            const auditData = result.data.logs || result.data || [];
            const auditLogs = auditData.filter(log => log.wo === wo || log.entityId === wo);
            digitalTwinState.auditLogs = auditLogs;
            console.log(`📜 Loaded ${auditLogs.length} audit log(s) for ${wo}`);
        } else {
            // Non-critical: audit data is optional
            console.warn('Failed to load audit logs:', result.message);
            digitalTwinState.auditLogs = [];
        }
    } catch (error) {
        // Non-critical: audit data is optional
        console.warn('Error loading audit logs:', error);
        digitalTwinState.auditLogs = [];
    }
}

/**
 * Render navigation bar
 */
function renderDTNavigation() {
    const navContainer = document.getElementById('dtNav');
    if (!navContainer) return;

    const wo = digitalTwinState.selectedWO;
    const user = digitalTwinState.user;

    navContainer.innerHTML = `
        <button class="dt-back-btn" onclick="navigateToDashboard()">
            ← Back to Dashboard
        </button>
        <div class="dt-breadcrumb">
            <span>Dashboard</span>
            <span class="separator">›</span>
            <span>Transformer</span>
            <span class="separator">›</span>
            <span class="current">${sanitizeHTML(wo)}</span>
        </div>
        <div class="dt-user-badge">
            <span id="roleBadge" class="role-badge">${sanitizeHTML(user.role)}</span>
        </div>
    `;
}

/**
 * Render header section
 */
function renderDTHeader() {
    const headerContainer = document.getElementById('dtHeader');
    if (!headerContainer) return;

    const transformer = digitalTwinState.transformer;
    if (!transformer) return;

    // Get customer name (from payload or fallback to ID)
    const customerName = transformer.customer || transformer.customerId || 'Unknown Customer';

    // Format timestamp
    const lastUpdated = transformer.lastUpdated
        ? formatTimestamp(transformer.lastUpdated)
        : 'Unknown';
    const lastUpdatedBy = transformer.lastUpdatedBy || 'Unknown';

    headerContainer.innerHTML = `
        <div class="dt-header-title-row">
            <h1 class="dt-wo-title">
                <span class="dt-wo-icon">🔧</span>
                <span>${sanitizeHTML(transformer.wo)}</span>
            </h1>
            <div class="dt-status-badge stage-${sanitizeHTML(transformer.stage)}">
                ${sanitizeHTML(STAGE_LABELS[transformer.stage] || transformer.stage)}
            </div>
        </div>
        
        <div class="dt-specs-grid">
            <div class="dt-spec-item">
                <span class="dt-spec-icon">📊</span>
                <span class="dt-spec-label">Rating</span>
                <span class="dt-spec-value">${sanitizeHTML(transformer.rating) || 'N/A'} MVA</span>
            </div>
            <div class="dt-spec-item">
                <span class="dt-spec-icon">⚡</span>
                <span class="dt-spec-label">Voltage</span>
                <span class="dt-spec-value">${sanitizeHTML(transformer.voltage) || 'N/A'} kV</span>
            </div>
            <div class="dt-spec-item">
                <span class="dt-spec-icon">📍</span>
                <span class="dt-spec-label">Customer</span>
                <span class="dt-spec-value">${sanitizeHTML(customerName)}</span>
            </div>
        </div>
        
        <div class="dt-last-updated">
            Last Updated: ${sanitizeHTML(lastUpdated)} by ${sanitizeHTML(lastUpdatedBy)}
        </div>
        
        <!-- Phase 3/4: Report & Export Buttons -->
        <div class="dt-actions" style="margin-top: 15px; display: flex; gap: 10px;">
            <button class="btn-login" style="width: auto; padding: 8px 16px; background: #e74c3c;" onclick="downloadReport()">
                📄 Engineering Report (PDF)
            </button>
            <button class="btn-login" style="width: auto; padding: 8px 16px; background: #27ae60;" onclick="handleExcelExport('${sanitizeHTML(transformer.stage)}', '${sanitizeHTML(transformer.wo)}')">
                📊 Export Checklist (Excel)
            </button>
        </div>
    `;

    // Update header border color based on stage
    // ... (rest of function)

    // ...

    /**
     * Download Engineering Report (Phase 4)
     */
    window.downloadReport = function () {
        const transformer = digitalTwinState.transformer;
        if (transformer && transformer.designData) {
            if (typeof window.generateEngineeringReport === 'function') {
                window.generateEngineeringReport(transformer);
            } else {
                Toast.warning('Report generator module not loaded. Please refresh the page.', { title: 'Module Error' });
            }
        } else {
            Toast.warning('No engineering design data available for this unit.', { title: 'No Data' });
        }
    };
    const header = document.querySelector('.dt-header');
    if (header && transformer.stage) {
        const stageColors = {
            design: '#9b59b6',
            winding: '#3498db',
            coreCoil: '#1abc9c',
            core: '#1abc9c', // Fallback
            vpd: '#16a085',
            tanking: '#f39c12',
            tankFilling: '#e67e22',
            testing: '#e67e22',
            completed: '#2ecc71'
        };
        const color = stageColors[transformer.stage] || '#4a9eff';
        header.style.borderTopColor = color;
    }

    // Phase 3: Export Checklist Excel logic securely
    window.handleExcelExport = async function (stage, wo) {
        try {
            const res = await fetch(`/export/checklist/${stage}/${encodeURIComponent(wo)}`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Export failed to generate');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Checklist_${stage}_${wo}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Excel Export Error:', err);
            if (typeof Toast !== 'undefined') {
                Toast.error('Failed to download Excel export', { title: 'Export Error' });
            } else {
                alert('Failed to download Excel export');
            }
        }
    };
}

/**
 * Render lifecycle timeline
 * Shows stage progression with completed/active/pending states
 */
function renderLifecycleTimeline() {
    const container = document.getElementById('dtLifecycle');
    if (!container) return;

    const transformer = digitalTwinState.transformer;
    if (!transformer) return;

    const currentStage = transformer.stage;
    const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

    // Calculate progress percentage
    const progressPercent = currentStageIndex >= 0
        ? ((currentStageIndex + 1) / STAGE_ORDER.length) * 100
        : 0;

    // Stage icons
    const stageIcons = {
        design: '📐',
        winding: '🔄',
        vpd: '🔬',
        coreCoil: '⚙️',
        core: '⚙️', // Fallback
        tanking: '🛢️',
        tankFilling: '🚰',
        testing: '🧪',
        completed: '✅'
    };

    // Build stage indicators
    const stageIndicators = STAGE_ORDER.map((stage, index) => {
        let stateClass = 'pending';
        if (index < currentStageIndex) {
            stateClass = 'completed';
        } else if (index === currentStageIndex) {
            stateClass = 'active';
        }

        const icon = stageIcons[stage] || '⚪';
        const label = STAGE_LABELS[stage] || stage;

        return `
            <div class="dt-stage-indicator ${sanitizeHTML(stateClass)}">
                <div class="dt-stage-dot">${sanitizeHTML(icon)}</div>
                <div class="dt-stage-label">${sanitizeHTML(label)}</div>
            </div>
        `;
    }).join('');

    container.setAttribute('data-role-visibility', 'internal');
    container.className = 'dt-lifecycle-section';
    container.innerHTML = `
        <h2 class="dt-lifecycle-title">
            <span>📈</span>
            <span>Lifecycle Timeline</span>
        </h2>
        <div class="dt-timeline-container">
            <div class="dt-timeline-line">
                <div class="dt-timeline-progress" style="width: ${progressPercent}%"></div>
            </div>
            <div class="dt-timeline-track">
                ${stageIndicators}
            </div>
        </div>
    `;
}

/**
 * Render current stage snapshot
 * Shows lock status, QA action, and last updated time for current stage
 */
function renderCurrentStageSnapshot() {
    const container = document.getElementById('dtStageSnapshot');
    if (!container) return;

    const transformer = digitalTwinState.transformer;
    const checklists = digitalTwinState.checklist || [];

    if (!transformer) return;

    const currentStage = transformer.stage;

    // Find checklist for current stage
    const currentChecklist = checklists.find(c => c.stage === currentStage);

    // Determine lock status
    let lockStatus = 'unlocked';
    let lockIcon = '🔓';
    let lockText = 'Unlocked';

    if (currentChecklist && currentChecklist.locked) {
        lockStatus = 'locked';
        lockIcon = '🔒';
        lockText = 'Locked';
    }

    // Determine QA action
    let qaStatus = 'none';
    let qaIcon = '⏳';
    let qaText = 'No QA Action';

    if (currentChecklist) {
        if (currentChecklist.qaApproved === true) {
            qaStatus = 'approved';
            qaIcon = '✅';
            qaText = 'Approved';
        } else if (currentChecklist.qaApproved === false) {
            qaStatus = 'rejected';
            qaIcon = '❌';
            qaText = 'Rejected';
        } else if (currentChecklist.qaApproved === null || currentChecklist.qaApproved === undefined) {
            qaStatus = 'pending';
            qaIcon = '⏳';
            qaText = 'Pending QA';
        }
    }

    // Last updated timestamp
    const lastUpdated = currentChecklist && currentChecklist.lastUpdated
        ? formatTimestamp(currentChecklist.lastUpdated)
        : 'Unknown';

    container.setAttribute('data-role-visibility', 'internal');
    container.className = 'dt-snapshot-section';
    container.innerHTML = `
        <h2 class="dt-snapshot-title">
            <span>🎯</span>
            <span>Current Stage Snapshot</span>
        </h2>
        <div class="dt-snapshot-grid">
            <div class="dt-snapshot-item">
                <div class="dt-snapshot-label">Stage</div>
                <div class="dt-snapshot-value">${sanitizeHTML(STAGE_LABELS[currentStage] || currentStage)}</div>
            </div>
            <div class="dt-snapshot-item">
                <div class="dt-snapshot-label">Lock Status</div>
                <div class="dt-snapshot-value">
                    <span class="dt-lock-status ${sanitizeHTML(lockStatus)}">
                        ${sanitizeHTML(lockIcon)} ${sanitizeHTML(lockText)}
                    </span>
                </div>
            </div>
            <div class="dt-snapshot-item">
                <div class="dt-snapshot-label">QA Action</div>
                <div class="dt-snapshot-value">
                    <span class="dt-qa-action ${sanitizeHTML(qaStatus)}">
                        ${sanitizeHTML(qaIcon)} ${sanitizeHTML(qaText)}
                    </span>
                </div>
            </div>
        </div>
        <div class="dt-snapshot-timestamp">
            Last updated: ${sanitizeHTML(lastUpdated)}
        </div>
    `;
}

/**
 * Render manufacturing history
 * Shows collapsible sections per stage with checklist summaries
 */
function renderManufacturingHistory() {
    const container = document.getElementById('dtHistory');
    if (!container) return;

    const transformer = digitalTwinState.transformer;
    const checklists = digitalTwinState.checklist || [];

    if (!transformer) return;

    // Group checklists by stage in chronological order
    const stageHistory = STAGE_ORDER.map(stage => {
        const stageChecklist = checklists.find(c => c.stage === stage);
        return {
            stage,
            label: STAGE_LABELS[stage] || stage,
            checklist: stageChecklist,
            hasData: !!stageChecklist
        };
    }).filter(item => item.hasData); // Only show stages with checklist data

    // Empty state
    if (stageHistory.length === 0) {
        container.setAttribute('data-role-visibility', 'internal');
        container.className = 'dt-history-section';
        container.innerHTML = `
            <h2 class="dt-history-title">
                <span>📋</span>
                <span>Manufacturing History</span>
            </h2>
            <div class="dt-history-empty">
                <div class="dt-history-empty-icon">📋</div>
                <p>No manufacturing history available yet.</p>
            </div>
        `;
        return;
    }

    // Build stage sections
    const stageSections = stageHistory.map((item, _index) => {
        const checklist = item.checklist;

        // Determine status
        let status = 'pending';
        let statusIcon = '⏳';
        let statusText = 'Pending';

        if (checklist.locked) {
            status = 'locked';
            statusIcon = '🔒';
            statusText = 'Locked';
        } else if (checklist.qaApproved === true) {
            status = 'completed';
            statusIcon = '✓';
            statusText = 'Checklist completed';
        } else if (checklist.qaApproved === false) {
            status = 'rejected';
            statusIcon = '✕';
            statusText = 'Checklist rejected';
        } else if (checklist.qaApproved === null || checklist.qaApproved === undefined) {
            status = 'pending';
            statusIcon = '⏳';
            statusText = 'QA pending';
        }

        // Format timestamp
        const lastUpdated = checklist.lastUpdated
            ? formatTimestamp(checklist.lastUpdated)
            : 'Unknown';

        // Rejection reason (if applicable)
        let rejectionReasonHTML = '';
        if (status === 'rejected' && checklist.rejectionReason) {
            rejectionReasonHTML = `
                <div class="dt-rejection-reason">
                    <div class="dt-rejection-reason-label">Reason:</div>
                    ${sanitizeHTML(checklist.rejectionReason)}
                </div>
            `;
        }

        // Current stage indicator
        const isCurrent = item.stage === transformer.stage;
        const currentBadge = isCurrent ? ' (Current)' : '';

        return `
            <div class="dt-stage-section" data-stage="${sanitizeHTML(item.stage)}">
                <div class="dt-stage-header" onclick="window.DigitalTwinUI.toggleStageSection('${sanitizeHTML(item.stage)}')">
                    <div class="dt-stage-header-left">
                        <span class="dt-stage-expand-icon">▶</span>
                        <span class="dt-stage-name">${sanitizeHTML(item.label)}${sanitizeHTML(currentBadge)}</span>
                    </div>
                    <div class="dt-stage-status-badge ${sanitizeHTML(status)}">
                        ${sanitizeHTML(statusIcon)} ${sanitizeHTML(statusText)}
                    </div>
                </div>
                <div class="dt-stage-content">
                    <div class="dt-stage-details">
                        <div class="dt-stage-detail-row">
                            <div class="dt-stage-detail-label">Last Updated</div>
                            <div class="dt-stage-detail-value">${sanitizeHTML(lastUpdated)}</div>
                        </div>
                        ${rejectionReasonHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.setAttribute('data-role-visibility', 'internal');
    container.className = 'dt-history-section';
    container.innerHTML = `
        <h2 class="dt-history-title">
            <span>📋</span>
            <span>Manufacturing History</span>
        </h2>
        <div class="dt-history-container">
            ${stageSections}
        </div>
    `;
}

/**
 * Toggle stage section expand/collapse
 * @param {string} stage - Stage name
 */
function toggleStageSection(stage) {
    const section = document.querySelector(`.dt-stage-section[data-stage="${stage}"]`);
    if (!section) return;

    section.classList.toggle('expanded');
}

/**
 * Render documents section
 * Fetches documents from /api/document/:wo
 */
async function renderDocuments() {
    const container = document.getElementById('dtDocuments');
    if (!container) return;

    const wo = digitalTwinState.selectedWO;
    if (!wo) return;

    try {
        const result = await DigitalTwinAPI.fetchWithAuth(`/document/${encodeURIComponent(wo)}`);
        const documents = result.data || result || [];

        container.className = 'dt-documents-section';

        if (documents.length === 0) {
            container.innerHTML = `
                <h2 class="dt-documents-title">
                    <span>📁</span>
                    <span>Documents & Media</span>
                </h2>
                <div class="dt-documents-empty">
                    <div class="dt-documents-empty-icon">📁</div>
                    <p>No documents available for this transformer.</p>
                </div>
            `;
            return;
        }

        const docList = documents.map(doc => `
            <div class="dt-document-card">
                <div class="dt-document-icon">📄</div>
                <div class="dt-document-info">
                    <div class="dt-document-name">${sanitizeHTML(doc.filename)}</div>
                    <div class="dt-document-meta">
                        ${sanitizeHTML(doc.type.toUpperCase())} • ${sanitizeHTML(new Date(doc.uploadedAt).toLocaleDateString())}
                    </div>
                </div>
                <a href="/document/download/${encodeURIComponent(doc.filename)}" class="dt-document-download" download>
                    ⬇️
                </a>
            </div>
        `).join('');

        container.innerHTML = `
            <h2 class="dt-documents-title">
                <span>📁</span>
                <span>Documents & Media</span>
            </h2>
            <div class="dt-documents-grid">
                ${docList}
            </div>
        `;

    } catch (error) {
        console.error('Error loading documents:', error);
        container.innerHTML = `
             <h2 class="dt-documents-title">
                <span>📁</span>
                <span>Documents & Media</span>
            </h2>
            <div class="dt-error-message">Failed to load documents.</div>
        `;
    }
}

/**
 * Render audit timeline
 * Shows chronological audit log entries for this transformer
 */
function renderAuditTimeline() {
    const container = document.getElementById('dtAudit');
    if (!container) return;

    const auditLogs = digitalTwinState.auditLogs || [];

    // Empty state
    if (auditLogs.length === 0) {
        container.setAttribute('data-role-visibility', 'quality-admin');
        container.className = 'dt-audit-section';
        container.innerHTML = `
            <h2 class="dt-audit-title">
                <span>📜</span>
                <span>Audit Timeline</span>
            </h2>
            <div class="dt-audit-empty">
                <div class="dt-audit-empty-icon">📜</div>
                <p>No audit logs available for this transformer.</p>
            </div>
        `;
        return;
    }

    // Sort audit logs chronologically (most recent first)
    const sortedLogs = [...auditLogs].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt);
        const dateB = new Date(b.timestamp || b.createdAt);
        return dateB - dateA;
    });

    // Build audit entries
    const auditEntries = sortedLogs.map(log => {
        const action = log.action || 'Unknown action';
        const user = log.user || log.username || 'Unknown user';
        const timestamp = log.timestamp || log.createdAt;
        const formattedTime = timestamp ? formatTimestamp(timestamp) : 'Unknown time';

        // Details (optional)
        let detailsHTML = '';
        if (log.details || log.description) {
            const details = log.details || log.description;
            detailsHTML = `
                <div class="dt-audit-details">${sanitizeHTML(details)}</div>
            `;
        }

        return `
            <div class="dt-audit-entry">
                <div class="dt-audit-entry-header">
                    <div class="dt-audit-action">${sanitizeHTML(action)}</div>
                    <div class="dt-audit-timestamp">${sanitizeHTML(formattedTime)}</div>
                </div>
                <div class="dt-audit-entry-body">
                    <div class="dt-audit-user">
                        <span class="dt-audit-user-icon">👤</span>
                        ${sanitizeHTML(user)}
                    </div>
                    ${detailsHTML}
                </div>
            </div>
        `;
    }).join('');

    container.setAttribute('data-role-visibility', 'quality-admin');
    container.className = 'dt-audit-section';
    container.innerHTML = `
        <h2 class="dt-audit-title">
            <span>📜</span>
            <span>Audit Timeline</span>
        </h2>
        <div class="dt-audit-container">
            ${auditEntries}
        </div>
    `;
}

/**
 * Render section placeholders (DT-3, DT-4)
 */
function renderDTPlaceholders() {
    // Lifecycle Timeline placeholder
    renderPlaceholder('dtLifecycle', '📈', 'Lifecycle Timeline', 'internal');

    // Current Stage Snapshot placeholder
    renderPlaceholder('dtStageSnapshot', '🎯', 'Current Stage Snapshot', 'internal');

    // Manufacturing History placeholder
    renderPlaceholder('dtHistory', '📋', 'Manufacturing History', 'internal');

    // Documents placeholder
    renderPlaceholder('dtDocuments', '📁', 'Documents & Media', 'all');

    // Audit Timeline placeholder
    renderPlaceholder('dtAudit', '📜', 'Audit Timeline', 'quality-admin');
}

/**
 * Render individual placeholder
 */
function renderPlaceholder(containerId, icon, title, visibility) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('data-role-visibility', visibility);
    container.innerHTML = `
        <div class="dt-placeholder-content">
            <span class="dt-placeholder-icon">${sanitizeHTML(icon)}</span>
            <h3 class="dt-placeholder-title">${sanitizeHTML(title)}</h3>
            <p class="dt-placeholder-text">
                This section is not available in this view.
            </p>
        </div>
    `;
}

/**
 * Apply role-based visibility (UX-only, not security)
 * Server-side permissions remain authoritative
 */
function applyDigitalTwinVisibility(userRole) {
    // Hide internal sections for customers
    if (userRole === 'customer' || userRole.includes('customer')) {
        const internalSections = document.querySelectorAll('[data-role-visibility="internal"]');
        internalSections.forEach(section => section.classList.add('hidden'));
    }

    // Hide audit for non-quality roles
    if (!['admin', 'quality'].includes(userRole)) {
        const qualityAdminSections = document.querySelectorAll('[data-role-visibility="quality-admin"]');
        qualityAdminSections.forEach(section => section.classList.add('hidden'));
    }

    console.log(`👁️ Applied Digital Twin visibility for: ${userRole}`);
}

/**
 * Navigate back to dashboard
 * Navigation Type: Client-side route change (SPA behavior)
 * - Uses existing showSection('home') from main.js
 * - NO page reload (preserves dashboard state)
 */
function navigateToDashboard() {
    // SPA route change - preserves state
    if (typeof showSection === 'function') {
        showSection('home');
    } else {
        // Fallback to hash routing
        window.location.hash = '#home';
    }
}

/**
 * Format timestamp to relative time
 * Reused from dashboard
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown time';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Show error state
 */
function showDTError(message) {
    const headerContainer = document.getElementById('dtHeader');
    if (!headerContainer) return;

    headerContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h3>Failed to load transformer</h3>
            <p>${sanitizeHTML(message)}</p>
            <button class="dt-back-btn" onclick="navigateToDashboard()" style="margin-top: 20px;">
                ← Back to Dashboard
            </button>
        </div>
    `;
}

/**
 * Render Design vs Actual Comparison (Phase 3)
 */
function renderComparison() {
    // We reuse the 'dtStageSnapshot' container for now, or append a new one
    let container = document.getElementById('dtComparison');
    if (!container) {
        const contentDiv = document.querySelector('.dt-content');
        if (contentDiv) {
            container = document.createElement('section');
            container.id = 'dtComparison';
            container.className = 'dt-section';
            // Insert after header
            const header = document.getElementById('dtHeader');
            if (header) header.after(container);
        } else {
            return;
        }
    }

    const transformer = digitalTwinState.transformer;
    if (!transformer || !transformer.actuals || !transformer.designData) return;

    const design = transformer.designData.calculations;
    const actual = transformer.actuals;

    // Calculate Deviation %
    const calcDev = (d, a) => ((a - d) / d) * 100;

    // comparisons array
    const comparisons = [
        {
            param: 'No-Load Loss',
            design: design.losses.coreLoss,
            actual: actual.core.noLoadLoss,
            unit: 'kW',
            limit: 15 // +/- 15% tolerance example
        },
        {
            param: 'Load Loss',
            design: design.losses.copperLoss.total,
            actual: actual.winding.loadLoss,
            unit: 'kW',
            limit: 15
        },
        {
            param: 'Impedance',
            design: design.impedance.percentImpedance,
            actual: actual.testing.impedance,
            unit: '%',
            limit: 10
        },
        {
            param: 'Total Weight',
            design: design.dimensions.weights.core, // Simplified mapping
            actual: actual.core.weight,
            unit: 'kg',
            limit: 5
        }
    ];

    // Build HTML using dt-comparison.css classes
    let tableRows = '';
    let totalDev = 0;

    comparisons.forEach(item => {
        const dev = calcDev(item.design, item.actual);
        totalDev += Math.abs(dev);

        const status = Math.abs(dev) <= item.limit ? 'pass' : 'fail';
        const deviationColor = status === 'pass' ? '#27ae60' : '#c0392b';

        tableRows += `
            <div class="dt-comp-row">
                <div class="dt-comp-label">${sanitizeHTML(item.param)}</div>
                <div class="dt-comp-val">${sanitizeHTML(item.design.toFixed(2))} ${sanitizeHTML(item.unit)}</div>
                <div class="dt-comp-val">${sanitizeHTML(item.actual.toFixed(2))} ${sanitizeHTML(item.unit)}</div>
                <div class="dt-comp-dev" style="color: ${deviationColor}">
                    ${dev > 0 ? '+' : ''}${sanitizeHTML(dev.toFixed(2))}%
                </div>
            </div>
        `;
    });

    // Health Score (Simple logic: 100 - avg deviation)
    const divisor = comparisons.length > 0 ? comparisons.length : 1;
    const healthScore = Math.max(0, 100 - (totalDev / divisor * 2)).toFixed(0);
    let healthColor = '#27ae60'; // Green
    if (healthScore < 80) healthColor = '#f39c12'; // Orange
    if (healthScore < 60) healthColor = '#c0392b'; // Red

    container.innerHTML = `
        <div class="dt-comparison-section">
            <div class="dt-comp-header">
                <h2 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 20px; color: #2c3e50;">
                    <span>⚖️</span> Design vs. Actual Validation
                </h2>
                <div class="dt-health-score">
                    <div class="score-label" style="color: ${healthColor}">Health Score</div>
                    <div class="score-val" style="color: ${healthColor}">${sanitizeHTML(healthScore)}</div>
                </div>
            </div>
            
            <div class="dt-comp-table">
                <div class="dt-comp-head">
                    <div>Parameter</div>
                    <div>Design Target</div>
                    <div>Actual</div>
                    <div>Deviation</div>
                </div>
                ${tableRows}
            </div>
        </div>
    `;
}

console.log('🔧 Digital Twin script loaded');

/* ============================================================
   WO DROPDOWN POPULATION + EMPTY-STATE MANAGEMENT
   ============================================================ */

/**
 * Populate the #dtWOSelect dropdown with transformers from the API.
 * Called automatically when the user navigates to the Digital Twin tab.
 */
async function populateDTWODropdown() {
    const select = document.getElementById('dtWOSelect');
    if (!select) return;

    // Check cache flag to avoid redundant network fetch
    if (digitalTwinState.dropdownPopulated) return;

    try {
        const data = await DigitalTwinAPI.fetchWithAuth('/transformers');

        // Populate dropdown (only runs when cache is empty, controlled by dropdownPopulated flag above)
        select.innerHTML = '<option value="">— Select W.O. Number —</option>';

        const rawTransformers = data.data || data;
        const transformers = Array.isArray(rawTransformers) ? rawTransformers : (rawTransformers ? [rawTransformers] : []);

        if (transformers.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = 'No transformers found';
            select.appendChild(opt);
            return;
        }

        transformers.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.woNumber || t.wo || t._id;
            opt.textContent = `${t.woNumber || t.wo || t._id}${t.customerName ? ' — ' + t.customerName : ''}`;
            select.appendChild(opt);
        });

        // Mark as populated so we don't fetch again unnecessarily
        digitalTwinState.dropdownPopulated = true;
    } catch (e) {
        console.warn('⚠️ Could not populate DT WO dropdown:', e.message);
    }
}

// ── Populate dropdown whenever showTab('digitalTwin') is called ──
const _origShowTab = window.showTab;
if (_origShowTab) {
    window.showTab = function (tabId, ...args) {
        _origShowTab(tabId, ...args);
        if (tabId === 'digitalTwin') {
            populateDTWODropdown();
        }
    };
}

// Export unused functions for potential external use
window.toggleStageSection = window.DigitalTwinUI.toggleStageSection; // correctly alias the namespaced function
window.renderDTPlaceholders = renderDTPlaceholders;
window.navigateToDashboard = navigateToDashboard;
window.renderComparison = renderComparison;
window.initDigitalTwin = initDigitalTwin;
