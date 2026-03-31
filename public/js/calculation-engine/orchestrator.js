(function () {
    /**
     * ===============================================
     * CALCULATION ENGINE - ORCHESTRATOR
     * Industry-Standard Transformer Design Calculator
     * Coordinates all calculation modules
     * ===============================================
     */

    // Import core utilities
    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('./core/constants.js');

    const { validateInputs } = typeof window !== 'undefined'
        ? window.InputValidator
        : require('./core/validator.js');

    const { CalculationError } = typeof window !== 'undefined'
        ? window.CalculationErrors
        : require('./core/errors.js');

    // Import calculation modules
    const { calculateCurrents } = typeof window !== 'undefined'
        ? window.CalcModule_Currents
        : require('./modules/01-currents.js');

    const { calculateCoreDesign } = typeof window !== 'undefined'
        ? window.CalcModule_CoreDesign
        : require('./modules/02-core-design.js');

    const { calculateWindingDesign } = typeof window !== 'undefined'
        ? window.CalcModule_WindingDesign
        : require('./modules/03-winding-design.js');

    const { calculateConductors } = typeof window !== 'undefined'
        ? window.CalcModule_Conductors
        : require('./modules/04-conductors.js');

    const { calculateLosses } = typeof window !== 'undefined'
        ? window.CalcModule_Losses
        : require('./modules/05-losses.js');

    const { calculateDimensions } = typeof window !== 'undefined'
        ? window.CalcModule_Dimensions
        : require('./modules/06-dimensions.js');

    const { calculateTemperatureRise } = typeof window !== 'undefined'
        ? window.CalcModule_Temperature
        : require('./modules/07-temperature.js');

    const { calculateImpedance } = typeof window !== 'undefined'
        ? window.CalcModule_Impedance
        : require('./modules/08-impedance.js');

    const { calculateShortCircuitForces } = typeof window !== 'undefined'
        ? window.CalcModule_ShortCircuit
        : require('./modules/09-short-circuit.js');

    const { calculateAdvancedFeatures } = typeof window !== 'undefined'
        ? window.CalcModule_Advanced
        : require('./modules/10-advanced.js');

    const { calculateTapExtremes } = (typeof window !== 'undefined'
        ? window.CalcModule_TapExtremes
        : require('./modules/11-tap-extremes.js')) || {};

    const { analyzeMargins } = (typeof window !== 'undefined'
        ? window.CalcModule_Validation
        : require('./modules/validation.js')) || {};

    /**
     * Main calculation orchestrator
     * Coordinates execution of all calculation modules
     * 
     * @param {Object} rawInputs - Raw user inputs
     * @returns {Object} Complete calculation results
     */
    function performCompleteDesign(rawInputs) {
        console.log('🚀 Starting transformer design calculation...');
        console.log('═══════════════════════════════════════════════');

        const startTime = performance.now();
        const results = {
            success: false,
            inputs: null,
            calculations: {},
            errors: [],
            metadata: {
                version: '2.0.0-IEC-60076',
                engine: 'Industry-Standard Calculation Engine',
                standards: ['IEC 60076', 'IEEE C57', 'IS 2026'],
                timestamp: new Date().toISOString()
            }
        };

        try {
            // ===== PHASE 1: INPUT VALIDATION =====
            console.log('\n📋 Phase 1: Validating inputs...');
            const validatedInputs = validateInputs(rawInputs);
            results.inputs = validatedInputs;
            console.log('   ✅ Inputs validated');

            // ===== PHASE 2: CURRENT CALCULATIONS =====
            console.log('\n📊 Phase 2: Current calculations...');
            const currents = calculateCurrents(validatedInputs);
            results.calculations.currents = currents;

            // ===== PHASE 3: CORE DESIGN =====
            console.log('\n🔧 Phase 3: Core design...');
            const coreDesign = calculateCoreDesign(validatedInputs, currents);
            results.calculations.coreDesign = coreDesign;

            // ===== PHASE 4: WINDING DESIGN =====
            console.log('\n🔄 Phase 4: Winding design...');
            const windingDesign = calculateWindingDesign(validatedInputs, currents, coreDesign);
            results.calculations.windingDesign = windingDesign;

            // ===== PHASE 5: CONDUCTOR SIZING =====
            console.log('\n⚡ Phase 5: Conductor sizing...');
            const conductors = calculateConductors(validatedInputs, currents, windingDesign, coreDesign);
            results.calculations.conductors = conductors;

            // ===== PHASE 6: DIMENSIONAL CALCULATIONS =====
            // Moved before losses to allow accurate core weight calculation
            console.log('\n📐 Phase 6: Dimensional calculations...');
            const dimensions = calculateDimensions(validatedInputs, coreDesign, windingDesign, conductors);
            results.calculations.dimensions = dimensions;

            // ===== PHASE 7: LOSS CALCULATIONS =====
            console.log('\n📉 Phase 7: Loss calculations...');
            const losses = calculateLosses(validatedInputs, coreDesign, conductors, currents, dimensions);
            results.calculations.losses = losses;

            // ===== PHASE 8: TEMPERATURE RISE =====
            console.log('\n🌡️ Phase 8: Temperature rise...');
            const temperature = calculateTemperatureRise(validatedInputs, losses, dimensions);
            results.calculations.temperature = temperature;

            // ===== PHASE 9: IMPEDANCE =====
            console.log('\n⚡ Phase 9: Impedance...');
            const impedance = calculateImpedance(validatedInputs, coreDesign, windingDesign, conductors);
            results.calculations.impedance = impedance;

            // ===== PHASE 10: SHORT CIRCUIT FORCES =====
            console.log('\n⚡ Phase 10: Short circuit forces...');
            const shortCircuit = calculateShortCircuitForces(validatedInputs, currents, coreDesign, windingDesign, impedance);
            results.calculations.shortCircuit = shortCircuit;

            // ===== PHASE 11: ADVANCED FEATURES =====
            console.log('\n🔬 Phase 11: Advanced features...');
            const advanced = calculateAdvancedFeatures(validatedInputs, {
                dimensions,
                losses,
                conductors,
                coreDesign,
                windingDesign
            });
            results.calculations.advanced = advanced;

            // ===== PHASE 12: TAP EXTREMES =====
            console.log('\n🔄 Phase 12: Tap Extremes...');
            const tapExtremes = calculateTapExtremes(validatedInputs, coreDesign);
            results.calculations.tapExtremes = tapExtremes;

            // ===== PHASE 13: VALIDATION & DEFENSIBILITY =====
            console.log('\n🛡️ Phase 13: IEC Validation...');
            const validation = analyzeMargins(results.calculations);
            results.validation = {
                margins: validation,
                compliance: {
                    status: validation.some(m => m.status === 'CRITICAL') ? 'NON-COMPLIANT' : 'COMPLIANT',
                    standard: 'IEC 60076 Series'
                }
            };

            // ===== PHASE 14: SUMMARY =====
            console.log('\n📊 Phase 14: Generating summary...');
            results.summary = generateSummary(results.calculations);

            // Mark as successful
            results.success = true;

            // Calculate execution time
            const endTime = performance.now();
            results.metadata.executionTime = Math.round(endTime - startTime);

            console.log('\n═══════════════════════════════════════════════');
            console.log(`✅ Design calculation complete in ${results.metadata.executionTime}ms`);
            console.log('═══════════════════════════════════════════════\n');

            return results;

        } catch (error) {
            console.error('\n❌ Calculation failed:', error);

            results.success = false;
            results.errors.push({
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                details: error.details || {}
            });

            const endTime = performance.now();
            results.metadata.executionTime = Math.round(endTime - startTime);

            return results;
        }
    }

    /**
     * Generate summary of key results
     */
    function generateSummary(calculations) {
        const { currents, coreDesign, losses, dimensions } = calculations;

        return {
            // Key electrical parameters
            electrical: {
                hvCurrent: currents.hvCurrent,
                lvCurrent: currents.lvCurrent,
                efficiency: losses.efficiency,
                totalLoss: losses.totalLoss,
                noLoadLoss: losses.noLoadLoss,
                loadLoss: losses.loadLoss
            },

            // Key design parameters
            design: {
                coreDiameter: coreDesign.diameter,
                hvTurns: coreDesign.hvTurns,
                lvTurns: coreDesign.lvTurns,
                turnsRatio: coreDesign.turnsRatio
            },

            // Key physical parameters
            physical: {
                tankLength: dimensions.tank.length,
                tankWidth: dimensions.tank.width,
                tankHeight: dimensions.tank.height,
                totalWeight: dimensions.weights.total,
                oilVolume: dimensions.oil.volume
            },

            // Compliance
            compliance: {
                iecLosses: losses.iecCompliance.overall,
                efficiency: losses.efficiency > 99.0 ? 'EXCELLENT' : losses.efficiency > 98.5 ? 'GOOD' : 'ACCEPTABLE'
            }
        };
    }

    /**
     * Quick calculation for basic parameters only
     * (Faster execution for preview/validation)
     */
    function performQuickCalculation(rawInputs) {
        console.log('⚡ Quick calculation mode...');

        try {
            const validatedInputs = validateInputs(rawInputs);
            const currents = calculateCurrents(validatedInputs);
            const coreDesign = calculateCoreDesign(validatedInputs, currents);

            return {
                success: true,
                currents: currents,
                coreDesign: coreDesign,
                metadata: {
                    mode: 'quick',
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Export for use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            performCompleteDesign,
            performQuickCalculation,
            generateSummary
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalculationEngine = {
            performCompleteDesign,
            performQuickCalculation,
            generateSummary
        };
    }
})();
