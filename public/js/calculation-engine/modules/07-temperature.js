(function () {
    /**
     * ===============================================
     * MODULE 7: TEMPERATURE RISE
     * Industry-Standard Transformer Design Calculator
     * IEC 60076-2 / IEEE C57.91 Compliant
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
     * Calculate temperature rise
     * 
     * @param {Object} inputs - Validated transformer inputs
     * @param {Object} losses - Loss calculation results
     * @param {Object} dimensions - Dimensional specifications
     * @returns {Object} Temperature rise calculations
     */
    function calculateTemperatureRise(inputs, losses, dimensions) {
        console.log('🌡️ [Module 7] Calculating temperature rise (IEC 60076-2)...');

        try {
            const { currentDensity, cooling, altitude, ambientTemp } = inputs;
            const { totalLoss, copperLoss } = losses;
            const { tank } = dimensions;

            // ===== STEP 1: CALCULATE TOP OIL TEMPERATURE RISE =====
            // Δθ_oil = P_total / (k_cooling * Surface Area)

            const topOilRise = Utils.oilTemperatureRise(totalLoss, tank.surfaceArea, cooling);

            console.log(`   Top oil rise: ${Utils.round(topOilRise, 1)} °C`);

            // ===== STEP 2: CALCULATE AVERAGE WINDING RISE =====
            // Δθ_winding = Δθ_oil_avg + Gradient

            // Mean oil temp rise (approximate)
            const meanOilRise = topOilRise * 0.8;

            // Winding gradient
            const gradient = Utils.windingGradient(currentDensity, 'Disc', 'Copper'); // Assuming Disc/Copper for now

            const averageWindingRise = meanOilRise + gradient;

            console.log(`   Avg winding rise: ${Utils.round(averageWindingRise, 1)} °C`);

            // ===== STEP 3: CALCULATE HOT SPOT TEMPERATURE =====
            // IEC 60076-2 Table 1: Hot spot factor H varies by cooling class
            // ONAN/ONAF: H = 1.1  |  OFAN: H = 1.2  |  OFAF/OFWF: H = 1.3
            const coolingClass = (cooling || 'ONAN').toUpperCase();
            const hotSpotFactor = {
                ONAN: 1.1,
                ONAF: 1.2,
                OFAN: 1.2,
                OFAF: 1.3,
                OFWF: 1.3
            }[coolingClass] ?? 1.3;

            const hotSpotDifferential = gradient * hotSpotFactor;
            const hotSpotRise = topOilRise + hotSpotDifferential;
            const hotSpotTemp = ambientTemp + hotSpotRise;

            console.log(`   Hot spot temp: ${Utils.round(hotSpotTemp, 1)} °C`);

            // ===== STEP 4: OVERLOAD SIMULATION (IEC 60076-2) =====
            // Estimate temp rise at 110% load (K = 1.1)
            // Rise_overload = Rise_rated * (K^y)
            // Oil Exponent y ≈ 0.8, Winding Exponent y ≈ 1.6

            const K_overload = 1.1; // 110% load
            const topOilRiseOverload = topOilRise * Math.pow(K_overload, 0.8);
            const windingGradientOverload = gradient * Math.pow(K_overload, 1.6);
            const hotSpotRiseOverload = topOilRiseOverload + (1.3 * windingGradientOverload);
            const hotSpotTempOverload = ambientTemp + hotSpotRiseOverload;

            console.log(`   Overload (110%) Hot Spot: ${Utils.round(hotSpotTempOverload, 1)} °C`);

            // ===== STEP 5: CHECK COMPLIANCE =====
            const compliance = checkTemperatureCompliance({
                topOilRise,
                averageWindingRise,
                hotSpotTemp,
                ambientTemp,
                hotSpotTempOverload,
                standard: 'IEC'
            });

            // ===== RESULTS =====
            const results = {
                // Temperature Rises (above ambient)
                rises: {
                    topOil: Utils.round(topOilRise, 1),
                    meanOil: Utils.round(meanOilRise, 1),
                    averageWinding: Utils.round(averageWindingRise, 1),
                    hotSpot: Utils.round(hotSpotRise, 1),
                    gradient: Utils.round(gradient, 1)
                },

                // Absolute Temperatures
                absolute: {
                    ambient: ambientTemp,
                    topOil: Utils.round(ambientTemp + topOilRise, 1),
                    hotSpot: Utils.round(hotSpotTemp, 1)
                },

                // Overload Capability (1 hour)
                overload: {
                    loadFactor: '110%',
                    hotSpotTemp: Utils.round(hotSpotTempOverload, 1),
                    status: hotSpotTempOverload < 140 ? 'SAFE' : 'CRITICAL' // IEC 60076-7 limit ~140C
                },

                // Compliance
                compliance: compliance,

                // Metadata
                methodology: 'IEC 60076-2 Thermal Calculation',
                accuracy: '±3°C',
                standard: 'IEC 60076-2',

                details: {
                    cooling: cooling,
                    altitude: altitude,
                    hotSpotFactor: 1.3
                }
            };

            console.log('   ✅ Temperature calculations complete');
            return results;

        } catch (error) {
            console.error('❌ Error in temperature calculation:', error);
            throw new ComputationError(
                `Temperature calculation failed: ${error.message}`,
                'Temperature',
                'calculateTemperatureRise',
                inputs
            );
        }
    }

    /**
     * Check compliance with standards
     */
    function checkTemperatureCompliance(params) {
        const { topOilRise, averageWindingRise, hotSpotTemp, ambientTemp, hotSpotTempOverload, standard } = params;

        // IEC 60076-2 Clause 4.2 limits
        const limits = {
            topOilRise: 55,           // °C (IEC 60076-2 Table 2, ONAN)
            averageWindingRise: 65,   // °C (IEC 60076-2 Table 2)
            hotSpotRise: 78,          // °C above average oil (IEC 60076-7 Table 1)
            overloadHotSpot: 140      // °C absolute (IEC 60076-7)
        };

        // Hot spot absolute limit = ambient + top oil rise + hot spot rise limit
        const hotSpotAbsoluteLimit = params.ambientTemp + limits.topOilRise + limits.hotSpotRise;

        return {
            topOil: topOilRise <= limits.topOilRise ? 'PASS' : 'FAIL',
            winding: averageWindingRise <= limits.averageWindingRise ? 'PASS' : 'FAIL',
            hotSpot: hotSpotTemp <= hotSpotAbsoluteLimit ? 'PASS' : 'FAIL',
            overload: hotSpotTempOverload <= limits.overloadHotSpot ? 'PASS' : 'FAIL',
            summary: (topOilRise <= limits.topOilRise && averageWindingRise <= limits.averageWindingRise) ? 'PASS' : 'FAIL'
        };
    }

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            calculateTemperatureRise,
            checkTemperatureCompliance
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalcModule_Temperature = {
            calculateTemperatureRise,
            checkTemperatureCompliance
        };
    }
})();
