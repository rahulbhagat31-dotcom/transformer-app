/**
 * Winding Calculation Module - 22-Parameter Atlanta Engineering Format
 */

const WindingCalc = {
    // Constants
    RESISTIVITY_CU: 0.0211, // ohm-mm2/m at 75°C
    DENSITY_CU: 8.89,      // gm/cm3

    /**
     * Main calculation entry point
     * @param {Object} inputs - Raw values from UI
     * @returns {Object} Calculated parameters and formulas
     */
    calculate: function (inputs, tapMode) {
        tapMode = tapMode || 'normal';
        const results = {};
        const showWorking = {};

        // 1. Phase Current (A)
        // Group A basics
        const mva = inputs.mva;
        const hvLineKV = inputs.hv;
        const lvLineKV = inputs.lv;
        const vg = inputs.vectorGroup;

        // Vector Group Rules for Phase Voltage
        let hvPhaseV, lvPhaseV;
        if (vg === 'YNyn0' || vg === 'YNd1' || vg === 'Yd1') {
            hvPhaseV = (hvLineKV * 1000) / Math.sqrt(3);
        } else {
            hvPhaseV = hvLineKV * 1000;
        }

        if (vg === 'YNyn0' || vg === 'Dyn11' || vg === 'YDn11') {
            lvPhaseV = (lvLineKV * 1000) / Math.sqrt(3);
        } else {
            lvPhaseV = lvLineKV * 1000;
        }

        // Phase Currents
        // Formula: (MVA * 10^6) / (3 * PhaseVoltage)
        const lvPhaseI = (mva * 1000000) / (3 * lvPhaseV);
        const hvPhaseI = (mva * 1000000) / (3 * hvPhaseV);

        results.sr1 = {
            lv: lvPhaseI.toFixed(2),
            hvMain: hvPhaseI.toFixed(2),
            hvTap: hvPhaseI.toFixed(2)
        };
        showWorking.sr1 = '(MVA × 10⁶) / (3 × PhaseVoltage)';

        // 2. Bare Copper Size (mm)
        results.sr2 = {
            lv: `${inputs.bareWidthLV} × ${inputs.bareThicknessLV}`,
            hvMain: `${inputs.bareWidthHV} × ${inputs.bareThicknessHV}`,
            hvTap: `${inputs.bareWidthTap} × ${inputs.bareThicknessTap}`
        };

        // 3. No. of Parallel Conductors
        results.sr3 = {
            lv: inputs.nCondLV,
            hvMain: inputs.nCondHV,
            hvTap: inputs.nCondTap
        };

        // 4. No. of Parallel Coils
        results.sr4 = {
            lv: inputs.nCoilLV,
            hvMain: inputs.nCoilHV,
            hvTap: inputs.nCoilTap
        };

        // 5. Gross CSA of single conductor (mm2)
        const lvGross = inputs.bareWidthLV * inputs.bareThicknessLV;
        const hvMainGross = inputs.bareWidthHV * inputs.bareThicknessHV;
        const hvTapGross = inputs.bareWidthTap * inputs.bareThicknessTap;

        results.sr5 = {
            lv: lvGross.toFixed(3),
            hvMain: hvMainGross.toFixed(3),
            hvTap: hvTapGross.toFixed(3)
        };
        showWorking.sr5 = 'Width × Thickness';

        // 6. Corner Radius (mm)
        results.sr6 = {
            lv: inputs.cornerRadiusLV,
            hvMain: inputs.cornerRadiusHV,
            hvTap: inputs.cornerRadiusTap
        };

        // 7. Corner Area Reduction (mm2)
        // Formula: (4 - PI) * r^2
        const calcAreaRed = (r) => (4 - Math.PI) * Math.pow(r, 2);
        const lvRed = calcAreaRed(inputs.cornerRadiusLV);
        const hvMainRed = calcAreaRed(inputs.cornerRadiusHV);
        const hvTapRed = calcAreaRed(inputs.cornerRadiusTap);

        results.sr7 = {
            lv: lvRed.toFixed(3),
            hvMain: hvMainRed.toFixed(3),
            hvTap: hvTapRed.toFixed(3)
        };
        showWorking.sr7 = '(4 - π) × r²';

        // 8. Total Net CSA (mm2)
        // Formula: (GrossCSA - Reduction) * n_cond * n_coil
        const lvNet = (lvGross - lvRed) * inputs.nCondLV * inputs.nCoilLV;
        const hvMainNet = (hvMainGross - hvMainRed) * inputs.nCondHV * inputs.nCoilHV;
        const hvTapNet = (hvTapGross - hvTapRed) * inputs.nCondTap * inputs.nCoilTap;

        results.sr8 = {
            lv: lvNet.toFixed(3),
            hvMain: hvMainNet.toFixed(3),
            hvTap: hvTapNet.toFixed(3)
        };
        showWorking.sr8 = '(Gross - Reduction) × n_cond × n_coil';

        // 9. Current Density (A/mm2)
        // Formula: PhaseCurrent / NetCSA
        const lvJ = lvPhaseI / lvNet;
        const hvMainJ = hvPhaseI / hvMainNet;
        const hvTapJ = hvPhaseI / hvTapNet;

        results.sr9 = {
            lv: lvJ.toFixed(3),
            hvMain: hvMainJ.toFixed(3),
            hvTap: hvTapJ.toFixed(3)
        };
        showWorking.sr9 = 'PhaseCurrent / NetCSA';

        // 10. No. of Turns
        // FIXED: Use provided LV turns if available to ensure exact ratio consistency
        const tapTurnsForEt = (tapMode === 'max') ? inputs.hvMaxTapTurns : inputs.hvNormalTapTurns;
        const et = hvPhaseV / (inputs.hvMainTurns + tapTurnsForEt);

        // If lvTurns is provided in inputs, use it; otherwise calculate strictly
        const lvTurnsActual = inputs.lvTurns || Math.round(lvPhaseV / et);

        results.sr10 = {
            lv: lvTurnsActual,
            hvMain: inputs.hvMainTurns,
            hvTap: tapTurnsForEt
        };
        results.et = et.toFixed(4);
        showWorking.sr10 = 'PhaseVoltage / Et (rounded to nearest integer)';

        // 11. Coil ID (mm)
        // Formula: Core Dia + 2 × (Wrapping Paper each side + Core-to-LV Oil Duct)
        results.sr11 = {
            lv: inputs.idLV,
            hvMain: inputs.idHV,
            hvTap: inputs.idTap
        };
        showWorking.sr11 = 'LV: Core Dia + 2×(Wrapping Paper + Oil Duct) | HV: LV OD + LV-HV Duct';

        // 12. Coil OD (mm) — Calculated from Refined Radial Build (Manual Sheet Logic)
        // Formula: Coil OD = Coil ID + 2 × Radial Build
        // RB = (Thick × Parallel_Cond × Parallel_Coil) + (Paper × TotalLayers) + Ducts + Wraps

        // LV (Sheet 5Target: 1035 OD): Metal (22.2) + Paper (0.2*46) + 3.6+3.6 wraps = 101.5
        const lvLayers = (inputs.nCondLV || 46) * (inputs.nCoilLV || 1);
        const lvPaper = (inputs.paperThickLV || 0.2) * lvLayers;
        const lvInsulation = (inputs.innerWrapLV || 3.6) + (inputs.outerWrapLV || 3.6);
        const lvRadialBuild = (inputs.bareThicknessLV * lvLayers) + lvPaper + lvInsulation;

        // HV Main (Sheet 1): (Thick * ParCond * ParCoil) + (Paper * Layers) + Wrap
        const hvMainLayers = (inputs.nCondHV || 13) * (inputs.nCoilHV || 2);
        const hvMainPaper = 0.3 * hvMainLayers;
        const hvMainWrap = (inputs.innerWrapHV || 0) + (inputs.outerWrapHV || 0); // Full insulation
        const hvMainRadialBuild = (inputs.bareThicknessHV * hvMainLayers) + hvMainPaper + hvMainWrap;

        // HV Tap (Sheet 4): (Thick * Layers) + Paper + Wrap
        const tapLayers = (inputs.nCondTap || 15) * (inputs.nCoilTap || 1);
        const tapPaper = 0.25 * tapLayers;
        const tapWrap = (inputs.innerWrapTap || 0) + (inputs.outerWrapTap || 0);
        const hvTapRadialBuild = (inputs.bareThicknessTap * tapLayers) + tapPaper + tapWrap;

        const lvOD = inputs.odLV || (parseFloat(inputs.idLV) + 2 * lvRadialBuild);
        const hvMainOD = inputs.odHV || (parseFloat(inputs.idHV) + 2 * hvMainRadialBuild);
        const hvTapOD = inputs.odTap || (parseFloat(inputs.idTap) + 2 * hvTapRadialBuild);

        results.sr12 = {
            lv: parseFloat(lvOD).toFixed(1),
            hvMain: parseFloat(hvMainOD).toFixed(1),
            hvTap: parseFloat(hvTapOD).toFixed(1)
        };
        showWorking.sr12 = 'Build = (Thick × Layers) + (Paper × Layers) + Duct + Wrap; OD = ID + 2×Build';

        // Use calculated ODs for downstream calculations (Lmt, Weight, etc.)
        const lvODfinal = lvOD;
        const hvMainODfinal = hvMainOD;
        const hvTapODfinal = hvTapOD;

        // 13. Mean Length of Turn (Lmt) (mm)
        // Formula: PI * (ID + OD) / 2
        const calcLmt = (id, od) => Math.PI * (parseFloat(id) + parseFloat(od)) / 2;
        const lvLmt = calcLmt(inputs.idLV, lvODfinal);
        const hvMainLmt = calcLmt(inputs.idHV, hvMainODfinal);
        const hvTapLmt = calcLmt(inputs.idTap, hvTapODfinal);

        results.sr13 = {
            lv: lvLmt.toFixed(1),
            hvMain: hvMainLmt.toFixed(1),
            hvTap: hvTapLmt.toFixed(1)
        };
        showWorking.sr13 = 'π × (ID + OD) / 2';

        // 14. Bare Copper Weight (kg)
        // Formula: (NetCSA * Lmt * Turns * 3 * Density) / 10^6
        const calcWeight = (csa, lmt, turns) => (csa * lmt * turns * 3 * this.DENSITY_CU) / 1000000;
        const lvWeight = calcWeight(lvNet, lvLmt, lvTurnsActual);
        const hvMainWeight = calcWeight(hvMainNet, hvMainLmt, inputs.hvMainTurns);
        const hvTapWeight = calcWeight(hvTapNet, hvTapLmt, inputs.hvMaxTapTurns); // Weight uses Max Tap Turns

        results.sr14 = {
            lv: lvWeight.toFixed(2),
            hvMain: hvMainWeight.toFixed(2),
            hvTap: hvTapWeight.toFixed(2)
        };
        showWorking.sr14 = '(NetCSA × Lmt × Turns × 3 × 8.89) / 10⁶';

        // 14a. Lead Copper Weight (kg)
        const calcLeadWeight = (leadLength, csa) => ((leadLength || 0) * csa * 3 * this.DENSITY_CU) / 1000000;
        const lvLeadWeight = calcLeadWeight(inputs.leadLengthLV, lvNet);
        const hvMainLeadWeight = calcLeadWeight(inputs.leadLengthHV, hvMainNet);
        const hvTapLeadWeight = calcLeadWeight(inputs.leadLengthTap, hvTapNet);

        results.sr14a = {
            lv: lvLeadWeight.toFixed(2),
            hvMain: hvMainLeadWeight.toFixed(2),
            hvTap: hvTapLeadWeight.toFixed(2)
        };
        showWorking.sr14a = '(LeadLength × NetCSA × 3 × 8.89) / 10⁶';

        // 15. Total Copper Weight (kg)
        const lvTotalWeight = lvWeight + lvLeadWeight;
        const hvMainTotalWeight = hvMainWeight + hvMainLeadWeight;
        const hvTapTotalWeight = hvTapWeight + hvTapLeadWeight;

        results.sr15 = {
            lv: lvTotalWeight.toFixed(2),
            hvMain: hvMainTotalWeight.toFixed(2),
            hvTap: hvTapTotalWeight.toFixed(2)
        };
        showWorking.sr15 = 'BareWeight + LeadWeight';

        // 16. Resistivity (ohm-mm2/m) at 75°C
        results.sr16 = {
            lv: this.RESISTIVITY_CU,
            hvMain: this.RESISTIVITY_CU,
            hvTap: this.RESISTIVITY_CU
        };

        // 17. Resistance at 75°C (Normal Tap)
        // Formula: (Resistivity * Lmt * Turns) / (1000 * NetCSA)
        // Note: Atlanta format usually shows per phase or total, we'll keep consistent.
        const calcResist = (lmt, turns, csa) => (this.RESISTIVITY_CU * (lmt / 1000) * turns) / csa;
        const lvResist = calcResist(lvLmt, lvTurnsActual, lvNet);
        const hvMainResist = calcResist(hvMainLmt, inputs.hvMainTurns, hvMainNet);
        // Resistance uses Normal or Max Tap Turns based on tapMode
        const tapTurnsForResist = (tapMode === 'max') ? inputs.hvMaxTapTurns : inputs.hvNormalTapTurns;
        const hvTapResist = calcResist(hvTapLmt, tapTurnsForResist, hvTapNet);

        results.sr17 = {
            lv: lvResist.toFixed(5),
            hvMain: hvMainResist.toFixed(5),
            hvTap: hvTapResist.toFixed(5)
        };
        showWorking.sr17 = '(ρ × Lmt × Turns) / (1000 × NetCSA)';

        // 18. I2R Loss (W) at 75°C
        // Formula: 3 * (PhaseCurrent^2) * Resistance
        const calcLoss = (i, r) => 3 * Math.pow(i, 2) * r;
        const lvLoss = calcLoss(lvPhaseI, lvResist);
        const hvMainLoss = calcLoss(hvPhaseI, hvMainResist);
        const hvTapLoss = calcLoss(hvPhaseI, hvTapResist);

        results.sr18 = {
            lv: lvLoss.toFixed(0),
            hvMain: hvMainLoss.toFixed(0),
            hvTap: hvTapLoss.toFixed(0)
        };
        showWorking.sr18 = '3 × I² × R';

        // Summary Calculations for 19-22
        const totalI2RLoss = lvLoss + hvMainLoss + hvTapLoss;
        const totalLoadLoss = totalI2RLoss + inputs.eddyStrayLoss;

        results.sr19 = totalI2RLoss.toFixed(0);
        results.sr20 = inputs.eddyStrayLoss.toFixed(0);
        results.sr21 = totalLoadLoss.toFixed(0);
        results.sr22 = (totalLoadLoss / 1000).toFixed(2); // In kW

        return { results, showWorking };
    }
};

if (typeof module !== 'undefined') {
    module.exports = WindingCalc;
}
