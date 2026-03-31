(function () {
    /**
     * ===============================================
     * VALIDATION & WARNING SYSTEM
     * IEC 60076 / IS 2026 Compliance Checks
     * Non-blocking warnings for design review
     * ===============================================
     */

    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('./constants.js');

    /**
     * Generate validation warnings for transformer design
     * Non-blocking - provides engineering guidance only
     *
     * @param {Object} results - Complete calculation results
     * @param {Object} inputs - User inputs
     * @returns {Array} Array of warning objects
     */
    function generateValidationWarnings(results, inputs) {
        const warnings = [];

        // ===== FLUX DENSITY CHECK =====
        const fluxDensity = parseFloat(inputs.fluxDensity);
        if (fluxDensity < 1.3 || fluxDensity > 1.8) {
            warnings.push({
                category: 'Core Design',
                severity: fluxDensity < 1.2 || fluxDensity > 1.9 ? 'high' : 'medium',
                message: `Flux density ${fluxDensity}T outside typical range (1.3-1.8T)`,
                recommendation: 'Review core saturation and no-load losses',
                standard: 'IEC 60076-1'
            });
        }

        // ===== CURRENT DENSITY CHECK =====
        const currentDensity = parseFloat(inputs.currentDensity);
        if (currentDensity < 1.5 || currentDensity > 4.0) {
            warnings.push({
                category: 'Conductor Design',
                severity: currentDensity > 4.5 ? 'high' : 'medium',
                message: `Current density ${currentDensity} A/mm² outside typical range (1.5-4.0 A/mm²)`,
                recommendation: currentDensity > 4.0
                    ? 'High current density may cause excessive temperature rise'
                    : 'Low current density may result in oversized conductors',
                standard: 'IEC 60076-1'
            });
        }

        // ===== HOT SPOT CHECK =====
        if (results.temperature && results.temperature.hotSpotTemp) {
            const hotSpotTemp = results.temperature.hotSpotTemp;
            const insulationClass = inputs.insulationClass || 'F';
            const insulationLimits = {
                'A': 105, 'E': 120, 'B': 130, 'F': 155, 'H': 180
            };
            const limit = insulationLimits[insulationClass];

            if (hotSpotTemp > limit) {
                warnings.push({
                    category: 'Temperature',
                    severity: 'high',
                    message: `Hot spot ${hotSpotTemp.toFixed(1)}°C exceeds Class ${insulationClass} limit (${limit}°C)`,
                    recommendation: 'Reduce losses, improve cooling, or upgrade insulation class',
                    standard: 'IEC 60076-2'
                });
            } else if (hotSpotTemp > limit * 0.9) {
                warnings.push({
                    category: 'Temperature',
                    severity: 'medium',
                    message: `Hot spot ${hotSpotTemp.toFixed(1)}°C approaching Class ${insulationClass} limit (${limit}°C)`,
                    recommendation: 'Consider design margin for ambient variations',
                    standard: 'IEC 60076-2'
                });
            }

            // IEC absolute hot-spot limit
            if (hotSpotTemp > 78) {
                warnings.push({
                    category: 'Temperature',
                    severity: 'high',
                    message: `Hot spot ${hotSpotTemp.toFixed(1)}°C exceeds IEC 60076-2 limit (78°C rise)`,
                    recommendation: 'Reduce load losses or enhance cooling',
                    standard: 'IEC 60076-2 Clause 4.2'
                });
            }
        }

        // ===== IMPEDANCE CHECK =====
        const impedance = parseFloat(inputs.impedance);
        if (impedance < 4 || impedance > 20) {
            warnings.push({
                category: 'Impedance',
                severity: impedance < 3 || impedance > 25 ? 'high' : 'medium',
                message: `Impedance ${impedance}% outside typical range (4-20%)`,
                recommendation: impedance < 4
                    ? 'Low impedance increases short-circuit current'
                    : 'High impedance may cause voltage regulation issues',
                standard: 'IEC 60076-1'
            });
        }

        // ===== BIL MISMATCH CHECK =====
        const hvVoltage = parseFloat(inputs.hv);
        const bilLevel = parseFloat(inputs.bilLevel);
        const expectedBIL = CONSTANTS.BIL_STANDARDS[hvVoltage]?.bil;

        if (expectedBIL && bilLevel && bilLevel !== expectedBIL) {
            const deviation = Math.abs((bilLevel - expectedBIL) / expectedBIL * 100);
            if (deviation > 10) {
                warnings.push({
                    category: 'Insulation',
                    severity: bilLevel < expectedBIL ? 'high' : 'low',
                    message: `BIL ${bilLevel}kV differs from IEC standard ${expectedBIL}kV for ${hvVoltage}kV class`,
                    recommendation: bilLevel < expectedBIL
                        ? 'Lower BIL may not meet insulation coordination requirements'
                        : 'Higher BIL increases insulation cost',
                    standard: 'IEC 60076-3 Table 1'
                });
            }
        }

        // ===== NO-LOAD CURRENT CHECK =====
        if (results.noLoadCurrent && results.noLoadCurrent.I_0_percent) {
            const I0_percent = results.noLoadCurrent.I_0_percent;
            if (I0_percent < 0.2 || I0_percent > 2.0) {
                warnings.push({
                    category: 'Core Design',
                    severity: I0_percent > 3.0 ? 'high' : 'medium',
                    message: `No-load current ${I0_percent.toFixed(2)}% outside typical range (0.2-2.0%)`,
                    recommendation: I0_percent > 2.0
                        ? 'High no-load current indicates core saturation or poor design'
                        : 'Unusually low no-load current - verify core design',
                    standard: 'IEC 60076-1'
                });
            }
        }

        // ===== EFFICIENCY CHECK =====
        if (results.losses && results.losses.efficiency) {
            const efficiency = results.losses.efficiency;
            if (efficiency < 98.0) {
                warnings.push({
                    category: 'Losses',
                    severity: 'high',
                    message: `Efficiency ${efficiency.toFixed(2)}% below typical minimum (98%)`,
                    recommendation: 'Review core and copper losses for optimization',
                    standard: 'IEC 60076-1'
                });
            }
        }

        // ===== TAP EXTREME CONDITIONS =====
        if (inputs.tapChangerType === 'OCTC' && inputs.tappingRange) {
            const tapRange = parseFloat(inputs.tappingRange);
            const maxFluxIncrease = (100 / (100 - tapRange)) - 1;
            const maxFlux = fluxDensity * (1 + maxFluxIncrease);

            if (maxFlux > 1.8) {
                warnings.push({
                    category: 'Tap Design',
                    severity: 'high',
                    message: `Flux density at minimum tap (${maxFlux.toFixed(2)}T) exceeds safe limit (1.8T)`,
                    recommendation: 'Reduce tapping range or base flux density',
                    standard: 'IEC 60076-1'
                });
            }
        }

        // ===== ALTITUDE DERATING =====
        const altitude = parseFloat(inputs.altitude) || 1000;
        if (altitude > 1000) {
            const deratingRequired = altitude > 3000;
            warnings.push({
                category: 'Environment',
                severity: deratingRequired ? 'high' : 'medium',
                message: `Altitude ${altitude}m above sea level requires consideration`,
                recommendation: deratingRequired
                    ? 'Derating required per IEC 60076-2 for altitude > 3000m'
                    : 'Monitor temperature rise at altitude',
                standard: 'IEC 60076-2 Clause 4.1'
            });
        }

        return warnings;
    }

    /**
     * Format warnings for display
     */
    function formatWarnings(warnings) {
        if (warnings.length === 0) {
            return {
                html: '<div class="no-warnings">✅ No design warnings - all parameters within typical ranges</div>',
                count: 0
            };
        }

        const grouped = warnings.reduce((acc, w) => {
            if (!acc[w.category]) acc[w.category] = [];
            acc[w.category].push(w);
            return acc;
        }, {});

        let html = '<div class="warnings-container">';
        html += `<div class="warnings-header">⚠️ ${warnings.length} Design Warning(s)</div>`;

        for (const [category, items] of Object.entries(grouped)) {
            html += `<div class="warning-category"><strong>${category}</strong></div>`;
            items.forEach(w => {
                const icon = w.severity === 'high' ? '🔴' : w.severity === 'medium' ? '🟡' : '🔵';
                html += `
                    <div class="warning-item severity-${w.severity}">
                        <div class="warning-message">${icon} ${w.message}</div>
                        <div class="warning-recommendation">${w.recommendation}</div>
                        <div class="warning-standard"><em>${w.standard}</em></div>
                    </div>
                `;
            });
        }

        html += '</div>';

        return {
            html: html,
            count: warnings.length,
            highSeverity: warnings.filter(w => w.severity === 'high').length
        };
    }

    // Export for use in modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            generateValidationWarnings,
            formatWarnings
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalcValidator = {
            generateValidationWarnings,
            formatWarnings
        };
    }
})();
