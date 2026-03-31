/* ===============================
   STAGE PROGRESSION MANAGEMENT
   Move transformers between stages
================================ */

/**
 * Get next stage in the progression
 */
function getNextStage(currentStage) {
    const stageOrder = ['design', 'winding', 'vpd', 'coreCoil', 'tanking', 'tankFilling', 'testing', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);

    if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
        return null; // Already at last stage or invalid stage
    }

    return stageOrder[currentIndex + 1];
}

/**
 * Move transformer to next stage
 */
async function moveToNextStage(transformerId, notes = '') {
    try {
        // Get transformer details from search results
        const response = await apiCall('/transformers');
        const transformers = response.data || response;
        const transformer = transformers.find(t => t.id === transformerId);

        if (!transformer) {
            Toast.error('Transformer not found');
            return;
        }

        const currentStage = transformer.currentStage || 'design';
        const nextStage = getNextStage(currentStage);

        if (!nextStage) {
            Toast.info('Transformer is already at the final stage (Completed)', { title: 'Final Stage' });
            return;
        }

        // Confirm stage change
        const stageName = getStageName(nextStage);
        const confirmed = await Modal.confirm({
            title: 'Move to Next Stage',
            message: `Move W.O. ${transformer.wo} to ${stageName}?`,
            icon: '🔄',
            intent: 'info',
            confirmText: 'Move Stage'
        });

        if (!confirmed) return;

        // Call API to update stage
        const result = await apiCall(`/transformers/${transformerId}/stage`, 'POST', {
            newStage: nextStage,
            notes: notes
        });

        if (result.success) {
            Toast.success(`Successfully moved to ${stageName}!`);

            // Refresh the search results
            if (typeof doSearch === 'function') doSearch();

            // Refresh dashboard if on dashboard page
            if (typeof loadDashboard === 'function') loadDashboard();
        }
    } catch (error) {
        console.error('❌ Error moving to next stage:', error);
        Toast.error('Failed to update stage: ' + error.message);
    }
}

/**
 * Show stage progression modal
 */
function showStageProgressionModal(transformerId, currentWO) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'stageProgressionModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
            <h3 style="margin-top: 0; color: #2c3e50;">🔄 Move to Next Stage</h3>
            <p style="color: #7f8c8d; margin-bottom: 20px;">W.O. Number: <strong>${currentWO}</strong></p>
            
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #2c3e50;">
                Notes (Optional):
            </label>
            <textarea id="stageNotes" class="ui-input" rows="4" 
                placeholder="Enter any notes about this stage completion..."></textarea>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="confirmStageChange('${transformerId}')" 
                    style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ✅ Confirm
                </button>
                <button onclick="closeStageModal()" 
                    style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ❌ Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Confirm stage change with notes
 */
async function confirmStageChange(transformerId) {
    const notes = document.getElementById('stageNotes')?.value || '';
    closeStageModal();
    await moveToNextStage(transformerId, notes);
}

/**
 * Close stage progression modal
 */
function closeStageModal() {
    const modal = document.getElementById('stageProgressionModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * View stage history for a transformer
 */
async function viewStageHistory(transformerId) {
    try {
        const response = await apiCall('/transformers');
        const transformers = response.data || response;
        const transformer = transformers.find(t => t.id === transformerId);

        if (!transformer) {
            Toast.error('Transformer not found');
            return;
        }

        const history = transformer.stageHistory || [];

        if (history.length === 0) {
            Toast.info('No stage history available for this transformer', { title: 'No History' });
            return;
        }

        // Create timeline modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'stageHistoryModal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto;';

        const historyHTML = history.map((h, _index) => {
            const isCompleted = h.completedAt !== null;
            const statusClass = isCompleted ? 'completed' : 'in-progress';
            const statusIcon = isCompleted ? '✅' : '🔄';

            return `
                <div class="timeline-item ${statusClass}" style="display: flex; gap: 15px; margin-bottom: 20px; padding: 15px; background: ${isCompleted ? '#d4edda' : '#fff3cd'}; border-radius: 8px; border-left: 4px solid ${isCompleted ? '#28a745' : '#ffc107'};">
                    <div style="font-size: 24px;">${statusIcon}</div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${getStageName(h.stage)}</h4>
                        <p style="margin: 4px 0; font-size: 13px; color: #7f8c8d;">
                            <strong>Started:</strong> ${new Date(h.startedAt).toLocaleString()}
                        </p>
                        ${isCompleted ? `
                            <p style="margin: 4px 0; font-size: 13px; color: #7f8c8d;">
                                <strong>Completed:</strong> ${new Date(h.completedAt).toLocaleString()}
                            </p>
                            <p style="margin: 4px 0; font-size: 13px; color: #7f8c8d;">
                                <strong>Duration:</strong> ${h.duration || 'N/A'}
                            </p>
                            <p style="margin: 4px 0; font-size: 13px; color: #7f8c8d;">
                                <strong>Completed By:</strong> ${h.completedBy || 'N/A'}
                            </p>
                        ` : `
                            <p style="margin: 4px 0; font-size: 13px; color: #856404;">
                                <strong>Status:</strong> In Progress
                            </p>
                        `}
                        ${h.notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; font-style: italic; color: #555;">"${h.notes}"</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-top: 0; color: #2c3e50;">📊 Stage History - W.O. ${transformer.wo}</h3>
                <p style="color: #7f8c8d; margin-bottom: 20px;">Complete timeline of stage progression</p>
                
                <div class="stage-timeline">
                    ${historyHTML}
                </div>
                
                <button onclick="closeHistoryModal()" 
                    style="width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 20px;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        console.error('❌ Error loading stage history:', error);
        Toast.error('Failed to load stage history: ' + error.message);
    }
}

/**
 * Close stage history modal
 */
function closeHistoryModal() {
    const modal = document.getElementById('stageHistoryModal');
    if (modal) {
        modal.remove();
    }
}

// Export functions to window
window.moveToNextStage = moveToNextStage;
window.showStageProgressionModal = showStageProgressionModal;
window.confirmStageChange = confirmStageChange;
window.closeStageModal = closeStageModal;
window.viewStageHistory = viewStageHistory;
window.closeHistoryModal = closeHistoryModal;
window.getNextStage = getNextStage;
