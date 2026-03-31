/**
 * Excel Export Functions
 */

/**
 * Export checklist to Excel
 * @param {string} stage - Stage name
 * @param {string} wo - Work order number
 */
async function exportChecklistToExcel(stage, wo) {
    try {
        showLoadingIndicator('Generating Excel file...');

        const url = `/export/checklist/${stage}/${encodeURIComponent(wo)}`;

        // Download file
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `checklist_${stage}_${wo.replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        hideLoadingIndicator();
        showSuccessMessage('Excel file downloaded successfully!');
    } catch (error) {
        hideLoadingIndicator();
        showErrorMessage('Failed to export Excel file');
        console.error('Export error:', error);
    }
}

/**
 * Export all transformers to Excel
 */
async function exportAllTransformers() {
    try {
        showLoadingIndicator('Exporting all transformers...');

        window.location.href = '/export/transformers';

        setTimeout(() => {
            hideLoadingIndicator();
            showSuccessMessage('Transformers exported successfully!');
        }, 1000);
    } catch (error) {
        hideLoadingIndicator();
        showErrorMessage('Failed to export transformers');
        console.error('Export error:', error);
    }
}

/**
 * Export audit logs to Excel
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 */
async function exportAuditLogs(startDate, endDate) {
    try {
        showLoadingIndicator('Exporting audit logs...');

        let url = '/export/audit';
        const params = new URLSearchParams();

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        window.location.href = url;

        setTimeout(() => {
            hideLoadingIndicator();
            showSuccessMessage('Audit logs exported successfully!');
        }, 1000);
    } catch (error) {
        hideLoadingIndicator();
        showErrorMessage('Failed to export audit logs');
        console.error('Export error:', error);
    }
}

/**
 * Export all stages for a work order
 * @param {string} wo - Work order number
 */
async function exportFullWorkOrder(wo) {
    try {
        showLoadingIndicator('Exporting complete work order...');

        window.location.href = `/export/wo/${encodeURIComponent(wo)}`;

        setTimeout(() => {
            hideLoadingIndicator();
            showSuccessMessage('Work order exported successfully!');
        }, 1000);
    } catch (error) {
        hideLoadingIndicator();
        showErrorMessage('Failed to export work order');
        console.error('Export error:', error);
    }
}

/**
 * Add export button to checklist page
 */
function addExportButtonToChecklist() {
    // Try multiple selectors to find the header
    const checklistHeader = document.querySelector('#manufacturingChecklist .checklist-header') ||
        document.querySelector('.checklist-header');

    if (!checklistHeader || document.getElementById('export-checklist-btn')) {
        // console.debug('Export button: Header not found or button already exists');
        return; // Already added or no header found
    }

    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-checklist-btn';
    exportBtn.className = 'btn btn-primary';
    exportBtn.innerHTML = '📊 Export to Excel';
    exportBtn.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';

    exportBtn.onclick = () => {
        const stage = typeof getCurrentStage === 'function' ? getCurrentStage() : null;
        const wo = typeof getCurrentWorkOrder === 'function' ? getCurrentWorkOrder() : null;

        console.log('Export clicked - Stage:', stage, 'WO:', wo);

        if (stage && wo) {
            exportChecklistToExcel(stage, wo);
        } else {
            alert('Please select a work order first');
        }
    };

    checklistHeader.appendChild(exportBtn);
    console.log('✅ Export button added to checklist page');
}

/**
 * Add export button to transformer list
 */
function addExportButtonToTransformerList() {
    const listHeader = document.querySelector('.transformer-list-header') ||
        document.querySelector('.page-header');

    if (!listHeader || document.getElementById('export-transformers-btn')) {
        return;
    }

    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-transformers-btn';
    exportBtn.className = 'btn btn-success';
    exportBtn.innerHTML = '📊 Export All';
    exportBtn.style.cssText = 'margin-left: 10px;';

    exportBtn.onclick = exportAllTransformers;

    listHeader.appendChild(exportBtn);
}

/**
 * Add export button to audit log page
 */
function addExportButtonToAuditLog() {
    const auditHeader = document.querySelector('.audit-header') ||
        document.querySelector('.page-header');

    if (!auditHeader || document.getElementById('export-audit-btn')) {
        return;
    }

    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-audit-btn';
    exportBtn.className = 'btn btn-success';
    exportBtn.innerHTML = '📊 Export Logs';
    exportBtn.style.cssText = 'margin-left: 10px;';

    exportBtn.onclick = () => {
        // Get date filters if they exist
        const startDate = document.getElementById('audit-start-date')?.value;
        const endDate = document.getElementById('audit-end-date')?.value;
        exportAuditLogs(startDate, endDate);
    };

    auditHeader.appendChild(exportBtn);
}

/**
 * Initialize export buttons on page load
 */
function initializeExportButtons() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addAllExportButtons, 500);
        });
    } else {
        setTimeout(addAllExportButtons, 500);
    }
}

function addAllExportButtons() {
    addExportButtonToChecklist();
    addExportButtonToTransformerList();
    addExportButtonToAuditLog();
}

// Auto-initialize
initializeExportButtons();

// Also try when view changes (for SPA behavior)
if (typeof window.addEventListener !== 'undefined') {
    // Retry when hash changes
    window.addEventListener('hashchange', () => {
        setTimeout(addAllExportButtons, 500);
    });

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
        addAllExportButtons();
    });

    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

console.log('📊 Export functions loaded');

// Export for external use
window.exportFullWorkOrder = exportFullWorkOrder;
