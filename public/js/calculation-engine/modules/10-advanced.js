(function () {
    /**
     * ===============================================
     * MODULE 10: ADVANCED FEATURES, COSTING & ENGINEERING
     * Industry-Standard Transformer Design Calculator
     * Includes: OLTC, BIL, Cooling Design, INR Cost,
     *           Loss Guarantee Check, Altitude Derating,
     *           Multi-PF Voltage Regulation, Efficiency Warning
     * ===============================================
     */

    const CONSTANTS = typeof window !== 'undefined'
        ? window.CALC_CONSTANTS
        : require('../core/constants.js');

    const Utils = typeof window !== 'undefined'
        ? window.CalcUtils
        : require('../core/utils.js');

    const { ComputationError } = typeof window !== 'undefined'
        ? window.CalculationErrors
        : require('../core/errors.js');

    // ========================================
    // MATERIAL PRICES (INR) — Update as needed
    // ========================================
    const MATERIAL_PRICES = {
        crgoSteel: 180,    // ₹/kg — CRGO Grain Oriented
        crngoSteel: 120,    // ₹/kg — CRNGO
        copper: 650,    // ₹/kg — Electrolytic Copper
        aluminum: 220,    // ₹/kg — Aluminium
        mineralOil: 85,    // ₹/kg — Transformer Oil
        tankSteel: 100,    // ₹/kg — Structural Steel
        insulation: 500,    // ₹/kg — Kraft paper, nomex etc.
        bushingsHV: 25000,   // ₹/unit
        bushingsLV: 10000,   // ₹/unit
        oltcUnit: 800000,  // ₹ — OLTC mechanism
        coolingTube: 3000,  // ₹/tube
        laborCost: 0.15,  // 15% of material
        overheadCost: 0.12,  // 12% overhead
        profitMargin: 0.25   // 25% profit
    };

    // ========================================
    // 1. OLTC DESIGN CALCULATOR
    // ========================================
    function calculateOLTC(inputs) {
        const { mva, hv, lv, tapChangerType, tappingRange } = inputs;
        if (!tapChangerType || tapChangerType === 'NONE') {
            return { present: false };
        }

        const tapRange = tappingRange || 10;   // ±10% default
        const tapSteps = tapChangerType === 'OLTC' ? 17 : 9; // standard steps
        const stepPercent = (tapRange * 2) / tapSteps;       // % per step

        const baseCurrent = (mva * 1000) / (Math.sqrt(3) * hv); // HV current
        const stepVoltage = (hv * stepPercent) / 100;           // voltage per step kV
        const stepCurrent = baseCurrent;                         // constant current

        // Generate tap position table
        const tapTable = [];
        const numSteps = Math.floor(tapSteps / 2);
        for (let i = -numSteps; i <= numSteps; i++) {
            const tapPercent = i * stepPercent;
            const tapVoltage = hv * (1 + tapPercent / 100);
            const tapCurrent = (mva * 1000) / (Math.sqrt(3) * tapVoltage);
            tapTable.push({
                position: i === 0 ? 'NOMINAL' : (i > 0 ? `+${i}` : `${i}`),
                percent: Utils.round(tapPercent, 2),
                hvVoltage: Utils.round(tapVoltage, 1),
                current: Utils.round(tapCurrent, 1),
                turnsRatio: Utils.round(tapVoltage / lv, 2)
            });
        }

        return {
            present: true,
            type: tapChangerType,
            tapRange: `±${tapRange}%`,
            tapSteps: tapSteps,
            stepPercent: Utils.round(stepPercent, 2),
            stepVoltage: Utils.round(stepVoltage, 2),
            ratedCurrent: Utils.round(baseCurrent, 1),
            tapTable
        };
    }

    // ========================================
    // 2. BIL & INSULATION CALCULATOR
    // ========================================
    function calculateBIL(inputs, hvBILkV, lvBILkV) {
        // BIL lookup per IEC 60076-3
        function getBIL(vkV) {
            if (vkV <= 1.1) return { bil: 10, chopped: 12, powerFreq: 5, label: '≤1.1 kV' };
            if (vkV <= 3.6) return { bil: 20, chopped: 24, powerFreq: 10, label: '3.6 kV' };
            if (vkV <= 7.2) return { bil: 40, chopped: 50, powerFreq: 20, label: '7.2 kV' };
            if (vkV <= 12) return { bil: 75, chopped: 88, powerFreq: 28, label: '12 kV' };
            if (vkV <= 24) return { bil: 125, chopped: 150, powerFreq: 50, label: '24 kV' };
            if (vkV <= 36) return { bil: 170, chopped: 200, powerFreq: 70, label: '36 kV' };
            if (vkV <= 52) return { bil: 250, chopped: 310, powerFreq: 95, label: '52 kV' };
            if (vkV <= 72.5) return { bil: 325, chopped: 380, powerFreq: 140, label: '72.5 kV' };
            if (vkV <= 123) return { bil: 550, chopped: 640, powerFreq: 230, label: '123 kV' };
            if (vkV <= 145) return { bil: 650, chopped: 750, powerFreq: 275, label: '145 kV' };
            if (vkV <= 245) return { bil: 1050, chopped: 1200, powerFreq: 460, label: '245 kV' };
            if (vkV <= 420) return { bil: 1425, chopped: 1575, powerFreq: 630, label: '420 kV' };
            return { bil: 1550, chopped: 1720, powerFreq: 680, label: '>420 kV' };
        }

        const hv = getBIL(inputs.hv);
        const lv = getBIL(inputs.lv);

        // Minimum clearances mm (IEC 60076-3 Table 2, approximate)
        function clearance(bil) {
            if (bil <= 75) return { oil: 25, air: 40, creepage: 100 };
            if (bil <= 170) return { oil: 45, air: 75, creepage: 180 };
            if (bil <= 325) return { oil: 75, air: 120, creepage: 320 };
            if (bil <= 650) return { oil: 130, air: 200, creepage: 560 };
            if (bil <= 1050) return { oil: 210, air: 310, creepage: 900 };
            return { oil: 290, air: 430, creepage: 1200 };
        }

        return {
            hv: { ...hv, clearance: clearance(hv.bil) },
            lv: { ...lv, clearance: clearance(lv.bil) },
            standard: 'IEC 60076-3'
        };
    }

    // ========================================
    // 3. COOLING SYSTEM DESIGN
    // ========================================
    function calculateCoolingSystem(inputs, losses, dimensions) {
        const totalLossW = losses.totalLoss * 1000; // W
        const coolingType = inputs.cooling || 'ONAN';
        const ambientTemp = inputs.ambientTemp || 30;

        // Dissipation coefficients (W/m²·°C)
        const coefficients = {
            'ONAN': 6.5,
            'ONAF': 12,
            'OFAF': 18,
            'ONAN/ONAF': 9,
            'OFWF': 25
        };
        const K = coefficients[coolingType] || 6.5;

        // Allow 60°C average temperature rise for oil
        const tempRise = 60;
        const requiredSurface = totalLossW / (K * tempRise); // m²

        // Tank surface available
        const tankH = (dimensions.tank.height || 2000) / 1000; // m
        const tankL = (dimensions.tank.length || 1500) / 1000;
        const tankW = (dimensions.tank.width || 1000) / 1000;
        const tankSurface = 2 * (tankH * tankL + tankH * tankW); // m² (sides only)

        // Extra surface needed via cooling tubes
        const extraSurface = Math.max(0, requiredSurface - tankSurface);
        const tubeSurfaceEach = 0.08; // m² per plain tube (approx 1m x 50mm dia)
        const tubesRequired = Math.ceil(extraSurface / tubeSurfaceEach);

        // Radiator alternative
        const radiatorPanels = Math.ceil(tubesRequired / 18); // ~18 tubes/panel

        // Fans if ONAF
        const fansRequired = coolingType.includes('AF')
            ? Math.max(2, Math.ceil(totalLossW / 8000))
            : 0;

        // Oil pump if OF
        const pumpRequired = coolingType.startsWith('OF');

        return {
            coolingType,
            totalLossW: Utils.round(totalLossW, 0),
            tempRise: tempRise,
            heatDissipCoeff: K,
            requiredSurface: Utils.round(requiredSurface, 2),
            tankSurface: Utils.round(tankSurface, 2),
            extraSurface: Utils.round(extraSurface, 2),
            tubesRequired,
            radiatorPanels,
            fansRequired,
            pumpRequired,
            recommendation: tubesRequired === 0
                ? `✅ Tank surface area sufficient for ${coolingType} cooling`
                : `💡 Add ${tubesRequired} cooling tubes (${radiatorPanels} radiator panel(s))`
        };
    }

    // ========================================
    // 4. MATERIAL COST ESTIMATION (INR)
    // ========================================
    function calculateMaterialCost(inputs, calculations) {
        const { coreDesign, conductors, dimensions, losses } = calculations;
        const { windingMaterial, coreMaterial, cooling, tapChangerType } = inputs;

        const coreWeight = dimensions.weights.core || coreDesign.weight || 0;
        const windingWeight = dimensions.weights.windings || conductors.totalWeight || 0;
        const tankWeight = dimensions.weights.tank ||
            (dimensions.tank.length * dimensions.tank.width * dimensions.tank.height * 0.001 * 7.85) || 0;
        const oilVolume = dimensions.oil?.volume || 0; // liters
        const oilWeight = oilVolume * 0.895;                // kg (mineral oil density)

        // Core material cost
        const coreRate = coreMaterial === 'CRGO'
            ? MATERIAL_PRICES.crgoSteel
            : MATERIAL_PRICES.crngoSteel;
        const coreCost = coreWeight * coreRate;

        // Winding cost
        const windingRate = windingMaterial === 'Copper'
            ? MATERIAL_PRICES.copper
            : MATERIAL_PRICES.aluminum;
        const windingCost = windingWeight * windingRate;

        // Insulation (approx 15% of winding weight for paper/pressboard)
        const insulationWeight = windingWeight * 0.15;
        const insulationCost = insulationWeight * MATERIAL_PRICES.insulation;

        // Tank cost
        const tankCost = tankWeight * MATERIAL_PRICES.tankSteel;

        // Oil cost
        const oilCost = oilWeight * MATERIAL_PRICES.mineralOil;

        // Bushings
        const hvBushings = 3; // 3-phase
        const lvBushings = 3;
        const bushingCost = (hvBushings * MATERIAL_PRICES.bushingsHV) +
            (lvBushings * MATERIAL_PRICES.bushingsLV);

        // OLTC
        const oltcCost = (tapChangerType && tapChangerType !== 'NONE')
            ? MATERIAL_PRICES.oltcUnit : 0;

        // Cooling tubes (estimate)
        const estimatedTubes = Math.max(0, Math.ceil(losses.totalLoss * 2));
        const coolingCost = estimatedTubes * MATERIAL_PRICES.coolingTube;

        // Subtotals
        const directMaterial = coreCost + windingCost + insulationCost +
            tankCost + oilCost + bushingCost + oltcCost + coolingCost;
        const laborCost = directMaterial * MATERIAL_PRICES.laborCost;
        const overheadCost = directMaterial * MATERIAL_PRICES.overheadCost;
        const totalCost = directMaterial + laborCost + overheadCost;
        const sellingPrice = totalCost * (1 + MATERIAL_PRICES.profitMargin);

        function inr(n) {
            // Format as Indian lakhs/crores
            if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
            if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
            return `₹${Math.round(n).toLocaleString('en-IN')}`;
        }

        return {
            breakdown: {
                coreCost: { raw: Math.round(coreCost), fmt: inr(coreCost), label: `Core (${coreMaterial})` },
                windingCost: { raw: Math.round(windingCost), fmt: inr(windingCost), label: `Winding (${windingMaterial})` },
                insulationCost: { raw: Math.round(insulationCost), fmt: inr(insulationCost), label: 'Insulation (paper/pressboard)' },
                tankCost: { raw: Math.round(tankCost), fmt: inr(tankCost), label: 'Oil Tank (MS Steel)' },
                oilCost: { raw: Math.round(oilCost), fmt: inr(oilCost), label: 'Transformer Oil' },
                bushingCost: { raw: Math.round(bushingCost), fmt: inr(bushingCost), label: 'HV/LV Bushings' },
                oltcCost: { raw: Math.round(oltcCost), fmt: inr(oltcCost), label: 'OLTC/DETC' },
                coolingCost: { raw: Math.round(coolingCost), fmt: inr(coolingCost), label: 'Cooling Tubes' }
            },
            directMaterial: { raw: Math.round(directMaterial), fmt: inr(directMaterial) },
            laborCost: { raw: Math.round(laborCost), fmt: inr(laborCost) },
            overheadCost: { raw: Math.round(overheadCost), fmt: inr(overheadCost) },
            totalCost: { raw: Math.round(totalCost), fmt: inr(totalCost) },
            sellingPrice: { raw: Math.round(sellingPrice), fmt: inr(sellingPrice) },
            currency: 'INR'
        };
    }

    // ========================================
    // 5. LOSS GUARANTEE CHECK
    // ========================================
    function checkLossGuarantees(inputs, losses) {
        const noLoad = losses.noLoadLoss;
        const load = losses.loadLoss;

        // Guaranteed values (use input-provided or IEC defaults per MVA)
        const guaranteedNoLoad = inputs.guaranteedNoLoad ||
            (inputs.mva * 0.0015 * 1000); // 0.15% of MVA as kW default
        const guaranteedLoad = inputs.guaranteedLoad ||
            (inputs.mva * 0.005 * 1000); // 0.5% of MVA as kW default

        const noLoadMargin = ((guaranteedNoLoad - noLoad) / guaranteedNoLoad) * 100;
        const loadMargin = ((guaranteedLoad - load) / guaranteedLoad) * 100;

        const noLoadStatus = noLoad <= guaranteedNoLoad ? 'PASS' : 'FAIL';
        const loadStatus = load <= guaranteedLoad ? 'PASS' : 'FAIL';
        const overall = (noLoadStatus === 'PASS' && loadStatus === 'PASS') ? 'PASS' : 'FAIL';

        return {
            noLoad: {
                calculated: Utils.round(noLoad, 2),
                guaranteed: Utils.round(guaranteedNoLoad, 2),
                margin: Utils.round(noLoadMargin, 1),
                status: noLoadStatus
            },
            load: {
                calculated: Utils.round(load, 2),
                guaranteed: Utils.round(guaranteedLoad, 2),
                margin: Utils.round(loadMargin, 1),
                status: loadStatus
            },
            overall
        };
    }

    // ========================================
    // 6. ALTITUDE DERATING (IEC 60076-2)
    // ========================================
    function calculateAltitudeDerating(inputs, temperature) {
        const altitude = inputs.altitude || 0;
        const topOilRise = temperature.topOilRise || 55;
        const windingRise = temperature.windingRise || temperature.windingHotspotRise || 65;

        if (altitude <= 1000) {
            return {
                altitude,
                deratingFactor: 1.0,
                deratingPercent: '0%',
                adjustedTopOilLimit: 60,
                adjustedWindingLimit: 65,
                topOilCompliance: topOilRise <= 60 ? 'PASS' : 'FAIL',
                windingCompliance: windingRise <= 65 ? 'PASS' : 'FAIL',
                overallStatus: (topOilRise <= 60 && windingRise <= 65) ? 'PASS' : 'FAIL',
                recommendation: '✅ No altitude derating required (altitude ≤ 1000 m)'
            };
        }

        const excess = altitude - 1000;
        const deratingPct = 0.5 * (excess / 100);
        const deratingFactor = 1 - (deratingPct / 100);
        const adjTopOil = 60 * deratingFactor;
        const adjWinding = 65 * deratingFactor;

        const topOilOK = topOilRise <= adjTopOil;
        const windingOK = windingRise <= adjWinding;

        let rec = '';
        if (topOilOK && windingOK) {
            rec = `✅ Design meets altitude-adjusted limits (${altitude} m)`;
        } else {
            rec = `⚠️ Design exceeds altitude-adjusted limits at ${altitude} m. Consider:`;
            if (!topOilOK) rec += ' (1) Improve cooling system.';
            if (!windingOK) rec += ' (2) Reduce current density.';
        }

        return {
            altitude,
            excessAltitude: excess,
            deratingFactor: Utils.round(deratingFactor, 3),
            deratingPercent: Utils.round(deratingPct, 1) + '%',
            baseTopOilLimit: 60,
            baseWindingLimit: 65,
            adjustedTopOilLimit: Utils.round(adjTopOil, 1),
            adjustedWindingLimit: Utils.round(adjWinding, 1),
            currentTopOilRise: Utils.round(topOilRise, 1),
            currentWindingRise: Utils.round(windingRise, 1),
            topOilCompliance: topOilOK ? 'PASS' : 'FAIL',
            windingCompliance: windingOK ? 'PASS' : 'FAIL',
            overallStatus: (topOilOK && windingOK) ? 'PASS' : 'FAIL',
            recommendation: rec
        };
    }

    // ========================================
    // 7. VOLTAGE REGULATION AT MULTIPLE PF
    // ========================================
    function calculateVoltageRegulation(inputs, impedance) {
        const percentR = impedance.resistancePercent || 0.5;
        const percentX = impedance.reactancePercent || impedance.impedancePercent || inputs.impedance || 12.5;

        function regulation(pf, lag) {
            const theta = Math.acos(pf);
            const sin_t = Math.sin(theta);
            const cos_t = pf;
            // Approximate regulation formula (IEC 60076-1)
            const eps = (lag ? 1 : -1);
            const reg = percentR * cos_t + eps * percentX * sin_t +
                Math.pow(percentX * cos_t - eps * percentR * sin_t, 2) / 200;
            return Utils.round(reg, 3);
        }

        return {
            percentR: Utils.round(percentR, 3),
            percentX: Utils.round(percentX, 3),
            regulationUnity: regulation(1.0, true),
            regulationLag08: regulation(0.8, true),
            regulationLag06: regulation(0.6, true),
            regulationLead08: regulation(0.8, false),
            standard: 'IEC 60076-1 Eq. 7'
        };
    }

    // ========================================
    // 8. EFFICIENCY WARNING & RECOMMENDATION
    // ========================================
    function checkEfficiencyWarning(inputs, losses) {
        const efficiency = losses.efficiency;
        const target = inputs.minEfficiency || 99.0;

        if (efficiency >= target) {
            return { hasIssue: false, efficiency, target };
        }

        const deficit = Utils.round(target - efficiency, 3);
        const currentDen = inputs.currentDensity || 2.5;
        const recommended = Utils.round(currentDen * 0.85, 2); // 15% reduction

        return {
            hasIssue: true,
            efficiency,
            target,
            deficit,
            message: `Efficiency ${efficiency}% is below target ${target}%`,
            recommendation: `Reduce current density from ${currentDen} to ${recommended} A/mm²`,
            expectedImprovement: 'Expected to bring efficiency within target range'
        };
    }

    // ========================================
    // 9. INRUSH CURRENT ESTIMATION (IEC 60076-1 Annex B)
    // ========================================
    function calculateInrushCurrent(inputs, coreDesign, currents) {
        const { mva, hv, frequency, phases, coreMaterial, fluxDensity } = inputs;
        const { hvCurrent } = currents;

        // Peak flux density at inrush: Bpeak = B_rated + B_residual
        // Residual flux: 0.7–0.85 × B_rated for CRGO (worst-case switch-on)
        const residualFactor = coreMaterial === 'CRGO' ? 0.80 : 0.65;
        const B_peak = fluxDensity + residualFactor * fluxDensity; // T (worst case)

        // At this flux level, core saturates → magnetizing impedance ≈ 0
        // Inrush limited only by winding resistance + leakage reactance (air-core inductance)
        // Approximation per IEC 60076-1 Annex B:
        //   I_inrush_peak ≈ √2 × V / (ω × L_air)
        // L_air ≈ (μ₀ × N² × A_window) / H_window  (air-core inductance)
        //
        // Simplified industry rule-of-thumb (widely used):
        //   I_inrush_peak = K_inrush × I_rated  (K = 6–14 typical for power transformers)
        // Using empirical formula: K ≈ 8 + 4 × (B_peak / 1.7 - 1) corrected for MVA
        const B_ratio = Math.min(B_peak / fluxDensity, 2.5); // cap at 2.5×
        const K_base = 8;   // base multiplier at nominal flux
        const K_sat = 1.5 * (B_ratio - 1);   // saturation contribution
        const K_mva = Math.max(0, 1 - 0.01 * mva); // larger units have lower ratio
        const K_inrush = Math.max(4, K_base + K_sat - K_mva * 2);

        const peakInrush = K_inrush * hvCurrent * Math.SQRT2; // A peak
        const rmsInrush = peakInrush / Math.SQRT2;           // A rms (1st half-cycle)

        // Decay time constant τ = L_m / R_winding ≈ 0.1–0.5 s for large units
        const tau = mva < 5 ? 0.05 : mva < 50 ? 0.15 : mva < 200 ? 0.3 : 0.5; // seconds
        const decayTo2Pct_cycles = Math.ceil((tau * Math.log(50)) / (1 / frequency)); // cycles to decay to 2%

        return {
            peakInrush: Utils.round(peakInrush, 0),       // A peak
            rmsInrush: Utils.round(rmsInrush, 0),         // A rms
            multipleOfRated: Utils.round(K_inrush, 1),    // × I_rated
            residualFluxFactor: residualFactor,
            bPeak: Utils.round(B_peak, 2),                 // T
            decayTimeConstant: tau,                        // seconds
            decayTo2PctCycles: decayTo2Pct_cycles,        // electrical cycles
            note: 'Worst-case estimate (closing at voltage zero-crossing, full residual flux)',
            methodology: 'IEC 60076-1 Annex B — Inrush approximation'
        };
    }

    // ========================================
    // 10. OIL BREAKDOWN VOLTAGE (BDV) CHECK  (IEC 60296)
    // ========================================
    function checkOilBDV(inputs, bil) {
        // Mineral transformer oil breakdown voltage
        // IEC 60296 Grade I (new oil): BDV ≥ 30 kV (2.5 mm gap standard test)
        // Field strength limit = BDV / gap = 30 / 2.5 = 12 kV/mm new, degrades to ~10 kV/mm in service
        const oilDielectricStrength = 12; // kV/mm (new mineral oil per IEC 60296)
        const serviceDerating = 0.75; // aged oil service factor
        const serviceDielectric = oilDielectricStrength * serviceDerating; // kV/mm

        const hvBIL_kV = bil.hv.bil;             // kV peak
        const hvGap_mm = bil.hv.clearance.oil;   // mm minimum clearance
        const lvBIL_kV = bil.lv.bil;
        const lvGap_mm = bil.lv.clearance.oil;

        // Peak field ≈ BIL / (√2 × oil gap)  (simplified uniform field assumption)
        const hvField_kVmm = hvBIL_kV / (Math.SQRT2 * hvGap_mm);
        const lvField_kVmm = lvBIL_kV / (Math.SQRT2 * lvGap_mm);

        // Enhancement factor for non-uniform field (sphere–plane gap): κ ≈ 1.2–1.5
        const kappa = 1.3;
        const hvFieldEff = hvField_kVmm * kappa;
        const lvFieldEff = lvField_kVmm * kappa;

        const hvMargin_pct = ((serviceDielectric - hvFieldEff) / serviceDielectric) * 100;
        const lvMargin_pct = ((serviceDielectric - lvFieldEff) / serviceDielectric) * 100;

        return {
            oilGrade: 'Mineral Oil (IEC 60296 Grade I)',
            newOilBDV: oilDielectricStrength, // kV/mm
            serviceBDV: serviceDielectric,     // kV/mm (aged)
            hv: {
                bilKV: hvBIL_kV,
                clearance_mm: hvGap_mm,
                fieldStrength: Utils.round(hvFieldEff, 2),   // kV/mm
                limit: serviceDielectric,
                margin: Utils.round(hvMargin_pct, 1), // %
                status: hvMargin_pct > 0 ? 'PASS' : 'FAIL'
            },
            lv: {
                bilKV: lvBIL_kV,
                clearance_mm: lvGap_mm,
                fieldStrength: Utils.round(lvFieldEff, 2),
                limit: serviceDielectric,
                margin: Utils.round(lvMargin_pct, 1),
                status: lvMargin_pct > 0 ? 'PASS' : 'FAIL'
            },
            overall: (hvMargin_pct > 0 && lvMargin_pct > 0) ? 'PASS' : 'FAIL',
            standard: 'IEC 60296 / IEC 60076-3'
        };
    }

    // ========================================
    // 11. TANK DESIGN PRESSURE  (IEC 60076-1)
    // ========================================
    function calculateTankPressure(inputs, dimensions, losses) {
        // Internal tank pressure arises from:
        // (a) Thermal oil expansion on load (steady state + fault)
        // (b) Gas generation on arcing (transient)
        // IEC 60076-1 Annex A provides guidance.

        // Tank dimensions
        const tankH_m = (dimensions.tank.height || 2000) / 1000; // m
        const oilVolL = dimensions.oil?.volume || 1000;           // litres
        const oilVol_m3 = oilVolL / 1000;                        // m³

        // Oil properties (mineral, IEC 60296)
        const rhoOil = 880;    // kg/m³ at 15°C
        const betaOil = 7.5e-4; // /°C thermal expansion coefficient
        const g = 9.81;   // m/s²

        // Temperature rise to worst-case fault: assume winding hot-spot reaches 250°C
        // Delta T from 20°C ambient to 250°C = 230°C (adiabatic worst case)
        const deltaT_fault = 230; // °C
        const deltaT_normal = (inputs.ambientTemp || 40) + 55; // top oil rise on load

        // Volume expansion (m³)
        const deltaV_fault = oilVol_m3 * betaOil * deltaT_fault;
        const deltaV_normal = oilVol_m3 * betaOil * deltaT_normal;

        // Pressure at bottom of tank due to static oil head (hydrostatic)
        const hydrostaticPressure_kPa = rhoOil * g * tankH_m / 1000; // kPa

        // Dynamic pressure from fault expansion (simplified: ΔP ≈ β × ΔT × bulk modulus)
        // Bulk modulus of oil ≈ 1600 MPa → but tank is not rigid, so use containment volume change
        // Approximate: ΔP = ρ × g × (ΔV/A_expansion) where A is conservator cross-section
        // For a sealed tank with conservator, pressure is atmospheric + conservator head
        // For sealed rigid tank: use gas-spring model (cushion pressure approach)
        // Practical industry approximation:
        //   P_fault ≈ P_hydrostatic + 10–30 kPa (gas pressure from arc products)
        const faultSurge_kPa = 20; // kPa — typical arc gas surge
        const thermalPressure_kPa = rhoOil * g * (deltaV_normal / (oilVol_m3 * 0.05)) / 1000; // kPa, assuming 5% headspace

        const designPressure_kPa = hydrostaticPressure_kPa + thermalPressure_kPa;
        const faultPressure_kPa = designPressure_kPa + faultSurge_kPa;

        // Standard tank design pressure limits (IEC 60076-1)
        const normalLimit_kPa = 75;  // kPa — normal rated pressure
        const faultLimit_kPa = 150; // kPa — fault withstand (pressure relief valve setting)

        return {
            // Inputs
            tankHeight_m: Utils.round(tankH_m, 2),
            oilVolume_L: Math.round(oilVolL),
            deltaT_normal_C: Math.round(deltaT_normal),
            deltaT_fault_C: deltaT_fault,

            // Volumes
            oilExpansion_normal_L: Utils.round(deltaV_normal * 1000, 1),
            oilExpansion_fault_L: Utils.round(deltaV_fault * 1000, 1),

            // Pressures
            hydrostaticPressure_kPa: Utils.round(hydrostaticPressure_kPa, 1),
            thermalPressure_kPa: Utils.round(thermalPressure_kPa, 1),
            designPressure_kPa: Utils.round(designPressure_kPa, 1),
            faultPressure_kPa: Utils.round(faultPressure_kPa, 1),

            // Limits & status
            normalLimit_kPa,
            faultLimit_kPa,
            normalStatus: designPressure_kPa <= normalLimit_kPa ? 'PASS' : 'OVER-PRESSURE',
            faultStatus: faultPressure_kPa <= faultLimit_kPa ? 'PASS' : 'NEEDS PRV',

            // Recommendation
            recommendation: faultPressure_kPa > faultLimit_kPa
                ? `⚠️ Install pressure relief valve (PRV) rated >${Math.ceil(faultPressure_kPa)} kPa. Consider conservator expansion tank.`
                : '✅ Tank design pressure within IEC 60076-1 limits. Conservator or sealed design acceptable.',

            standard: 'IEC 60076-1 Annex A / IEC 60076-7'
        };
    }

    // ========================================
    // MAIN ENTRY — calculateAdvancedFeatures()
    // ========================================
    function calculateAdvancedFeatures(inputs, calculations) {
        console.log('🔬 [Module 10] Calculating advanced features...');

        try {
            const { dimensions, losses, coreDesign, conductors, windingDesign } = calculations;
            const { mva, hv, lv } = inputs;

            // Noise (NEMA/IEC approx)
            const noiseLevel = 55 + (12 * Math.log10(mva));

            // 1. OLTC
            const oltc = calculateOLTC(inputs);

            // 2. BIL
            const bil = calculateBIL(inputs);

            // 3. Cooling system
            const cooling = calculateCoolingSystem(inputs, losses, dimensions);

            // 4. Material cost (INR)
            const cost = calculateMaterialCost(inputs, calculations);

            // 5. Loss guarantee check
            const lossGuarantee = checkLossGuarantees(inputs, losses);

            // 6. Altitude derating
            const temperature = calculations.temperature || {};
            const altitude = calculateAltitudeDerating(inputs, temperature);

            // 7. Multi-PF voltage regulation
            const impedance = calculations.impedance || {};
            const regulation = calculateVoltageRegulation(inputs, impedance);

            // 8. Efficiency warning
            const efficiencyWarning = checkEfficiencyWarning(inputs, losses);

            // 9. Inrush current
            const inrush = calculateInrushCurrent(inputs, coreDesign, calculations.currents || { hvCurrent: (inputs.mva * 1e6) / (1.732 * inputs.hv * 1000) });

            // 10. Oil BDV check
            const oilBDV = checkOilBDV(inputs, bil);

            // 11. Tank pressure
            const tankPressure = calculateTankPressure(inputs, dimensions, losses);

            // Legacy USD economics (kept for reference)
            const A_factor = 6000, B_factor = 2000;
            const lossCapitalization = (losses.noLoadLoss * A_factor) + (losses.loadLoss * B_factor);
            const usdPrice = cost.totalCost.raw / 83; // rough USD conversion

            console.log('   ✅ Advanced calculations complete');

            return {
                parameters: {
                    noiseLevel: Utils.round(noiseLevel, 1),
                    insulation: { hvBIL: bil.hv.bil, lvBIL: bil.lv.bil }
                },
                oltc,
                bil,
                cooling,
                costINR: cost,
                lossGuarantee,
                altitude,
                regulation,
                efficiencyWarning,
                inrush,
                oilBDV,
                tankPressure,
                economics: {
                    materialCost: cost.totalCost.raw,
                    estimatedPrice: Math.round(usdPrice),
                    lossCapitalization: {
                        total: Math.round(lossCapitalization)
                    },
                    totalOwnershipCost: Math.round(usdPrice + lossCapitalization),
                    currency: 'USD (approx)'
                },
                metadata: {
                    methodology: 'IEC 60076 Series',
                    currency: 'INR primary / USD reference',
                    baseYear: 2025
                }
            };

        } catch (error) {
            console.error('❌ Error in advanced calculation:', error);
            throw new ComputationError(
                `Advanced calculation failed: ${error.message}`,
                'Advanced', 'calculateAdvancedFeatures', inputs
            );
        }
    }

    // ========================================
    // EXPORTS
    // ========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            calculateAdvancedFeatures,
            calculateOLTC,
            calculateBIL,
            calculateCoolingSystem,
            calculateMaterialCost,
            checkLossGuarantees,
            calculateAltitudeDerating,
            calculateVoltageRegulation,
            checkEfficiencyWarning,
            calculateInrushCurrent,
            checkOilBDV,
            calculateTankPressure
        };
    }

    if (typeof window !== 'undefined') {
        window.CalcModule_Advanced = {
            calculateAdvancedFeatures,
            calculateOLTC,
            calculateBIL,
            calculateCoolingSystem,
            calculateMaterialCost,
            checkLossGuarantees,
            calculateAltitudeDerating,
            calculateVoltageRegulation,
            checkEfficiencyWarning,
            calculateInrushCurrent,
            checkOilBDV,
            calculateTankPressure
        };
    }
})();
