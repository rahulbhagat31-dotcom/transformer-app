/**
 * ================================================
 * CALCULATOR INPUT VALIDATION
 * Real-time validation with visual feedback
 * ================================================
 */

// Validation rules for each input field
const VALIDATION_RULES = {
    mva: {
        min: 0.1,
        max: 500,
        recommended: { min: 1, max: 400 },
        unit: 'MVA',
        tooltip: 'Transformer rating in Mega Volt-Amperes. Typical range: 1-400 MVA for power transformers.'
    },
    hv: {
        min: 1,
        max: 765,
        recommended: { min: 11, max: 400 },
        unit: 'kV',
        tooltip: 'High Voltage side in kiloVolts. Must be greater than LV. Common: 11, 33, 66, 132, 220, 400 kV.'
    },
    lv: {
        min: 0.4,
        max: 400,
        recommended: { min: 0.4, max: 132 },
        unit: 'kV',
        tooltip: 'Low Voltage side in kiloVolts. Must be less than HV. Common: 0.4, 11, 33, 66, 132 kV.'
    },
    frequency: {
        min: 50,
        max: 60,
        recommended: { min: 50, max: 60 },
        unit: 'Hz',
        tooltip: 'System frequency. Standard: 50 Hz (Europe/Asia) or 60 Hz (Americas).'
    },
    fluxDensity: {
        min: 1.3,
        max: 1.8,
        recommended: { min: 1.6, max: 1.75 },
        unit: 'Tesla',
        tooltip: 'Core flux density. IEC 60076: 1.3-1.8T for CRGO steel. Higher = smaller core, higher losses.'
    },
    voltsPerTurn: {
        min: 5,
        max: 150,
        recommended: { min: 10, max: 100 },
        unit: 'V/turn',
        tooltip: 'EMF per turn. Affects core size and number of turns. Higher = larger core, fewer turns.'
    },
    impedance: {
        min: 4,
        max: 20,
        recommended: { min: 8, max: 15 },
        unit: '%',
        tooltip: 'Percentage impedance at rated load. IEC 60076: 4-20%. Affects short-circuit current and regulation.'
    },
    currentDensity: {
        min: 1.5,
        max: 3.5,
        recommended: { min: 2.2, max: 2.8 },
        unit: 'A/mm²',
        tooltip: 'Current density in conductors. Copper: 2.2-3.0 A/mm². Higher = smaller conductor, higher losses.'
    },
    ambientTemp: {
        min: -20,
        max: 60,
        recommended: { min: 30, max: 50 },
        unit: '°C',
        tooltip: 'Maximum ambient temperature. IEC 60076: 40°C standard, 50°C for tropical.'
    },
    altitude: {
        min: 0,
        max: 5000,
        recommended: { min: 0, max: 1000 },
        unit: 'm',
        tooltip: 'Installation altitude above sea level. >1000m requires derating per IEC 60076-2.'
    }
};

/**
 * Validate a single input field
 */
function validateInput(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const value = parseFloat(input.value);
    const rules = VALIDATION_RULES[fieldId];

    if (!rules) return;

    // Remove existing validation classes
    input.classList.remove('valid', 'invalid', 'warning');

    // Get or create validation icon
    let icon = input.parentElement.querySelector('.validation-icon');
    if (!icon) {
        icon = document.createElement('span');
        icon.className = 'validation-icon';
        input.parentElement.appendChild(icon);
    }

    // Get or create validation message
    let message = input.parentElement.querySelector('.validation-message');
    if (!message) {
        message = document.createElement('div');
        message.className = 'validation-message';
        input.parentElement.appendChild(message);
    }

    // Validate
    if (isNaN(value) || value === '') {
        // Empty or invalid
        icon.classList.remove('show');
        message.classList.remove('show');
        return;
    }

    if (value < rules.min || value > rules.max) {
        // Out of absolute range
        input.classList.add('invalid');
        icon.className = 'validation-icon error show';
        icon.textContent = '❌';
        message.className = 'validation-message error show';
        message.textContent = `Must be between ${rules.min} and ${rules.max} ${rules.unit}`;
    } else if (value < rules.recommended.min || value > rules.recommended.max) {
        // Outside recommended range
        input.classList.add('warning');
        icon.className = 'validation-icon warn show';
        icon.textContent = '⚠️';
        message.className = 'validation-message warning show';
        message.textContent = `Recommended: ${rules.recommended.min}-${rules.recommended.max} ${rules.unit}`;
    } else {
        // Valid
        input.classList.add('valid');
        icon.className = 'validation-icon success show';
        icon.textContent = '✓';
        message.classList.remove('show');
    }
}

/**
 * Validate all inputs
 */
function validateAllInputs() {
    Object.keys(VALIDATION_RULES).forEach(fieldId => {
        validateInput(fieldId);
    });
}

/**
 * Add validation listeners to all inputs
 */
function initializeValidation() {
    Object.keys(VALIDATION_RULES).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            // Validate on input
            input.addEventListener('input', () => validateInput(fieldId));

            // Validate on blur
            input.addEventListener('blur', () => validateInput(fieldId));
        }
    });

    console.log('✅ Input validation initialized');
}

/**
 * Cross-field validation (HV > LV)
 */
function validateVoltageRatio() {
    const hvInput = document.getElementById('hv');
    const lvInput = document.getElementById('lv');

    if (!hvInput || !lvInput) return;

    const hv = parseFloat(hvInput.value);
    const lv = parseFloat(lvInput.value);

    if (isNaN(hv) || isNaN(lv)) return;

    if (hv <= lv) {
        // Show error on both
        hvInput.classList.add('invalid');
        lvInput.classList.add('invalid');

        showToast('⚠️ HV voltage must be greater than LV voltage', 'warning');
    }
}

// Initialize validation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeValidation);
} else {
    initializeValidation();
}

console.log('📊 Calculator validation loaded');

// Export for external use
window.validateAllInputs = validateAllInputs;
window.validateVoltageRatio = validateVoltageRatio;
