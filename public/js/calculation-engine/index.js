(function () {
    /**
     * ===============================================
     * CALCULATION ENGINE - PUBLIC API
     * Industry-Standard Transformer Design Calculator
     * Main entry point for the calculation engine
     * ===============================================
     */

    // Import orchestrator
    const { performCompleteDesign, performQuickCalculation } = (typeof window !== 'undefined'
        ? window.CalculationEngine
        : require('./orchestrator.js')) || {};

    /**
     * Public API for transformer design calculations
     */
    const TransformerCalculator = {
        /**
         * Version information
         */
        version: '2.0.0',
        name: 'Industry-Standard Transformer Design Calculator',
        standards: ['IEC 60076', 'IEEE C57.12', 'IS 2026'],

        /**
         * Perform complete transformer design calculation
         * 
         * @param {Object} inputs - Transformer specifications
         * @returns {Object} Complete design results
         * 
         * @example
         * const results = TransformerCalculator.calculate({
         *     mva: 160,
         *     hv: 220,
         *     lv: 66,
         *     frequency: 50,
         *     phases: 3,
         *     vectorGroup: 'Dyn11',
         *     cooling: 'ONAN',
         *     coreMaterial: 'CRGO',
         *     windingMaterial: 'Copper',
         *     fluxDensity: 1.65,
         *     voltsPerTurn: 60,
         *     impedance: 12.5,
         *     currentDensity: 2.5
         * });
         */
        calculate(inputs) {
            return performCompleteDesign(inputs);
        },

        /**
         * Perform quick calculation (currents and core design only)
         * Useful for validation or preview
         * 
         * @param {Object} inputs - Transformer specifications
         * @returns {Object} Basic calculation results
         */
        quickCalculate(inputs) {
            return performQuickCalculation(inputs);
        },

        /**
         * Get default input values
         * 
         * @param {number} mva - MVA rating
         * @returns {Object} Default inputs for given MVA
         */
        getDefaults(mva = 160) {
            return {
                mva: mva,
                hv: 220,
                lv: 66,
                frequency: 50,
                phases: 3,
                vectorGroup: 'Dyn11',
                cooling: 'ONAN',
                coreMaterial: 'CRGO',
                windingMaterial: 'Copper',
                fluxDensity: 1.65,
                voltsPerTurn: 60,
                impedance: 12.5,
                currentDensity: 2.5,
                tapChangerType: 'NONE',
                tappingRange: 10,
                ambientTemp: 50,
                altitude: 1000
            };
        },

        /**
         * Validate inputs without performing calculation
         * 
         * @param {Object} inputs - Inputs to validate
         * @returns {Object} Validation result
         */
        validateInputs(inputs) {
            try {
                const { validateInputs } = typeof window !== 'undefined'
                    ? window.InputValidator
                    : require('./core/validator.js');

                const validated = validateInputs(inputs);
                return {
                    valid: true,
                    inputs: validated
                };
            } catch (error) {
                return {
                    valid: false,
                    error: error.message,
                    details: error.details
                };
            }
        },

        /**
         * Get information about the calculation engine
         */
        getInfo() {
            return {
                version: this.version,
                name: this.name,
                standards: this.standards,
                modules: [
                    'Module 1: Current Calculations (IEC 60076-1)',
                    'Module 2: Core Design (IEC 60076)',
                    'Module 3: Winding Design',
                    'Module 4: Conductor Sizing (IEEE C57.12.90)',
                    'Module 5: Loss Calculations (IEC 60076-1)',
                    'Module 6: Dimensional Calculations'
                ],
                features: [
                    'Industry-standard formulas',
                    'Comprehensive validation',
                    'IEC/IEEE compliance checking',
                    'Modular architecture',
                    'Detailed error handling'
                ]
            };
        }
    };

    // Export for use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TransformerCalculator;
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.TransformerCalculator = TransformerCalculator;
    }

    // Log initialization
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Transformer Design Calculator v${TransformerCalculator.version}              ║
║  Industry-Standard Calculation Engine                    ║
║  Standards: IEC 60076, IEEE C57, IS 2026                 ║
╚═══════════════════════════════════════════════════════════╝
`);
})();
