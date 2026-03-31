(function () {
    /**
     * ===============================================
     * CALCULATION ENGINE - PHYSICAL CONSTANTS
     * Industry-Standard Transformer Design Calculator
     * IEC 60076 / IEEE C57 / IS 2026 Compliant
     * ===============================================
     */

    /**
     * Physical and mathematical constants
     */
    const CONSTANTS = {
        // Mathematical constants
        PI: Math.PI,
        SQRT_3: Math.sqrt(3),
        SQRT_2: Math.sqrt(2),

        // Physical constants
        MU_0: 4 * Math.PI * 1e-7,           // Permeability of free space (H/m)

        // Material properties - CRGO (Cold Rolled Grain Oriented)
        CRGO: {
            stackingFactor: 0.95,            // Typical stacking factor
            density: 7650,                   // kg/m³
            steinmetz: {
                k: 1.3,                      // Steinmetz coefficient
                alpha: 1.6,                  // Frequency exponent
                beta: 2.0                    // Flux density exponent
            },
            // IEC 60076-1 compliant loss coefficients
            hysteresisCoeff: {               // k_h for P_h = k_h × f × B^α × weight
                M4: 0.85,
                M5: 1.05,
                M6: 1.25
            },
            eddyCoeff: {                     // k_e for P_e = k_e × f² × B² × weight
                M4: 0.020,
                M5: 0.025,
                M6: 0.030
            },
            resistivity: 4.7e-7,             // Ω·m at 20°C
            specificLoss: {                  // W/kg at 1.7T, 50Hz (IEC 60404-8-7)
                M4: 0.95,
                M5: 1.20,
                M6: 1.45
            }
        },

        // Material properties - CRNGO (Cold Rolled Non-Grain Oriented)
        CRNGO: {
            stackingFactor: 0.92,
            density: 7700,                   // kg/m³
            steinmetz: {
                k: 2.5,
                alpha: 1.5,
                beta: 2.2
            },
            resistivity: 5.5e-7,
            specificLoss: {
                standard: 3.5                // W/kg at 1.5T, 50Hz
            }
        },

        // Conductor materials - Copper
        COPPER: {
            density: 8960,                   // kg/m³ (pure copper, IEC standard)
            resistivity20C: 1.724e-8,        // Ω·m at 20°C
            tempCoefficient: 0.00393,        // per °C
            thermalConductivity: 385,        // W/(m·K)
            specificHeat: 385,               // J/(kg·K)
            yieldStrength: 200,              // MPa (annealed)
            tensileStrength: 220             // MPa
        },

        // Conductor materials - Aluminum
        ALUMINUM: {
            density: 2700,                   // kg/m³
            resistivity20C: 2.826e-8,        // Ω·m at 20°C
            tempCoefficient: 0.00403,        // per °C
            thermalConductivity: 237,        // W/(m·K)
            specificHeat: 897,               // J/(kg·K)
            yieldStrength: 95,               // MPa
            tensileStrength: 110             // MPa
        },

        // Insulation materials
        INSULATION: {
            paper: {
                dielectricStrength: 15,      // kV/mm
                thickness: {
                    turnToTurn: 0.2,         // mm
                    layerToLayer: 1.0        // mm
                }
            },
            pressboard: {
                dielectricStrength: 12,      // kV/mm
                density: 1200                // kg/m³
            },
            oil: {
                dielectricStrength: 30,      // kV/mm (peak)
                density: 880,                // kg/m³
                specificHeat: 2.1,           // kJ/(kg·K)
                thermalConductivity: 0.13,   // W/(m·K)
                viscosity: 12                // cSt at 40°C
            }
        },

        // IEC 60076 Standard values
        IEC_60076: {
            referenceTemp: 75,               // °C for resistance measurement
            ambientTemp: 50,                 // °C maximum ambient
            oilRiseLimit: {
                ONAN: 55,                    // °C
                ONAF: 55,
                OFAF: 55
            },
            windingRiseLimit: {
                oilImmersed: 65,             // °C
                dryType: 100
            },
            hotSpotLimit: 78,                // °C rise above mean oil (IEC 60076-7 Table 1)
            scDuration: 2,                   // seconds (standard test)
            frequencies: [50, 60],           // Hz (standard frequencies)
            voltageClasses: [11, 22, 33, 66, 110, 132, 220, 400] // kV
        },

        // IEEE C57 Standard values
        IEEE_C57: {
            referenceTemp: 75,               // °C
            ambientTemp: 40,                 // °C (IEEE uses 40°C)
            averageWindingRise: 65,          // °C
            hotSpotRise: 80,                 // °C
            topOilRise: 55                   // °C
        },

        // Typical design ranges
        DESIGN_RANGES: {
            fluxDensity: {
                min: 1.3,                    // Tesla
                max: 1.8,
                typical: 1.65
            },
            currentDensity: {
                min: 1.5,                    // A/mm²
                max: 4.0,
                typical: 2.5
            },
            voltsPerTurn: {
                min: 10,                     // V
                max: 150,
                typical: 60
            },
            impedance: {
                min: 4,                      // %
                max: 20,
                typical: 12.5
            },
            efficiency: {
                min: 98.0,                   // %
                max: 99.9,
                typical: 99.5
            },
            noLoadCurrent: {
                min: 0.2,                    // % of rated
                max: 2.0,
                typical: 0.5
            }
        },

        // Cooling coefficients (W/m²·°C)
        COOLING: {
            ONAN: 1.2,                       // Oil Natural, Air Natural
            ONAF: 2.2,                       // Oil Natural, Air Forced
            OFAF: 3.0,                       // Oil Forced, Air Forced
            OFWF: 4.5                        // Oil Forced, Water Forced
        },

        // BIL (Basic Impulse Level) - IEC 60076-3
        BIL_STANDARDS: {
            11: { bil: 75, acTest: 28 },
            22: { bil: 125, acTest: 50 },
            33: { bil: 170, acTest: 70 },
            66: { bil: 325, acTest: 140 },
            110: { bil: 450, acTest: 185 },
            132: { bil: 550, acTest: 230 },
            220: { bil: 1050, acTest: 460 },
            400: { bil: 1425, acTest: 630 }
        },

        // Conversion factors
        CONVERSIONS: {
            KW_TO_W: 1000,
            MVA_TO_VA: 1e6,
            KV_TO_V: 1000,
            MM_TO_M: 0.001,
            CM_TO_M: 0.01,
            CM2_TO_M2: 1e-4,
            MM2_TO_M2: 1e-6
        }
    };

    // Freeze to prevent modifications
    Object.freeze(CONSTANTS);

    // Export for use in modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CONSTANTS;
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window.CALC_CONSTANTS = CONSTANTS;
    }
})();
