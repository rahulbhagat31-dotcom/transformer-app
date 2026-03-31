/**
 * Warning Integration Script
 * Integrates IEC 60076 validation warnings into calculator results
 */

(function () {
    'use strict';

    // Make warnings integration available globally
    window.WarningsIntegration = {
        displayWarnings: displayWarnings,
        updateWarningBadge: updateWarningBadge
    };

    /**
     * Display warnings in the results panel
     * @param {Object} results - Complete calculation results
     * @param {Object} inputs - User inputs
     */
    function displayWarnings(results, inputs) {
        console.log('⚠️ Generating validation warnings...');

        // Check if warnings module is available
        if (typeof CalcValidator === 'undefined') {
            console.warn('Warnings module not loaded');
            return;
        }

        // Generate warnings
        const warnings = CalcValidator.generateValidationWarnings(results, inputs);
        const formatted = CalcValidator.formatWarnings(warnings);

        // Update warning badge
        updateWarningBadge(formatted.count, formatted.highSeverity);

        // Display warnings in the warnings tab
        const warningsContainer = document.getElementById('warningsDisplay');
        if (warningsContainer) {
            warningsContainer.innerHTML = formatted.html;
        }

        console.log(`✅ Displayed ${formatted.count} warning(s)`);
    }

    /**
     * Update warning count badge on tab
     * @param {number} count - Total warning count
     * @param {number} highCount - High severity warning count
     */
    function updateWarningBadge(count, highCount) {
        const badge = document.getElementById('warningBadge');
        if (!badge) return;

        if (count === 0) {
            badge.style.display = 'none';
            return;
        }

        badge.style.display = 'inline-flex';
        badge.textContent = count;

        // Set badge color based on severity
        badge.className = 'warning-badge';
        if (highCount > 0) {
            badge.classList.add('high');
        } else {
            badge.classList.add('medium');
        }
    }

    console.log('✅ Warnings integration initialized');
})();
