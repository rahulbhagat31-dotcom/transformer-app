const stageService = require('../services/stage.service');

// Canonical stage order — single source of truth for the entire backend
// Must match transformer.controller.js VALID_STAGES and frontend STAGE_ORDER
const STAGE_ORDER = ['design', 'winding', 'spa', 'vpd', 'coreCoil', 'tanking', 'tankFilling', 'coreBuilding', 'testing', 'completed'];

// Sub-stages for winding
const WINDING_SUBSTAGES = ['winding1', 'winding2', 'winding3', 'winding4', 'winding5'];

/**
 * Initialize stage status (No-op now, handled by service/DB)
 */
function initStageStatusFile() {
    // No-op: SQLite handles this
}

/**
 * Get stage status for a specific work order
 * Creates default status in DB if WO doesn't exist
 */
function getStageStatus(wo) {
    let statuses = stageService.findAllByWo(wo);

    if (statuses.length === 0) {
        stageService.initStages(wo, STAGE_ORDER);
        statuses = stageService.findAllByWo(wo);
    }

    // Convert array to object map for easy lookup { stageName: { ... } }
    const statusMap = {};
    STAGE_ORDER.forEach(stage => {
        const found = statuses.find(s => s.stage === stage);
        statusMap[stage] = found || {
            status: 'pending',
            completedAt: null,
            completedBy: null,
            completionPercentage: 0,
            locked: 1, // Default locked if not found (shouldn't happen after init)
            lockedAt: null
        };
    });

    return statusMap;
}

/**
 * Check if user can access a specific stage
 */
function canAccessStage(wo, stage) {
    const statusMap = getStageStatus(wo);

    // Map winding substages to main winding stage
    let checkStage = stage;
    if (WINDING_SUBSTAGES.includes(stage)) {
        checkStage = 'winding';
    }

    if (!statusMap[checkStage]) {
        return { allowed: false, reason: 'Invalid stage' };
    }

    const currentStatus = statusMap[checkStage];

    // Block if stage is locked/completed (submitted for Stage Complete)
    if (currentStatus.locked && currentStatus.status === 'completed') {
        return { allowed: false, reason: 'Stage is submitted for QA review. Awaiting approval.' };
    }

    // Block if stage is awaiting QA review (production clicked Ready for QA)
    if (currentStatus.status === 'awaiting_qa') {
        return { allowed: false, reason: 'Stage is awaiting QA review. You will be notified when QA responds.' };
    }

    // Block approved stages
    if (currentStatus.status === 'approved') {
        return { allowed: false, reason: 'Stage has been approved. Contact admin to re-open.' };
    }

    // Check if previous stage is complete, awaiting_qa, or approved
    const stageIndex = STAGE_ORDER.indexOf(checkStage);
    if (stageIndex > 0) {
        const prevStage = STAGE_ORDER[stageIndex - 1];
        const prevStatus = statusMap[prevStage];
        const prevDone = ['completed', 'awaiting_qa', 'approved'].includes(prevStatus.status);
        if (!prevDone) {
            return { allowed: false, reason: `Please complete ${prevStage.toUpperCase()} stage first.` };
        }
    }

    return { allowed: true };
}

/**
 * Approve a stage (QA/admin)
 * Sets status → 'approved', records who approved, unlocks next stage
 */
function approveStage(wo, stage, userId, username) {
    // Map winding substages to main winding stage
    let checkStage = stage;
    if (WINDING_SUBSTAGES.includes(stage)) {
        checkStage = 'winding';
    }

    const current = stageService.findByWoAndStage(wo, checkStage);
    if (!current) {
        return { success: false, error: 'Stage not found. Please initialise the WO first.' };
    }

    if (current.status !== 'completed') {
        return {
            success: false,
            error: `Cannot approve: stage status is '${current.status}'. Stage must be submitted (completed) before it can be approved.`
        };
    }

    // Mark stage as approved
    stageService.upsert({
        wo,
        stage: checkStage,
        status: 'approved',
        completionPercentage: 100,
        locked: 1,          // stays locked — only admin can re-open
        approvedBy: username,
        approvedAt: new Date().toISOString(),
        completedAt: current.completedAt,
        completedBy: current.completedBy
    });

    // Unlock next stage in the sequence
    const stageIndex = STAGE_ORDER.indexOf(checkStage);
    if (stageIndex < STAGE_ORDER.length - 1) {
        const nextStage = STAGE_ORDER[stageIndex + 1];
        const nextCurrent = stageService.findByWoAndStage(wo, nextStage);

        stageService.upsert({
            wo,
            stage: nextStage,
            status: 'in-progress',
            locked: 0,
            completionPercentage: nextCurrent ? nextCurrent.completionPercentage : 0
        });

        console.log(`🔓 Next stage unlocked: ${nextStage} for WO ${wo}`);
    }

    console.log(`✅ Stage approved: ${checkStage} for WO ${wo} by ${username}`);
    return { success: true, status: getStageStatus(wo) };
}

/**
 * Reject a submitted stage (QA/admin)
 * Reverts status → in-progress so production can correct and resubmit
 */
function rejectStage(wo, stage, reason, userId, username) {
    let checkStage = stage;
    if (WINDING_SUBSTAGES.includes(stage)) {
        checkStage = 'winding';
    }

    const current = stageService.findByWoAndStage(wo, checkStage);
    if (!current) {
        return { success: false, error: 'Stage not found.' };
    }

    if (current.status !== 'completed') {
        return {
            success: false,
            error: `Cannot reject: stage status is '${current.status}'. Only submitted (completed) stages can be rejected.`
        };
    }

    if (!reason || reason.trim().length < 10) {
        return { success: false, error: 'Rejection reason must be at least 10 characters.' };
    }

    // Revert to in-progress so production can fix and resubmit
    stageService.upsert({
        wo,
        stage: checkStage,
        status: 'in-progress',
        locked: 0,
        completionPercentage: current.completionPercentage,
        completedAt: null,
        completedBy: null,
        rejectedBy: username,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason.trim()
    });

    console.log(`❌ Stage rejected: ${checkStage} for WO ${wo} by ${username} — ${reason}`);
    return { success: true, status: getStageStatus(wo) };
}

/**
 * Ready for QA — Production engineer signals stage is ready for QA review
 * Sets status → awaiting_qa (locked), stores submittedBy / submittedAt
 * QA can then Approve or Reject
 */
function readyForQA(wo, stage, userId, username) {
    let checkStage = stage;
    if (WINDING_SUBSTAGES.includes(stage)) {
        checkStage = 'winding';
    }

    const current = stageService.findByWoAndStage(wo, checkStage);
    if (!current) {
        return { success: false, error: 'Stage not found. Load the WO first.' };
    }

    if (current.status !== 'in-progress') {
        return {
            success: false,
            error: `Cannot submit: stage status is '${current.status}'. Only in-progress stages can be submitted for QA.`
        };
    }

    stageService.upsert({
        wo,
        stage: checkStage,
        status: 'awaiting_qa',
        locked: 1,
        completionPercentage: current.completionPercentage,
        completedAt: current.completedAt,
        completedBy: current.completedBy,
        submittedBy: username,
        submittedAt: new Date().toISOString()
    });

    console.log(`📋 Stage ready for QA: ${checkStage} for WO ${wo} by ${username}`);
    return { success: true, status: getStageStatus(wo) };
}

module.exports = {
    initStageStatusFile,
    getStageStatus,
    canAccessStage,
    updateStageProgress,
    completeStage,
    approveStage,
    rejectStage,
    readyForQA,
    unlockStage,
    STAGE_ORDER,
    WINDING_SUBSTAGES
};

function updateStageProgress(wo, stage, percentage) {
    // Map winding substages to main winding stage
    let checkStage = stage;
    let effectivePercentage = percentage;

    if (WINDING_SUBSTAGES.includes(stage)) {
        checkStage = 'winding';

        // Aggregate: the parent winding stage is the average of all sub-stage percentages.
        // Fetch the progress stored for each sub-stage and average them.
        const subStageRows = WINDING_SUBSTAGES.map(subStage => {
            const row = stageService.findByWoAndStage(wo, subStage);
            // If the sub-stage being updated, use the new value; otherwise use stored value
            if (subStage === stage) {
                return percentage;
            }
            return row ? (row.completionPercentage || 0) : 0;
        });

        // First: upsert the sub-stage row itself so future reads are correct
        stageService.upsert({
            wo,
            stage,
            completionPercentage: percentage,
            status: percentage >= 100 ? 'completed' : (percentage > 0 ? 'in-progress' : 'pending')
        });

        effectivePercentage = Math.round(
            subStageRows.reduce((sum, p) => sum + p, 0) / WINDING_SUBSTAGES.length
        );
    }

    const current = stageService.findByWoAndStage(wo, checkStage);

    // If not found, init first (should rarely happen if getStageStatus was called)
    if (!current) {
        getStageStatus(wo);
    }

    const newStatus = effectivePercentage >= 100
        ? 'completed'
        : (effectivePercentage > 0 ? 'in-progress' : (current ? current.status : 'pending'));

    // Update the parent (or non-winding) stage
    const updated = stageService.upsert({
        wo,
        stage: checkStage,
        completionPercentage: effectivePercentage,
        status: newStatus,
        locked: current ? current.locked : 0,
        lockedAt: current ? current.lockedAt : null
    });

    return updated;
}

/**
 * Mark a stage as complete
 */
function completeStage(wo, stage, userId, username) {
    // Map winding substages to main winding stage
    let checkStage = stage;
    if (WINDING_SUBSTAGES.includes(stage)) {
        checkStage = 'winding';
    }

    const current = stageService.findByWoAndStage(wo, checkStage);
    if (!current) {
        // Auto-init if missing
        getStageStatus(wo);
    }

    // Mark as complete
    stageService.upsert({
        wo,
        stage: checkStage,
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: username,
        completionPercentage: 100,
        locked: 1,
        lockedAt: new Date().toISOString()
    });

    // Unlock next stage
    const stageIndex = STAGE_ORDER.indexOf(checkStage);
    if (stageIndex < STAGE_ORDER.length - 1) {
        const nextStage = STAGE_ORDER[stageIndex + 1];
        const nextCurrent = stageService.findByWoAndStage(wo, nextStage);

        stageService.upsert({
            wo,
            stage: nextStage,
            status: 'in-progress',
            locked: 0,
            completionPercentage: nextCurrent ? nextCurrent.completionPercentage : 0
        });
    }

    console.log(`✅ Stage completed: ${checkStage} for WO ${wo} by ${username}`);

    return { success: true, status: getStageStatus(wo) };
}

/**
 * Unlock a stage (admin only)
 */
function unlockStage(wo, stage, reason, userId, username) {
    const current = stageService.findByWoAndStage(wo, stage);
    if (!current) {
        return { success: false, error: 'Stage not found' };
    }

    stageService.upsert({
        wo,
        stage,
        locked: 0,
        status: 'in-progress',
        unlockedBy: username,
        unlockedAt: new Date().toISOString(),
        unlockReason: reason,
        completionPercentage: current.completionPercentage,
        completedAt: current.completedAt,
        completedBy: current.completedBy
    });

    console.log(`🔓 Stage unlocked: ${stage} for WO ${wo} by ${username} - Reason: ${reason}`);

    return { success: true, status: getStageStatus(wo) };
}

