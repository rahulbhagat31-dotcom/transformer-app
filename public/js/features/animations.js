/* ================================================
   WEEK 6 — ANIMATION HOOKS
   Attaches micro-animation triggers to DOM events
   ================================================ */

(function initAnimationHooks() {

    /* ── Stage content slide on tab change ──────── */
    // Watch #stageContent for innerHTML changes → trigger slide-in
    const stageContent = document.getElementById('stageContent');
    if (stageContent) {
        const observer = new MutationObserver(() => {
            stageContent.classList.remove('stage-content-slide');
            void stageContent.offsetWidth; // force reflow
            stageContent.classList.add('stage-content-slide');
        });
        observer.observe(stageContent, { childList: true, subtree: false });
    }

    /* ── Stage panel slide-in ────────────────────── */
    // Watch for panel visibility changes (approved / rejected / awaiting panels)
    const panelIds = [
        'stageApprovedMessage', 'stageRejectedMessage',
        'stageAwaitingQAMessage', 'stageLockMessage', 'stageControlButtons'
    ];
    panelIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const obs = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.attributeName === 'style' && el.style.display !== 'none') {
                    el.classList.remove('panel-appear');
                    void el.offsetWidth;
                    el.classList.add('panel-appear');
                }
            });
        });
        obs.observe(el, { attributes: true, attributeFilter: ['style'] });
    });

    /* ── Stage tab badge colour for awaiting_qa ─── */
    // Extend updateStageTabBadge to include awaiting_qa colour
    const origBadge = window.updateStageTabBadge;
    if (typeof origBadge === 'function') {
        window.updateStageTabBadge = function (stageKey, stageStatus) {
            origBadge(stageKey, stageStatus);
            // Fix awaiting_qa badge colour (not in original colour map)
            if (stageStatus === 'awaiting_qa') {
                const btns = document.querySelectorAll('.stage-btn, .nav-subitem');
                btns.forEach(btn => {
                    const badge = btn.querySelector('.stage-tab-badge');
                    if (badge && badge.textContent.includes('Awaiting QA')) {
                        badge.style.background = '#2980b9';
                        badge.style.color = '#fff';
                    }
                });
            }
        };
    }

    /* ── Reject modal danger shake ─────────────── */
    const origRejectModal = window.showRejectStageModal;
    if (typeof origRejectModal === 'function') {
        window.showRejectStageModal = function () {
            origRejectModal();
            const modal = document.getElementById('rejectStageModal');
            if (modal) {
                modal.classList.remove('modal-danger-shake');
                void modal.offsetWidth;
                modal.classList.add('modal-danger-shake');
                setTimeout(() => modal.classList.remove('modal-danger-shake'), 500);
            }
        };
    }

    /* ── Stage complete celebrate ──────────────── */
    const origMarkStage = window.markStageComplete;
    if (typeof origMarkStage === 'function') {
        window.markStageComplete = function (wo, stage) {
            const content = document.getElementById('checklistMainContent');
            if (content) {
                content.classList.remove('stage-complete-celebrate');
                void content.offsetWidth;
                content.classList.add('stage-complete-celebrate');
                setTimeout(() => content.classList.remove('stage-complete-celebrate'), 1800);
            }
            return origMarkStage(wo, stage);
        };
    }

    console.log('🎬 Animation hooks initialised');
})();
