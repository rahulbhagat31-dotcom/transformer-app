/**
 * ================================================
 * CALCULATOR ENHANCEMENTS
 * Inline Validation & Save/Load Design Sets
 * ================================================
 */

// ─── INLINE VALIDATION ───────────────────────────────────────────────────────

const VALIDATION_RULES = {
    fluxDensity: {
        min: 1.3, max: 1.8,
        unit: 'T',
        standard: 'IEC 60076-1',
        message: (v) => v < 1.3
            ? `⚠️ Flux density ${v}T is below typical minimum (1.3T). Risk of under-utilised core.`
            : `⚠️ Flux density ${v}T exceeds recommended maximum (1.8T). Risk of saturation.`
    },
    currentDensity: {
        min: 1.5, max: 4.0,
        unit: 'A/mm²',
        standard: 'IEC 60076-1',
        message: (v) => v < 1.5
            ? `⚠️ Current density ${v} A/mm² is low. Winding may be oversized.`
            : `⚠️ Current density ${v} A/mm² exceeds recommended maximum (4.0 A/mm²). Risk of overheating.`
    },
    impedance: {
        min: 4, max: 20,
        unit: '%',
        standard: 'IEC 60076-1',
        message: (v) => v < 4
            ? `⚠️ Impedance ${v}% is below typical minimum (4%). High fault current risk.`
            : `⚠️ Impedance ${v}% exceeds typical maximum (20%). May cause excessive voltage drop.`
    }
};

/**
 * Validate a field and show/hide its warning div.
 * @param {HTMLInputElement} input - The input element
 * @param {string} ruleKey - Key in VALIDATION_RULES
 */
window.validateField = function (input, ruleKey) {
    const rule = VALIDATION_RULES[ruleKey];
    if (!rule) return;

    const warningId = ruleKey + '-warning';
    const warningDiv = document.getElementById(warningId);
    const value = parseFloat(input.value);

    if (!warningDiv) return;

    if (isNaN(value) || (value >= rule.min && value <= rule.max)) {
        warningDiv.style.display = 'none';
        input.style.borderColor = '';
    } else {
        warningDiv.textContent = rule.message(value) + ` (${rule.standard})`;
        warningDiv.style.display = 'block';
        input.style.borderColor = '#e67e22';
    }
};

// Convenience wrappers called from HTML oninput attributes
window.validateFluxDensity = (el) => window.validateField(el, 'fluxDensity');
window.validateCurrentDensity = (el) => window.validateField(el, 'currentDensity');
window.validateImpedance = (el) => window.validateField(el, 'impedance');


// ─── SAVE / LOAD DESIGN SETS ─────────────────────────────────────────────────

const DESIGN_SETS_KEY = 'calculatorDesignSets';
const MAX_DESIGN_SETS = 20;

/** Collect all calculator input values into a plain object */
function collectInputs() {
    const inputs = {};
    document.querySelectorAll('input[type="number"], input[type="text"], select').forEach(el => {
        if (el.id) inputs[el.id] = el.value;
    });
    return inputs;
}

/** Apply a saved input object back to the form */
function applyInputs(inputs) {
    Object.entries(inputs).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            // Trigger validation if applicable
            if (el.oninput) el.oninput.call(el);
        }
    });
}

/** Save current inputs as a named design set */
window.saveDesignSet = function () {
    const name = prompt('Name for this design set:', 'Design ' + new Date().toLocaleDateString());
    if (!name) return;

    const sets = JSON.parse(localStorage.getItem(DESIGN_SETS_KEY) || '[]');
    if (sets.length >= MAX_DESIGN_SETS) sets.shift(); // drop oldest

    sets.push({
        name,
        savedAt: new Date().toISOString(),
        inputs: collectInputs()
    });

    localStorage.setItem(DESIGN_SETS_KEY, JSON.stringify(sets));
    alert(`✅ Design set "${name}" saved (${sets.length}/${MAX_DESIGN_SETS} slots used).`);
};

/** Show a list of saved design sets and load the selected one */
window.loadDesignSet = function () {
    const sets = JSON.parse(localStorage.getItem(DESIGN_SETS_KEY) || '[]');
    if (sets.length === 0) {
        alert('No saved design sets found. Use 💾 to save one first.');
        return;
    }

    const list = sets.map((s, i) =>
        `${i + 1}. ${s.name}  (saved ${new Date(s.savedAt).toLocaleString()})`
    ).join('\n');

    const choice = prompt(`Select a design set to load (1–${sets.length}):\n\n${list}`);
    const idx = parseInt(choice, 10) - 1;

    if (isNaN(idx) || idx < 0 || idx >= sets.length) {
        if (choice !== null) alert('Invalid selection.');
        return;
    }

    applyInputs(sets[idx].inputs);
    alert(`✅ Loaded design set "${sets[idx].name}".`);
};
