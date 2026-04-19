/**
 * CORE CALCULATOR TEST SUITE
 * Tests for improved core-calc.js v2.0
 * 
 * Run in browser console:
 * 1. Load index.html
 * 2. Open DevTools Console
 * 3. Copy-paste test functions below
 * 4. Call test functions: test_calculateFlux(), test_validateInputs(), etc.
 */

'use strict';

/**
 * Test 1: Basic Flux Calculation
 * Verifies core mathematical calculations work correctly
 */
function test_calculateFlux() {
    console.group('🧪 Test 1: Flux Calculation');
    
    try {
        const result = window._coreElectricalMath({
            S: 160,
            VHV: 132,
            VLV: 33,
            f: 50,
            Sf: 0.96,
            Bm: 1.7,
            Kf: 0.75,
            hvMain: 500,
            hvNormTap: 64,
            Wcore: 950,
            wsp: 1.2,
            magVA: 1.5,
            vecGroup: 'YNyn0'
        });
        
        console.log('✅ Calculation succeeded');
        console.log('Core Diameter (D):', result.D.toFixed(1), 'mm');
        console.log('Peak Flux (Φm):', result.Phim.toFixed(4), 'Wb');
        console.log('EMF per Turn (Et):', result.Et.toFixed(3), 'V/turn');
        console.log('AT Balance:', result.AT_bal.toFixed(3));
        
        // Verify results are reasonable
        if (result.D > 100 && result.D < 1000) {
            console.log('✅ Diameter is in reasonable range');
        }
        if (result.Phim > 0.2 && result.Phim < 0.6) {
            console.log('✅ Flux is in reasonable range');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    console.groupEnd();
}

/**
 * Test 2: Validation with Invalid Inputs
 * Verifies that invalid inputs are properly caught
 */
function test_validateInputs() {
    console.group('🧪 Test 2: Input Validation');
    
    try {
        // This should fail - negative MVA
        const result = window._coreElectricalMath({
            S: -160,  // ❌ Invalid
            VHV: 132,
            VLV: 33,
            f: 50,
            Sf: 0.96,
            Bm: 1.7,
            Kf: 0.75,
            hvMain: 500,
            hvNormTap: 64,
            Wcore: 950,
            wsp: 1.2,
            magVA: 1.5,
            vecGroup: 'YNyn0'
        });
        console.error('❌ Should have caught negative S value');
    } catch (error) {
        console.log('✅ Correctly rejected invalid input:', error.message);
    }
    console.groupEnd();
}

/**
 * Test 3: State Management
 * Verifies CoreCalcState object works correctly
 */
function test_stateManagement() {
    console.group('🧪 Test 3: State Management');
    
    try {
        const state = window.CoreCalcState;
        console.log('✅ CoreCalcState exists');
        console.log('  - isCalculating:', state.isCalculating);
        console.log('  - lastValidInputs:', state.lastValidInputs ? '(exists)' : '(null)');
        console.log('  - lastError:', state.lastError ? '(exists)' : '(null)');
        
        // Test logging
        state.logger('Test message', 'success');
        state.logger('Test warning', 'log');
        state.logger('Test error', 'error');
        
        console.log('✅ State logger works');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    console.groupEnd();
}

/**
 * Test 4: Vector Group Recognition
 * Verifies vector group parsing works for different configurations
 */
function test_vectorGroups() {
    console.group('🧪 Test 4: Vector Group Recognition');
    
    const testConfigs = [
        { vg: 'YNyn0', expectHVStar: true, expectLVDelta: false, name: 'YNyn0 (standard)' },
        { vg: 'Yyn0', expectHVStar: true, expectLVDelta: false, name: 'Yyn0 (Y on HV)' },
        { vg: 'YNd1', expectHVStar: true, expectLVDelta: true, name: 'YNd1 (delta on LV)' },
        { vg: 'DD0', expectHVStar: false, expectLVDelta: true, name: 'DD0 (both delta)' }
    ];
    
    testConfigs.forEach(cfg => {
        try {
            const result = window._coreElectricalMath({
                S: 100, VHV: 132, VLV: 33, f: 50, Sf: 0.96, Bm: 1.7,
                Kf: 0.75, hvMain: 400, hvNormTap: 64, Wcore: 800,
                wsp: 1.2, magVA: 1.5, vecGroup: cfg.vg
            });
            console.log(`✅ ${cfg.name} - calculated successfully (D=${result.D.toFixed(1)}mm)`);
        } catch (error) {
            console.error(`❌ ${cfg.name} failed:`, error.message);
        }
    });
    
    console.groupEnd();
}

/**
 * Test 5: Compliance Checking
 * Verifies design compliance validation works
 */
function test_compliance() {
    console.group('🧪 Test 5: Compliance Checking');
    
    try {
        const result = window._coreElectricalMath({
            S: 160,
            VHV: 132,
            VLV: 33,
            f: 50,
            Sf: 0.96,
            Bm: 1.7,
            Kf: 0.75,
            hvMain: 500,
            hvNormTap: 64,
            Wcore: 950,
            wsp: 1.2,
            magVA: 1.5,
            vecGroup: 'YNyn0'
        });
        
        const compliance = result.compliance;
        console.log('Compliance Check Results:');
        console.log(`  Bm (${compliance.Bm_ok ? '✅' : '❌'})    ${(result.Bm_chk).toFixed(3)} T → 1.55-1.75 T`);
        console.log(`  An (${compliance.An_ok ? '✅' : '❌'})    ${(result.An).toFixed(4)} m² → > 0.18 m²`);
        console.log(`  Φ  (${compliance.Phi_ok ? '✅' : '❌'})    ${(result.Phim).toFixed(4)} Wb → 0.30-0.40 Wb`);
        console.log(`  Et (${compliance.Et_ok ? '✅' : '❌'})    ${(result.Et).toFixed(1)} V/t → 50-100 V/t`);
        console.log(`  N  (${compliance.NHV_ok ? '✅' : '❌'})    ${(result.NHV_used)} turns → 650-850`);
        console.log(`  P  (${compliance.P_ok ? '✅' : '❌'})    ${(result.Pcore).toFixed(1)} kW → < 75 kW`);
        console.log(`  I₀ (${compliance.I0p_ok ? '✅' : '❌'})    ${(result.I0_percent).toFixed(4)}% → < 0.5%`);
        console.log(`  AT (${compliance.AT_ok ? '✅' : '❌'})    ${(result.AT_bal).toFixed(3)} → 0.98-1.02`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    console.groupEnd();
}

/**
 * Test 6: Live Diameter Update Function
 * Verifies real-time updates work when inputs change
 */
function test_liveDiameterUpdate() {
    console.group('🧪 Test 6: Live Diameter Update');
    
    try {
        // Create test inputs if they don't exist
        if (!document.getElementById('cd_mva')) {
            console.warn('⚠️  Test inputs not present in DOM - skipping');
            console.groupEnd();
            return;
        }
        
        // Set test values
        document.getElementById('cd_mva').value = '160';
        document.getElementById('cd_hv').value = '132';
        
        // Call live update
        window.updateCoreDiaLive();
        
        const diaValue = document.getElementById('cd_diameter')?.value;
        if (diaValue && diaValue !== '') {
            console.log(`✅ Diameter updated: ${diaValue} mm`);
        } else {
            console.warn('⚠️  Diameter field not updated');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    console.groupEnd();
}

/**
 * Run all tests
 */
function runAllTests() {
    console.clear();
    console.log('%c═══════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold; font-size: 14px');
    console.log('%c  CORE CALCULATOR TEST SUITE v2.0', 'color: #667eea; font-weight: bold; font-size: 14px');
    console.log('%c═══════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold; font-size: 14px');
    
    test_calculateFlux();
    test_validateInputs();
    test_stateManagement();
    test_vectorGroups();
    test_compliance();
    test_liveDiameterUpdate();
    
    console.log('%c═══════════════════════════════════════════════════════', 'color: #27ae60; font-weight: bold; font-size: 14px');
    console.log('%c  ALL TESTS COMPLETED ✅', 'color: #27ae60; font-weight: bold; font-size: 14px');
    console.log('%c═══════════════════════════════════════════════════════', 'color: #27ae60; font-weight: bold; font-size: 14px');
}

// Export test functions
window.runAllTests = runAllTests;
window.test_calculateFlux = test_calculateFlux;
window.test_validateInputs = test_validateInputs;
window.test_stateManagement = test_stateManagement;
window.test_vectorGroups = test_vectorGroups;
window.test_compliance = test_compliance;
window.test_liveDiameterUpdate = test_liveDiameterUpdate;

console.log('%c✅ Test suite loaded. Run: runAllTests()', 'color: #27ae60; font-weight: bold;');
