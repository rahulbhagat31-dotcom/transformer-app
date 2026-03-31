/**
 * ===============================================
 * TEST: NEW CALCULATION ENGINE
 * Validate with real 160 MVA transformer data
 * ===============================================
 */

// Test data from real 160 MVA, 220/66 kV transformer
const realTransformerData = {
    // Input specifications
    inputs: {
        mva: 160,
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
        tapChangerType: 'OLTC',
        tappingRange: 10,
        ambientTemp: 50,
        altitude: 1000
    },

    // Expected results from manufacturer datasheet
    expected: {
        currents: {
            hvCurrent: 420, // A (±2%)
            lvCurrent: 1400 // A (±2%)
        },
        losses: {
            noLoadLoss: 110, // kW (±5%)
            loadLoss: 520, // kW (±5%)
            totalLoss: 630, // kW
            efficiency: 99.61 // % (±0.1%)
        },
        temperature: {
            oilRise: 48, // °C (±5°C)
            windingRise: 58, // °C (±5°C)
            hotSpot: 73 // °C (±5°C)
        },
        impedance: {
            calculated: 12.5, // % (±7.5%)
            regulation: 3.5 // % (±10%)
        },
        dimensions: {
            tankLength: 4500, // mm (±10%)
            tankWidth: 2800, // mm (±10%)
            tankHeight: 3200, // mm (±10%)
            totalWeight: 95000 // kg (±10%)
        },
        shortCircuit: {
            scCurrent: 3360, // A (±10%)
            thermalWithstand: 'PASS',
            mechanicalWithstand: 'PASS'
        }
    }
};

/**
 * Run test and compare results
 */
function runValidationTest() {
    console.log('🧪 Starting validation test with real transformer data...\n');
    console.log('═══════════════════════════════════════════════════════════');

    try {
        // Run calculation
        const results = TransformerCalculator.calculate(realTransformerData.inputs);

        if (!results.success) {
            console.error('❌ Calculation failed:', results.errors);
            return;
        }

        // Validate results
        const validation = {
            currents: validateCurrents(results.calculations.currents, realTransformerData.expected.currents),
            losses: validateLosses(results.calculations.losses, realTransformerData.expected.losses),
            temperature: validateTemperature(results.calculations.temperature, realTransformerData.expected.temperature),
            impedance: validateImpedance(results.calculations.impedance, realTransformerData.expected.impedance),
            dimensions: validateDimensions(results.calculations.dimensions, realTransformerData.expected.dimensions),
            shortCircuit: validateShortCircuit(results.calculations.shortCircuit, realTransformerData.expected.shortCircuit)
        };

        // Print results
        console.log('\n📊 VALIDATION RESULTS:');
        console.log('═══════════════════════════════════════════════════════════\n');

        printValidationResults(validation);

        // Overall pass/fail
        const allPassed = Object.values(validation).every(v => v.status === 'PASS');

        console.log('\n═══════════════════════════════════════════════════════════');
        if (allPassed) {
            console.log('✅ ALL TESTS PASSED - Engine validated!');
        } else {
            console.log('⚠️ SOME TESTS FAILED - Review results above');
        }
        console.log('═══════════════════════════════════════════════════════════\n');

        return { validation, results, allPassed };

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        return null;
    }
}

/**
 * Validate currents
 */
function validateCurrents(calculated, expected) {
    const hvError = Math.abs((calculated.hvCurrent - expected.hvCurrent) / expected.hvCurrent) * 100;
    const lvError = Math.abs((calculated.lvCurrent - expected.lvCurrent) / expected.lvCurrent) * 100;

    const hvPass = hvError <= 2;
    const lvPass = lvError <= 2;

    return {
        status: (hvPass && lvPass) ? 'PASS' : 'FAIL',
        details: {
            hvCurrent: {
                calculated: calculated.hvCurrent,
                expected: expected.hvCurrent,
                error: hvError.toFixed(2) + '%',
                pass: hvPass
            },
            lvCurrent: {
                calculated: calculated.lvCurrent,
                expected: expected.lvCurrent,
                error: lvError.toFixed(2) + '%',
                pass: lvPass
            }
        }
    };
}

/**
 * Validate losses
 */
function validateLosses(calculated, expected) {
    const noLoadError = Math.abs((calculated.noLoadLoss - expected.noLoadLoss) / expected.noLoadLoss) * 100;
    const loadError = Math.abs((calculated.loadLoss - expected.loadLoss) / expected.loadLoss) * 100;
    const efficiencyError = Math.abs(calculated.efficiency - expected.efficiency);

    const noLoadPass = noLoadError <= 5;
    const loadPass = loadError <= 5;
    const efficiencyPass = efficiencyError <= 0.1;

    return {
        status: (noLoadPass && loadPass && efficiencyPass) ? 'PASS' : 'FAIL',
        details: {
            noLoadLoss: {
                calculated: calculated.noLoadLoss,
                expected: expected.noLoadLoss,
                error: noLoadError.toFixed(2) + '%',
                pass: noLoadPass
            },
            loadLoss: {
                calculated: calculated.loadLoss,
                expected: expected.loadLoss,
                error: loadError.toFixed(2) + '%',
                pass: loadPass
            },
            efficiency: {
                calculated: calculated.efficiency,
                expected: expected.efficiency,
                error: efficiencyError.toFixed(3) + '%',
                pass: efficiencyPass
            }
        }
    };
}

/**
 * Validate temperature
 */
function validateTemperature(calculated, expected) {
    const actualOilRise = calculated.oilRise ?? calculated.rises?.topOil;
    const actualWindingRise = calculated.windingRise?.average ?? calculated.rises?.averageWinding;
    const actualHotSpot = calculated.hotSpot ?? calculated.absolute?.hotSpot;

    const oilError = Math.abs(actualOilRise - expected.oilRise);
    const windingError = Math.abs(actualWindingRise - expected.windingRise);
    const hotSpotError = Math.abs(actualHotSpot - expected.hotSpot);

    const oilPass = oilError <= 5;
    const windingPass = windingError <= 5;
    const hotSpotPass = hotSpotError <= 5;

    return {
        status: (oilPass && windingPass && hotSpotPass) ? 'PASS' : 'FAIL',
        details: {
            oilRise: {
                calculated: actualOilRise,
                expected: expected.oilRise,
                error: oilError.toFixed(1) + '°C',
                pass: oilPass
            },
            windingRise: {
                calculated: actualWindingRise,
                expected: expected.windingRise,
                error: windingError.toFixed(1) + '°C',
                pass: windingPass
            },
            hotSpot: {
                calculated: actualHotSpot,
                expected: expected.hotSpot,
                error: hotSpotError.toFixed(1) + '°C',
                pass: hotSpotPass
            }
        }
    };
}

/**
 * Validate impedance
 */
function validateImpedance(calculated, expected) {
    const actualImpedance = calculated.calculated ?? calculated.percentImpedance;
    const actualRegulation = calculated.regulation?.atFullLoad ?? calculated.regulation;

    const impedanceError = Math.abs((actualImpedance - expected.calculated) / expected.calculated) * 100;
    const regulationError = typeof actualRegulation === 'number'
        ? Math.abs((actualRegulation - expected.regulation) / expected.regulation) * 100
        : Number.POSITIVE_INFINITY;

    const impedancePass = impedanceError <= 7.5;
    const regulationPass = regulationError <= 10;

    return {
        status: (impedancePass && regulationPass) ? 'PASS' : 'FAIL',
        details: {
            impedance: {
                calculated: actualImpedance,
                expected: expected.calculated,
                error: impedanceError.toFixed(2) + '%',
                pass: impedancePass
            },
            regulation: {
                calculated: actualRegulation ?? 'N/A',
                expected: expected.regulation,
                error: Number.isFinite(regulationError) ? regulationError.toFixed(2) + '%' : 'N/A',
                pass: regulationPass
            }
        }
    };
}

/**
 * Validate dimensions
 */
function validateDimensions(calculated, expected) {
    const lengthError = Math.abs((calculated.tank.length - expected.tankLength) / expected.tankLength) * 100;
    const widthError = Math.abs((calculated.tank.width - expected.tankWidth) / expected.tankWidth) * 100;
    const heightError = Math.abs((calculated.tank.height - expected.tankHeight) / expected.tankHeight) * 100;
    const weightError = Math.abs((calculated.weights.total - expected.totalWeight) / expected.totalWeight) * 100;

    const lengthPass = lengthError <= 10;
    const widthPass = widthError <= 10;
    const heightPass = heightError <= 10;
    const weightPass = weightError <= 10;

    return {
        status: (lengthPass && widthPass && heightPass && weightPass) ? 'PASS' : 'FAIL',
        details: {
            tankLength: {
                calculated: calculated.tank.length,
                expected: expected.tankLength,
                error: lengthError.toFixed(2) + '%',
                pass: lengthPass
            },
            tankWidth: {
                calculated: calculated.tank.width,
                expected: expected.tankWidth,
                error: widthError.toFixed(2) + '%',
                pass: widthPass
            },
            tankHeight: {
                calculated: calculated.tank.height,
                expected: expected.tankHeight,
                error: heightError.toFixed(2) + '%',
                pass: heightPass
            },
            totalWeight: {
                calculated: calculated.weights.total,
                expected: expected.totalWeight,
                error: weightError.toFixed(2) + '%',
                pass: weightPass
            }
        }
    };
}

/**
 * Validate short circuit
 */
function validateShortCircuit(calculated, expected) {
    const actualScCurrent = calculated.scCurrent?.symmetrical ?? calculated.currents?.rms;
    const actualThermalStatus = calculated.thermalWithstand?.status;
    const actualMechanicalStatus = calculated.mechanicalWithstand?.status ?? calculated.status;

    const scError = Math.abs((actualScCurrent - expected.scCurrent) / expected.scCurrent) * 100;
    const scPass = scError <= 10;

    const thermalPass = actualThermalStatus === expected.thermalWithstand;
    const mechanicalPass = actualMechanicalStatus === expected.mechanicalWithstand;

    return {
        status: (scPass && thermalPass && mechanicalPass) ? 'PASS' : 'FAIL',
        details: {
            scCurrent: {
                calculated: actualScCurrent,
                expected: expected.scCurrent,
                error: scError.toFixed(2) + '%',
                pass: scPass
            },
            thermalWithstand: {
                calculated: actualThermalStatus,
                expected: expected.thermalWithstand,
                pass: thermalPass
            },
            mechanicalWithstand: {
                calculated: actualMechanicalStatus,
                expected: expected.mechanicalWithstand,
                pass: mechanicalPass
            }
        }
    };
}

/**
 * Print validation results
 */
function printValidationResults(validation) {
    for (const [category, result] of Object.entries(validation)) {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${category.toUpperCase()}: ${result.status}`);

        for (const [param, data] of Object.entries(result.details)) {
            const paramIcon = data.pass ? '  ✓' : '  ✗';
            console.log(`${paramIcon} ${param}: ${data.calculated} (expected: ${data.expected}, error: ${data.error})`);
        }
        console.log('');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ValidationTest = {
        run: runValidationTest,
        data: realTransformerData
    };
}

// Auto-run if in browser console
if (typeof window !== 'undefined' && window.TransformerCalculator) {
    console.log('Validation test loaded. Run with: ValidationTest.run()');
}
