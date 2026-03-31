const TransformerCalculator = require('./index.js');

// Mock window for compatibility if needed (though modules utilize checks)
if (typeof window === 'undefined') {
    global.window = {};
}

// 1. Setup Input Data (20 MVA Standard Design)
console.log('🏗️ Setting up test inputs...');
const inputs = TransformerCalculator.getDefaults(20);
inputs.coreMaterial = 'CRGO';
inputs.windingMaterial = 'Copper';

// 2. Run Calculation
console.log('🚀 Running calculation...');
const results = TransformerCalculator.calculate(inputs);

if (!results.success) {
    console.error('❌ Calculation Failed:', results.errors);
    process.exit(1);
}

// 3. Inspect Results (Accuracy Verification)
const losses = results.calculations.losses;
const coreDetails = losses.details.coreWeightDetails;
const conductors = results.calculations.conductors;

console.log('\n--- ACCURACY RESTORATION VERIFICATION ---');
console.log(`Methodology: ${losses.methodology}`);

console.log('\n[CHECK 1: Core Weight Accuracy]');
if (coreDetails && coreDetails.methodology === 'Limb-Yoke-Corner') {
    console.log('✅ PASS: Limb-Yoke-Corner method is active.');
    console.log(`   - Limb Weight: ${coreDetails.limbWeight} kg`);
    console.log(`   - Yoke Weight: ${coreDetails.yokeWeight} kg`);
    console.log(`   - Corner Weight: ${coreDetails.cornerWeight} kg`);
    console.log(`   - Total Weight: ${coreDetails.totalWeight} kg`);
} else {
    console.error('❌ FAIL: Core weight methodology mismatch or details missing.');
    console.log('Details:', coreDetails);
}

console.log('\n[CHECK 2: AC Resistance (Skin/Proximity)]');
const hvFactor = conductors.hv.skinEffectFactor;
const lvFactor = conductors.lv.skinEffectFactor;
// Industry standard factors should be > 1.0
if (parseFloat(hvFactor) > 1.0 && parseFloat(lvFactor) > 1.0) {
    console.log(`✅ PASS: AC Resistance Factors active (HV: ${hvFactor}, LV: ${lvFactor})`);
} else {
    console.error(`❌ FAIL: AC Factors look like DC (1.0). HV: ${hvFactor}, LV: ${lvFactor}`);
}

console.log('\n[CHECK 3: Detailed Loss Breakdown]');
const eddy = losses.eddyLoss;
const stray = losses.strayLoss;
// Standard loss calc should produce > 0 eddy and stray losses
if (eddy > 0 && stray > 0 && losses.breakdown.tank > 0) {
    console.log('✅ PASS: Detailed loss components present.');
    console.log(`   - Eddy Loss: ${eddy} kW`);
    console.log(`   - Stray Loss: ${stray} kW`);
    console.log(`   - Tank Loss: ${losses.breakdown.tank} kW`);
} else {
    console.error('❌ FAIL: Detailed losses missing or zero.');
}

console.log('\n-----------------------------------------');
const overallPass = (coreDetails?.methodology === 'Limb-Yoke-Corner') &&
    (parseFloat(hvFactor) > 1.0) &&
    (eddy > 0);

if (overallPass) {
    console.log('🏆 OVERALL STATUS: ACCURACY RESTORED SUCCESSFULLY');
} else {
    console.log('⚠️ OVERALL STATUS: VERIFICATION FAILED');
    process.exit(1);
}
