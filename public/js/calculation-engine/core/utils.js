(function () {
    /**
     * ===============================================
     * CALCULATION ENGINE - UTILITY FUNCTIONS
     * Industry-Standard Transformer Design Calculator
     * ===============================================
     */

    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('./constants.js');

    /**
     * Utility functions for calculations
     */
    const Utils = {
        /**
         * Calculate resistance at a specific temperature
         * R_t = R_20 * (1 + α * (T - 20))
         */
        resistanceAtTemp(R20, temp, material = 'Copper') {
            const materialData = CONSTANTS[material.toUpperCase()];
            if (!materialData) {
                throw new Error(`Unknown material: ${material}`);
            }

            const alpha = materialData.tempCoefficient;
            return R20 * (1 + alpha * (temp - 20));
        },

        /**
         * Calculate skin effect factor for AC resistance
         * Based on conductor dimensions and frequency
         */
        skinEffectFactor(conductorThickness, frequency, material = 'Copper') {
            const materialData = CONSTANTS[material.toUpperCase()];
            const rho = materialData.resistivity20C;
            const mu = CONSTANTS.MU_0; // Assume non-magnetic

            // Skin depth
            const delta = Math.sqrt(rho / (Math.PI * frequency * mu));

            // Ratio of thickness to skin depth
            const xi = conductorThickness / (2 * delta);

            // Skin effect factor (simplified formula)
            if (xi < 1) {
                return 1 + (xi ** 4) / 48; // Small correction for thin conductors
            } else {
                return xi * (Math.sinh(2 * xi) + Math.sin(2 * xi)) /
                    (Math.cosh(2 * xi) - Math.cos(2 * xi));
            }
        },

        /**
         * Calculate proximity effect factor
         * Simplified formula for typical transformer windings
         */
        proximityEffectFactor(conductorSpacing, conductorWidth, frequency) {
            // Simplified empirical formula
            const ratio = conductorSpacing / conductorWidth;

            if (ratio > 3) {
                return 1.0; // Negligible proximity effect
            } else {
                return 1 + 0.15 * Math.exp(-ratio);
            }
        },

        /**
         * Calculate mean turn length for a winding
         */
        meanTurnLength(innerDiameter, outerDiameter) {
            const meanDiameter = (innerDiameter + outerDiameter) / 2;
            return Math.PI * meanDiameter;
        },

        /**
         * Calculate core weight using limb-yoke-corner method
         * Returns weight in kg
         */
        coreWeight(limbVolume, yokeVolume, cornerVolume, material = 'CRGO') {
            const materialData = CONSTANTS[material];
            if (!materialData) {
                throw new Error(`Unknown core material: ${material}`);
            }

            const density = materialData.density;
            const stackingFactor = materialData.stackingFactor;

            const totalVolume = limbVolume + yokeVolume + cornerVolume;
            return totalVolume * density * stackingFactor;
        },

        /**
         * Calculate core loss using IEC 60076-1 methodology
         * Separates hysteresis and eddy current losses
         * P_core = P_h + P_e
         * P_h = k_h × f × B^α × weight (hysteresis loss)
         * P_e = k_e × f² × B² × weight (eddy current loss)
         *
         * @param {number} weight - Core weight in kg
         * @param {number} frequency - Frequency in Hz
         * @param {number} fluxDensity - Flux density in Tesla
         * @param {string} material - Core material (CRGO/CRNGO)
         * @param {string} grade - Material grade (M4/M5/M6 for CRGO)
         * @returns {Object} Loss breakdown with total, hysteresis, eddy components
         */
        coreLoss(weight, frequency, fluxDensity, material = 'CRGO', grade = 'M4') {
            const materialData = CONSTANTS[material];
            if (!materialData) {
                throw new Error(`Unknown core material: ${material}`);
            }

            // IEC 60076-1: Separate hysteresis and eddy current losses

            // Hysteresis loss: P_h = k_h × f × B^α × weight
            const k_h = materialData.hysteresisCoeff ? materialData.hysteresisCoeff[grade] || 1.0 : 1.0;
            const alpha = 1.6; // Typical for CRGO steel
            const hysteresisLoss = k_h * frequency * Math.pow(fluxDensity, alpha) * weight;

            // Eddy current loss: P_e = k_e × f² × B² × weight
            const k_e = materialData.eddyCoeff ? materialData.eddyCoeff[grade] || 0.025 : 0.025;
            const eddyLoss = k_e * Math.pow(frequency, 2) * Math.pow(fluxDensity, 2) * weight;

            // Total core loss
            const totalLoss = hysteresisLoss + eddyLoss;

            // Return detailed breakdown per IEC 60076-1
            return {
                total: totalLoss / 1000,           // kW
                hysteresis: hysteresisLoss / 1000, // kW
                eddy: eddyLoss / 1000,             // kW
                methodology: 'IEC 60076-1 Hysteresis + Eddy Current',
                standard: 'IEC 60076-1 Clause 6.2',
                details: {
                    k_h: k_h,
                    k_e: k_e,
                    alpha: alpha,
                    weight: weight,
                    frequency: frequency,
                    fluxDensity: fluxDensity
                }
            };
        },

        /**
         * Calculate winding gradient (temperature rise per unit current density)
         */
        windingGradient(currentDensity, windingType = 'disc', material = 'Copper') {
            // Empirical formula based on cooling and winding design
            const baseGradient = windingType === 'disc' ? 8 : 10; // °C per A/mm²
            const materialFactor = material === 'Copper' ? 1.0 : 1.2; // Aluminum runs hotter

            return baseGradient * materialFactor * Math.sqrt(currentDensity);
        },

        /**
         * Calculate oil temperature rise
         * Based on total losses and cooling surface area
         */
        oilTemperatureRise(totalLoss, coolingArea, coolingType = 'ONAN') {
            // coolingCoefficient in CONSTANTS.COOLING is in W/m²·°C
            // totalLoss is in kW → convert coefficient to kW/m²·°C by dividing by 1000
            const coolingCoefficient = (CONSTANTS.COOLING[coolingType] || 1.2) / 1000; // kW/m²·°C

            // Δθ = P(kW) / (h(kW/m²·°C) * A(m²))
            const tempRise = totalLoss / (coolingCoefficient * coolingArea);

            // Clamp to physically plausible range (≤150°C rise for ONAN)
            return Math.min(tempRise, 150);
        },

        /**
         * Calculate impedance from leakage reactance and resistance
         */
        impedancePercent(reactance, resistance, baseVoltage, baseCurrent) {
            const Z_ohms = Math.sqrt(reactance ** 2 + resistance ** 2);
            const Z_base = baseVoltage / (CONSTANTS.SQRT_3 * baseCurrent);

            return (Z_ohms / Z_base) * 100;
        },

        /**
         * Calculate short circuit current
         */
        shortCircuitCurrent(ratedCurrent, impedancePercent) {
            return ratedCurrent / (impedancePercent / 100);
        },

        /**
         * Calculate radial short circuit force
         * F = (μ₀ * I² * N * h) / (2π * r)
         */
        radialSCForce(current, turns, height, radius) {
            const mu0 = CONSTANTS.MU_0;
            const force = (mu0 * current ** 2 * turns * height) / (2 * Math.PI * radius);

            return force; // Newtons
        },

        /**
         * Calculate axial short circuit force
         */
        axialSCForce(current, turns, axialGap, meanTurnLength) {
            const mu0 = CONSTANTS.MU_0;
            const force = (mu0 * current ** 2 * turns ** 2 * axialGap) / (2 * meanTurnLength);

            return force; // Newtons
        },

        /**
         * Calculate efficiency
         */
        efficiency(mva, totalLoss) {
            const powerOut = mva * 1000; // kW
            const powerIn = powerOut + totalLoss;

            return (powerOut / powerIn) * 100;
        },

        /**
         * Round to specified decimal places
         */
        round(value, decimals = 2) {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        },

        /**
         * Clamp value between min and max
         */
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        /**
         * Linear interpolation
         */
        lerp(a, b, t) {
            return a + (b - a) * t;
        },

        /**
         * Check if value is within tolerance
         */
        withinTolerance(value, target, tolerancePercent) {
            const tolerance = Math.abs(target * tolerancePercent / 100);
            return Math.abs(value - target) <= tolerance;
        },

        /**
         * Format number with units
         */
        formatWithUnit(value, unit, decimals = 2) {
            return `${this.round(value, decimals)} ${unit}`;
        },

        /**
         * Calculate percentage difference
         */
        percentDifference(value, reference) {
            return ((value - reference) / reference) * 100;
        },

        /**
         * Deep clone object (simple implementation)
         */
        deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        /**
         * Merge objects (shallow)
         */
        merge(...objects) {
            return Object.assign({}, ...objects);
        },

        /**
         * Get material properties
         */
        getMaterialProperties(material, property) {
            const materialData = CONSTANTS[material.toUpperCase()];
            if (!materialData) {
                throw new Error(`Unknown material: ${material}`);
            }

            return property ? materialData[property] : materialData;
        },

        /**
         * Calculate stepped core configuration
         * Returns array of step diameters for optimized core
         */
        steppedCoreSteps(diameter) {
            // Standard stepped core design
            const steps = [];
            const numSteps = diameter > 500 ? 9 : diameter > 300 ? 7 : 5;

            for (let i = 0; i < numSteps; i++) {
                const stepDiameter = diameter * (1 - (i * 0.15));
                steps.push(this.round(stepDiameter, 1));
            }

            return steps;
        }
    };

    // Export for use in modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Utils;
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalcUtils = Utils;
    }
})();
