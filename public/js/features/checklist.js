/* ===============================
   MANUFACTURING CHECKLIST LOGIC
   Atlanta PDF-based checklist with 4-role system
================================ */

let currentStage = 'winding1';
let currentWO = '';
let currentTransformerData = null;
let currentStageStatus = null; // 🔹 NEW: Track stage status

/* ===============================
   STAGE CONTROL SYSTEM (NEW)
================================ */

/**
 * Load and display stage status
 */
async function loadStageStatus(wo) {
    if (!wo) {
        console.warn('⚠️ No W.O. provided to loadStageStatus');
        return;
    }

    try {
        const response = await getStageStatus(wo);
        currentStageStatus = response.data || response;
        console.log(`📊 Stage status loaded for ${wo}:`, currentStageStatus);

        // Ensure stage status container is visible
        const stageContainer = document.getElementById('stageStatusContainer');
        if (stageContainer) {
            stageContainer.style.display = 'block';
        }

        // Update UI with stage status
        updateStageUI();

        return currentStageStatus;
    } catch (error) {
        console.error('❌ Error loading stage status:', error);
        // Create default structure if API fails
        currentStageStatus = {
            winding: { status: 'in-progress', completionPercentage: 0, locked: false, completedAt: null, completedBy: null },
            spa: { status: 'pending', completionPercentage: 0, locked: false, completedAt: null, completedBy: null },
            coreCoil: { status: 'pending', completionPercentage: 0, locked: true, completedAt: null, completedBy: null },
            tanking: { status: 'pending', completionPercentage: 0, locked: true, completedAt: null, completedBy: null }
        };
        updateStageUI();
        return null;
    }
}

/**
 * Update stage UI with badges and lock indicators
 */
function updateStageUI() {
    if (!currentStageStatus) return;

    const stageContainer = document.getElementById('stageStatusContainer');
    if (!stageContainer) return;

    // Show the container
    stageContainer.style.display = 'block';

    const stages = ['winding', 'spa', 'coreCoil', 'tanking'];
    let html = '<div class="stage-badges">';

    stages.forEach(stage => {
        const stageInfo = currentStageStatus[stage];
        if (!stageInfo) return;

        let badge = '';
        let icon = '';

        if (stageInfo.locked && stageInfo.status === 'completed') {
            badge = 'completed';
            icon = '✅';
        } else if (stageInfo.locked && stageInfo.status !== 'completed') {
            badge = 'pending';
            icon = '🔒';
        } else if (stageInfo.status === 'in-progress') {
            badge = 'in-progress';
            icon = '⏳';
        } else {
            badge = 'pending';
            icon = '⏳';
        }

        const label = stage.charAt(0).toUpperCase() + stage.slice(1);
        const percentage = stageInfo.completionPercentage || 0;

        html += `<div class="stage-badge ${badge}" title="${percentage}% complete">
                    <span>${icon}</span>
                    <span>${label}</span>
                    <span class="percentage">${percentage}%</span>
                </div>`;
    });

    html += '</div>';
    stageContainer.innerHTML = html;

    // 🔹 NEW: Update stage control buttons visibility
    updateStageControlButtons();
}

function hideAllStagePanels() {
    ['stageControlButtons', 'stageLockMessage', 'stageApprovedMessage', 
     'stageRejectedMessage', 'stageAwaitingQAMessage'].forEach(id => {
        const div = document.getElementById(id);
        if (div) div.style.display = 'none';
    });
}

function renderApprovedState(stageInfo, isAdmin) {
    const approvedMessageDiv = document.getElementById('stageApprovedMessage');
    if (approvedMessageDiv) {
        approvedMessageDiv.style.display = 'block';
        const subMsg = document.getElementById('stageApprovedSubMsg');
        if (subMsg) {
            const approvedBy = stageInfo.approvedBy || 'QA';
            const approvedAt = stageInfo.approvedAt
                ? new Date(stageInfo.approvedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';
            subMsg.textContent = `Approved by ${approvedBy}${approvedAt ? ' on ' + approvedAt : ''}.`;
        }
        const adminBtn = document.getElementById('adminUnlockBtnApproved');
        if (adminBtn) adminBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
}

function renderAwaitingQAState(stageInfo, isAdmin, isQA) {
    const awaitingQADiv = document.getElementById('stageAwaitingQAMessage');
    const lockMessageDiv = document.getElementById('stageLockMessage');
    if (awaitingQADiv) {
        awaitingQADiv.style.display = 'block';
        const subMsg = document.getElementById('stageAwaitingSubMsg');
        if (subMsg && stageInfo.submittedBy) {
            const submittedAt = stageInfo.submittedAt
                ? new Date(stageInfo.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';
            subMsg.textContent = `Submitted by ${stageInfo.submittedBy}${submittedAt ? ' on ' + submittedAt : ''}. QA is reviewing — awaiting response.`;
        }
        // QA/admin: show Approve + Reject
        if (isQA || isAdmin) {
            if (lockMessageDiv) {
                lockMessageDiv.style.display = 'block';
                awaitingQADiv.style.display = 'none'; // QA sees lock panel with action buttons
                const approveBtn = document.getElementById('approveStageBtn');
                if (approveBtn) approveBtn.style.display = 'inline-block';
                const rejectBtn = document.getElementById('rejectStageBtn');
                if (rejectBtn) rejectBtn.style.display = 'inline-block';
            }
        } else {
            const reopenBtn = document.getElementById('adminUnlockBtnAwaiting');
            if (reopenBtn) reopenBtn.style.display = isAdmin ? 'inline-block' : 'none';
        }
    }
}

function renderLockedCompletedState(isAdmin, isQA) {
    const lockMessageDiv = document.getElementById('stageLockMessage');
    if (lockMessageDiv) {
        lockMessageDiv.style.display = 'block';
        const approveBtn = document.getElementById('approveStageBtn');
        if (approveBtn) approveBtn.style.display = (isQA || isAdmin) ? 'inline-block' : 'none';
        const rejectBtn = document.getElementById('rejectStageBtn');
        if (rejectBtn) rejectBtn.style.display = (isQA || isAdmin) ? 'inline-block' : 'none';
        const reopenBtn = document.getElementById('adminUnlockBtnLocked');
        if (reopenBtn) reopenBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
}

function renderInProgressState(stageInfo, isAdmin, isProduction, isLocked, status) {
    const controlDiv = document.getElementById('stageControlButtons');
    const rejectedMessageDiv = document.getElementById('stageRejectedMessage');
    
    // Show rejection notice if stage was previously rejected
    if (stageInfo.rejectionReason) {
        if (rejectedMessageDiv) {
            rejectedMessageDiv.style.display = 'block';
            const rejBy = document.getElementById('stageRejectedByMsg');
            if (rejBy) {
                const rejectedBy = stageInfo.rejectedBy || 'QA';
                const rejectedAt = stageInfo.rejectedAt
                    ? new Date(stageInfo.rejectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '';
                rejBy.textContent = `Returned by ${rejectedBy}${rejectedAt ? ' on ' + rejectedAt : ''}:`;
            }
            const reasonEl = document.getElementById('stageRejectionReasonText');
            if (reasonEl) reasonEl.textContent = stageInfo.rejectionReason;
        }
    }

    const isEditable = !isLocked && status === 'in-progress';
    if (isEditable || isAdmin) {
        if (controlDiv) {
            controlDiv.style.display = 'block';
            const submitBtn = controlDiv.querySelector('button[onclick*="markStageComplete"]');
            if (submitBtn) submitBtn.style.display = isEditable ? 'inline-block' : 'none';
            // Ready for QA button: show for production role when editable
            const readyBtn = document.getElementById('readyForQABtn');
            if (readyBtn) readyBtn.style.display = (isEditable && isProduction) ? 'inline-block' : 'none';
            const adminBtn = document.getElementById('adminUnlockBtn');
            if (adminBtn) adminBtn.style.display = (isAdmin && !isEditable) ? 'inline-block' : 'none';
            const hasVisible = controlDiv.querySelectorAll('button');
            const anyVisible = Array.from(hasVisible).some(b => b.style.display !== 'none');
            if (!anyVisible) controlDiv.style.display = 'none';
        }
    }
}

/**
 * Show/hide stage control buttons based on stage status and user role
 */
function updateStageControlButtons() {
    if (!currentStageStatus || !currentStage) return;

    hideAllStagePanels();

    const mainStage = currentStage.startsWith('winding') ? 'winding' : currentStage;
    const stageInfo = currentStageStatus[mainStage];
    
    if (!stageInfo) return;

    const userRole = window.currentUserRole;
    const isAdmin = userRole === 'admin';
    const isQA = userRole === 'quality';
    const isProduction = userRole === 'engineer' || userRole === 'production';

    const status = stageInfo.status;
    const isLocked = !!stageInfo.locked;

    if (status === 'approved') {
        renderApprovedState(stageInfo, isAdmin);
    } else if (status === 'awaiting_qa') {
        renderAwaitingQAState(stageInfo, isAdmin, isQA);
    } else if (isLocked && status === 'completed') {
        renderLockedCompletedState(isAdmin, isQA);
    } else {
        renderInProgressState(stageInfo, isAdmin, isProduction, isLocked, status);
    }

    if (typeof updateStageTabBadge === 'function') {
        updateStageTabBadge(mainStage, status);
    }
}

/**
 * Check if stage can be accessed
 */
async function validateStageAccess(wo, stage) {
    try {
        console.log(`🔍 Validating access for WO: ${wo}, Stage: ${stage}`);

        // If no stage status loaded, allow access (will show lock message if needed)
        if (!currentStageStatus) {
            console.warn('⚠️ Stage status not loaded, allowing access');
            return true;
        }

        const mainStage = stage.startsWith('winding') ? 'winding' : stage;
        const stageInfo = currentStageStatus[mainStage];

        if (!stageInfo) {
            console.warn(`⚠️ Stage ${mainStage} not found in status`);
            return true;
        }

        // Check if stage is locked and completed
        if (stageInfo.locked && stageInfo.status === 'completed') {
            console.warn(`⛔ Access denied - stage is locked: ${mainStage}`);
            alert('⛔ Stage is locked and cannot be edited.\nContact admin to unlock.');
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Stage access validation error:', error);
        // Allow access on error - let backend handle validation
        return true;
    }
}

/**
 * Mark stage as complete
 */
async function markStageComplete(wo, stage) {
    if (!wo || !stage) {
        alert('⚠️ Missing WO or stage');
        return false;
    }

    const confirmed = confirm(`✅ Submit ${stage.toUpperCase()} stage for QA review?\n\nThis will lock the stage and send it for QA approval.`);
    if (!confirmed) return false;

    try {
        const response = await completeStage(wo, stage);
        const result = response.data || response;

        console.log('✅ Stage submitted for review:', result);
        alert(`✅ ${stage.toUpperCase()} stage submitted for QA review!`);

        // Reload stage status
        await loadStageStatus(wo);

        return true;
    } catch (error) {
        console.error('❌ Error submitting stage:', error);
        alert(`❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Approve the current stage (QA / admin only)
 * Calls POST /stage/:wo/approve → marks approved, unlocks next stage
 */
async function approveCurrentStage() {
    const wo = window.currentWO;
    const stage = window.currentStage;
    const mainStage = stage && stage.startsWith('winding') ? 'winding' : stage;

    if (!wo || !mainStage) {
        alert('⚠️ No active WO or stage');
        return;
    }

    const confirmed = confirm(`✔ Approve ${mainStage.toUpperCase()} stage?\n\nThis will mark the stage as QA-approved and unlock the next stage.`);
    if (!confirmed) return;

    try {
        const btn = document.getElementById('approveStageBtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Approving…'; }

        const response = await apiCall(`/stage/${encodeURIComponent(wo)}/approve`, 'POST', { stage: mainStage });

        if (response.success || response.data) {
            alert(`✔ ${mainStage.toUpperCase()} stage approved successfully!\nThe next stage is now unlocked.`);
            await loadStageStatus(wo);
        } else {
            throw new Error(response.error || 'Approval failed');
        }
    } catch (error) {
        console.error('❌ Stage approval error:', error);
        alert(`❌ ${error.message}`);
        const btn = document.getElementById('approveStageBtn');
        if (btn) { btn.disabled = false; btn.textContent = '✔ Approve Stage'; }
    }
}

/**
 * Show the Reject Stage modal
 */
function showRejectStageModal() {
    const userRole = window.currentUserRole;
    if (userRole !== 'quality' && userRole !== 'admin') {
        alert('⚠️ Only QA or admin can reject a stage');
        return;
    }
    const modal = document.getElementById('rejectStageModal');
    const textarea = document.getElementById('rejectStageReason');
    const errDiv = document.getElementById('rejectReasonError');
    if (textarea) textarea.value = '';
    if (errDiv) errDiv.style.display = 'none';
    if (modal) modal.style.display = 'flex';
}

/**
 * Close the Reject Stage modal
 */
function closeRejectStageModal() {
    const modal = document.getElementById('rejectStageModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Confirm stage rejection
 */
async function confirmRejectStage() {
    const wo = window.currentWO;
    const stage = window.currentStage;
    const mainStage = stage && stage.startsWith('winding') ? 'winding' : stage;
    const reason = (document.getElementById('rejectStageReason')?.value || '').trim();
    const errDiv = document.getElementById('rejectReasonError');

    if (reason.length < 10) {
        if (errDiv) errDiv.style.display = 'block';
        return;
    }
    if (errDiv) errDiv.style.display = 'none';

    if (!wo || !mainStage) {
        alert('⚠️ No active WO or stage');
        return;
    }

    try {
        const confirmBtn = document.querySelector('#rejectStageModal .btn-danger');
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '⏳ Rejecting…'; }

        const response = await apiCall(`/stage/${encodeURIComponent(wo)}/reject`, 'POST', { stage: mainStage, reason });

        if (response.success || response.data) {
            closeRejectStageModal();
            alert(`❌ Stage returned for corrections.\n\nProduction engineer will see the QA comment:\n"${reason}"`);
            await loadStageStatus(wo);
        } else {
            throw new Error(response.error || 'Rejection failed');
        }
    } catch (error) {
        console.error('❌ Stage rejection error:', error);
        alert(`❌ ${error.message}`);
        const confirmBtn = document.querySelector('#rejectStageModal .btn-danger');
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '❌ Confirm Rejection'; }
    }
}

/**
 * Production engineer: signal this stage is ready for QA inspection
 * Calls POST /stage/:wo/ready-for-qa → sets status = awaiting_qa
 */
async function submitStageForQAReview() {
    const wo = window.currentWO;
    const stage = window.currentStage;
    const mainStage = stage && stage.startsWith('winding') ? 'winding' : stage;

    if (!wo || !mainStage) { alert('⚠️ No active WO or stage'); return; }

    const confirmed = confirm(`📋 Mark ${mainStage.toUpperCase()} as Ready for QA?\n\nThe stage will be locked and QA will be able to review and approve or reject it.`);
    if (!confirmed) return;

    try {
        const btn = document.getElementById('readyForQABtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Submitting…'; }

        const response = await apiCall(`/stage/${encodeURIComponent(wo)}/ready-for-qa`, 'POST', { stage: mainStage });

        if (response.success || response.data) {
            alert(`📋 ${mainStage.toUpperCase()} submitted for QA review!\nYou will be notified once QA responds.`);
            await loadStageStatus(wo);
        } else {
            throw new Error(response.error || 'Submission failed');
        }
    } catch (error) {
        console.error('❌ Ready for QA error:', error);
        alert(`❌ ${error.message}`);
        const btn = document.getElementById('readyForQABtn');
        if (btn) { btn.disabled = false; btn.textContent = '📋 Ready for QA'; }
    }
}

/**
 * Unlock stage (admin only)
 */
async function showUnlockDialog(wo, stage) {
    if (window.currentUserRole !== 'admin') {
        alert('⚠️ Only admins can unlock stages');
        return;
    }

    const reason = prompt(`🔓 Unlock ${stage.toUpperCase()} stage?\n\nEnter reason (min 10 characters):`);
    if (!reason || reason.length < 10) {
        alert('⚠️ Please enter a valid reason (minimum 10 characters)');
        return;
    }

    try {
        const response = await unlockStage(wo, stage, reason);
        const result = response.data || response;

        console.log('🔓 Stage unlocked:', result);
        alert(`✅ ${stage.toUpperCase()} stage unlocked by admin.\nReason: ${reason}`);

        // Reload stage status
        await loadStageStatus(wo);

    } catch (error) {
        console.error('❌ Error unlocking stage:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

/* ===============================
   LOAD CHECKLIST TRANSFORMERS
================================ */
async function loadChecklistTransformers() {
    try {
        const response = await apiCall('/transformers');
        console.log('📦 API Response:', response); // Debug log

        const transformers = response.data || response;
        console.log('📋 Transformers:', transformers); // Debug log

        const select = document.getElementById('checklistWOSelect');
        if (!select) {
            console.error('❌ Select element not found: checklistWOSelect');
            return;
        }

        if (!transformers || transformers.length === 0) {
            console.warn('⚠️ No transformers available');
            select.innerHTML = '<option value="">No transformers available</option>';
            return;
        }

        // Get unique W.O. numbers to avoid duplicates
        const uniqueTransformers = Array.from(new Map(transformers.map(t => [t.wo, t])).values());
        console.log('✅ Unique transformers:', uniqueTransformers);

        const options = uniqueTransformers.map(t =>
            `<option value="${t.wo}" data-transformer='${JSON.stringify(t)}'>${t.wo} - ${t.customer || 'Unknown'}</option>`
        ).join('');

        select.innerHTML = '<option value="">-- Select Transformer W.O. --</option>' + options;
        console.log(`✅ Loaded ${uniqueTransformers.length} transformers`);
    } catch (error) {
        console.error('❌ Error loading transformers:', error);
        const select = document.getElementById('checklistWOSelect');
        if (select) {
            select.innerHTML = '<option value="">Error loading transformers</option>';
        }
    }
}

/* ===============================
   W.O. SELECTION CHANGE
================================ */
function onWOChange() {
    const select = document.getElementById('checklistWOSelect');
    if (!select) return;

    const selectedOption = select.options[select.selectedIndex];
    currentWO = select.value;

    if (currentWO) {
        currentTransformerData = JSON.parse(selectedOption.getAttribute('data-transformer'));

        // Show transformer details
        document.getElementById('woDetails').style.display = 'block';
        document.getElementById('woCustomer').textContent = currentTransformerData.customer || 'N/A';
        document.getElementById('woRating').textContent = currentTransformerData.rating || 'N/A';
        document.getElementById('woVoltage').textContent =
            `HV: ${currentTransformerData.hv || 'N/A'}V / LV: ${currentTransformerData.lv || 'N/A'}V`;

        // Show checklist content
        document.getElementById('checklistMainContent').style.display = 'block';
        document.getElementById('noWOMessage').style.display = 'none';

        // 🔹 NEW: Load stage status
        loadStageStatus(currentWO).then(() => {
            // Load the current stage
            loadStageContent(currentStage);
            setTimeout(() => {
                loadChecklistData(currentStage);
                updateProgress();
            }, 100);
        }).catch(() => {
            // Even if stage status fails, still render the checklist
            loadStageContent(currentStage);
            setTimeout(() => {
                loadChecklistData(currentStage);
                updateProgress();
            }, 100);
        });
    } else {
        document.getElementById('checklistMainContent').style.display = 'none';
        document.getElementById('noWOMessage').style.display = 'block';
        document.getElementById('woDetails').style.display = 'none';
        document.getElementById('progressBar').style.display = 'none';
        currentTransformerData = null;
        currentStageStatus = null;
    }
}

/* ===============================
   SAVE CHECKLIST ITEM (PDF Structure)
================================ */
async function saveNewChecklistItem(stage, itemNumber, rowId) {
    if (!currentWO) {
        alert('⚠️ Please select a transformer W.O. number first!');
        return;
    }

    // 🔹 NEW: Check stage access before saving
    const canAccess = await validateStageAccess(currentWO, stage);
    if (!canAccess) {
        return;
    }

    // Get all values
    // Get actual value - handle different input types
    let actualValue = '';
    const mainInput = document.getElementById(`actualValue_${rowId}`);

    if (mainInput) {
        // Single input field
        actualValue = mainInput.value || '';
    } else {
        // Multiple phase/limb inputs - collect all values
        const allValues = {};

        // Check for phase-based inputs (U Phase, V Phase, W Phase)
        const phases = ['U_Phase', 'V_Phase', 'W_Phase'];
        phases.forEach(phase => {
            const input = document.getElementById(`actualValue_${rowId}_${phase}`);
            if (input) {
                allValues[phase.replace('_', ' ')] = input.value || '';
            }
        });

        // Check for limb-based inputs
        const limbs = ['Limb_1_Near_U_Phase', 'Limb_2_Near_W_Phase'];
        limbs.forEach(limb => {
            const input = document.getElementById(`actualValue_${rowId}_${limb}`);
            if (input) {
                allValues[limb.replace(/_/g, ' ')] = input.value || '';
            }
        });

        // Check for TMB measurements
        phases.forEach(phase => {
            ['T', 'M', 'B'].forEach(pos => {
                const input = document.getElementById(`actualValue_${rowId}_${phase}_${pos}`);
                if (input) {
                    const key = `${phase.replace('_', ' ')} ${pos}`;
                    allValues[key] = input.value || '';
                }
            });
        });

        // Convert to JSON string if we have multiple values
        if (Object.keys(allValues).length > 0) {
            actualValue = JSON.stringify(allValues);
        }
    }

    // Also handle technician as text input instead of dropdown
    let technicianInput = document.getElementById(`technician_${rowId}`);
    let technician = technicianInput?.value || '';

    let shopSupervisorInput = document.getElementById(`shopSup_${rowId}`);
    let shopSupervisor = shopSupervisorInput?.value || '';

    let qaSupervisorInput = document.getElementById(`qaSup_${rowId}`);
    let qaSupervisor = qaSupervisorInput?.value || '';

    let remarkInput = document.getElementById(`remark_${rowId}`);
    let remark = remarkInput?.value || '';

    // If these main inputs don't have values, check for split inputs (per phase)
    // defined in tmb-measurements or others
    const phasesForSplit = ['U_Phase', 'V_Phase', 'W_Phase'];

    // Technician Split
    if (!technician) {
        let techSplit = {};
        phasesForSplit.forEach(phase => {
            const el = document.getElementById(`technician_${rowId}_${phase}`);
            if (el && el.value) techSplit[phase.replace('_', ' ')] = el.value;
        });
        if (Object.keys(techSplit).length > 0) technician = JSON.stringify(techSplit);
    }

    // Shop Sup Split
    if (!shopSupervisor) {
        let shopSplit = {};
        phasesForSplit.forEach(phase => {
            const el = document.getElementById(`shopSup_${rowId}_${phase}`);
            if (el && el.value) shopSplit[phase.replace('_', ' ')] = el.value;
        });
        if (Object.keys(shopSplit).length > 0) shopSupervisor = JSON.stringify(shopSplit);
    }

    // QA Sup Split
    if (!qaSupervisor) {
        let qaSplit = {};
        phasesForSplit.forEach(phase => {
            const el = document.getElementById(`qaSup_${rowId}_${phase}`);
            if (el && el.value) qaSplit[phase.replace('_', ' ')] = el.value;
        });
        if (Object.keys(qaSplit).length > 0) qaSupervisor = JSON.stringify(qaSplit);
    }

    // Remark Split
    if (!remark) {
        let remSplit = {};
        phasesForSplit.forEach(phase => {
            const el = document.getElementById(`remark_${rowId}_${phase}`);
            if (el && el.value) remSplit[phase.replace('_', ' ')] = el.value;
        });
        if (Object.keys(remSplit).length > 0) remark = JSON.stringify(remSplit);
    }

    // Validation
    if (!actualValue.trim()) {
        alert('❌ Please enter Actual Value');
        return;
    }

    if (!technician) {
        alert('❌ Please select Technician');
        return;
    }

    // Get current timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN');

    const checklistData = {
        wo: String(currentWO || ''),
        customerId: String(currentTransformerData?.customerId || ''),
        customer: String(currentTransformerData?.customer || ''),
        stage: String(stage || ''),
        itemNumber: Number(itemNumber),
        rowId: String(rowId || ''),
        actualValue: String(actualValue || ''),
        technician: String(technician || ''),
        shopSupervisor: String(shopSupervisor || ''),
        qaSupervisor: String(qaSupervisor || ''),
        remark: String(remark || ''),
        timestamp: String(timestamp || ''),
        userId: String(window.currentUserId || ''),
        userName: String(window.currentUserName || ''),
        userRole: String(window.currentUserRole || '')
    };

    console.log('📤 Sending checklist data:', JSON.stringify(checklistData, null, 2));

    try {
        const response = await fetch(`${API_BASE}/checklist/save`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checklistData)
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const result = await response.json();
        console.log('📥 Server response:', result);

        if (response.ok && result.success) {
            // Display timestamps
            if (technician) {
                const techTime = document.getElementById(`techTime_${rowId}`);
                if (techTime) techTime.textContent = timestamp;
            }

            if (shopSupervisor) {
                const shopTime = document.getElementById(`shopTime_${rowId}`);
                if (shopTime) shopTime.textContent = timestamp;
            }

            if (qaSupervisor) {
                const qaTime = document.getElementById(`qaTime_${rowId}`);
                if (qaTime) qaTime.textContent = timestamp;
            }

            // Animate the saved row — green flash
            const row = document.getElementById(rowId);
            if (row) {
                row.setAttribute('data-locked', 'true');
                // Remove old animation first if already flashed
                row.classList.remove('row-saved-flash', 'row-locked-flash');
                // Force reflow so animation replays
                void row.offsetWidth;
                row.classList.add('row-saved-flash');
                setTimeout(() => row.classList.remove('row-saved-flash'), 1500);
            }

            // Bounce the save button
            const saveBtn = document.getElementById(`save_${rowId}`);
            if (saveBtn) {
                saveBtn.classList.add('btn-click-bounce');
                setTimeout(() => saveBtn.classList.remove('btn-click-bounce'), 350);
            }

            // Disable inputs if not admin
            if (window.currentUserRole !== 'admin') {
                const inputs = row?.querySelectorAll('input, select, textarea') || [];
                inputs.forEach(input => input.disabled = true);

                if (saveBtn) {
                    saveBtn.innerHTML = '🔒 Submitted';
                    saveBtn.disabled = true;
                    saveBtn.style.background = '#95a5a6';
                }
            } else {
                if (saveBtn) {
                    saveBtn.innerHTML = '✎ Update';
                    saveBtn.style.background = '#3498db';
                }
            }

            // Show unlock button for admin
            const unlockBtn = document.getElementById(`unlock_${rowId}`);
            if (unlockBtn && window.currentUserRole === 'admin') {
                unlockBtn.style.display = 'inline-block';
            }

            // Activity Line — inject audit trail inline below the row
            if (row) {
                const existingLine = row.querySelector('.audit-activity-line');
                if (!existingLine) {
                    // Build Activity Line: User · Role · Shift · Time → Submitted
                    const userName = (result.savedBy || result.technician || window.currentUser || 'Engineer');
                    const userRole = (result.role || window.currentUserRole || '');
                    const shift = (result.shift || result.shiftName || '');
                    const ts = result.savedAt || result.updatedAt || result.timestamp || '';
                    const timeStr = ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

                    const lineHTML = `
                        <td colspan="99">
                            <div class="audit-activity-line">
                                <span class="aal-user">${userName}</span>
                                ${userRole ? `<span class="aal-role">${userRole}</span><span class="aal-dot">·</span>` : ''}
                                ${shift ? `<span class="aal-shift">${shift}</span><span class="aal-dot">·</span>` : ''}
                                ${timeStr ? `<span class="aal-time">${timeStr}</span>` : ''}
                                <span class="aal-arrow">→</span>
                                <span class="aal-action aal-submitted">Submitted</span>
                            </div>
                        </td>`;

                    const activityRow = document.createElement('tr');
                    activityRow.innerHTML = lineHTML;
                    activityRow.className = 'audit-activity-row';
                    row.after(activityRow);
                }
            }

            // Brief toast instead of blocking alert
            if (typeof showToast === 'function') {
                showToast('success', `✅ Item ${itemNumber} saved`, { duration: 1800 });
            } else {
                console.log(`✅ Item ${itemNumber} saved successfully`);
            }
            setTimeout(() => updateProgress(), 200);
        } else {
            throw new Error(result.error || 'Failed to save');
        }

    } catch (error) {
        console.error('❌ Error saving:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

/* ===============================
   LOAD CHECKLIST DATA
================================ */
async function loadChecklistData(stage) {
    if (!currentWO) {
        console.log('No W.O. selected');
        return;
    }

    // 🔹 NEW: Check stage access before loading
    const canAccess = await validateStageAccess(currentWO, stage);
    if (!canAccess) {
        console.log(`Access denied for stage ${stage}`);
        const container = document.getElementById('checklistContent');
        if (container) {
            container.innerHTML = '<div class="stage-locked-message">⛔ This stage is locked. Contact your administrator to proceed.</div>';
        }
        return;
    }

    try {
        const checklistItems = await apiCall(`/checklist/${stage}/${encodeURIComponent(currentWO)}`);

        checklistItems.forEach(item => {
            const rowId = item.rowId;

            // Set values
            // Handle loading actual values - check if it's JSON (multiple values)
            const actualValueInput = document.getElementById(`actualValue_${rowId}`);
            if (actualValueInput) {
                actualValueInput.value = item.actualValue || '';
                if (item.locked && window.currentUserRole !== 'admin') {
                    actualValueInput.disabled = true;
                }
            } else {
                // Try to parse as JSON for multi-value fields
                try {
                    const values = JSON.parse(item.actualValue || '{}');
                    Object.entries(values).forEach(([key, value]) => {
                        // Convert key to ID format
                        const cleanKey = key.replace(/\s+/g, '_');
                        let inputId = `actualValue_${rowId}_${cleanKey}`;

                        const input = document.getElementById(inputId);
                        if (input) {
                            input.value = value;
                            if (item.locked && window.currentUserRole !== 'admin') {
                                input.disabled = true;
                            }
                        }
                    });
                } catch {
                    // Not JSON, try single value
                    const singleInput = document.getElementById(`actualValue_${rowId}`);
                    if (singleInput) {
                        singleInput.value = item.actualValue || '';
                    }
                }
            }

            const techInput = document.getElementById(`technician_${rowId}`);
            if (techInput) {
                techInput.value = item.technician || '';
                if (item.locked && window.currentUserRole !== 'admin') {
                    techInput.disabled = true;
                }
            } else {
                // Try parsing as split technician
                try {
                    const techs = JSON.parse(item.technician || '{}');
                    Object.entries(techs).forEach(([key, val]) => {
                        const el = document.getElementById(`technician_${rowId}_${key.replace(/\s+/g, '_')}`);
                        if (el) {
                            el.value = val;
                            if (item.locked && window.currentUserRole !== 'admin') el.disabled = true;
                        }
                    });
                } catch { }
            }

            // Load Shop Supervisor
            const shopInput = document.getElementById(`shopSup_${rowId}`);
            if (shopInput) {
                shopInput.value = item.shopSupervisor || '';
                if (item.locked && window.currentUserRole !== 'admin') shopInput.disabled = true;
            } else {
                try {
                    const shops = JSON.parse(item.shopSupervisor || '{}');
                    Object.entries(shops).forEach(([key, val]) => {
                        const el = document.getElementById(`shopSup_${rowId}_${key.replace(/\s+/g, '_')}`);
                        if (el) {
                            el.value = val;
                            if (item.locked && window.currentUserRole !== 'admin') el.disabled = true;
                        }
                    });
                } catch {}
            }

            // Load QA Supervisor
            const qaInput = document.getElementById(`qaSup_${rowId}`);
            if (qaInput) {
                qaInput.value = item.qaSupervisor || '';
                if (item.locked && window.currentUserRole !== 'admin') qaInput.disabled = true;
            } else {
                try {
                    const qas = JSON.parse(item.qaSupervisor || '{}');
                    Object.entries(qas).forEach(([key, val]) => {
                        const el = document.getElementById(`qaSup_${rowId}_${key.replace(/\s+/g, '_')}`);
                        if (el) {
                            el.value = val;
                            if (item.locked && window.currentUserRole !== 'admin') el.disabled = true;
                        }
                    });
                } catch {}
            }

            // Load Remark
            const remInput = document.getElementById(`remark_${rowId}`);
            if (remInput) {
                remInput.value = item.remark || '';
                if (item.locked && window.currentUserRole !== 'admin') remInput.disabled = true;
            } else {
                try {
                    const rems = JSON.parse(item.remark || '{}');
                    Object.entries(rems).forEach(([key, val]) => {
                        const el = document.getElementById(`remark_${rowId}_${key.replace(/\s+/g, '_')}`);
                        if (el) {
                            el.value = val;
                            if (item.locked && window.currentUserRole !== 'admin') el.disabled = true;
                        }
                    });
                } catch {}
            }

            // Display timestamps
            if (item.timestamp) {
                const techTime = document.getElementById(`techTime_${rowId}`);
                const shopTime = document.getElementById(`shopTime_${rowId}`);
                const qaTime = document.getElementById(`qaTime_${rowId}`);

                if (techTime) techTime.textContent = item.timestamp;
                if (shopTime) shopTime.textContent = item.timestamp;
                if (qaTime) qaTime.textContent = item.timestamp;
            }

            // Update row lock status
            const row = document.getElementById(rowId);
            if (row) {
                row.setAttribute('data-locked', item.locked);
                if (item.locked) row.style.backgroundColor = '#f0f0f0';
                if (!item.locked && window.currentUserRole === 'admin') {
                    row.style.backgroundColor = '#fff3cd';
                }
            }

            // ── Status badge (Week 1: status badges everywhere) ──
            if (typeof renderRowStatusBadge === 'function') {
                renderRowStatusBadge(rowId, item);
            }

            // Update buttons (Week 2: rename Save → Submit)
            if (typeof updateSaveButtonLabel === 'function') {
                updateSaveButtonLabel(rowId, item);
            } else {
                const saveBtn = document.getElementById(`save_${rowId}`);
                if (saveBtn) {
                    if (item.locked && window.currentUserRole !== 'admin') {
                        saveBtn.innerHTML = '🔒 Locked';
                        saveBtn.disabled = true;
                        saveBtn.style.background = '#95a5a6';
                    } else if (item.locked && window.currentUserRole === 'admin') {
                        saveBtn.innerHTML = '🔒 Update';
                        saveBtn.style.background = '#3498db';
                    } else {
                        saveBtn.innerHTML = '✅ Submit';
                        saveBtn.style.background = '#27ae60';
                        saveBtn.disabled = false;
                    }
                }
            }

            // Update lock/unlock buttons for admin (new system with dropdown)
            if (window.currentUserRole === 'admin') {
                const lockBtn = document.getElementById(`lock_${rowId}`);
                const rowUnlockBtn = document.getElementById(`rowUnlock_${rowId}`);

                if (lockBtn) {
                    lockBtn.style.display = !item.locked ? 'inline-block' : 'none';
                }
                if (rowUnlockBtn) {
                    rowUnlockBtn.style.display = item.locked ? 'inline-block' : 'none';
                }
            }
        });

        console.log(`✅ Loaded ${checklistItems.length} items for ${stage} - WO: ${currentWO}`);

        // ── Stage summary pills (Week 1) ──
        if (typeof renderStageSummaryPills === 'function') {
            renderStageSummaryPills('stageSummaryPills', checklistItems);
        }

        // 🔹 Update stage control button visibility
        updateStageControlButtons();
    } catch (error) {
        console.error('❌ Error loading checklist:', error);
    }
}

/* ===============================
   UPDATE PROGRESS BAR
================================ */
async function updateProgress() {
    if (!currentWO || !currentStage) return;

    try {
        const items = await apiCall(`/checklist/${currentStage}/${encodeURIComponent(currentWO)}`);

        const allRows = document.querySelectorAll('[id^="row_' + currentStage + '_"]');
        const total = allRows.length;
        const completed = items.filter(i => i.locked && i.actualValue).length;
        const pending = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('progressBar').style.display = 'block';
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = percentage + '% Complete';
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('totalCount').textContent = total;

        // Hero banner stat chips
        const hc = document.getElementById('heroCompleted');
        const hp = document.getElementById('heroPending');
        const ht = document.getElementById('heroTotal');
        if (hc) hc.textContent = completed;
        if (hp) hp.textContent = pending;
        if (ht) ht.textContent = total;

        const progressFill = document.getElementById('progressFill');
        if (percentage === 100) {
            progressFill.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
        } else if (percentage >= 50) {
            progressFill.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        }
    } catch (error) {
        console.error('❌ Error updating progress:', error);
    }
}

/* ===============================
   UNLOCK ITEM (ADMIN ONLY)
================================ */
async function unlockChecklistItem(stage, rowId) {
    if (!currentWO) {
        alert('⚠️ No W.O. selected!');
        return;
    }

    if (window.currentUserRole !== 'admin') {
        alert('⚠️ Only admins can unlock items!');
        return;
    }

    const reason = prompt('Enter reason for unlocking this item:');
    if (!reason) return;

    try {
        const result = await apiCall('/checklist/unlock', 'POST', {
            wo: currentWO,
            stage: stage,
            rowId: rowId,
            reason: reason
        });

        if (result.success) {
            const row = document.getElementById(rowId);
            if (row) {
                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = false);
                // Yellow "reopened" flash instead of static background
                row.classList.remove('row-saved-flash', 'row-locked-flash', 'row-unlocked-flash');
                void row.offsetWidth;
                row.classList.add('row-unlocked-flash');
                setTimeout(() => row.classList.remove('row-unlocked-flash'), 1400);
                row.setAttribute('data-locked', 'false');
            }

            const saveBtn = document.getElementById(`save_${rowId}`);
            if (saveBtn) {
                saveBtn.innerHTML = '💾 Save';
                saveBtn.style.background = '#27ae60';
                saveBtn.disabled = false;
            }

            const unlockBtn = document.getElementById(`unlock_${rowId}`);
            if (unlockBtn) unlockBtn.style.display = 'none';

            if (typeof showToast === 'function') {
                showToast('info', '🔑 Item re-opened', { duration: 1800 });
            }
        }
    } catch (error) {
        console.error('❌ Error unlocking:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

// Export to window
window.loadChecklistTransformers = loadChecklistTransformers;
window.onWOChange = onWOChange;
/**
 * Show unlock dialog for a specific row (admin only)
 */
function showRowUnlockDialog(itemId) {
    if (window.currentUserRole !== 'admin') {
        alert('❌ Only admin can unlock rows');
        return;
    }

    window.currentRowUnlockId = itemId;
    document.getElementById('unlockReasonSelect').value = '';
    document.getElementById('customUnlockReason').value = '';
    document.getElementById('customReasonContainer').style.display = 'none';

    const modal = document.getElementById('rowUnlockModal');
    if (modal) {
        modal.style.display = ''; // clear any stale inline style
        modal.classList.add('open');
        // Add warning pulse to the modal box
        modal.classList.remove('modal-warning-pulse');
        void modal.offsetWidth;
        modal.classList.add('modal-warning-pulse');
        setTimeout(() => modal.classList.remove('modal-warning-pulse'), 5000);
    }
}

/**
 * Show lock dialog for a specific row (admin only)
 */
function showRowLockDialog(itemId) {
    if (window.currentUserRole !== 'admin') {
        alert('❌ Only admin can lock rows');
        return;
    }

    window.currentRowLockId = itemId;

    // Reset chip state
    document.querySelectorAll('#lockReasonChips .reason-chip').forEach(c => c.classList.remove('reason-chip--active'));
    document.getElementById('lockReasonSelect').value = '';
    document.getElementById('customLockReason').value = '';
    document.getElementById('customLockReasonContainer').style.display = 'none';

    const modal = document.getElementById('rowLockModal');
    modal.style.display = 'flex';
}

/**
 * Toggle custom unlock reason textarea
 */
/**
 * Chip-based reason selector for the Re-open (unlock) modal
 * One tap selects and highlights a chip, sets hidden input value
 */
function selectUnlockReason(chipEl, value) {
    // De-select all chips
    document.querySelectorAll('#unlockReasonChips .reason-chip').forEach(c => c.classList.remove('reason-chip--active'));
    chipEl.classList.add('reason-chip--active');

    if (value === 'OTHER') {
        document.getElementById('unlockReasonSelect').value = '';
        document.getElementById('customReasonContainer').style.display = 'block';
        document.getElementById('customUnlockReason').focus();
    } else {
        document.getElementById('unlockReasonSelect').value = value;
        document.getElementById('customReasonContainer').style.display = 'none';
    }
}

// Legacy alias kept for any old references
function toggleCustomReason() { }

/**
 * Chip-based reason selector for the Submit for Review (lock) modal
 */
function selectLockReason(chipEl, value) {
    document.querySelectorAll('#lockReasonChips .reason-chip').forEach(c => c.classList.remove('reason-chip--active'));
    chipEl.classList.add('reason-chip--active');

    if (value === 'OTHER') {
        document.getElementById('lockReasonSelect').value = '';
        document.getElementById('customLockReasonContainer').style.display = 'block';
        document.getElementById('customLockReason').focus();
    } else {
        document.getElementById('lockReasonSelect').value = value;
        document.getElementById('customLockReasonContainer').style.display = 'none';
    }
}

// Legacy alias kept for any old references
function toggleCustomLockReason() { }

/**
 * Close row unlock modal
 */
function closeRowUnlockModal() {
    const m = document.getElementById('rowUnlockModal');
    if (m) { m.classList.remove('open'); m.style.display = ''; }
    window.currentRowUnlockId = null;
}

/**
 * Close row lock modal
 */
function closeRowLockModal() {
    document.getElementById('rowLockModal').style.display = 'none';
    window.currentRowLockId = null;
}

/**
 * Confirm and process row unlock
 */
async function confirmRowUnlock() {
    const itemId = window.currentRowUnlockId;
    // reason is now stored in a hidden input (chip selection or textarea freetext)
    const reason = document.getElementById('unlockReasonSelect').value.trim();

    if (!reason) {
        // Flash the chip area to indicate a selection is required
        const chips = document.getElementById('unlockReasonChips');
        if (chips) {
            chips.classList.add('btn-click-bounce');
            setTimeout(() => chips.classList.remove('btn-click-bounce'), 350);
        }
        if (typeof showToast === 'function') showToast('warning', '⚠️ Please select a reason', { duration: 2000 });
        else alert('⚠️ Please select a reason for re-opening');
        return;
    }

    try {
        console.log(`🔓 Unlocking row ${itemId} with reason: ${reason}`);
        const response = await unlockChecklistRow(itemId, reason);

        if (response.success) {
            console.log('✅ Row unlocked successfully');

            // Animate + re-enable the row
            const row = document.getElementById(itemId);
            if (row) {
                row.removeAttribute('data-locked');
                row.classList.remove('row-saved-flash', 'row-locked-flash');
                void row.offsetWidth;
                row.classList.add('row-unlocked-flash');
                setTimeout(() => row.classList.remove('row-unlocked-flash'), 1400);
                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = false);

                const saveBtn = document.getElementById(`save_${itemId}`);
                if (saveBtn) {
                    saveBtn.innerHTML = '✅ Submit';
                    saveBtn.disabled = false;
                    saveBtn.style.background = '#27ae60';
                }

                if (typeof renderRowStatusBadge === 'function') {
                    renderRowStatusBadge(itemId, { locked: false, status: 'pending' });
                }
            }

            closeRowUnlockModal();
            if (typeof showToast === 'function') showToast('info', '🔑 Row re-opened', { duration: 1800 });

        } else {
            if (typeof showToast === 'function') showToast('error', `❌ ${response.error}`, { duration: 2500 });
            else alert(`❌ Error: ${response.error}`);
        }
    } catch (error) {
        console.error('❌ Error unlocking row:', error);
        if (typeof showToast === 'function') showToast('error', '❌ Error unlocking row', { duration: 2000 });
        else alert('❌ Error unlocking row. Check console for details.');
    }
}

/**
 * Confirm and process row lock
 */
async function confirmRowLock() {
    const itemId = window.currentRowLockId;
    // reason is now stored in a hidden input (chip selection or freetext)
    const reason = document.getElementById('lockReasonSelect').value.trim();

    if (!reason) {
        const chips = document.getElementById('lockReasonChips');
        if (chips) {
            chips.classList.add('btn-click-bounce');
            setTimeout(() => chips.classList.remove('btn-click-bounce'), 350);
        }
        if (typeof showToast === 'function') showToast('warning', '⚠️ Please select a submission reason', { duration: 2000 });
        else alert('⚠️ Please select a reason for submission');
        return;
    }

    try {
        console.log(`🔒 Locking row ${itemId} with reason: ${reason}`);
        const response = await lockChecklistRow(itemId, reason);

        if (response.success) {
            console.log('✅ Row locked successfully');

            const row = document.getElementById(itemId);
            if (row) {
                row.setAttribute('data-locked', 'true');
                // Blue locked flash
                row.classList.remove('row-saved-flash', 'row-unlocked-flash');
                void row.offsetWidth;
                row.classList.add('row-locked-flash');
                setTimeout(() => row.classList.remove('row-locked-flash'), 1300);

                const inputs = row.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = true);

                const saveBtn = document.getElementById(`save_${itemId}`);
                if (saveBtn) {
                    saveBtn.innerHTML = '🔒 Submitted';
                    saveBtn.disabled = true;
                    saveBtn.style.background = '#95a5a6';
                }

                if (typeof renderRowStatusBadge === 'function') {
                    renderRowStatusBadge(itemId, { locked: true, status: 'locked' });
                }
            }

            closeRowLockModal();
            if (typeof showToast === 'function') showToast('success', '✅ Row submitted for review', { duration: 1800 });

        } else {
            if (typeof showToast === 'function') showToast('error', `❌ ${response.error}`, { duration: 2500 });
            else alert(`❌ Error: ${response.error}`);
        }
    } catch (error) {
        console.error('❌ Error locking row:', error);
        if (typeof showToast === 'function') showToast('error', '❌ Error submitting row', { duration: 2000 });
        else alert('❌ Error locking row. Check console for details.');
    }
}

window.saveNewChecklistItem = saveNewChecklistItem;
window.loadChecklistData = loadChecklistData;
window.updateProgress = updateProgress;
window.unlockChecklistItem = unlockChecklistItem;
window.currentWO = currentWO;
window.currentTransformerData = currentTransformerData;
window.currentStage = currentStage;
window.loadStageStatus = loadStageStatus;
window.updateStageUI = updateStageUI;
window.validateStageAccess = validateStageAccess;
window.markStageComplete = markStageComplete;
window.approveCurrentStage = approveCurrentStage;
window.showRejectStageModal = showRejectStageModal;
window.closeRejectStageModal = closeRejectStageModal;
window.confirmRejectStage = confirmRejectStage;
window.submitStageForQAReview = submitStageForQAReview;
window.showUnlockDialog = showUnlockDialog;
window.showRowUnlockDialog = showRowUnlockDialog;
window.showRowLockDialog = showRowLockDialog;
window.closeRowUnlockModal = closeRowUnlockModal;
window.closeRowLockModal = closeRowLockModal;
// Chip-based reason selectors (replaces old dropdown toggles)
window.selectUnlockReason = selectUnlockReason;
window.selectLockReason = selectLockReason;
window.toggleCustomReason = toggleCustomReason;       // legacy no-op
window.toggleCustomLockReason = toggleCustomLockReason; // legacy no-op
window.confirmRowUnlock = confirmRowUnlock;
window.confirmRowLock = confirmRowLock;

// ── Bulk Supervisor Sign-Off ──────────────────────────────────────────────────
async function bulkSupervisorSignOff() {
    if (!window.currentWO || !window.currentStage) {
        alert('⚠ Please select a work order and stage first.');
        return;
    }
    const items = document.querySelectorAll('#stageContent tr[id^="row_"]');
    if (items.length === 0) {
        alert('⚠ No checklist items found.');
        return;
    }
    if (!confirm(`Sign off ALL technician-completed items for ${window.currentStage}?`)) return;

    try {
        const result = await apiCall(`/stage/${window.currentWO}/supervisor-signoff-all`, 'POST', {
            stage: window.currentStage
        });
        if (result.success) {
            if (typeof showToast === 'function') showToast('success', 'All items signed off successfully', { title: 'Bulk Sign-Off' });
            loadChecklistData(window.currentStage);
        } else {
            alert('❌ ' + (result.error || 'Failed'));
        }
    } catch (error) {
        alert('❌ ' + error.message);
    }
}
window.bulkSupervisorSignOff = bulkSupervisorSignOff;

// ── Export Checklist PDF ──────────────────────────────────────────────────────
function exportChecklistPDF() {
    if (!window.currentWO || !window.currentStage) {
        alert('⚠ Please select a work order and stage first.');
        return;
    }
    const url = `/checklist/${window.currentStage}/${window.currentWO}/pdf`;
    window.open(url, '_blank');
}
window.exportChecklistPDF = exportChecklistPDF;
