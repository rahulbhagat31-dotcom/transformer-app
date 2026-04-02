/* ===============================
   API COMMUNICATION LAYER
   Handles all HTTP requests to backend
================================ */

// Default to same-origin so the app works when deployed behind any host/port.
// (You can still override by setting `window.__API_BASE__` before this script loads.)
const API_BASE = window.__API_BASE__ || window.location.origin;

// Generic API call wrapper with error handling
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        credentials: 'include', // Send HttpOnly auth cookie automatically
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        // Normalize: strip /api prefix if present — server routes are mounted at /
        const normalizedEndpoint = endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint;
        const response = await fetch(`${API_BASE}${normalizedEndpoint}`, options);

        // Handle 401 Unauthorized - token expired or cookie missing
        if (response.status === 401) {
            console.warn('🔐 Unauthorized - clearing session');
            // Clear cookie server-side
            try {
                await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
            } catch (err) {
                console.warn('Silent failure on server-side logout', err);
            }
            localStorage.removeItem('user');
            localStorage.removeItem('rememberedUserId');
            // Show session expired message if not already on login page
            const loginPage = document.getElementById('loginPage');
            const errorDiv = document.getElementById('loginError');
            if (loginPage) {
                document.getElementById('mainApp').style.display = 'none';
                loginPage.style.display = 'block';
                if (errorDiv) {
                    errorDiv.textContent = '⏱️ Your session has expired. Please log in again.';
                    errorDiv.style.display = 'block';
                }
            } else {
                window.location.reload();
            }
            throw new Error('Session expired. Please log in again.');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`❌ API Error [${method} ${endpoint}]:`, error);
        throw error;
    }
}

// File upload helper
async function uploadFile(endpoint, formData) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            credentials: 'include', // Send HttpOnly auth cookie
            body: formData
            // Note: no Content-Type header — browser sets multipart/form-data with boundary automatically
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data;
    } catch (error) {
        console.error('❌ Upload Error:', error);
        throw error;
    }
}
// ========================================
// AUDIT LOG API
// ========================================

async function getAuditLogs(entity, entityId, startDate, endDate, userId) {
    const params = new URLSearchParams();
    if (entity) params.append('entity', entity);
    if (entityId) params.append('entityId', entityId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (userId) params.append('userId', userId);

    return apiCall(`/audit?${params.toString()}`);
}

// Export to window
window.getAuditLogs = getAuditLogs;

// ========================================
// STAGE CONTROL API
// ========================================

/**
 * Get stage status for a work order
 */
async function getStageStatus(wo) {
    return apiCall(`/stage/${encodeURIComponent(wo)}`);
}

/**
 * Check if user can access a stage
 */
async function checkStageAccess(wo, stage) {
    return apiCall(`/stage/${encodeURIComponent(wo)}/check-access`, 'POST', { stage });
}

/**
 * Update stage progress percentage
 */
async function updateStageProgress(wo, stage, percentage) {
    return apiCall(`/stage/${encodeURIComponent(wo)}/update-progress`, 'POST', { stage, percentage });
}

/**
 * Mark stage as complete
 */
async function completeStage(wo, stage) {
    return apiCall(`/stage/${encodeURIComponent(wo)}/complete`, 'POST', { stage });
}

/**
 * Unlock a stage (admin only)
 */
async function unlockStage(wo, stage, reason) {
    return apiCall(`/stage/${encodeURIComponent(wo)}/unlock`, 'POST', { stage, reason });
}

/**
 * Lock a specific checklist row (admin only)
 */
async function lockChecklistRow(itemId, reason) {
    return apiCall(`/checklist/row/${itemId}/lock`, 'POST', { reason });
}

/**
 * Unlock a specific checklist row (admin only)
 */
async function unlockChecklistRow(itemId, reason) {
    return apiCall(`/checklist/row/${itemId}/unlock`, 'POST', { reason });
}

// Export for use in other modules
window.apiCall = apiCall;
window.uploadFile = uploadFile;
window.getStageStatus = getStageStatus;
window.checkStageAccess = checkStageAccess;
window.updateStageProgress = updateStageProgress;
window.completeStage = completeStage;
window.unlockStage = unlockStage;
window.lockChecklistRow = lockChecklistRow;
window.unlockChecklistRow = unlockChecklistRow;

/**
 * apiRequest - Modern wrapper for apiCall
 * Compatible with feature scripts that use: apiRequest(url, { method, body })
 * Falls back to GET if no options provided.
 */
async function apiRequest(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || null;
    return apiCall(url, method, body);
}
window.apiRequest = apiRequest;
