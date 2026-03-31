/**
 * Calculator UI Enhancement Script
 * Handles new IEC 60076 input parameters
 */

(function () {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalculatorEnhancements);
    } else {
        initCalculatorEnhancements();
    }

    function initCalculatorEnhancements() {
        console.log('🔧 Initializing calculator UI enhancements...');

        // 1. BIL Auto-population
        setupBILAutopopulation();

        // 2. Tapping Side Conditional Logic
        setupTappingSideLogic();

        // 3. Vector Group Validation
        setupVectorGroupValidation();

        // 4. OLTC Validation
        setupOLTCValidation();
    }

    /**
     * Auto-populate BIL based on HV voltage
     */
    function setupBILAutopopulation() {
        const hvInput = document.getElementById('hv');
        const bilInput = document.getElementById('bilLevel');

        if (!hvInput || !bilInput) return;

        // BIL Standards from IEC 60076-3
        const BIL_STANDARDS = {
            11: 75,
            22: 125,
            33: 170,
            66: 325,
            110: 450,
            132: 550,
            220: 1050,
            400: 1425
        };

        function updateBIL() {
            const hvVoltage = parseFloat(hvInput.value);
            if (!hvVoltage || bilInput.value) return; // Don't override manual input

            // Find closest standard voltage
            const voltages = Object.keys(BIL_STANDARDS).map(Number).sort((a, b) => a - b);
            const closest = voltages.reduce((prev, curr) => {
                return Math.abs(curr - hvVoltage) < Math.abs(prev - hvVoltage) ? curr : prev;
            });

            const standardBIL = BIL_STANDARDS[closest];
            bilInput.value = standardBIL;
            bilInput.placeholder = `Auto: ${standardBIL}kV (IEC 60076-3)`;
        }

        hvInput.addEventListener('change', updateBIL);
        hvInput.addEventListener('blur', updateBIL);
    }

    /**
     * Enable/disable tapping side based on tap changer type
     */
    function setupTappingSideLogic() {
        const tapChangerType = document.getElementById('tapChangerType');
        const tappingSide = document.getElementById('tappingSide');

        if (!tapChangerType || !tappingSide) return;

        function updateTappingSide() {
            const type = tapChangerType.value;

            if (type === 'OCTC') {
                tappingSide.disabled = false;
                tappingSide.style.opacity = '1';
            } else {
                tappingSide.disabled = true;
                tappingSide.style.opacity = '0.5';
            }
        }

        tapChangerType.addEventListener('change', updateTappingSide);
        updateTappingSide(); // Initial state
    }

    /**
     * Validate vector group matches HV/LV connections
     */
    function setupVectorGroupValidation() {
        const vectorGroup = document.getElementById('vectorGroup');
        const hvConnection = document.getElementById('hvConnection');
        const lvConnection = document.getElementById('lvConnection');

        if (!vectorGroup || !hvConnection || !lvConnection) return;

        function validateConnections() {
            const vg = vectorGroup.value;
            const hv = hvConnection.value;
            const lv = lvConnection.value;

            // Vector group format: XyN (e.g., Dyn11, Yyn0)
            const hvSymbol = vg.charAt(0).toUpperCase();
            const lvSymbol = vg.charAt(1).toLowerCase();

            const hvExpected = hvSymbol === 'D' ? 'Delta' : 'Star';
            const lvExpected = lvSymbol === 'd' ? 'Delta' : (lvSymbol === 'z' ? 'Zigzag' : 'Star');

            // Show warning if mismatch
            if (hv !== hvExpected || lv !== lvExpected) {
                console.warn(`⚠️ Vector group ${vg} expects HV:${hvExpected}, LV:${lvExpected}`);
                // Could add visual warning here
            }
        }

        vectorGroup.addEventListener('change', validateConnections);
        hvConnection.addEventListener('change', validateConnections);
        lvConnection.addEventListener('change', validateConnections);
    }

    /**
     * Prevent OLTC selection with validation error
     */
    function setupOLTCValidation() {
        const calculatorForm = document.getElementById('calculatorForm');
        if (!calculatorForm) return;

        calculatorForm.addEventListener('submit', function (e) {
            const tapChangerType = document.getElementById('tapChangerType');
            if (tapChangerType && tapChangerType.value === 'OLTC') {
                e.preventDefault();
                alert('⚠️ OLTC electrical and thermal modeling is not supported in this version.\n\nPlease select OCTC (Off-Circuit) or NONE.');
                tapChangerType.value = 'NONE';
                return false;
            }
        });
    }

    console.log('✅ Calculator UI enhancements initialized');
})();
