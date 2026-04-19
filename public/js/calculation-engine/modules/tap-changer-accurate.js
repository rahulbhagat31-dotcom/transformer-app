/**
 * ================================================
 * ACCURATE TAP CHANGER CALCULATION MODULE v2.0
 * OLTC (On-Load) & OCTC (Off-Circuit)
 * Based on IEC 60076-1, IEEE C57.12.00
 * ================================================
 */

(function () {
    'use strict';

    /**
     * ACCURATE FLUX CALCULATION AT TAP EXTREMES
     * 
     * Physics-based derivation:
     * EMF equation: E = 4.44 × f × N × Φ
     * At constant frequency and core area:
     * V ∝ N × Φ
     * 
     * When tapping on HV side:
     * - Tap changes N (number of turns)
     * - Core flux Φ = V / (4.44 × f × N)
     * - At minimum tap (-x%): V_min = V₀(1 - x/100), N_min = N₀(1 - x/100)
     *   → Φ_min = V_min / (4.44 × f × N_min) = [V₀(1-x/100)] / (4.44 × f × N₀(1-x/100))
     *   → Φ_min = V₀ / (4.44 × f × N₀) = Φ₀ (SAME!)
     * 
     * BUT this assumes proportional turns reduction. In reality:
     * - Tapping windings have finite resolution
     * - Core flux is determined by V/N ratio
     * - When only HV side taps and V drops, but N drops proportionally → Flux constant
     * - When only HV taps and core designed for nominal Bm:
     *   At minimum tap: Bm_min = Bm₀ × (V_min/V₀) / (N_min/N₀)
     *   = Bm₀ × [(1-x/100)] / [(1-x/100)] = Bm₀ (no change if proportional!)
     * 
     * CORRECT FORMULA (when tap position determines voltage ratio directly):
     * Bm_tap = Bm_nominal × (V_tap/N_tap) / (V_nominal/N_nominal)
     * = Bm_nominal × (Tap voltage ratio)
     * = Bm_nominal / (1 ± tapRangePercent/100)
     */
    function calculateAccurateTapFlux(nominalBm, tapRangePercent, isMinTap) {
        // When voltage changes but turns change proportionally:
        // Flux = V/(4.44×f×N), and both scale together, so flux UNCHANGED
        // But this ignores saturation curves and iron loss behavior
        
        // ACCURATE method: Use inverse relationship
        // At minimum tap (-x%): Fewer turns, same core, so flux per turn increases
        // Correct factor = 1 / (1 - tapRange/100) for minimum tap
        // Correct factor = 1 / (1 + tapRange/100) for maximum tap
        
        const factor = isMinTap 
            ? 1 / (1 - tapRangePercent / 100)  // e.g., -10% → factor = 1/0.9 = 1.111
            : 1 / (1 + tapRangePercent / 100); // e.g., +10% → factor = 1/1.1 = 0.909
        
        const resultBm = nominalBm * factor;
        return {
            Bm: resultBm,
            factor: factor,
            percentChange: ((factor - 1) * 100).toFixed(2)
        };
    }

    /**
     * Calculate OCTC (Off-Circuit Tap Changer) with accurate flux
     */
    function calculateOCTC(inputs, coreDesign) {
        console.log('🔄 [OCTC Accurate] Calculating off-circuit tap positions...');

        const {
            tapChangerType,
            tappingRange,
            tappingSide,
            hv,
            lv,
            frequency
        } = inputs;

        if (tapChangerType !== 'OCTC' && tapChangerType !== 'DETC') {
            return {
                applicable: false,
                type: tapChangerType,
                message: 'Not an off-circuit tap changer'
            };
        }

        const tapRangePercent = parseFloat(tappingRange) || 0;
        if (tapRangePercent === 0) {
            return {
                applicable: false,
                message: 'No tapping range specified'
            };
        }

        const nominalBm = parseFloat(coreDesign.fluxDensity) || 1.7;
        const isTappingHV = tappingSide === 'HV';
        const baseVoltage = isTappingHV ? parseFloat(hv) : parseFloat(lv);

        // ===== MINIMUM TAP (Lowest voltage, highest flux) =====
        const minTapVoltage = baseVoltage * (1 - tapRangePercent / 100);
        const minFluxResult = calculateAccurateTapFlux(nominalBm, tapRangePercent, true);
        const minTapFlux = minFluxResult.Bm;

        // ===== MAXIMUM TAP (Highest voltage, lowest flux) =====
        const maxTapVoltage = baseVoltage * (1 + tapRangePercent / 100);
        const maxFluxResult = calculateAccurateTapFlux(nominalBm, tapRangePercent, false);
        const maxTapFlux = maxFluxResult.Bm;

        // ===== VOLTS PER TURN =====
        const actualVPT = coreDesign.actualVoltsPerTurn || (baseVoltage * 1000) / (coreDesign.hvTurns || 500);
        const minTapVPT = actualVPT * minFluxResult.factor;
        const maxTapVPT = actualVPT * maxFluxResult.factor;

        // ===== COMPREHENSIVE WARNINGS =====
        const warnings = [];

        // Check minimum tap saturation
        if (minTapFlux > 1.85) {
            warnings.push({
                severity: 'CRITICAL',
                icon: '🔴',
                parameter: 'Minimum Tap Flux',
                value: minTapFlux.toFixed(3),
                limit: '≤ 1.85 T',
                message: `Flux ${minTapFlux.toFixed(3)}T at min tap exceeds 1.85T saturation point`,
                recommendation: 'REJECT: Reduce base Bm or tapping range to prevent core saturation and excessive I₀',
                standard: 'IEC 60076-1, IEEE C57.12.00'
            });
        } else if (minTapFlux > 1.75) {
            warnings.push({
                severity: 'HIGH',
                icon: '🟠',
                parameter: 'Minimum Tap Flux',
                value: minTapFlux.toFixed(3),
                limit: '≤ 1.75 T (design margin)',
                message: `Flux ${minTapFlux.toFixed(3)}T near saturation knee - reduced design margin`,
                recommendation: 'Consider design impact on core losses and no-load current at min tap',
                standard: 'IEC 60076-1'
            });
        }

        // Check maximum tap - minimum flux
        if (maxTapFlux < 1.15) {
            warnings.push({
                severity: 'MEDIUM',
                icon: '🟡',
                parameter: 'Maximum Tap Flux',
                value: maxTapFlux.toFixed(3),
                limit: '≥ 1.15 T (efficiency)',
                message: `Flux ${maxTapFlux.toFixed(3)}T at max tap is low - core may be oversized`,
                recommendation: 'Design inefficiency: core not utilized well at max tap. Consider smaller core or larger tapping range',
                standard: 'Design optimization'
            });
        }

        // Check voltage range adequacy
        const voltageSpread = maxTapVoltage - minTapVoltage;
        if (voltageSpread < baseVoltage * 0.15) {
            warnings.push({
                severity: 'LOW',
                icon: '🔵',
                parameter: 'Voltage Range',
                value: `±${(voltageSpread / baseVoltage * 50).toFixed(1)}%`,
                limit: '≥ ±7.5% spread',
                message: 'Limited voltage correction range',
                recommendation: 'May not provide adequate voltage regulation for system variations',
                standard: 'System design requirement'
            });
        }

        console.log(`   ✓ Min tap: ${minTapVoltage.toFixed(2)}kV, Bm: ${minTapFlux.toFixed(3)}T (${minFluxResult.percentChange}%)`);
        console.log(`   ✓ Max tap: ${maxTapVoltage.toFixed(2)}kV, Bm: ${maxTapFlux.toFixed(3)}T (${maxFluxResult.percentChange}%)`);
        console.log(`   ⚠️ Warnings: ${warnings.length}`);

        return {
            applicable: true,
            type: 'OCTC',
            tappingSide: tappingSide,
            tappingRange: tapRangePercent,
            
            // Nominal condition
            nominal: {
                voltage: baseVoltage,
                Bm: nominalBm,
                VPT: actualVPT,
                description: 'Rated tap position'
            },

            // Minimum tap
            minimumTap: {
                position: `-${tapRangePercent}%`,
                voltage: minTapVoltage.toFixed(2),
                Bm: minTapFlux.toFixed(3),
                BmChange: minFluxResult.percentChange,
                VPT: minTapVPT.toFixed(3),
                factor: minFluxResult.factor.toFixed(3),
                status: minTapFlux > 1.85 ? 'CRITICAL' : (minTapFlux > 1.75 ? 'WARNING' : 'OK'),
                concern: minTapFlux > 1.85 ? 'Saturation risk' : 'Design adequate'
            },

            // Maximum tap
            maximumTap: {
                position: `+${tapRangePercent}%`,
                voltage: maxTapVoltage.toFixed(2),
                Bm: maxTapFlux.toFixed(3),
                BmChange: maxFluxResult.percentChange,
                VPT: maxTapVPT.toFixed(3),
                factor: maxFluxResult.factor.toFixed(3),
                status: maxTapFlux < 1.15 ? 'LOW' : 'OK',
                concern: maxTapFlux < 1.15 ? 'Low utilization' : 'Design adequate'
            },

            // Summary
            summary: {
                fluxRange: {
                    min: minTapFlux.toFixed(3),
                    nominal: nominalBm.toFixed(3),
                    max: maxTapFlux.toFixed(3),
                    spread: (minTapFlux - maxTapFlux).toFixed(3)
                },
                voltageRange: {
                    min: minTapVoltage.toFixed(2),
                    nominal: baseVoltage.toFixed(2),
                    max: maxTapVoltage.toFixed(2)
                },
                designAdequacy: minTapFlux <= 1.85 && maxTapFlux >= 1.15 ? 'PASS' : 'REVIEW REQUIRED'
            },

            warnings: warnings,
            methodology: 'Accurate physics-based flux calculation (V/N ratio inversion)',
            standard: 'IEC 60076-1:2011, IEEE C57.12.00:2015',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate OLTC (On-Load Tap Changer) with comprehensive thermal analysis
     */
    function calculateOLTCAccurate(inputs, coreDesign, windingDesign) {
        console.log('⚡ [OLTC Accurate] Calculating on-load tap changer with thermal...');

        const { mva, hv, lv, tapChangerType, tappingRange, frequency } = inputs;
        
        if (!tapChangerType || tapChangerType === 'NONE') {
            return { present: false, type: 'NONE' };
        }

        if (tapChangerType !== 'OLTC') {
            return { present: false, type: tapChangerType, message: 'Not OLTC' };
        }

        const tapRange = parseFloat(tappingRange) || 10;
        const nominalBm = parseFloat(coreDesign.fluxDensity) || 1.7;

        // Standard OLTC step counts by range
        const stepConfig = {
            5: { steps: 9, stepPercent: 1.25, type: 'Standard ±5%' },
            10: { steps: 17, stepPercent: 1.18, type: 'Standard ±10%' },
            15: { steps: 25, stepPercent: 1.25, type: 'Extended ±15%' },
            20: { steps: 33, stepPercent: 1.22, type: 'Extended ±20%' }
        };

        const config = stepConfig[tapRange] || stepConfig[10];
        const totalSteps = config.steps;
        const stepPercent = tapRange * 2 / (totalSteps - 1); // Recalculate for accuracy

        // ===== VOLTAGE & CURRENT CALCULATIONS =====
        const hvVoltageBase = parseFloat(hv) * 1000; // V
        const lvVoltageBase = parseFloat(lv) * 1000; // V
        const hvCurrentBase = (mva * 1e6) / (Math.sqrt(3) * hvVoltageBase);
        const lvCurrentBase = (mva * 1e6) / (Math.sqrt(3) * lvCurrentBase);

        // ===== GENERATE COMPLETE TAP TABLE WITH PHYSICS =====
        const tapTable = [];
        const centerStep = Math.ceil(totalSteps / 2);

        for (let step = 1; step <= totalSteps; step++) {
            const stepOffset = step - centerStep;
            const tapPercent = stepOffset * stepPercent;
            const tapVoltageHV = hvVoltageBase * (1 + tapPercent / 100);
            const tapVoltageLV = lvVoltageBase; // LV constant if HV taps
            const tapCurrentHV = (mva * 1e6) / (Math.sqrt(3) * tapVoltageHV);
            const tapCurrentLV = (mva * 1e6) / (Math.sqrt(3) * tapVoltageLV);

            // Flux at tap position
            const fluxAtTap = stepOffset < 0
                ? nominalBm / (1 - Math.abs(stepOffset * stepPercent) / 100)
                : nominalBm / (1 + stepOffset * stepPercent / 100);

            tapTable.push({
                step: step,
                position: stepOffset === 0 ? 'NOMINAL' : (stepOffset > 0 ? `+${stepOffset}` : `${stepOffset}`),
                percentChange: tapPercent.toFixed(2),
                hvVoltage: (tapVoltageHV / 1000).toFixed(2),
                hvCurrent: tapCurrentHV.toFixed(2),
                lvVoltage: (tapVoltageLV / 1000).toFixed(2),
                lvCurrent: tapCurrentLV.toFixed(2),
                turnsRatio: (tapVoltageHV / tapVoltageLV).toFixed(4),
                fluxDensity: fluxAtTap.toFixed(3),
                fluxStatus: fluxAtTap > 1.85 ? '⚠️ HIGH' : (fluxAtTap > 1.75 ? '⚡ MED' : '✓ OK')
            });
        }

        // ===== TAP CHANGER CONTACT RESISTANCE & HEATING =====
        // Contact resistance: R_contact ≈ 10-100 μΩ per contact (data from manufacturer)
        const contactResistance = 25e-6; // 25 μΩ typical for medium-duty
        const minTapCurrent = Math.max(...tapTable.map(t => parseFloat(t.hvCurrent)));
        const maxContactPower = minTapCurrent ** 2 * contactResistance * 2; // Two contacts in series during transition

        // Selector arm impedance (typically 20-50 nΩ)
        const selectorImpedance = 35e-9; // 35 nΩ
        const selectorPower = hvCurrentBase ** 2 * selectorImpedance;

        // Diverter load resistance (for resistor-type OLTC)
        const diverterResistance = (hv / hvCurrentBase / 1000) * 0.01; // ~1% of impedance
        const diverterPower = hvCurrentBase ** 2 * diverterResistance;

        // ===== RESULTS =====
        return {
            present: true,
            type: 'OLTC',
            rating: `${mva} MVA, ${hv}/${lv} kV`,
            tappingRange: `±${tapRange}%`,
            totalSteps: totalSteps,
            stepSize: {
                percent: stepPercent.toFixed(3),
                voltage: ((stepPercent / 100) * hv).toFixed(3),
                unit: 'kV per step'
            },

            voltageRange: {
                minimum: (hvVoltageBase * (1 - tapRange / 100) / 1000).toFixed(2),
                nominal: hv,
                maximum: (hvVoltageBase * (1 + tapRange / 100) / 1000).toFixed(2),
                spread: `±${tapRange}%`
            },

            currentRange: {
                atMinimumVoltage: (hvCurrentBase * (1 + tapRange / 100)).toFixed(2),
                atNominalVoltage: hvCurrentBase.toFixed(2),
                atMaximumVoltage: (hvCurrentBase * (1 - tapRange / 100)).toFixed(2),
                unit: 'A'
            },

            fluxDensityRange: {
                minimum: (nominalBm / (1 + tapRange / 100)).toFixed(3),
                nominal: nominalBm.toFixed(3),
                maximum: (nominalBm / (1 - tapRange / 100)).toFixed(3),
                unit: 'T'
            },

            thermalAnalysis: {
                contactResistance: (contactResistance * 1e6).toFixed(1) + ' μΩ',
                maxContactPower: maxContactPower.toFixed(3) + ' W',
                selectorImpedance: (selectorImpedance * 1e9).toFixed(1) + ' nΩ',
                selectorPower: selectorPower.toFixed(6) + ' W',
                diverterResistance: diverterResistance.toFixed(6) + ' Ω',
                diverterPower: diverterPower.toFixed(3) + ' W',
                totalDissipation: (maxContactPower + selectorPower + diverterPower).toFixed(2) + ' W',
                note: 'Power dissipated in tap changer during transitions'
            },

            tapTable: tapTable,
            
            designValidation: {
                fluxAtMinTap: (nominalBm / (1 - tapRange / 100)).toFixed(3),
                fluxLimit: '≤ 1.85 T',
                fluxStatus: (nominalBm / (1 - tapRange / 100)) <= 1.85 ? 'PASS ✓' : 'FAIL ✗',
                fluxMargin: ((1.85 - nominalBm / (1 - tapRange / 100)) * 100 / nominalBm).toFixed(1) + '%'
            },

            recommendations: [
                'Verify tap changer mechanical endurance: typical duty cycle 1-10 operations/day',
                'Monitor diverter load resistance for overheating during rapid tap changes',
                'Ensure adequate contact material (typically silver-alloy plated copper)',
                'Verify selector arm spring tension for reliable contact pressure',
                'Check cooling system adequate for dissipation of tap transition losses'
            ],

            standard: 'IEC 60076-1:2011, IEEE C57.12.00:2015, IEC 60076-4 (Dielectric)',
            methodology: 'Physics-based voltage scaling with flux inversion, empirical contact analysis',
            timestamp: new Date().toISOString()
        };
    }

    // ===== EXPORT =====
    if (typeof window !== 'undefined') {
        window.calculateOCTCAccurate = calculateOCTC;
        window.calculateOLTCAccurate = calculateOLTCAccurate;
        window.calculateAccurateTapFlux = calculateAccurateTapFlux;
        console.log('✅ Accurate Tap Changer Module Loaded (v2.0)');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            calculateOCTCAccurate: calculateOCTC,
            calculateOLTCAccurate: calculateOLTCAccurate,
            calculateAccurateTapFlux: calculateAccurateTapFlux
        };
    }
})();
