(function () {
    /**
     * ===============================================
     * CALCULATION ENGINE - ERROR HANDLING
     * Industry-Standard Transformer Design Calculator
     * ===============================================
     */

    /**
     * Base error class for calculation errors
     */
    class CalculationError extends Error {
        constructor(message, code, details = {}) {
            super(message);
            this.name = 'CalculationError';
            this.code = code;
            this.details = details;
            this.timestamp = new Date().toISOString();
        }

        toJSON() {
            return {
                name: this.name,
                message: this.message,
                code: this.code,
                details: this.details,
                timestamp: this.timestamp
            };
        }
    }

    /**
     * Validation error - thrown when input validation fails
     */
    class ValidationError extends CalculationError {
        constructor(message, field, value, constraints = {}) {
            super(message, 'VALIDATION_ERROR', {
                field,
                value,
                constraints
            });
            this.name = 'ValidationError';
        }
    }

    /**
     * Calculation error - thrown when calculation logic fails
     */
    class ComputationError extends CalculationError {
        constructor(message, module, operation, inputs = {}) {
            super(message, 'COMPUTATION_ERROR', {
                module,
                operation,
                inputs
            });
            this.name = 'ComputationError';
        }
    }

    /**
     * Range error - thrown when calculated values are out of acceptable range
     */
    class RangeError extends CalculationError {
        constructor(message, parameter, value, range) {
            super(message, 'RANGE_ERROR', {
                parameter,
                value,
                range
            });
            this.name = 'RangeError';
        }
    }

    /**
     * Standards compliance error - thrown when design doesn't meet standards
     */
    class ComplianceError extends CalculationError {
        constructor(message, standard, requirement, actualValue) {
            super(message, 'COMPLIANCE_ERROR', {
                standard,
                requirement,
                actualValue
            });
            this.name = 'ComplianceError';
        }
    }

    // Export for use in modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CalculationError,
            ValidationError,
            ComputationError,
            RangeError,
            ComplianceError
        };
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CalculationErrors = {
            CalculationError,
            ValidationError,
            ComputationError,
            RangeError,
            ComplianceError
        };
    }
})();
