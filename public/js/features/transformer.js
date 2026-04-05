/* ===============================
   TRANSFORMER MASTER MANAGEMENT
   Search, add, update transformers
   With pagination, search, and stage filter
================================ */

let customerList = [];

// Pagination state
const registryPagination = {
    allResults: [],
    page: 1,
    pageSize: 25
};

/* ===============================
   CLEAR TRANSFORMER FILTERS
================================ */
window.clearTransformerFilters = function () {
    const q = document.getElementById('q');
    const customerFilter = document.getElementById('customerFilterDropdown');
    const stageFilter = document.getElementById('stageFilterDropdown');
    if (q) q.value = '';
    if (customerFilter) customerFilter.value = '';
    if (stageFilter) stageFilter.value = '';
    doSearch();
};

/* ===============================
   SEARCH TRANSFORMERS (with pagination)
================================ */
async function doSearch() {
    const query = (document.getElementById('q')?.value || '').toLowerCase();
    const customerFilter = document.getElementById('customerFilterDropdown')?.value || '';
    const stageFilter = document.getElementById('stageFilterDropdown')?.value || '';

    try {
        const response = await apiRequest('/api/transformers');
        const transformers = response.data || response;

        registryPagination.allResults = transformers.filter(t => {
            const matchesSearch = !query ||
                t.customer?.toLowerCase().includes(query) ||
                t.wo?.toLowerCase().includes(query) ||
                t.rating?.toString().includes(query);
            const matchesCustomer = !customerFilter ||
                t.customerId === customerFilter || t.customer === customerFilter;
            const matchesStage = !stageFilter ||
                (t.stage || t.currentStage) === stageFilter;
            return matchesSearch && matchesCustomer && matchesStage;
        });

        // Reset to page 1 on new search
        registryPagination.page = 1;
        renderRegistryPage();

    } catch (error) {
        console.error('❌ Search error:', error);
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `<p style="color:var(--danger,#e74c3c)">Failed to load transformers: ${error.message}</p>`;
        }
    }
}

/* ===============================
   RENDER CURRENT PAGE OF RESULTS
================================ */
function renderRegistryPage() {
    const { allResults, page, pageSize } = registryPagination;
    const total = allResults.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageItems = allResults.slice(start, end);

    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    if (total === 0) {
        resultsDiv.innerHTML = `
            <div class="tm-empty-state">
                <div class="tm-empty-icon">🔍</div>
                <h3>No transformers found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>`;
        updatePaginationControls(0, 0, 0, 0);
        return;
    }

    resultsDiv.innerHTML = pageItems.map((t, idx) => {
        const stage = t.stage || t.currentStage || 'design';
        const stageName = getStageName(stage);
        const dateStr = t.createdAt
            ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';

        // Customer visibility toggle — only shown to admin/quality users
        const canToggleVisibility = (window.currentUserRole === 'admin' || window.currentUserRole === 'quality');
        const isVisible = t.customerVisible === true;
        const visibilityBtn = canToggleVisibility ? `
            <button class="tm-action-btn ${isVisible ? 'tm-btn-visible' : 'tm-btn-hidden'}"
                id="vis-btn-${t.wo}"
                title="${isVisible ? 'Checklist shared with customer — click to hide' : 'Checklist hidden from customer — click to share'}"
                onclick="toggleCustomerVisibility('${t.wo}', ${isVisible})"
                style="background:${isVisible ? 'linear-gradient(135deg,#27ae60,#2ecc71)' : 'linear-gradient(135deg,#95a5a6,#7f8c8d)'}; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer; font-weight:600; transition:all 0.2s;">
                ${isVisible ? '&#x1F441; Shared' : '&#x1F512; Hidden'}
            </button>` : '';

        return `
            <div class="tm-registry-card" style="animation-delay:${idx * 55}ms">
                <div class="tm-card-left">
                    <div class="tm-card-wo-badge">${t.wo || 'N/A'}</div>
                    <div class="tm-card-info">
                        <div class="tm-card-customer">${t.customer || 'Unknown Customer'}</div>
                        <div class="tm-card-specs">
                            ${t.rating ? `<span class="tm-spec-chip">&#x26A1; ${t.rating} kVA</span>` : ''}
                            ${t.hv ? `<span class="tm-spec-chip">HV: ${t.hv} kV</span>` : ''}
                            ${t.lv ? `<span class="tm-spec-chip">LV: ${t.lv} kV</span>` : ''}
                        </div>
                        ${dateStr ? `<div class="tm-card-date">&#x1F4C5; Registered: ${dateStr}</div>` : ''}
                    </div>
                </div>
                <div class="tm-card-right">
                    <div class="tm-card-stage">
                        <span class="stage-badge stage-${stage}">${stageName}</span>
                    </div>
                    <button class="tm-action-btn tm-btn-stage"
                        onclick="showStageProgressionModal('${t.id || t.wo}', '${t.wo}')">
                        &#x1F504; Set Stage
                    </button>
                    <button class="tm-action-btn tm-btn-history"
                        onclick="viewStageHistory('${t.id || t.wo}')">
                        &#x1F4CA; History
                    </button>
                    <button class="tm-action-btn tm-btn-twin"
                        onclick="openDigitalTwin('${t.wo}')">
                        &#x1F52D; Twin
                    </button>
                    ${visibilityBtn}
                </div>
            </div>`;
    }).join('');

    updatePaginationControls(page, totalPages, start + 1, end, total);
}

/* ===============================
   CUSTOMER CHECKLIST VISIBILITY TOGGLE
   Admin / Quality only — shows/hides checklist from customer
================================ */
window.toggleCustomerVisibility = async function (wo, currentlyVisible) {
    const newVisible = !currentlyVisible;
    const btn = document.getElementById(`vis-btn-${wo}`);

    // Optimistic UI update
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
        btn.style.opacity = '0.6';
    }

    try {
        const res = await apiRequest(`/api/transformers/${encodeURIComponent(wo)}/customer-visibility`, {
            method: 'PUT',
            body: JSON.stringify({ visible: newVisible })
        });

        const result = res; // apiRequest already parses JSON
        if (!result.success) {
            throw new Error(result.error || 'Update failed');
        }

        // Update button appearance in-place
        if (btn) {
            btn.id           = `vis-btn-${wo}`;
            btn.disabled     = false;
            btn.style.opacity = '1';
            btn.style.background = newVisible
                ? 'linear-gradient(135deg,#27ae60,#2ecc71)'
                : 'linear-gradient(135deg,#95a5a6,#7f8c8d)';
            btn.innerHTML = newVisible ? '&#x1F441; Shared' : '&#x1F512; Hidden';
            btn.title     = newVisible
                ? 'Checklist shared with customer — click to hide'
                : 'Checklist hidden from customer — click to share';
            btn.setAttribute('onclick', `toggleCustomerVisibility('${wo}', ${newVisible})`);
            btn.className = `tm-action-btn ${newVisible ? 'tm-btn-visible' : 'tm-btn-hidden'}`;
        }

        if (typeof Toast !== 'undefined') {
            Toast.success(
                newVisible
                    ? `Checklist for WO ${wo} is now visible to the customer.`
                    : `Checklist for WO ${wo} is now hidden from the customer.`,
                { title: newVisible ? '&#x1F441; Shared' : '&#x1F512; Hidden' }
            );
        }

        // Also refresh the in-memory list so pagination re-renders correctly
        const idx = registryPagination.allResults.findIndex(t => t.wo === wo);
        if (idx !== -1) registryPagination.allResults[idx].customerVisible = newVisible;

    } catch (err) {
        console.error('Error toggling customer visibility:', err);
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        if (typeof Toast !== 'undefined') {
            Toast.error('Failed to update visibility: ' + err.message);
        }
    }
};

/* ===============================
   PAGINATION CONTROLS
================================ */
function updatePaginationControls(page, totalPages, start, end, total) {
    let paginationDiv = document.getElementById('registryPagination');
    if (!paginationDiv) {
        // Create pagination container after results div
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;
        paginationDiv = document.createElement('div');
        paginationDiv.id = 'registryPagination';
        paginationDiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:8px 0;';
        resultsDiv.insertAdjacentElement('afterend', paginationDiv);
    }

    if (total === 0) {
        paginationDiv.innerHTML = '';
        return;
    }

    paginationDiv.innerHTML = `
        <span style="font-size:13px; opacity:0.7;">Showing ${start}–${end} of ${total} transformers</span>
        <div style="display:flex; gap:8px; align-items:center;">
            <button id="prevPageBtn"
                onclick="registryChangePage(-1)"
                ${page <= 1 ? 'disabled' : ''}
                style="padding:6px 14px; border:1px solid var(--border,#e2e8f0); border-radius:6px; cursor:${page <= 1 ? 'not-allowed' : 'pointer'}; opacity:${page <= 1 ? '0.4' : '1'}; background:var(--card-bg,#fff);">
                ← Prev
            </button>
            <span style="font-size:13px; font-weight:600;">Page ${page} / ${totalPages}</span>
            <button id="nextPageBtn"
                onclick="registryChangePage(1)"
                ${page >= totalPages ? 'disabled' : ''}
                style="padding:6px 14px; border:1px solid var(--border,#e2e8f0); border-radius:6px; cursor:${page >= totalPages ? 'not-allowed' : 'pointer'}; opacity:${page >= totalPages ? '0.4' : '1'}; background:var(--card-bg,#fff);">
                Next →
            </button>
        </div>`;
}

window.registryChangePage = function (delta) {
    const { allResults, page, pageSize } = registryPagination;
    const totalPages = Math.ceil(allResults.length / pageSize);
    const newPage = Math.max(1, Math.min(totalPages, page + delta));
    if (newPage !== registryPagination.page) {
        registryPagination.page = newPage;
        renderRegistryPage();
        // Scroll results into view
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

/* ===============================
   ADD NEW TRANSFORMER
================================ */
async function addTransformer() {
    if (!hasPermission('quality')) {
        Toast.error('You do not have permission to add transformers.', { title: 'Permission Denied' });
        return;
    }

    const customerId = document.getElementById('customerSelect').value;
    const wo = document.getElementById('w').value;
    const rating = document.getElementById('r').value;
    const hv = document.getElementById('hv_master').value;
    const lv = document.getElementById('lv_master').value;

    if (!customerId || !wo) {
        Toast.warning('Please select a customer and enter W.O. No', { title: 'Missing Fields' });
        return;
    }

    try {
        const customer = customerList.find(c => c.customerId === customerId);

        const result = await apiRequest('/api/transformers', {
            method: 'POST',
            body: JSON.stringify({ customerId, customer: customer?.name, wo, rating, hv, lv })
        });

        if (result.success) {
            Toast.success('Transformer added successfully!');
            document.getElementById('w').value = '';
            document.getElementById('r').value = '';
            document.getElementById('hv_master').value = '';
            document.getElementById('lv_master').value = '';
            updateTransformerDropdowns();
            doSearch();
        }
    } catch (error) {
        console.error('❌ Error adding transformer:', error);
        Toast.error('Failed to add transformer: ' + error.message);
    }
}

/* ===============================
   UPDATE TRANSFORMER DROPDOWNS
================================ */
async function updateTransformerDropdowns() {
    try {
        const response = await apiRequest('/api/transformers');
        const transformers = response.data || response;

        const bomSelect = document.getElementById('bomTransformer');
        const docSelect = document.getElementById('docTransformer');

        const options = transformers.map(t =>
            `<option value="${t.wo}">${t.wo} - ${t.customer}</option>`
        ).join('');

        const defaultOption = '<option value="">-- Select Transformer --</option>';

        if (bomSelect) bomSelect.innerHTML = defaultOption + options;
        if (docSelect) docSelect.innerHTML = defaultOption + options;

    } catch (error) {
        console.error('❌ Error updating dropdowns:', error);
    }
}

/* ===============================
   LOAD CUSTOMER LIST
================================ */
async function loadCustomerList() {
    try {
        const response = await apiRequest('/api/transformers/customers');
        customerList = response.data || response || [];

        const select = document.getElementById('customerSelect');
        if (select) {
            select.innerHTML = '<option value="">-- Select Customer --</option>' +
                customerList.map(c =>
                    `<option value="${c.customerId}">${c.name || c.customerId}</option>`
                ).join('');
        }

        console.log('✅ Customers loaded:', customerList.length);
    } catch (error) {
        console.error('❌ Error loading customers:', error);
    }
}

/* ===============================
   BOM UPLOAD
================================ */
async function uploadBOM() {
    const woSelect = document.getElementById('bomTransformer');
    const fileInput = document.getElementById('bomFile');
    if (!woSelect || !fileInput) { Toast.error('Required elements not found'); return; }

    const wo = woSelect.value;
    const file = fileInput.files[0];
    if (!wo) { Toast.warning('Please select a transformer', { title: 'No Transformer' }); return; }
    if (!file) { Toast.warning('Please select a file to upload', { title: 'No File' }); return; }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('wo', wo);
        formData.append('customerId', window.currentCustomerId || '');

        const result = await uploadFile('/bom/upload', formData);
        if (result.success) {
            Toast.success('BOM uploaded successfully!');
            fileInput.value = '';
            loadBOMList(wo);
        }
    } catch (error) {
        console.error('❌ BOM upload error:', error);
        Toast.error('Failed to upload BOM: ' + error.message);
    }
}

/* ===============================
   DOCUMENT UPLOAD
================================ */
async function uploadDocument() {
    const woSelect = document.getElementById('docTransformer');
    const typeSelect = document.getElementById('docType');
    const fileInput = document.getElementById('docFile');
    if (!woSelect || !typeSelect || !fileInput) { Toast.error('Required elements not found'); return; }

    const wo = woSelect.value;
    const type = typeSelect.value;
    const file = fileInput.files[0];
    if (!wo) { Toast.warning('Please select a transformer', { title: 'No Transformer' }); return; }
    if (!file) { Toast.warning('Please select a file to upload', { title: 'No File' }); return; }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('wo', wo);
        formData.append('type', type);
        formData.append('customerId', window.currentCustomerId || '');

        const result = await uploadFile('/document/upload', formData);
        if (result.success) {
            Toast.success('Document uploaded successfully!');
            fileInput.value = '';
            loadDocumentList(wo);
        }
    } catch (error) {
        console.error('❌ Document upload error:', error);
        Toast.error('Failed to upload document: ' + error.message);
    }
}

/* ===============================
   LOAD BOM LIST
================================ */
async function loadBOMList(wo) {
    try {
        const boms = await apiRequest(`/api/bom/${wo}`);
        const listDiv = document.getElementById('bomList');
        const items = boms.data || boms;

        if (listDiv && items.length > 0) {
            listDiv.innerHTML = '<h4>Uploaded BOMs:</h4>' + items.map(b => `
                <div class="search-card">
                    📄 ${b.filename} - Uploaded: ${new Date(b.uploadedAt).toLocaleDateString()}
                    <a href="/api/download/${b.filename}" download>Download</a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Error loading BOMs:', error);
    }
}

/* ===============================
   LOAD DOCUMENT LIST
================================ */
async function loadDocumentList(wo) {
    try {
        const docs = await apiRequest(`/api/document/${wo}`);
        const listDiv = document.getElementById('docList');
        const items = docs.data || docs;

        if (listDiv && items.length > 0) {
            listDiv.innerHTML = '<h4>Uploaded Documents:</h4>' + items.map(d => `
                <div class="search-card">
                    📐 ${d.filename} (${d.type}) - Uploaded: ${new Date(d.uploadedAt).toLocaleDateString()}
                    <a href="/api/download/${d.filename}" download>Download</a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Error loading documents:', error);
    }
}

/* ===============================
   STAGE HELPER FUNCTION
================================ */
function getStageName(stage) {
    const stages = {
        'design': '🎨 Design',
        'winding': '🔧 Winding',
        'vpd': '💨 VPD',
        'coreCoil': '⚙️ Core Coil',
        'tanking': '🛢️ Tanking',
        'tankFilling': '💧 Tank Filling',
        'testing': '🧪 Testing',
        'completed': '✅ Completed'
    };
    return stages[stage] || '❓ Unknown';
}

// NOTE: loadCustomerList() is called by auth.js after a successful login.
// Do NOT call it on DOMContentLoaded — the user is not authenticated yet and
// the request will 401, clear the session, and redirect back to the login page.


window.doSearch = doSearch;
window.addTransformer = addTransformer;
window.updateTransformerDropdowns = updateTransformerDropdowns;
window.loadCustomerList = loadCustomerList;
window.uploadBOM = uploadBOM;
window.uploadDocument = uploadDocument;
window.loadBOMList = loadBOMList;
window.loadDocumentList = loadDocumentList;
window.getStageName = getStageName;
window.renderRegistryPage = renderRegistryPage;

/* ===============================
   OPEN DIGITAL TWIN (SPA navigation)
   Sets the WO and switches to digitalTwin section
================================ */
window.openDigitalTwin = function (wo) {
    if (typeof showDigitalTwin === 'function') {
        showDigitalTwin(wo);
    } else {
        // If showDigitalTwin isn't ready, set WO and navigate manually
        window._pendingDigitalTwinWO = wo;
        if (typeof showSection === 'function') showSection('digitalTwin');
    }
};