/**
 * ===============================================
 * MODULE: VALIDATION & COMPLIANCE (IEC 60076)
 * Phase 2: Design Defensibility
 * ===============================================
 */

(function () {
    const Utils = typeof window !== 'undefined'
        ? window.CalcUtils
        : require('../core/utils.js');

    /**
     * Analyze Design Margins against IEC Limits
     * Returns "Traffic Light" status for key parameters
     */
    function analyzeMargins(results) {
        console.log('🛡️ [Validation] Analyzing design margins...');

        const margins = [];

        // 1. Flux Density (Limit 1.80T)
        // From Tap Extremes or Core Design
        const flux = results.tapExtremes?.worstCase?.fluxDensity || results.core?.fluxDensity;
        if (flux) {
            margins.push(createMarginObject(
                'Flux Density',
                flux,
                1.80,
                'Tesla',
                'IEC 60076-1',
                true // Is Upper Limit
            ));
        }

        // 2. Current Density (Typical Limit 3.5 - 4.0 A/mm2 for Oil)
        // From Conductors
        const J_hv = results.conductors?.hv?.currentDensity;
        if (J_hv) {
            margins.push(createMarginObject(
                'HV Current Density',
                J_hv,
                4.0,
                'A/mm²',
                'Thermal Limit',
                true
            ));
        }

        // 3. Short Circuit Stress (Copper Yield ~200-220 MPa)
        // From Short Circuit
        const stress = results.shortCircuit?.stresses?.hoop;
        if (stress) {
            margins.push(createMarginObject(
                'Hoop Stress',
                stress,
                220,
                'MPa',
                'IEC 60076-5',
                true
            ));
        }

        // 4. Hot Spot Temp (Limit 118°C / 98°C rise + 20°C ambient)
        // From Temperature
        const hotSpot = results.temperature?.absolute?.hotSpot;
        if (hotSpot) {
            margins.push(createMarginObject(
                'Hot Spot Temp',
                hotSpot,
                118,
                '°C',
                'IEC 60076-2',
                true
            ));
        }

        // 5. No Load Current (Max Limit typically 2-3% depending on MVA)
        // We check the calculated No Load Current % against a standard limit
        const i0 = results.losses?.noLoadCurrent?.percentage;
        if (i0 !== undefined) {
            margins.push(createMarginObject(
                'No-Load Current',
                i0,
                3.0, // Typical limit for distribution/power transformers
                '%',
                'Performance Guarantee',
                true
            ));
        }

        return margins;
    }

    /**
     * Helper to create standard margin object
     */
    function createMarginObject(name, value, limit, unit, standard, isUpperLimit) {
        const marginVal = isUpperLimit ? limit - value : value - limit;
        const marginPercent = (marginVal / limit) * 100;

        let status = 'SAFE'; // Green
        if (marginPercent < 0) status = 'CRITICAL'; // Red (Violation)
        else if (marginPercent < 5) status = 'WARNING'; // Red/Orange
        else if (marginPercent < 15) status = 'CAUTION'; // Yellow

        return {
            parameter: name,
            value: Number(value).toFixed(2),
            limit: limit,
            unit: unit,
            margin: marginPercent.toFixed(1) + '%',
            status: status,
            standard: standard
        };
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { analyzeMargins };
    }
    if (typeof window !== 'undefined') {
        window.CalcModule_Validation = { analyzeMargins };
    }
})();
