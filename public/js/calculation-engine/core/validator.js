(function () {
    /**
     * ===============================================
     * CALCULATION ENGINE - INPUT VALIDATOR
     * Industry-Standard Transformer Design Calculator
     * IEC 60076 / IEEE C57 / IS 2026 Compliant
     * ===============================================
     */

    // Import errors (will work in both browser and Node.js)
    const { ValidationError, RangeError } = typeof window !== 'undefined'
        ? window.CalculationErrors
        : require('./errors.js');

    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('./constants.js');

    /**
     * Validation rules for transformer inputs
     */
    const VALIDATION_RULES = {
        mva: {
            min: 0.01,
            max: 1000,
            type: 'number',
            required: true,
            description: 'Transformer MVA rating'
        },
        frequency: {
            min: 50,
            max: 60,
            type: 'number',
            required: true,
            allowedValues: [50, 60],
            description: 'System frequency (Hz)'
        },
        phases: {
            min: 1,
            max: 3,
            type: 'number',
            required: true,
            allowedValues: [1, 3],
            description: 'Number of phases'
        },
        hv: {
            min: 0.4,
            max: 765,
            type: 'number',
            required: true,
            description: 'High voltage (kV)'
        },
        lv: {
            min: 0.4,
            max: 765,
            type: 'number',
            required: true,
            description: 'Low voltage (kV)'
        },
        vectorGroup: {
            type: 'string',
            required: true,
            allowedValues: ['Dyn11', 'Yyn0', 'Yd11', 'Dd0', 'Yz11', 'YNyn0', 'Dyn1'],
            description: 'Vector group'
        },
        cooling: {
            type: 'string',
            required: true,
            allowedValues: ['ONAN', 'ONAF', 'OFAF', 'OFWF', 'ONAN/ONAF'],
            description: 'Cooling method'
        },
        coreMaterial: {
            type: 'string',
            required: true,
            allowedValues: ['CRGO', 'CRNGO'],
            description: 'Core material'
        },
        windingMaterial: {
            type: 'string',
            required: true,
            allowedValues: ['Copper', 'Aluminum'],
            description: 'Winding material'
        },
        fluxDensity: {
            min: CONSTANTS.DESIGN_RANGES.fluxDensity.min,
            max: CONSTANTS.DESIGN_RANGES.fluxDensity.max,
            type: 'number',
            required: true,
            description: 'Core flux density (Tesla)'
        },
        voltsPerTurn: {
            min: CONSTANTS.DESIGN_RANGES.voltsPerTurn.min,
            max: CONSTANTS.DESIGN_RANGES.voltsPerTurn.max,
            type: 'number',
            required: true,
            description: 'Volts per turn'
        },
        impedance: {
            min: CONSTANTS.DESIGN_RANGES.impedance.min,
            max: CONSTANTS.DESIGN_RANGES.impedance.max,
            type: 'number',
            required: true,
            description: 'Impedance (%)'
        },
        currentDensity: {
            min: CONSTANTS.DESIGN_RANGES.currentDensity.min,
            max: CONSTANTS.DESIGN_RANGES.currentDensity.max,
            type: 'number',
            required: true,
            description: 'Current density (A/mm²)'
        },
        tapChangerType: {
            type: 'string',
            required: false,
            allowedValues: ['NONE', 'OLTC', 'DETC', 'OCTC'],
            default: 'NONE',
            description: 'Tap changer type'
        },
        tappingRange: {
            min: 5,
            max: 20,
            type: 'number',
            required: false,
            allowedValues: [5, 10, 15, 20],
            default: 10,
            description: 'Tapping range (%)'
        },
        ambientTemp: {
            min: -40,
            max: 60,
            type: 'number',
            required: false,
            default: 50,
            description: 'Ambient temperature (°C)'
        },
        altitude: {
            min: 0,
            max: 5000,
            type: 'number',
            required: false,
            default: 1000,
            description: 'Installation altitude (m)'
        }
    };

    /**
     * Validate a single input field
     */
    function validateField(fieldName, value, rules) {
        // Check if field is required
        if (rules.required && (value === null || value === undefined || value === '')) {
            throw new ValidationError(
                `${rules.description} is required`,
                fieldName,
                value,
                { required: true }
            );
        }

        // If not required and no value, use default
        if (!rules.required && (value === null || value === undefined || value === '')) {
            return rules.default;
        }

        // Type validation
        if (rules.type === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                throw new ValidationError(
                    `${rules.description} must be a valid number`,
                    fieldName,
                    value,
                    { type: 'number' }
                );
            }
            value = numValue;
        }

        // Range validation
        if (rules.min !== undefined && value < rules.min) {
            throw new ValidationError(
                `${rules.description} must be at least ${rules.min}`,
                fieldName,
                value,
                { min: rules.min }
            );
        }

        if (rules.max !== undefined && value > rules.max) {
            throw new ValidationError(
                `${rules.description} must be at most ${rules.max}`,
                fieldName,
                value,
                { max: rules.max }
            );
        }

        // Allowed values validation
        if (rules.allowedValues && !rules.allowedValues.includes(value)) {
            throw new ValidationError(
                `${rules.description} must be one of: ${rules.allowedValues.join(', ')}`,
                fieldName,
                value,
                { allowedValues: rules.allowedValues }
            );
        }

        return value;
    }

    /**
     * Validate all transformer inputs
     */
    function validateInputs(inputs) {
        const validated = {};
        const errors = [];

        // Validate each field
        for (const [fieldName, rules] of Object.entries(VALIDATION_RULES)) {
            try {
                validated[fieldName] = validateField(fieldName, inputs[fieldName], rules);
            } catch (error) {
                if (error instanceof ValidationError) {
                    errors.push(error);
                } else {
                    throw error;
                }
            }
        }

        // If there are validation errors, throw with all errors
        if (errors.length > 0) {
            const errorMessages = errors.map(e => e.message).join('; ');
            throw new ValidationError(
                `Input validation failed: ${errorMessages}`,
                'multiple',
                null,
                { errors: errors.map(e => e.toJSON()) }
            );
        }

        // Cross-field validations
        validateCrossFields(validated);

        return validated;
    }

    /**
     * Validate relationships between fields
     */
    function validateCrossFields(inputs) {
        // HV must be greater than LV
        if (inputs.hv <= inputs.lv) {
            throw new ValidationError(
                'High voltage must be greater than low voltage',
                'hv',
                inputs.hv,
                { comparison: 'hv > lv', lv: inputs.lv }
            );
        }

        // Voltage ratio should be reasonable
        const voltageRatio = inputs.hv / inputs.lv;
        if (voltageRatio > 100) {
            throw new ValidationError(
                'Voltage ratio is too high (> 100:1)',
                'voltageRatio',
                voltageRatio,
                { max: 100 }
            );
        }

        // MVA and voltage combination check
        const hvCurrent = (inputs.mva * 1e6) / (CONSTANTS.SQRT_3 * inputs.hv * 1000);
        if (hvCurrent > 50000) {
            throw new ValidationError(
                'Calculated HV current is too high (> 50,000 A)',
                'hvCurrent',
                hvCurrent,
                { max: 50000, mva: inputs.mva, hv: inputs.hv }
            );
        }

        // Frequency and flux density relationship
        if (inputs.frequency === 60 && inputs.fluxDensity > 1.7) {
            console.warn('⚠️ High flux density for 60 Hz may cause excessive core losses');
        }

        return true;
    }

    /**
     * Validate calculation results
     */
    function validateResults(results, module) {
        const errors = [];

        // Check for NaN values
        function checkForNaN(obj, path = '') {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;

                if (typeof value === 'number' && isNaN(value)) {
                    errors.push({
                        path: currentPath,
                        value: value,
                        error: 'NaN value detected'
                    });
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    checkForNaN(value, currentPath);
                }
            }
        }

        checkForNaN(results);

        if (errors.length > 0) {
            throw new ValidationError(
                `Invalid calculation results in ${module}: ${errors.length} NaN values detected`,
                module,
                null,
                { errors }
            );
        }

        return true;
    }

    /**
     * Validate that a value is within acceptable range
     */
    function validateRange(value, min, max, parameter, unit = '') {
        if (value < min || value > max) {
            throw new RangeError(
                `${parameter} (${value}${unit}) is outside acceptable range`,
                parameter,
                value,
                { min, max, unit }
            );
        }
        return true;
    }

    // Export for use in modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            validateInputs,
            validateField,
            validateCrossFields,
            validateResults,
            validateRange,
            VALIDATION_RULES
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.InputValidator = {
            validateInputs,
            validateField,
            validateCrossFields,
            validateResults,
            validateRange,
            VALIDATION_RULES
        };
    }
})();
