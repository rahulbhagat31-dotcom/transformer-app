/* ===============================
   TRANSFORMER PROFILE & DIGITAL TWIN
   Individual transformer lifecycle view
================================ */

/**
 * Load and display transformer profile
 */
async function loadTransformerProfile(wo) {
    currentProfileWO = wo;

    try {
        // Fetch transformer data
        const response = await fetch('/transformers');
        const result = await response.json();
        const transformers = result.data || result;

        const transformer = transformers.find(t => t.wo === wo);

        if (!transformer) {
            alert('Transformer not found');
            return;
        }

        // Update profile header
        document.getElementById('profileWO').textContent = wo;
        document.getElementById('profileCustomer').textContent = transformer.customer || 'N/A';

        // Render specifications
        renderSpecifications(transformer);

        // Render current status
        renderCurrentStatus(transformer);

        // Render timeline
        renderManufacturingTimeline(wo);

        // Load documents
        loadRelatedDocuments(wo);

        console.log(`✅ Loaded profile for transformer ${wo}`);
    } catch (error) {
        console.error('❌ Error loading transformer profile:', error);
        alert('Failed to load transformer profile');
    }
}

/**
 * Render specifications card
 */
function renderSpecifications(transformer) {
    const container = document.getElementById('specsContent');

    const specs = [
        { label: 'Rating', value: transformer.rating || 'N/A', icon: '⚡' },
        { label: 'Voltage', value: transformer.voltage || 'N/A', icon: '🔌' },
        { label: 'Customer', value: transformer.customer || 'N/A', icon: '🏢' },
        { label: 'W.O. Number', value: transformer.wo, icon: '📋' },
        { label: 'Status', value: transformer.status || 'pending', icon: '📊' }
    ];

    container.innerHTML = specs.map((spec, index) => `
        <div class="spec-item" style="--item-index: ${index}">
            <span class="spec-icon">${spec.icon}</span>
            <div class="spec-details">
                <div class="spec-label">${spec.label}</div>
                <div class="spec-value">${spec.value}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Render current status card
 */
function renderCurrentStatus(transformer) {
    const container = document.getElementById('statusContent');

    const status = transformer.status || 'pending';
    const statusColors = {
        'pending': 'var(--warning)',
        'in-progress': 'var(--primary)',
        'completed': 'var(--success)',
        'on-hold': 'var(--danger)'
    };

    const statusIcons = {
        'pending': '⏳',
        'in-progress': '🔄',
        'completed': '✅',
        'on-hold': '⏸️'
    };

    container.innerHTML = `
        <div class="status-badge-large" style="background: ${statusColors[status]}20; border-left: 4px solid ${statusColors[status]}">
            <span class="status-icon-large">${statusIcons[status]}</span>
            <div>
                <div class="status-label">Current Status</div>
                <div class="status-value">${status.toUpperCase().replace('-', ' ')}</div>
            </div>
        </div>
        <div class="status-meta">
            <div class="meta-item">
                <span class="meta-label">Created</span>
                <span class="meta-value">${new Date(transformer.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Last Updated</span>
                <span class="meta-value">${new Date(transformer.updatedAt || Date.now()).toLocaleDateString()}</span>
            </div>
        </div>
    `;
}

/**
 * Render manufacturing timeline
 */
function renderManufacturingTimeline(_wo) {
    const stages = [
        { name: 'Design', icon: '🧮', status: 'completed', date: '2026-01-20' },
        { name: 'Winding', icon: '🔧', status: 'in-progress', date: '2026-01-25' },
        { name: 'VPD Test', icon: '⚡', status: 'pending', date: null },
        { name: 'Core Assembly', icon: '🔩', status: 'pending', date: null },
        { name: 'Tanking', icon: '🛢️', status: 'pending', date: null },
        { name: 'Testing', icon: '🧪', status: 'pending', date: null },
        { name: 'Dispatch', icon: '🚚', status: 'pending', date: null }
    ];

    const container = document.getElementById('timelineViz');

    container.innerHTML = `
        <div class="timeline-container">
            ${stages.map((stage, index) => `
                <div class="timeline-item ${stage.status}" style="--item-index: ${index}">
                    <div class="timeline-marker">
                        <div class="timeline-icon">${stage.icon}</div>
                        ${stage.status === 'completed' ? '<div class="timeline-check">✓</div>' : ''}
                    </div>
                    <div class="timeline-content">
                        <h4 class="timeline-title">${stage.name}</h4>
                        <p class="timeline-status">${stage.status.replace('-', ' ')}</p>
                        ${stage.date ? `<p class="timeline-date">${new Date(stage.date).toLocaleDateString()}</p>` : ''}
                    </div>
                    ${index < stages.length - 1 ? '<div class="timeline-connector"></div>' : ''}
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Load related documents
 */
function loadRelatedDocuments(_wo) {
    const docs = [
        { type: 'Design Calculation', stage: 'Design', icon: '📐', url: '#designCalculations' },
        { type: 'Winding Checklist', stage: 'Manufacturing', icon: '📋', url: '#manufacturingChecklist' },
        { type: 'BOM', stage: 'Design', icon: '📊', url: '#bomUpload' },
        { type: 'Test Report', stage: 'Testing', icon: '🧪', url: '#' }
    ];

    const container = document.getElementById('documentsGrid');

    container.innerHTML = docs.map((doc, index) => `
        <div class="doc-card" style="--item-index: ${index}" onclick="navigateToDocument('${doc.url}')">
            <div class="doc-icon">${doc.icon}</div>
            <div class="doc-info">
                <h4 class="doc-title">${doc.type}</h4>
                <p class="doc-stage">${doc.stage}</p>
            </div>
            <button class="doc-action">→</button>
        </div>
    `).join('');
}

/**
 * Navigate to document
 */
function navigateToDocument(url) {
    if (url && url !== '#') {
        const sectionId = url.replace('#', '');
        const section = document.getElementById(sectionId);
        if (section) {
            const navBtn = document.querySelector(`[onclick*="showTab('${sectionId}'"]`);
            showTab(sectionId, navBtn);
        }
    }
}

// Export to window
window.loadTransformerProfile = loadTransformerProfile;
window.navigateToDocument = navigateToDocument;

console.log('✅ Transformer Profile module loaded');
