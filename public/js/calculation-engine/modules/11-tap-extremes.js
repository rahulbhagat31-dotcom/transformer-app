/**
 * ===============================================
 * TAP EXTREME CALCULATIONS MODULE
 * IEC 60076-1 Tap Changer Analysis
 * ===============================================
 */

(function () {
    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('../core/constants.js');

    const Utils = typeof window !== 'undefined'
        ? window.CalcUtils
        : require('../core/utils.js');

    /**
     * Calculate flux density and voltage at extreme tap positions
     * Critical for OCTC design validation per IEC 60076-1
     * 
     * @param {Object} inputs - Transformer inputs
     * @param {Object} coreDesign - Core design results
     * @returns {Object} Tap extreme analysis with warnings
     */
    function calculateTapExtremes(inputs, coreDesign) {
        console.log('🔄 [Tap Extremes] Calculating OCTC tap positions...');

        const {
            tapChangerType,
            tappingRange,
            tappingSide,
            hv,
            lv,
            fluxDensity
        } = inputs;

        // Only calculate for OCTC
        if (tapChangerType !== 'OCTC') {
            return {
                applicable: false,
                message: 'Tap extreme calculations only for OCTC'
            };
        }

        const tapRangePercent = parseFloat(tappingRange) || 0;
        if (tapRangePercent === 0) {
            return {
                applicable: false,
                message: 'No tapping range specified'
            };
        }

        // ===== CALCULATE VOLTAGE AT EXTREME TAPS =====
        // Tapping side determines which voltage varies
        const isTappingHV = tappingSide === 'HV';
        const baseVoltage = isTappingHV ? parseFloat(hv) : parseFloat(lv);
        const fixedVoltage = isTappingHV ? parseFloat(lv) : parseFloat(hv);

        // Minimum tap: Lowest tapping voltage, highest flux
        // (Fewer turns, same flux linkage → higher flux density)
        const minTapVoltage = baseVoltage * (1 - tapRangePercent / 100);

        // Maximum tap: Highest tapping voltage, lowest flux
        // (More turns, same flux linkage → lower flux density)
        const maxTapVoltage = baseVoltage * (1 + tapRangePercent / 100);

        // ===== CALCULATE FLUX DENSITY AT EXTREME TAPS =====
        // From EMF equation: E = 4.44 × f × Φ × N
        // At constant frequency and core area:
        // Φ ∝ V/N
        // When taps reduce voltage, turns also reduce proportionally
        // Net effect: Flux increases at minimum tap

        // At minimum tap (lowest voltage, fewest turns)
        // Flux density increases because V/N ratio increases
        const minTapFluxFactor = 100 / (100 - tapRangePercent);
        const minTapFlux = parseFloat(fluxDensity) * minTapFluxFactor;

        // At maximum tap (highest voltage, most turns)
        // Flux density decreases because V/N ratio decreases
        const maxTapFluxFactor = 100 / (100 + tapRangePercent);
        const maxTapFlux = parseFloat(fluxDensity) * maxTapFluxFactor;

        // ===== CALCULATE VOLTS PER TURN AT EXTREMES =====
        const { actualVoltsPerTurn } = coreDesign;
        const minTapVPT = actualVoltsPerTurn * minTapFluxFactor;
        const maxTapVPT = actualVoltsPerTurn * maxTapFluxFactor;

        // ===== GENERATE WARNINGS =====
        const warnings = [];

        // Critical: Flux density at minimum tap
        if (minTapFlux > 1.8) {
            warnings.push({
                severity: 'high',
                category: 'Tap Design',
                message: `Flux density at minimum tap (${minTapFlux.toFixed(2)}T) exceeds safe limit (1.8T)`,
                recommendation: 'Reduce base flux density or tapping range to prevent core saturation',
                standard: 'IEC 60076-1',
                position: 'Minimum Tap',
                value: minTapFlux,
                limit: 1.8
            });
        } else if (minTapFlux > 1.7) {
            warnings.push({
                severity: 'medium',
                category: 'Tap Design',
                message: `Flux density at minimum tap (${minTapFlux.toFixed(2)}T) approaching limit (1.8T)`,
                recommendation: 'Consider design margin for manufacturing tolerances',
                standard: 'IEC 60076-1',
                position: 'Minimum Tap',
                value: minTapFlux,
                limit: 1.8
            });
        }

        // Check if maximum tap flux is too low (inefficient design)
        if (maxTapFlux < 1.2) {
            warnings.push({
                severity: 'low',
                category: 'Tap Design',
                message: `Flux density at maximum tap (${maxTapFlux.toFixed(2)}T) is low`,
                recommendation: 'Core may be oversized for maximum tap operation',
                standard: 'IEC 60076-1',
                position: 'Maximum Tap',
                value: maxTapFlux,
                limit: 1.2
            });
        }

        console.log(`   Min tap: ${minTapVoltage.toFixed(1)}kV, Flux: ${minTapFlux.toFixed(2)}T`);
        console.log(`   Max tap: ${maxTapVoltage.toFixed(1)}kV, Flux: ${maxTapFlux.toFixed(2)}T`);
        console.log(`   Warnings: ${warnings.length}`);

        // ===== RESULTS =====
        return {
            applicable: true,
            tapChangerType: 'OCTC',
            tappingSide: tappingSide,
            tappingRange: tapRangePercent,

            // Nominal (rated) position
            nominal: {
                voltage: baseVoltage,
                fluxDensity: parseFloat(fluxDensity),
                voltsPerTurn: actualVoltsPerTurn
            },

            // Minimum tap position (highest flux)
            minimumTap: {
                position: `-${tapRangePercent}%`,
                voltage: Utils.round(minTapVoltage, 2),
                fluxDensity: Utils.round(minTapFlux, 3),
                voltsPerTurn: Utils.round(minTapVPT, 3),
                fluxFactor: Utils.round(minTapFluxFactor, 3),
                status: minTapFlux > 1.8 ? 'CRITICAL' : (minTapFlux > 1.7 ? 'WARNING' : 'OK')
            },

            // Maximum tap position (lowest flux)
            maximumTap: {
                position: `+${tapRangePercent}%`,
                voltage: Utils.round(maxTapVoltage, 2),
                fluxDensity: Utils.round(maxTapFlux, 3),
                voltsPerTurn: Utils.round(maxTapVPT, 3),
                fluxFactor: Utils.round(maxTapFluxFactor, 3),
                status: maxTapFlux < 1.2 ? 'LOW' : 'OK'
            },

            // Worst case for design
            worstCase: {
                position: minTapFlux > 1.8 ? 'Minimum Tap' : 'Nominal',
                fluxDensity: Math.max(minTapFlux, parseFloat(fluxDensity)),
                concern: minTapFlux > 1.8 ? 'Core saturation risk' : 'Within limits'
            },

            warnings: warnings,
            methodology: 'IEC 60076-1 Tap Position Analysis',
            standard: 'IEC 60076-1 Clause 5'
        };
    }

    /**
     * Generate tap position table for display
     */
    function generateTapPositionTable(tapExtremes) {
        if (!tapExtremes.applicable) {
            return null;
        }

        const positions = [
            {
                name: 'Minimum Tap',
                position: tapExtremes.minimumTap.position,
                voltage: tapExtremes.minimumTap.voltage,
                flux: tapExtremes.minimumTap.fluxDensity,
                vpt: tapExtremes.minimumTap.voltsPerTurn,
                status: tapExtremes.minimumTap.status
            },
            {
                name: 'Nominal (Rated)',
                position: '0%',
                voltage: tapExtremes.nominal.voltage,
                flux: tapExtremes.nominal.fluxDensity,
                vpt: tapExtremes.nominal.voltsPerTurn,
                status: 'RATED'
            },
            {
                name: 'Maximum Tap',
                position: tapExtremes.maximumTap.position,
                voltage: tapExtremes.maximumTap.voltage,
                flux: tapExtremes.maximumTap.fluxDensity,
                vpt: tapExtremes.maximumTap.voltsPerTurn,
                status: tapExtremes.maximumTap.status
            }
        ];

        return positions;
    }

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            calculateTapExtremes,
            generateTapPositionTable
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalcModule_TapExtremes = {
            calculateTapExtremes,
            generateTapPositionTable
        };
    }
})();
