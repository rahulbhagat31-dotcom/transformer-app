/**
 * =====================================================
 * ENGINE CORE UNIT TESTS
 * Tests for calculation-engine/core/utils.js and
 * calculation-engine/core/validator.js
 *
 * Uses Node.js built-in assert — no extra dependencies.
 * Run with: npm run test:engine
 * =====================================================
 */

'use strict';

const assert = require('assert');

// Note: engine IIFE files check `typeof window !== 'undefined'`.
// In Node (no window defined) they take the module.exports branch — correct.
// Do NOT set global.window here or they will try to read unset window.* globals.

// Load engine core modules (Node require path)
const Utils = require('../../public/js/calculation-engine/core/utils.js');
const { validateInputs, validateField, validateCrossFields, VALIDATION_RULES } = require('../../public/js/calculation-engine/core/validator.js');

// ─── Test helpers ────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`  ✅ ${description}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ ${description}`);
        console.error(`     → ${err.message}`);
        failed++;
    }
}

function describe(group, fn) {
    console.log(`\n📦 ${group}`);
    fn();
}

// ─── Valid input fixture ─────────────────────────────
function validInputs() {
    return {
        mva: 20,
        frequency: 50,
        phases: 3,
        hv: 33,
        lv: 11,
        vectorGroup: 'Dyn11',
        cooling: 'ONAN',
        coreMaterial: 'CRGO',
        windingMaterial: 'Copper',
        fluxDensity: 1.65,
        voltsPerTurn: 80,
        impedance: 6,
        currentDensity: 3.0
    };
}

// ═══════════════════════════════════════════════════
//  GROUP 1: Math Utilities
// ═══════════════════════════════════════════════════
describe('Utils — Math', () => {
    test('round: rounds to 2 decimal places', () => {
        assert.strictEqual(Utils.round(3.14159, 2), 3.14);
    });

    test('round: rounds to 0 decimal places', () => {
        assert.strictEqual(Utils.round(4.7, 0), 5);
    });

    test('clamp: clamps above max', () => {
        assert.strictEqual(Utils.clamp(200, 0, 100), 100);
    });

    test('clamp: clamps below min', () => {
        assert.strictEqual(Utils.clamp(-5, 0, 100), 0);
    });

    test('clamp: leaves value in range unchanged', () => {
        assert.strictEqual(Utils.clamp(50, 0, 100), 50);
    });

    test('lerp: interpolates midpoint correctly', () => {
        assert.strictEqual(Utils.lerp(0, 100, 0.5), 50);
    });

    test('lerp: returns start when t=0', () => {
        assert.strictEqual(Utils.lerp(10, 50, 0), 10);
    });

    test('lerp: returns end when t=1', () => {
        assert.strictEqual(Utils.lerp(10, 50, 1), 50);
    });

    test('withinTolerance: value within 5% tolerance', () => {
        assert.strictEqual(Utils.withinTolerance(104, 100, 5), true);
    });

    test('withinTolerance: value outside 5% tolerance', () => {
        assert.strictEqual(Utils.withinTolerance(110, 100, 5), false);
    });

    test('percentDifference: returns correct signed %', () => {
        assert.strictEqual(Utils.round(Utils.percentDifference(110, 100), 1), 10);
    });

    test('deepClone: produces independent copy', () => {
        const original = { a: 1, b: { c: 2 } };
        const clone = Utils.deepClone(original);
        clone.b.c = 99;
        assert.strictEqual(original.b.c, 2); // original unchanged
    });
});

// ═══════════════════════════════════════════════════
//  GROUP 2: Physics Utilities
// ═══════════════════════════════════════════════════
describe('Utils — Physics', () => {
    test('resistanceAtTemp: copper resistance increases with temp', () => {
        const r20 = 1.0;
        const r75 = Utils.resistanceAtTemp(r20, 75, 'Copper');
        assert.ok(r75 > r20, `Expected r75 (${r75}) > r20 (${r20})`);
    });

    test('resistanceAtTemp: same temp returns same resistance', () => {
        assert.strictEqual(Utils.resistanceAtTemp(1.0, 20, 'Copper'), 1.0);
    });

    test('resistanceAtTemp: throws for unknown material', () => {
        assert.throws(
            () => Utils.resistanceAtTemp(1.0, 75, 'Unobtanium'),
            /Unknown material/
        );
    });

    test('skinEffectFactor: returns factor > 1 for typical HV conductor', () => {
        // HV conductor: ~3mm thickness at 50Hz
        const factor = Utils.skinEffectFactor(0.003, 50, 'Copper');
        assert.ok(factor > 1.0, `Expected factor > 1.0, got ${factor}`);
    });

    test('efficiency: 20 MVA transformer has > 98% efficiency', () => {
        const eff = Utils.efficiency(20, 100); // 100 kW total loss
        assert.ok(eff > 98, `Expected efficiency > 98%, got ${eff}%`);
    });

    test('shortCircuitCurrent: 6% impedance gives 16.67x rated', () => {
        const ratedCurrent = 1000;
        const isc = Utils.shortCircuitCurrent(ratedCurrent, 6);
        assert.ok(Math.abs(isc - 16666.67) < 1, `Expected ~16667 A, got ${isc}`);
    });

    test('meanTurnLength: uses π × mean diameter', () => {
        const mtl = Utils.meanTurnLength(0.5, 0.7); // inner, outer in meters
        const expected = Math.PI * 0.6;
        assert.ok(Math.abs(mtl - expected) < 0.001);
    });
});

// ═══════════════════════════════════════════════════
//  GROUP 3: Core Loss (IEC 60076-1)
// ═══════════════════════════════════════════════════
describe('Utils — coreLoss (IEC 60076-1)', () => {
    test('coreLoss: returns object with total, hysteresis, eddy fields', () => {
        const result = Utils.coreLoss(10000, 50, 1.65, 'CRGO', 'M4');
        assert.ok(typeof result.total === 'number', 'total must be number');
        assert.ok(typeof result.hysteresis === 'number', 'hysteresis must be number');
        assert.ok(typeof result.eddy === 'number', 'eddy must be number');
    });

    test('coreLoss: total = hysteresis + eddy (within rounding)', () => {
        const result = Utils.coreLoss(10000, 50, 1.65, 'CRGO', 'M4');
        const sum = Utils.round(result.hysteresis + result.eddy, 4);
        const total = Utils.round(result.total, 4);
        assert.strictEqual(sum, total);
    });

    test('coreLoss: all values > 0 for valid inputs', () => {
        const result = Utils.coreLoss(10000, 50, 1.65, 'CRGO', 'M4');
        assert.ok(result.total > 0, 'total should be positive');
        assert.ok(result.hysteresis > 0, 'hysteresis should be positive');
        assert.ok(result.eddy > 0, 'eddy should be positive');
    });

    test('coreLoss: throws for unknown material', () => {
        assert.throws(
            () => Utils.coreLoss(10000, 50, 1.65, 'UNOBTANIUM'),
            /Unknown core material/
        );
    });

    test('coreLoss: higher flux density → higher losses', () => {
        const low = Utils.coreLoss(10000, 50, 1.5, 'CRGO', 'M4');
        const high = Utils.coreLoss(10000, 50, 1.7, 'CRGO', 'M4');
        assert.ok(high.total > low.total, 'Higher flux density should raise losses');
    });
});

// ═══════════════════════════════════════════════════
//  GROUP 4: Input Validator
// ═══════════════════════════════════════════════════
describe('Validator — Valid inputs', () => {
    test('validateInputs: accepts complete valid 20 MVA dataset', () => {
        const result = validateInputs(validInputs());
        assert.strictEqual(result.mva, 20);
        assert.strictEqual(result.coreMaterial, 'CRGO');
    });

    test('validateInputs: fills optional fields with defaults', () => {
        const result = validateInputs(validInputs());
        // tapChangerType is optional with default 'NONE'
        assert.strictEqual(result.tapChangerType, 'NONE');
    });

    test('validateField: accepts valid mva value', () => {
        const result = validateField('mva', 20, VALIDATION_RULES.mva);
        assert.strictEqual(result, 20);
    });

    test('validateField: coerces string number to float', () => {
        const result = validateField('mva', '20.5', VALIDATION_RULES.mva);
        assert.strictEqual(result, 20.5);
    });
});

describe('Validator — Required field errors', () => {
    test('validateInputs: throws when MVA is missing', () => {
        const inputs = validInputs();
        delete inputs.mva;
        assert.throws(
            () => validateInputs(inputs),
            /mva|required/i
        );
    });

    test('validateInputs: throws for invalid vectorGroup', () => {
        const inputs = validInputs();
        inputs.vectorGroup = 'Dyn99';
        assert.throws(
            () => validateInputs(inputs),
            /vector|allowed/i
        );
    });
});

describe('Validator — Range errors', () => {
    test('validateField: throws when MVA < 0.01', () => {
        assert.throws(
            () => validateField('mva', 0, VALIDATION_RULES.mva),
            /at least/
        );
    });

    test('validateField: throws when MVA > 1000', () => {
        assert.throws(
            () => validateField('mva', 2000, VALIDATION_RULES.mva),
            /at most/
        );
    });

    test('validateField: throws for non-numeric mva', () => {
        assert.throws(
            () => validateField('mva', 'not-a-number', VALIDATION_RULES.mva),
            /valid number/
        );
    });
});

describe('Validator — Cross-field rules', () => {
    test('validateCrossFields: throws when HV <= LV', () => {
        const inputs = { ...validInputs(), hv: 11, lv: 11, mva: 20 };
        assert.throws(
            () => validateCrossFields(inputs),
            /High voltage must be greater/
        );
    });

    test('validateCrossFields: throws when voltage ratio > 100', () => {
        const inputs = { ...validInputs(), hv: 500, lv: 0.4, mva: 20 };
        assert.throws(
            () => validateCrossFields(inputs),
            /ratio.*too high/i
        );
    });

    test('validateCrossFields: passes for valid HV > LV', () => {
        const inputs = validInputs();
        const result = validateCrossFields(inputs);
        assert.strictEqual(result, true);
    });
});

// ═══════════════════════════════════════════════════
//  SUMMARY
// ═══════════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('❌ Some engine tests FAILED');
    process.exit(1);
} else {
    console.log('🏆 ALL ENGINE CORE TESTS PASSED');
}
