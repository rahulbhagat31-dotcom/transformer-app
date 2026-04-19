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
     * Enable OLTC selection with accurate calculations
     * OLTC (On-Load Tap Changer) support is now available with:
     * - Physics-based flux calculations
     * - Complete tap position tables
     * - Thermal analysis (contact heating, diverter losses)
     * - IEC 60076-1 compliance checks
     */
    function setupOLTCValidation() {
        const calculatorForm = document.getElementById('calculatorForm');
        if (!calculatorForm) return;

        // Show info message when OLTC is selected
        const tapChangerType = document.getElementById('tapChangerType');
        if (tapChangerType) {
            tapChangerType.addEventListener('change', function (e) {
                if (e.target.value === 'OLTC') {
                    // Show info that OLTC is now supported
                    const infoDiv = document.getElementById('oltcInfoMessage');
                    if (!infoDiv) {
                        const msg = document.createElement('div');
                        msg.id = 'oltcInfoMessage';
                        msg.style.cssText = 'padding:12px;margin:10px 0;background:#e8f4f8;border-left:4px solid #06b6d4;border-radius:4px;color:#0369a1;font-size:14px;';
                        msg.innerHTML = '✅ <strong>OLTC Support Enabled</strong><br/>Physics-based calculations with thermal analysis and IEC 60076-1 compliance checks are now available.';
                        const formGroup = tapChangerType.closest('.form-group') || tapChangerType.parentElement;
                        if (formGroup) {
                            formGroup.insertAdjacentElement('afterend', msg);
                        }
                    }
                } else {
                    // Remove info message
                    const infoDiv = document.getElementById('oltcInfoMessage');
                    if (infoDiv) {
                        infoDiv.remove();
                    }
                }
            });
        }
    }

    console.log('✅ Calculator UI enhancements initialized');
})();
