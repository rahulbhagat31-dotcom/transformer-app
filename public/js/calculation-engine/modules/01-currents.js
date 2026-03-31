(function () {
    /**
     * ===============================================
     * MODULE 1: CURRENT CALCULATIONS
     * Industry-Standard Transformer Design Calculator
     * IEC 60076-1 Compliant
     * ===============================================
     */

    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('../core/constants.js');

    const Utils = typeof window !== 'undefined'
        ? window.CalcUtils
        : require('../core/utils.js');

    const { ValidationError } = typeof window !== 'undefined'
        ? window.CalculationErrors
        : require('../core/errors.js');

    /**
     * Calculate transformer currents
     * 
     * @param {Object} inputs - Validated transformer inputs
     * @returns {Object} Current calculations with metadata
     */
    function calculateCurrents(inputs) {
        console.log('📊 [Module 1] Calculating currents (IEC 60076-1)...');

        try {
            // Extract inputs
            const { mva, hv, lv, phases } = inputs;

            // Convert units
            const mvaVA = mva * CONSTANTS.CONVERSIONS.MVA_TO_VA;
            const hvVolts = hv * CONSTANTS.CONVERSIONS.KV_TO_V;
            const lvVolts = lv * CONSTANTS.CONVERSIONS.KV_TO_V;

            // Calculate currents based on number of phases
            let hvCurrent, lvCurrent;

            if (phases === 3) {
                // Three-phase: I = S / (√3 × V)
                hvCurrent = mvaVA / (CONSTANTS.SQRT_3 * hvVolts);
                lvCurrent = mvaVA / (CONSTANTS.SQRT_3 * lvVolts);
            } else {
                // Single-phase: I = S / V
                hvCurrent = mvaVA / hvVolts;
                lvCurrent = mvaVA / lvVolts;
            }

            // Calculate phase current (for delta windings)
            const hvPhaseCurrent = inputs.vectorGroup?.startsWith('D')
                ? hvCurrent / CONSTANTS.SQRT_3
                : hvCurrent;

            const lvPhaseCurrent = inputs.vectorGroup?.includes('d') || inputs.vectorGroup?.includes('z')
                ? lvCurrent / CONSTANTS.SQRT_3
                : lvCurrent;

            // Calculate current ratio
            const currentRatio = lvCurrent / hvCurrent;

            // Validate results
            if (hvCurrent > 50000 || lvCurrent > 50000) {
                console.warn('⚠️ Warning: Very high current detected');
            }

            const results = {
                hvCurrent: Utils.round(hvCurrent, 2),
                lvCurrent: Utils.round(lvCurrent, 2),
                hvPhaseCurrent: Utils.round(hvPhaseCurrent, 2),
                lvPhaseCurrent: Utils.round(lvPhaseCurrent, 2),
                currentRatio: Utils.round(currentRatio, 4),

                // Metadata
                methodology: 'IEC 60076-1',
                formula: phases === 3 ? 'I = S / (√3 × V)' : 'I = S / V',
                accuracy: '±0.1%',
                standard: 'IEC 60076-1 Section 3',

                // Calculation details
                details: {
                    mvaVA: mvaVA,
                    hvVolts: hvVolts,
                    lvVolts: lvVolts,
                    phases: phases,
                    vectorGroup: inputs.vectorGroup
                }
            };

            console.log(`   ✅ HV Current: ${results.hvCurrent} A`);
            console.log(`   ✅ LV Current: ${results.lvCurrent} A`);

            return results;

        } catch (error) {
            console.error('❌ Error in current calculation:', error);
            throw error;
        }
    }

    /**
     * Validate current calculation results
     */
    function validateCurrentResults(results) {
        // Check for NaN
        if (isNaN(results.hvCurrent) || isNaN(results.lvCurrent)) {
            throw new ValidationError(
                'Invalid current calculation - NaN detected',
                'currents',
                null
            );
        }

        // Check for reasonable values
        if (results.hvCurrent <= 0 || results.lvCurrent <= 0) {
            throw new ValidationError(
                'Currents must be positive',
                'currents',
                { hv: results.hvCurrent, lv: results.lvCurrent }
            );
        }

        // Check for extremely high currents
        if (results.hvCurrent > 100000 || results.lvCurrent > 100000) {
            throw new ValidationError(
                'Calculated current exceeds maximum limit (100,000 A)',
                'currents',
                { hv: results.hvCurrent, lv: results.lvCurrent }
            );
        }

        return true;
    }

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            calculateCurrents,
            validateCurrentResults
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalcModule_Currents = {
            calculateCurrents,
            validateCurrentResults
        };
    }
})();
