/* ============================================================
   TRANSFORMER CORE ELECTRICAL DESIGN CALCULATOR
   Formula Reference: IEC 60076 / IS 2026
   Matches: ATLANTA Engineering Sheet "Flux, EMF, Turns & Core Loss"

   Architecture:
     _coreElectricalMath(params)        ← pure function, zero DOM, testable in Node
     calculateCoreElectricalDesign()    ← thin DOM adapter: reads UI → calls math → renders
   
   Improvements (v2.0):
     - Enhanced error handling with detailed messages
     - Real-time input validation with visual feedback
     - Better default value management
     - Improved state tracking and logging
     - XSS-safe template rendering
     - Better accessibility and UX feedback
   ============================================================ */

'use strict';

// Global state for calculator
const CoreCalcState = {
    lastValidInputs: null,
    isCalculating: false,
    lastError: null,
    logger: (msg, type = 'log') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${msg}`);
    }
};

/**
 * PURE MATH ENGINE — no DOM reads, fully headless-testable.
 *
 * @param {Object} params
 * @param {number} params.S         MVA rating
 * @param {number} params.VHV       HV line voltage (kV)
 * @param {number} params.VLV       LV line voltage (kV)
 * @param {number} params.f         Frequency (Hz)
 * @param {number} params.Sf        Stacking factor (e.g. 0.96)
 * @param {number} params.Bm        Peak flux density (T)
 * @param {number} params.Kf        Filling / space factor
 * @param {number} params.hvMain    HV main turns
 * @param {number} params.hvNormTap HV normal tap turns
 * @param {number} params.Wcore     Core weight (kg)
 * @param {number} params.wsp       Specific core loss (W/kg)
 * @param {number} params.magVA     Specific magnetising VA (VA/kg)
 * @param {string} params.vecGroup  Vector group string (e.g. 'YNyn0')
 * @returns {Object} Calculated results (no side-effects)
 */
function _calcFluxDomain(D, Sf, Bm, Kf) {
    const D_m = D / 1000;
    const Ag = Kf * (Math.PI / 4) * D_m * D_m;
    const An = Ag * Sf;
    const Phim = Bm * An;
    const Phirms = Phim / Math.SQRT2;
    const Bm_chk = Phim / An;
    const satMargin = ((1.9 - Bm) / 1.9) * 100;
    return { D, Ag, An, Phim, Phirms, Bm_chk, satMargin };
}

function _calcEMFDomain(VHV_phase, VLV_phase, totalHVTurns, Phim, f, VHV, VLV) {
    const Et = 4.44 * f * Phim;
    const NHV_calc = Math.round(VHV_phase / Et);
    const NHV_used = totalHVTurns;
    const NLV = Math.round(VLV_phase / Et);
    const Et_design = VHV_phase / NHV_used;
    const turnRatio = NHV_used / NLV;
    const voltRatio = VHV / VLV;
    return { Et, Et_design, NHV_calc, NHV_used, NLV, turnRatio, voltRatio };
}

function _calcCurrentsDomain(S, VHV, VLV, NHV_used, NLV, isHVStar, isLVDelta) {
    const sqrt3 = Math.sqrt(3);
    const IHV_line = (S * 1e6) / (sqrt3 * VHV * 1000);
    const ILV_line = (S * 1e6) / (sqrt3 * VLV * 1000);
    const IHV_phase = isHVStar ? IHV_line : IHV_line / sqrt3;
    const ILV_phase = isLVDelta ? ILV_line / sqrt3 : ILV_line;
    const AT_HV = NHV_used * IHV_phase;
    const AT_LV = NLV * ILV_phase;
    const AT_bal = AT_HV / AT_LV;
    const MMF_tot = (AT_HV + AT_LV) / 2;
    return { IHV_line, ILV_line, IHV_phase, ILV_phase, AT_HV, AT_LV, AT_bal, MMF_tot };
}

function _calcLossDomain(S, VHV, Wcore, wsp, magVA, IHV_line) {
    const sqrt3 = Math.sqrt(3);
    const Pcore = (Wcore * wsp) / 1000;
    const coreLossPerc = (Pcore / S) * 100;
    const MagVAtotal = (magVA * Wcore) / 1000;
    const I0 = (MagVAtotal * 1000) / (sqrt3 * VHV * 1000);
    const I0_percent = (I0 / IHV_line) * 100;
    const Ph = Pcore * 0.60;
    const Pe = Pcore * 0.40;
    return { Pcore, coreLossPerc, MagVAtotal, I0, I0_percent, Ph, Pe };
}

function _validateComplianceDomain(Bm, An, Phim, Et, NHV_used, Pcore, I0_percent, AT_bal) {
    return {
        Bm_ok: Bm >= 1.55 && Bm <= 1.75,
        An_ok: An >= 0.18,
        Phi_ok: Phim >= 0.30 && Phim <= 0.40,
        Et_ok: Et >= 50 && Et <= 100,
        NHV_ok: NHV_used >= 650 && NHV_used <= 850,
        P_ok: Pcore < 75,
        I0p_ok: I0_percent < 0.5,
        AT_ok: AT_bal >= 0.98 && AT_bal <= 1.02
    };
}

/**
 * PURE MATH ENGINE — no DOM reads, fully headless-testable.
 */
function _coreElectricalMath(params) {
    const { S, VHV, VLV, f, Sf, Bm, Kf, hvMain, hvNormTap, Wcore, wsp, magVA, vecGroup } = params;

    const totalHVTurns = hvMain + hvNormTap;
    if (totalHVTurns <= 0) throw new Error('HV Turns must be > 0');

    const sqrt3 = Math.sqrt(3);
    const isHVStar = vecGroup.startsWith('Y') || vecGroup.includes('YN');
    const isLVDelta = vecGroup.toLowerCase().includes('d');

    const VHV_phase = isHVStar ? (VHV * 1000) / sqrt3 : (VHV * 1000);
    const VLV_phase = isLVDelta ? (VLV * 1000) : (VLV * 1000) / sqrt3;

    // Core diameter sizing
    const Et_calc = VHV_phase / totalHVTurns;
    const denom = 4.44 * f * Bm * Sf * Kf * 0.7854;
    const D = Math.sqrt(Et_calc / denom) * 1000;

    const fluxDom = _calcFluxDomain(D, Sf, Bm, Kf);
    const emfDom = _calcEMFDomain(VHV_phase, VLV_phase, totalHVTurns, fluxDom.Phim, f, VHV, VLV);
    const currDom = _calcCurrentsDomain(S, VHV, VLV, emfDom.NHV_used, emfDom.NLV, isHVStar, isLVDelta);
    const lossDom = _calcLossDomain(S, VHV, Wcore, wsp, magVA, currDom.IHV_line);

    const compliance = _validateComplianceDomain(
        Bm, fluxDom.An, fluxDom.Phim, emfDom.Et, emfDom.NHV_used, lossDom.Pcore, lossDom.I0_percent, currDom.AT_bal
    );

    return {
        ...fluxDom,
        ...emfDom,
        ...currDom,
        ...lossDom,
        inp: { S, VHV, VLV, f, D, Sf, Bm, Kf, Wcore, wsp, magVA, vecGroup },
        compliance
    };
}

/* ─────────────────────────────────────────────────────────
   DOM ADAPTER — reads UI fields, calls _coreElectricalMath, renders results
   Enhanced: Better validation, error handling, and user feedback
───────────────────────────────────────────────────────── */
function calculateCoreElectricalDesign() {
    CoreCalcState.isCalculating = true;
    CoreCalcState.logger('Starting core electrical design calculation...', 'log');
    
    try {
        // Read all inputs from DOM (two possible element IDs per field for legacy compat)
        const S       = parseFloat(document.getElementById('mva')?.value)                || parseFloat(document.getElementById('cd_mva')?.value)               || 0;
        const VHV     = parseFloat(document.getElementById('hv')?.value)                 || parseFloat(document.getElementById('cd_hv')?.value)                || 0;
        const VLV     = parseFloat(document.getElementById('lv')?.value)                 || parseFloat(document.getElementById('cd_lv')?.value)                || 0;
        const f       = parseFloat(document.getElementById('frequency')?.value)          || parseFloat(document.getElementById('cd_freq')?.value)              || 50;
        const Sf      = parseFloat(document.getElementById('sf')?.value)                 || parseFloat(document.getElementById('cd_sf')?.value)                || 0.96;
        const Bm      = parseFloat(document.getElementById('fluxDensity')?.value)        || parseFloat(document.getElementById('cd_bm')?.value)                || 1.7;
        const Kf      = parseFloat(document.getElementById('kf')?.value)                 || parseFloat(document.getElementById('cd_kf')?.value)                || 0.75;
        const hvMain  = parseFloat(document.getElementById('hvMainTurns')?.value)        || parseFloat(document.getElementById('cd_hv_main_turns')?.value)      || 0;
        const hvNormTap=parseFloat(document.getElementById('hvNormalTapTurns')?.value)   || parseFloat(document.getElementById('cd_hv_normal_tap_turns')?.value) || 0;
        const Wcore   = parseFloat(document.getElementById('coreWeight')?.value)         || parseFloat(document.getElementById('cd_wcore')?.value)              || 0;
        const wsp     = parseFloat(document.getElementById('specificCoreLoss')?.value)   || parseFloat(document.getElementById('cd_wsp')?.value)                || 0;
        const magVA   = parseFloat(document.getElementById('specificMagVA')?.value)      || parseFloat(document.getElementById('cd_magva')?.value)              || 0;
        const vecGroup= document.getElementById('vectorGroup')?.value || document.getElementById('cd_vecgroup')?.value || 'YNyn0';

        // Field validation with detailed error messages
        const validationRules = {
            'Rating (MVA)': { value: S, min: 0.1, max: 500 },
            'HV Voltage': { value: VHV, min: 0.4, max: 765 },
            'LV Voltage': { value: VLV, min: 0.1, max: 500 },
            'Frequency': { value: f, min: 40, max: 60 },
            'Stacking Factor': { value: Sf, min: 0.8, max: 1.0 },
            'Flux Density': { value: Bm, min: 1.0, max: 1.9 },
            'Filling Factor': { value: Kf, min: 0.5, max: 1.0 },
            'HV Main Turns': { value: hvMain, min: 1, max: 2000 },
            'Core Weight': { value: Wcore, min: 0.1, max: 100000 },
            'Specific Core Loss': { value: wsp, min: 0.1, max: 10 },
            'Specific Mag VA': { value: magVA, min: 0.1, max: 100 }
        };

        let validationErrors = [];
        for (const [name, rule] of Object.entries(validationRules)) {
            if (isNaN(rule.value)) {
                validationErrors.push(`${name} is not a valid number`);
            } else if (rule.value < rule.min || rule.value > rule.max) {
                validationErrors.push(`${name} = ${rule.value} (valid range: ${rule.min} - ${rule.max})`);
            }
        }

        if (validationErrors.length > 0) {
            const errorMsg = 'Validation Errors:\n' + validationErrors.map(e => '• ' + e).join('\n');
            CoreCalcState.logger(errorMsg, 'error');
            CoreCalcState.lastError = errorMsg;
            alert('❌ Invalid Inputs:\n\n' + validationErrors.join('\n'));
            CoreCalcState.isCalculating = false;
            return;
        }

        // Store valid inputs
        CoreCalcState.lastValidInputs = { S, VHV, VLV, f, Sf, Bm, Kf, hvMain, hvNormTap, Wcore, wsp, magVA, vecGroup };

        let result;
        try {
            result = _coreElectricalMath({ S, VHV, VLV, f, Sf, Bm, Kf, hvMain, hvNormTap, Wcore, wsp, magVA, vecGroup });
            CoreCalcState.logger('✅ Calculation successful', 'success');
        } catch (e) {
            CoreCalcState.logger(`Calculation failed: ${e.message}`, 'error');
            CoreCalcState.lastError = e.message;
            alert(`❌ Calculation Error: ${e.message}`);
            CoreCalcState.isCalculating = false;
            return;
        }

        // Write computed diameter back to DOM
        const diaField = document.getElementById('cd_diameter');
        if (diaField) {
            diaField.value = result.D.toFixed(1);
            diaField.classList.add('highlight-update');
            setTimeout(() => diaField.classList.remove('highlight-update'), 1500);
        }

        displayCoreResults(result, result.inp, result.compliance);
        CoreCalcState.isCalculating = false;
        
    } catch (error) {
        CoreCalcState.logger(`Unexpected error: ${error.message}`, 'error');
        CoreCalcState.lastError = error.message;
        alert(`❌ Unexpected Error: ${error.message}`);
        CoreCalcState.isCalculating = false;
    }
}

/* ─────────────────────────────────────────────────────────
   DISPLAY: Full Atlanta Engineering Sheet (5 Sections)
───────────────────────────────────────────────────────── */
function displayCoreResults(r, inp, chk) {
    const container = document.getElementById('coreDesignResults');
    if (!container) return;

    const f4 = (v) => (typeof v === 'number' && !isNaN(v)) ? v.toFixed(4) : '—';
    const f3 = (v) => (typeof v === 'number' && !isNaN(v)) ? v.toFixed(3) : '—';
    const f2 = (v) => (typeof v === 'number' && !isNaN(v)) ? v.toFixed(2) : '—';
    const f1 = (v) => (typeof v === 'number' && !isNaN(v)) ? v.toFixed(1) : '—';
    const fi = (v) => Math.round(v).toLocaleString();
    const ok  = (pass, _note='') => {
        const noteText = _note ? ` ${_note}` : '';
        return pass
            ? '<span style="color:#27ae60;font-weight:bold;">✓ OK</span>'
            : `<span style="color:#e74c3c;font-weight:bold;">✗ CHECK${noteText}</span>`;
    };
    const row = (p, v, u, p2='', v2='', u2='') => `
    <tr>
      <td>${p}</td><td style='color:#1565c0;font-weight:bold;'>${v}</td><td>${u}</td>
      ${p2 ? `<td>${p2}</td><td style='color:#1565c0;font-weight:bold;'>${v2}</td><td>${u2}</td>` : '<td colspan="3"></td>'}
    </tr>`;

    const thStyle = 'style=\'background:#1a3a5c;color:white;padding:7px 12px;text-align:left;\'';
    const tblHdr = `<table style='width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;'>
    <thead><tr>
      <th ${thStyle}>Parameter</th><th ${thStyle}>Value</th><th ${thStyle}>Unit</th>
      <th ${thStyle}>Parameter</th><th ${thStyle}>Value</th><th ${thStyle}>Unit</th>
    </tr></thead><tbody>`;
    const sectionHdr = (icon, title, color='#1a3a5c') =>
        `<div style='background:${color};color:white;padding:8px 15px;font-weight:bold;font-size:13px;margin-top:12px;border-radius:4px 4px 0 0;'>${icon} ${title}</div>`;

    container.innerHTML = `
  <!-- Header Banner -->
  <div style="background:#1a3a5c;color:white;padding:14px 20px;border-radius:6px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:16px;font-weight:bold;">Flux, EMF, Turns &amp; Core Loss</div>
      <div style="font-size:12px;opacity:0.8;">${inp.S} MVA, ${inp.VHV}/${inp.VLV} kV, ${inp.f} Hz &nbsp;|&nbsp; <span id="vec-group-display"></span> &nbsp;|&nbsp; Core Ø ${f1(inp.D)} mm</div>
    </div>
    <div style="font-size:11px;opacity:0.7;">IEC 60076 / IS 2026 &nbsp;|&nbsp; M4 CRGO &nbsp;|&nbsp; Bm = ${inp.Bm} T</div>
  </div>

  <!-- A. FLUX CALCULATIONS -->
  ${sectionHdr('A.', 'FLUX CALCULATIONS', '#0d47a1')}
  ${tblHdr}
    ${row('Gross Core Area (Ag = π×D²/4)', f4(r.Ag), 'm²', 'Net Core Area (An = Ag × Sf)', f4(r.An), 'm²')}
    ${row('Peak Flux (ϕm = Bm × An)', f4(r.Phim), 'Wb', 'RMS Flux (ϕrms = ϕm/√2)', f4(r.Phirms), 'Wb')}
    ${row('Flux Density Check (Bm = ϕm/An)', f3(r.Bm_chk), 'T', 'Saturation Margin (IS-2026, 1.9T limit)', r.satMargin.toFixed(1), '%')}
  </tbody></table>

  <!-- B. EMF PER TURN & WINDING TURNS -->
  ${sectionHdr('B.', 'EMF PER TURN & WINDING TURNS', '#1565c0')}
  ${tblHdr}
    ${row('EMF per Turn (Et = 4.44 × f × ϕm)', f3(r.Et), 'V/turn', 'Volts/Turn (design check)', f3(r.Et_design), 'V/turn')}
    ${row('HV Phase Voltage (Star: Vline/√3)', f1(inp.VHV * 1000 / Math.sqrt(3)), 'V', 'LV Phase Voltage (Delta: Vline)', f1(inp.VLV * 1000), 'V')}
    ${row('HV Turns (N_HV = V_HV_phase / Et) — Used', fi(r.NHV_used), 'turns', 'LV Turns (N_LV = V_LV_phase / Et)', fi(r.NLV), 'turns')}
    ${row('Turns Ratio (N_HV / N_LV)', f3(r.turnRatio), '—', 'Voltage Ratio Check', (inp.VHV/inp.VLV).toFixed(3), '—')}
  </tbody></table>

  <!-- C. RATED CURRENTS & AMPERE-TURNS -->
  ${sectionHdr('C.', 'RATED CURRENTS & AMPERE-TURNS', '#283593')}
  ${tblHdr}
    ${row('HV Rated Line Current (S / √3 × V_HV)', f1(r.IHV_line), 'A', 'LV Rated Line Current (S / √3 × V_LV)', f1(r.ILV_line), 'A')}
    ${row('HV Phase Current (Star = line current)', f1(r.IHV_phase), 'A', 'LV Phase Current (Delta: I_line/√3)', f1(r.ILV_phase), 'A')}
    ${row('HV Ampere-Turns (AT_HV = N_HV × I_H)', fi(r.AT_HV), 'A-turns', 'LV Ampere-Turns (AT_LV = N_LV × I_LV)', fi(r.AT_LV), 'A-turns')}
    ${row('AT Balance (≈1.0)', f3(r.AT_bal), '—', 'Total MMF (NI per limb)', fi(r.MMF_tot), 'A-turns')}
  </tbody></table>

  <!-- D. CORE LOSS & NO-LOAD CURRENT -->
  ${sectionHdr('D.', 'CORE LOSS & NO-LOAD CURRENT', '#1a3a5c')}
  ${tblHdr}
    ${row('Core Total Weight', fi(inp.Wcore), 'kg', 'Specific Core Loss @ '+inp.Bm+' T (M4 CRGO)', inp.wsp.toFixed(3), 'W/kg')}
    ${row('Total Core Loss (P_core = W_core × wsp)', f3(r.Pcore), 'kW', 'Core Loss % (P_core / S × 100)', r.coreLossPerc.toFixed(4), '%')}
    ${row('Specific Magnetising VA @ '+inp.Bm+' T (M4)', inp.magVA.toFixed(2), 'VA/kg', 'Total Magnetising VA', f2(r.MagVAtotal), 'kVA')}
    ${row('No-Load Current (I0 = mag_VA / √3 / V_L)', r.I0.toFixed(4), 'A', 'No-Load Current %', r.I0_percent.toFixed(4), '%')}
    ${row('Hysteresis Loss (Ph ≈ 60% of P_core)', r.Ph.toFixed(3), 'kW', 'Eddy Current Loss (Pe ≈ 40% of P_core)', r.Pe.toFixed(3), 'kW')}
  </tbody></table>

  <!-- E. DESIGN SUMMARY & COMPLIANCE -->
  ${sectionHdr('E.', 'DESIGN SUMMARY & COMPLIANCE CHECK', '#263238')}
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr>
      <th ${thStyle}>Parameter</th>
      <th ${thStyle}>Calculated</th>
      <th ${thStyle}>Unit</th>
      <th ${thStyle}>Target / Limit</th>
      <th ${thStyle}>Status</th>
    </tr></thead>
    <tbody>
      <tr><td>Peak Flux Density (Bm)</td><td style="font-weight:bold;">${f3(r.Bm_chk)}</td><td>T</td><td>1.55 – 1.75 T</td><td>${ok(chk.Bm_ok)}</td></tr>
      <tr><td>Net Core Area</td><td style="font-weight:bold;">${f4(r.An)}</td><td>m²</td><td>&gt; 0.18 m²</td><td>${ok(chk.An_ok)}</td></tr>
      <tr><td>Peak Flux (ϕm)</td><td style="font-weight:bold;">${f4(r.Phim)}</td><td>Wb</td><td>0.30 – 0.40 Wb</td><td>${ok(chk.Phi_ok)}</td></tr>
      <tr><td>EMF per Turn</td><td style="font-weight:bold;">${f3(r.Et)}</td><td>V/t</td><td>50 – 100 V/t</td><td>${ok(chk.Et_ok)}</td></tr>
      <tr><td>HV Turns (Used)</td><td style="font-weight:bold;">${fi(r.NHV_used)}</td><td>turns</td><td>650 – 850</td><td>${ok(chk.NHV_ok)}</td></tr>
      <tr><td>Core Loss</td><td style="font-weight:bold;">${f3(r.Pcore)}</td><td>kW</td><td>&lt; 75 kW</td><td>${ok(chk.P_ok)}</td></tr>
      <tr><td>No-Load Current %</td><td style="font-weight:bold;">${r.I0_percent.toFixed(4)}</td><td>%</td><td>&lt; 0.5 %</td><td>${ok(chk.I0p_ok)}</td></tr>
      <tr><td>AT Balance</td><td style="font-weight:bold;">${f3(r.AT_bal)}</td><td>—</td><td>0.98 – 1.02</td><td>${ok(chk.AT_ok, '(REVISE)')}</td></tr>
    </tbody>
  </table>
  `;

    // Securely set the vector group to prevent XSS
    const vgEl = container.querySelector('#vec-group-display');
    if (vgEl) {
        vgEl.textContent = inp.vecGroup;
    }

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearCoreResults() {
    const c = document.getElementById('coreDesignResults');
    if (c) { c.innerHTML = ''; c.style.display = 'none'; }
}

/* ── Live update Core Diameter ── */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        CoreCalcState.logger('Initializing live core diameter updater...', 'log');
        const ids = [
            'cd_hv','cd_freq','cd_bm','cd_sf','cd_kf','cd_hv_main_turns','cd_hv_normal_tap_turns','cd_vecgroup','cd_mva',
            'hv','frequency','fluxDensity','sf','kf','hvMainTurns','hvNormalTapTurns','hvMaxTapTurns','vectorGroup','mva'
        ];
        let debounceTimer = null;
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    // Debounce updates to prevent excessive recalculations
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => updateCoreDiaLive(), 300);
                });
            }
        });
        updateCoreDiaLive();
    });
}

function updateCoreDiaLive() {
    try {
        const VHV      = parseFloat(document.getElementById('hv')?.value)           || parseFloat(document.getElementById('cd_hv')?.value)    || 0;
        const mva      = parseFloat(document.getElementById('mva')?.value)           || parseFloat(document.getElementById('cd_mva')?.value)   || 0;
        const vecGroup = document.getElementById('vectorGroup')?.value               || document.getElementById('cd_vecgroup')?.value || 'YNyn0';
        const hvNormTap= parseFloat(document.getElementById('hvNormalTapTurns')?.value) || 64;
        const f        = parseFloat(document.getElementById('frequency')?.value)     || parseFloat(document.getElementById('cd_freq')?.value)   || 50;
        const Sf       = parseFloat(document.getElementById('sf')?.value)            || parseFloat(document.getElementById('cd_sf')?.value)     || 0.97;
        const Bm       = parseFloat(document.getElementById('fluxDensity')?.value)   || parseFloat(document.getElementById('cd_bm')?.value)    || 1.7;
        const Kf       = parseFloat(document.getElementById('kf')?.value)            || parseFloat(document.getElementById('cd_kf')?.value)    || 0.867;

        const diaOut = document.getElementById('cd_diameter');

        // Validate inputs are present and reasonable
        if (isNaN(mva) || isNaN(VHV) || mva <= 0 || VHV <= 0) {
            if (diaOut) {
                diaOut.value = '';
                diaOut.placeholder = 'Enter MVA and HV Voltage';
            }
            return;
        }

        const sqrt3     = Math.sqrt(3);
        const isHVStar  = vecGroup.startsWith('Y') || vecGroup.includes('YN');
        const VHV_phase = isHVStar ? (VHV * 1000) / sqrt3 : (VHV * 1000);

        // Et auto-estimation using empirical formula
        const K     = (mva >= 50) ? 0.497 : (mva >= 10) ? 0.52 : 0.55;
        const Et_est = K * Math.sqrt(mva * 1000);
        const totalTurnsReq    = Math.round(VHV_phase / Et_est);
        const hvMainCalculated = Math.max(1, totalTurnsReq - hvNormTap);

        // Update HV Main Turns fields
        const mainField = document.getElementById('hvMainTurns');
        if (mainField && isNaN(parseFloat(mainField.value))) {
            mainField.value = hvMainCalculated;
            mainField.classList.add('auto-filled');
            setTimeout(() => mainField.classList.remove('auto-filled'), 1000);
        }
        
        const legacyMain = document.getElementById('cd_hv_main_turns');
        if (legacyMain && isNaN(parseFloat(legacyMain.value))) {
            legacyMain.value = hvMainCalculated;
            legacyMain.classList.add('auto-filled');
        }

        // Calculate core diameter
        const hvMain     = parseFloat(document.getElementById('hvMainTurns')?.value) || hvMainCalculated;
        const totalTurns = hvMain + hvNormTap;
        
        if (totalTurns <= 0) {
            if (diaOut) diaOut.value = '';
            return;
        }

        const Et_calc    = VHV_phase / totalTurns;
        const denom      = 4.44 * f * Bm * Sf * Kf * 0.7854;
        
        if (denom <= 0) {
            CoreCalcState.logger('Invalid calculation parameters', 'error');
            return;
        }

        const D_calc     = Math.sqrt(Et_calc / denom) * 1000;

        // Update diameter output
        if (diaOut) {
            diaOut.value = D_calc.toFixed(1);
            diaOut.classList.add('auto-calculated');
            setTimeout(() => diaOut.classList.remove('auto-calculated'), 1200);
        }

        // Auto core weight (logarithmic fit for standard transformers)
        const calculatedWeight = Math.round(310 * Math.pow(mva, 0.88));
        const wf = document.getElementById('cd_wcore');    
        if (wf && isNaN(parseFloat(wf.value))) {
            wf.value = calculatedWeight;
            wf.classList.add('auto-filled');
        }
        const mwf= document.getElementById('coreWeight');
        if (mwf && isNaN(parseFloat(mwf.value))) {
            mwf.value = calculatedWeight;
            mwf.classList.add('auto-filled');
        }

        // Auto oil volume (for ONAN cooling)
        const calculatedOil = Math.round(1200 * Math.sqrt(mva));
        const of2 = document.getElementById('oilVolume');
        if (of2 && isNaN(parseFloat(of2.value))) {
            of2.value = calculatedOil;
            of2.classList.add('auto-filled');
        }

        CoreCalcState.logger(`Core diameter updated: ${D_calc.toFixed(1)} mm`, 'log');
        
    } catch (error) {
        CoreCalcState.logger(`Live update error: ${error.message}`, 'error');
        const out = document.getElementById('cd_diameter');
        if (out) out.value = '';
    }
}

// ── Exports ──
// Browser globals (DOM adapter + live updater)
if (typeof window !== 'undefined') {
    window.calculateCoreElectricalDesign = calculateCoreElectricalDesign;
    window.clearCoreResults               = clearCoreResults;
    window.updateCoreDiaLive              = updateCoreDiaLive;
    window._coreElectricalMath            = _coreElectricalMath;
    window.CoreCalcState                  = CoreCalcState;
    
    // Utility: Get last calculation result
    window.getLastValidInputs = () => CoreCalcState.lastValidInputs;
    window.getLastError = () => CoreCalcState.lastError;
}

// Node/test exports (pure math engine only — no DOM)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        _coreElectricalMath,
        _calcFluxDomain,
        _calcEMFDomain,
        _calcCurrentsDomain,
        _calcLossDomain,
        _validateComplianceDomain
    };
}

// Log module initialization
if (typeof window !== 'undefined') {
    CoreCalcState.logger('Core Electrical Calculator Module Loaded v2.0', 'success');
}
