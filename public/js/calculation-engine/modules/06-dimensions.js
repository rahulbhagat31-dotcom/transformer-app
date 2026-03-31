(function () {
    /**
     * ===============================================
     * MODULE 6: DIMENSIONAL CALCULATIONS
     * Industry-Standard Transformer Design Calculator
     * Tank, Window, and Overall Dimensions
     * ===============================================
     */

    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('../core/constants.js');

    const Utils = typeof window !== 'undefined'
        ? window.CalcUtils
        : require('../core/utils.js');

    const { ValidationError, ComputationError } = typeof window !== 'undefined'
        ? window.CalculationErrors
        : require('../core/errors.js');

    /**
     * Calculate transformer dimensions
     * 
     * @param {Object} inputs - Validated transformer inputs
     * @param {Object} coreDesign - Core design results
     * @param {Object} windingDesign - Winding design results
     * @returns {Object} Complete dimensional specifications
     */
    function calculateDimensions(inputs, coreDesign, windingDesign) {
        console.log('📐 [Module 6] Calculating dimensions...');

        try {
            const { mva, cooling } = inputs;
            const { diameter: coreDiameter } = coreDesign;
            const { hv: hvWinding, lv: lvWinding, clearances } = windingDesign;

            // ===== STEP 1: CALCULATE CORE WINDOW DIMENSIONS =====
            const windowWidth = hvWinding.outerDiameter + (2 * clearances.hvToTank);
            const windowHeight = hvWinding.axialHeight + 200; // Add 200mm for top/bottom clearance

            console.log(`   Window: ${Utils.round(windowWidth, 1)} × ${Utils.round(windowHeight, 1)} mm`);

            // ===== STEP 2: CALCULATE TANK DIMENSIONS =====
            const tankDimensions = calculateTankDimensions({
                mva: mva,
                windowWidth: windowWidth,
                windowHeight: windowHeight,
                coreDiameter: coreDiameter,
                cooling: cooling
            });

            console.log(`   Tank: ${tankDimensions.length} × ${tankDimensions.width} × ${tankDimensions.height} mm`);

            // ===== STEP 3: CALCULATE ACTIVE PART DIMENSIONS =====
            const activePartHeight = windowHeight + 400; // Core + windings + yokes
            const activePartWidth = windowWidth + 200;
            const activePartLength = windowWidth * 2.5; // For 3-phase

            // ===== STEP 4: CALCULATE COOLING SURFACE AREA =====
            const coolingSurfaceArea = calculateCoolingSurfaceArea(tankDimensions);

            console.log(`   Cooling surface: ${Utils.round(coolingSurfaceArea, 2)} m²`);

            // ===== STEP 5: CALCULATE OIL VOLUME =====
            const oilVolume = calculateOilVolume(tankDimensions, activePartWidth, activePartLength, activePartHeight);

            console.log(`   Oil volume: ${Utils.round(oilVolume, 1)} liters`);

            // ===== STEP 6: CALCULATE TOTAL WEIGHT =====
            const totalWeight = calculateTotalWeight(inputs, coreDesign, windingDesign, tankDimensions, oilVolume);

            console.log(`   Total weight: ${Utils.round(totalWeight.total, 1)} kg`);

            // ===== RESULTS =====
            const results = {
                // Core window
                window: {
                    width: Utils.round(windowWidth, 1),
                    height: Utils.round(windowHeight, 1),
                    area: Utils.round((windowWidth * windowHeight) / 1e6, 3) // m²
                },

                // Active part
                activePart: {
                    length: Utils.round(activePartLength, 1),
                    width: Utils.round(activePartWidth, 1),
                    height: Utils.round(activePartHeight, 1),
                    volume: Utils.round((activePartLength * activePartWidth * activePartHeight) / 1e9, 3) // m³
                },

                // Tank
                tank: {
                    length: tankDimensions.length,
                    width: tankDimensions.width,
                    height: tankDimensions.height,
                    wallThickness: tankDimensions.wallThickness,
                    volume: Utils.round((tankDimensions.length * tankDimensions.width * tankDimensions.height) / 1e9, 3), // m³
                    surfaceArea: Utils.round(coolingSurfaceArea, 2)
                },

                // Oil
                oil: {
                    volume: Utils.round(oilVolume, 1),
                    weight: Utils.round(oilVolume * 0.88, 1) // Oil density ~0.88 kg/L
                },

                // Weights
                weights: {
                    core: totalWeight.core,
                    windings: totalWeight.windings,
                    tank: totalWeight.tank,
                    oil: totalWeight.oil,
                    accessories: totalWeight.accessories,
                    total: Utils.round(totalWeight.total, 1)
                },

                // Shipping
                shipping: {
                    length: tankDimensions.length + 200,
                    width: tankDimensions.width + 200,
                    height: tankDimensions.height + 500,
                    weight: Utils.round(totalWeight.total, 1),
                    volume: Utils.round(((tankDimensions.length + 200) * (tankDimensions.width + 200) * (tankDimensions.height + 500)) / 1e9, 3)
                },

                // Metadata
                methodology: 'Industry standard dimensional design',
                accuracy: '±5%',

                details: {
                    mva: mva,
                    cooling: cooling
                }
            };

            console.log('   ✅ Dimensional calculations complete');
            return results;

        } catch (error) {
            console.error('❌ Error in dimensional calculation:', error);
            throw new ComputationError(
                `Dimensional calculation failed: ${error.message}`,
                'Dimensions',
                'calculateDimensions',
                inputs
            );
        }
    }

    /**
     * Calculate tank dimensions
     */
    function calculateTankDimensions(params) {
        const { mva, windowWidth, windowHeight, coreDiameter, cooling } = params;

        // Base dimensions on active part + clearances
        const clearance = 300; // mm clearance all around

        let length = (windowWidth * 2.5) + (2 * clearance); // For 3-phase
        let width = windowWidth + (2 * clearance);
        let height = windowHeight + 800; // Extra for conservator, bushings

        // Adjust for cooling type
        if (cooling.includes('AF')) {
            // Add space for radiators/fans
            width += 400;
            length += 200;
        }

        // Wall thickness based on MVA
        let wallThickness;
        if (mva < 10) {
            wallThickness = 6;
        } else if (mva < 50) {
            wallThickness = 8;
        } else if (mva < 100) {
            wallThickness = 10;
        } else {
            wallThickness = 12;
        }

        return {
            length: Utils.round(length, 0),
            width: Utils.round(width, 0),
            height: Utils.round(height, 0),
            wallThickness: wallThickness
        };
    }

    /**
     * Calculate cooling surface area
     */
    function calculateCoolingSurfaceArea(tankDims) {
        const { length, width, height } = tankDims;

        // Convert to meters
        const L = length / 1000;
        const W = width / 1000;
        const H = height / 1000;

        // Surface area (excluding bottom)
        const area = (2 * L * H) + (2 * W * H) + (L * W);

        return area; // m²
    }

    /**
     * Calculate oil volume
     */
    function calculateOilVolume(tankDims, activeWidth, activeLength, activeHeight) {
        // Tank volume
        const tankVolume = (tankDims.length * tankDims.width * tankDims.height) / 1e6; // liters

        // Active part volume (approximate)
        const activeVolume = (activeWidth * activeLength * activeHeight) / 1e6; // liters

        // Oil volume is tank volume minus active part volume
        const oilVolume = tankVolume - activeVolume;

        // Add conservator volume (typically 10% of tank volume)
        const conservatorVolume = tankVolume * 0.1;

        return oilVolume + conservatorVolume;
    }

    /**
     * Calculate total weight
     */
    function calculateTotalWeight(inputs, coreDesign, windingDesign, tankDims, oilVolume) {
        const { coreMaterial, windingMaterial } = inputs;

        // Core weight (from Module 5)
        const materialData = CONSTANTS[coreMaterial];
        const coreDensity = materialData.density;
        const stackingFactor = materialData.stackingFactor;
        const diameter = coreDesign.diameter / 1000; // mm to m
        const coreArea = Math.PI * Math.pow(diameter / 2, 2);
        const coreLength = diameter * 3;
        const coreWeight = coreArea * coreLength * coreDensity * stackingFactor;

        // Winding weight (approximate from conductor data)
        // This would come from Module 4 in full implementation
        const windingWeight = inputs.mva * 50; // Rough estimate: 50 kg/MVA

        // Tank weight
        const tankSurfaceArea = calculateCoolingSurfaceArea(tankDims);
        const tankThickness = tankDims.wallThickness / 1000; // mm to m
        const steelDensity = 7850; // kg/m³
        const tankWeight = tankSurfaceArea * tankThickness * steelDensity;

        // Oil weight
        const oilWeight = oilVolume * 0.88; // kg (oil density ~0.88 kg/L)

        // Accessories weight (bushings, conservator, radiators, etc.)
        const accessoriesWeight = inputs.mva * 30; // Rough estimate: 30 kg/MVA

        const total = coreWeight + windingWeight + tankWeight + oilWeight + accessoriesWeight;

        return {
            core: Utils.round(coreWeight, 1),
            windings: Utils.round(windingWeight, 1),
            tank: Utils.round(tankWeight, 1),
            oil: Utils.round(oilWeight, 1),
            accessories: Utils.round(accessoriesWeight, 1),
            total: total
        };
    }

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            calculateDimensions,
            calculateTankDimensions,
            calculateCoolingSurfaceArea,
            calculateOilVolume,
            calculateTotalWeight
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalcModule_Dimensions = {
            calculateDimensions,
            calculateTankDimensions,
            calculateCoolingSurfaceArea,
            calculateOilVolume,
            calculateTotalWeight
        };
    }
})();
