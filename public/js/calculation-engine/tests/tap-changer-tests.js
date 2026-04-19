/**
 * ================================================
 * TAP CHANGER ACCURACY TEST SUITE
 * Tests for OLTC & OCTC Calculations v2.0
 * ================================================
 */

(function () {
    'use strict';

    /**
     * TEST 1: OCTC Flux Calculation Accuracy
     */
    function test_OCTCFluxAccuracy() {
        console.log('\n🧪 TEST 1: OCTC Flux Calculation Accuracy');
        console.log('=' .repeat(60));

        const testCases = [
            {
                name: '±10% OCTC, 1.70T nominal',
                inputs: { tapChangerType: 'OCTC', tappingRange: 10, tappingSide: 'HV', hv: 132, lv: 33 },
                coreDesign: { fluxDensity: 1.70, hvTurns: 612 },
                expected: {
                    minBm: 1.889,  // 1.70 × (1 / 0.9) = 1.70 × 1.1111 = 1.889
                    maxBm: 1.545,  // 1.70 × (1 / 1.1) = 1.70 × 0.9091 = 1.545
                    minStatus: 'CRITICAL'
                }
            },
            {
                name: '±5% OCTC, 1.70T nominal',
                inputs: { tapChangerType: 'OCTC', tappingRange: 5, tappingSide: 'HV', hv: 132, lv: 33 },
                coreDesign: { fluxDensity: 1.70, hvTurns: 612 },
                expected: {
                    minBm: 1.789,  // 1.70 × (1 / 0.95) = 1.70 × 1.0526 = 1.789
                    maxBm: 1.619,  // 1.70 × (1 / 1.05) = 1.70 × 0.9524 = 1.619
                    minStatus: 'WARNING'
                }
            },
            {
                name: '±10% OCTC, 1.60T nominal (safe)',
                inputs: { tapChangerType: 'OCTC', tappingRange: 10, tappingSide: 'HV', hv: 132, lv: 33 },
                coreDesign: { fluxDensity: 1.60, hvTurns: 612 },
                expected: {
                    minBm: 1.778,  // 1.60 × 1.1111 = 1.778
                    maxBm: 1.455,  // 1.60 × 0.9091 = 1.455
                    minStatus: 'OK'
                }
            }
        ];

        let passed = 0, failed = 0;

        testCases.forEach((tc, idx) => {
            console.log(`\n  Test ${idx + 1}: ${tc.name}`);
            
            if (typeof window.calculateOCTCAccurate === 'undefined') {
                console.warn('  ⚠️ calculateOCTCAccurate not found. Skipping.');
                return;
            }

            const result = window.calculateOCTCAccurate(tc.inputs, tc.coreDesign);
            
            if (!result.applicable) {
                console.error(`  ✗ FAIL: Result not applicable`);
                failed++;
                return;
            }

            const minBm = parseFloat(result.minimumTap.Bm);
            const maxBm = parseFloat(result.maximumTap.Bm);
            const minStatus = result.minimumTap.status;

            const minPass = Math.abs(minBm - tc.expected.minBm) < 0.01;
            const maxPass = Math.abs(maxBm - tc.expected.maxBm) < 0.01;
            const statusPass = minStatus === tc.expected.minStatus;

            if (minPass && maxPass && statusPass) {
                console.log(`  ✅ PASS`);
                console.log(`     Min Bm: ${minBm.toFixed(3)}T (expected ${tc.expected.minBm.toFixed(3)}T)`);
                console.log(`     Max Bm: ${maxBm.toFixed(3)}T (expected ${tc.expected.maxBm.toFixed(3)}T)`);
                console.log(`     Status: ${minStatus} (expected ${tc.expected.minStatus})`);
                passed++;
            } else {
                console.log(`  ✗ FAIL`);
                if (!minPass) console.log(`     Min Bm mismatch: ${minBm.toFixed(3)}T vs ${tc.expected.minBm.toFixed(3)}T`);
                if (!maxPass) console.log(`     Max Bm mismatch: ${maxBm.toFixed(3)}T vs ${tc.expected.maxBm.toFixed(3)}T`);
                if (!statusPass) console.log(`     Status mismatch: ${minStatus} vs ${tc.expected.minStatus}`);
                failed++;
            }
        });

        console.log(`\n  Summary: ${passed}/${testCases.length} passed, ${failed} failed`);
        return { name: 'OCTC Flux Accuracy', passed, failed };
    }

    /**
     * TEST 2: OLTC Tap Table Generation
     */
    function test_OLTCTapTableAccuracy() {
        console.log('\n🧪 TEST 2: OLTC Tap Table Generation');
        console.log('=' .repeat(60));

        const inputs = {
            mva: 160,
            hv: 132,
            lv: 33,
            tapChangerType: 'OLTC',
            tappingRange: 10,
            frequency: 50
        };

        const coreDesign = {
            fluxDensity: 1.70,
            hvTurns: 612,
            actualVoltsPerTurn: 0.2157
        };

        if (typeof window.calculateOLTCAccurate === 'undefined') {
            console.warn('  ⚠️ calculateOLTCAccurate not found. Skipping.');
            return { name: 'OLTC Tap Table', passed: 0, failed: 1 };
        }

        const result = window.calculateOLTCAccurate(inputs, coreDesign, {});

        let passed = 0, failed = 0;

        console.log('\n  Checking tap table generation...');
        
        if (result.tapTable.length === 17) {
            console.log(`  ✅ PASS: Tap table has 17 steps (±10% range)`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Expected 17 steps, got ${result.tapTable.length}`);
            failed++;
        }

        // Check nominal (center) tap
        const nominalTap = result.tapTable[8];  // Center of 17 steps
        if (nominalTap && nominalTap.position === 'NOMINAL') {
            console.log(`  ✅ PASS: Nominal tap found at center position`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Nominal tap not found correctly`);
            failed++;
        }

        // Check voltage range
        const minVoltage = Math.min(...result.tapTable.map(t => parseFloat(t.hvVoltage)));
        const maxVoltage = Math.max(...result.tapTable.map(t => parseFloat(t.hvVoltage)));
        const expectedMin = 132 * 0.9;  // 118.8
        const expectedMax = 132 * 1.1;  // 145.2

        if (Math.abs(minVoltage - expectedMin) < 0.5 && Math.abs(maxVoltage - expectedMax) < 0.5) {
            console.log(`  ✅ PASS: Voltage range correct (${minVoltage.toFixed(2)} - ${maxVoltage.toFixed(2)} kV)`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Voltage range incorrect (${minVoltage.toFixed(2)} - ${maxVoltage.toFixed(2)} vs ${expectedMin.toFixed(2)} - ${expectedMax.toFixed(2)})`);
            failed++;
        }

        // Check current calculations
        const nominalCurrent = 160 * 1000 / (Math.sqrt(3) * 132);  // ~700 A
        const minTapCurrent = nominalCurrent * (132 / (132 - 13.2));  // Max current at min tap
        if (result.tapTable[8].hvCurrent && parseFloat(result.tapTable[8].hvCurrent) > 690 && parseFloat(result.tapTable[8].hvCurrent) < 710) {
            console.log(`  ✅ PASS: Nominal current calculation correct (${result.tapTable[8].hvCurrent} A)`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Nominal current calculation (${result.tapTable[8].hvCurrent} vs ~700 A)`);
            failed++;
        }

        // Check thermal analysis
        if (result.thermalAnalysis && result.thermalAnalysis.totalDissipation) {
            const dissipation = parseFloat(result.thermalAnalysis.totalDissipation);
            console.log(`  ✅ PASS: Thermal analysis present (${dissipation.toFixed(2)} W dissipation)`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Thermal analysis missing`);
            failed++;
        }

        console.log(`\n  Summary: ${passed}/5 checks passed`);
        return { name: 'OLTC Tap Table', passed, failed };
    }

    /**
     * TEST 3: Warning Generation
     */
    function test_WarningGeneration() {
        console.log('\n🧪 TEST 3: Warning Generation for Design Issues');
        console.log('=' .repeat(60));

        const problematicInputs = {
            tapChangerType: 'OCTC',
            tappingRange: 15,  // Wide tapping range
            tappingSide: 'HV',
            hv: 132,
            lv: 33
        };

        const coreDesign = {
            fluxDensity: 1.75,  // High nominal Bm
            hvTurns: 612
        };

        if (typeof window.calculateOCTCAccurate === 'undefined') {
            console.warn('  ⚠️ calculateOCTCAccurate not found. Skipping.');
            return { name: 'Warning Generation', passed: 0, failed: 1 };
        }

        const result = window.calculateOCTCAccurate(problematicInputs, coreDesign);

        let passed = 0, failed = 0;

        console.log('\n  Checking warning generation for problematic design...');
        console.log(`  Nominal Bm: ${coreDesign.fluxDensity}T, Tap Range: ±${problematicInputs.tappingRange}%`);
        
        // Expected min flux: 1.75 × (1 / (1 - 15/100)) = 1.75 × (1 / 0.85) = 2.058 T
        const expectedMinBm = coreDesign.fluxDensity / (1 - problematicInputs.tappingRange / 100);
        console.log(`  Expected min Bm: ${expectedMinBm.toFixed(3)}T`);

        if (result.warnings.length > 0) {
            console.log(`  ✅ PASS: Warnings generated (${result.warnings.length})`);
            passed++;

            result.warnings.forEach((w, idx) => {
                console.log(`     Warning ${idx + 1}: [${w.severity}] ${w.message}`);
            });
        } else {
            console.log(`  ✗ FAIL: Expected warnings but none generated`);
            failed++;
        }

        // Check for critical severity
        const critical = result.warnings.find(w => w.severity === 'CRITICAL');
        if (critical) {
            console.log(`  ✅ PASS: Critical warning detected`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: No critical warning despite high flux`);
            failed++;
        }

        // Check recommendation provided
        const hasRec = critical && critical.recommendation && critical.recommendation.length > 0;
        if (hasRec) {
            console.log(`  ✅ PASS: Recommendation provided: "${critical.recommendation.substring(0, 50)}..."`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: No recommendation provided`);
            failed++;
        }

        console.log(`\n  Summary: ${passed}/3 checks passed`);
        return { name: 'Warning Generation', passed, failed };
    }

    /**
     * TEST 4: Thermal Dissipation Calculation
     */
    function test_ThermalDissipation() {
        console.log('\n🧪 TEST 4: OLTC Thermal Dissipation Calculation');
        console.log('=' .repeat(60));

        const inputs = {
            mva: 160,
            hv: 132,
            lv: 33,
            tapChangerType: 'OLTC',
            tappingRange: 10,
            frequency: 50
        };

        const coreDesign = {
            fluxDensity: 1.70,
            hvTurns: 612,
            actualVoltsPerTurn: 0.2157
        };

        if (typeof window.calculateOLTCAccurate === 'undefined') {
            console.warn('  ⚠️ calculateOLTCAccurate not found. Skipping.');
            return { name: 'Thermal Dissipation', passed: 0, failed: 1 };
        }

        const result = window.calculateOLTCAccurate(inputs, coreDesign, {});

        let passed = 0, failed = 0;

        console.log('\n  Checking thermal analysis components...');

        const ta = result.thermalAnalysis;

        // Check contact resistance
        if (ta.contactResistance && ta.contactResistance.includes('μΩ')) {
            console.log(`  ✅ PASS: Contact resistance included (${ta.contactResistance})`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Contact resistance missing`);
            failed++;
        }

        // Check dissipation values
        if (ta.maxContactPower && ta.selectorPower && ta.diverterPower) {
            const contact = parseFloat(ta.maxContactPower);
            const selector = parseFloat(ta.selectorPower);
            const diverter = parseFloat(ta.diverterPower);
            
            if (contact > 0 && selector > 0 && diverter > 0) {
                console.log(`  ✅ PASS: All dissipation components calculated`);
                console.log(`     Contact: ${contact.toFixed(2)} W, Selector: ${selector.toFixed(3)} W, Diverter: ${diverter.toFixed(2)} W`);
                passed++;
            } else {
                console.log(`  ✗ FAIL: Invalid dissipation values`);
                failed++;
            }
        } else {
            console.log(`  ✗ FAIL: Dissipation components missing`);
            failed++;
        }

        // Check total dissipation
        if (ta.totalDissipation) {
            const total = parseFloat(ta.totalDissipation);
            console.log(`  ✅ PASS: Total dissipation: ${total.toFixed(2)} W`);
            passed++;
        } else {
            console.log(`  ✗ FAIL: Total dissipation missing`);
            failed++;
        }

        console.log(`\n  Summary: ${passed}/3 checks passed`);
        return { name: 'Thermal Dissipation', passed, failed };
    }

    /**
     * TEST 5: Flux Factor Verification Against Manual Calculations
     */
    function test_FluxFactorVerification() {
        console.log('\n🧪 TEST 5: Flux Factor Physics Verification');
        console.log('=' .repeat(60));

        if (typeof window.calculateAccurateTapFlux === 'undefined') {
            console.warn('  ⚠️ calculateAccurateTapFlux not found. Skipping.');
            return { name: 'Flux Factor Verification', passed: 0, failed: 1 };
        }

        const testCases = [
            { nomBm: 1.70, range: 10, isMin: true, expected: 1.889 },   // 1.70 / 0.9
            { nomBm: 1.70, range: 10, isMin: false, expected: 1.545 },  // 1.70 / 1.1
            { nomBm: 1.70, range: 5, isMin: true, expected: 1.789 },    // 1.70 / 0.95
            { nomBm: 1.70, range: 20, isMin: true, expected: 2.125 }    // 1.70 / 0.8
        ];

        let passed = 0, failed = 0;

        testCases.forEach((tc, idx) => {
            const result = window.calculateAccurateTapFlux(tc.nomBm, tc.range, tc.isMin);
            const actual = result.Bm;
            const match = Math.abs(actual - tc.expected) < 0.01;

            if (match) {
                console.log(`  ✅ Case ${idx + 1}: ${tc.nomBm}T ±${tc.range}% ${tc.isMin ? 'min' : 'max'} = ${actual.toFixed(3)}T ✓`);
                passed++;
            } else {
                console.log(`  ✗ Case ${idx + 1}: Expected ${tc.expected.toFixed(3)}T, got ${actual.toFixed(3)}T`);
                failed++;
            }
        });

        console.log(`\n  Summary: ${passed}/${testCases.length} passed`);
        return { name: 'Flux Factor Verification', passed, failed };
    }

    /**
     * Run All Tests
     */
    function runAllTests() {
        console.log('\n');
        console.log('╔' + '═'.repeat(58) + '╗');
        console.log('║  TAP CHANGER ACCURACY TEST SUITE v2.0                     ║');
        console.log('║  OLTC & OCTC Physics-Based Calculations                  ║');
        console.log('╚' + '═'.repeat(58) + '╝');

        const results = [];
        
        results.push(test_FluxFactorVerification());
        results.push(test_OCTCFluxAccuracy());
        results.push(test_OLTCTapTableAccuracy());
        results.push(test_WarningGeneration());
        results.push(test_ThermalDissipation());

        // Summary
        console.log('\n');
        console.log('╔' + '═'.repeat(58) + '╗');
        console.log('║  TEST SUMMARY                                            ║');
        console.log('╚' + '═'.repeat(58) + '╝');

        let totalPassed = 0, totalFailed = 0;
        results.forEach(r => {
            const status = r.failed === 0 ? '✅ PASS' : '⚠️  PARTIAL';
            console.log(`${status} | ${r.name.padEnd(30)} | ${r.passed}/${r.passed + r.failed}`);
            totalPassed += r.passed;
            totalFailed += r.failed;
        });

        console.log('─'.repeat(60));
        const allPass = totalFailed === 0;
        const summary = allPass ? '✅ ALL TESTS PASSED' : `⚠️  ${totalFailed} FAILURES`;
        console.log(`${summary.padEnd(30)} Total: ${totalPassed}/${totalPassed + totalFailed}`);
        console.log('\n');

        return { passed: totalPassed, failed: totalFailed, allPass };
    }

    // ===== EXPORTS =====
    if (typeof window !== 'undefined') {
        window.test_OCTCFluxAccuracy = test_OCTCFluxAccuracy;
        window.test_OLTCTapTableAccuracy = test_OLTCTapTableAccuracy;
        window.test_WarningGeneration = test_WarningGeneration;
        window.test_ThermalDissipation = test_ThermalDissipation;
        window.test_FluxFactorVerification = test_FluxFactorVerification;
        window.runAllTapChangerTests = runAllTests;
        console.log('✅ Tap Changer Test Suite Loaded (run: runAllTapChangerTests())');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            test_OCTCFluxAccuracy,
            test_OLTCTapTableAccuracy,
            test_WarningGeneration,
            test_ThermalDissipation,
            test_FluxFactorVerification,
            runAllTests
        };
    }
})();
