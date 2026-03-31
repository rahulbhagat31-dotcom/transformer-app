/**
 * ================================================
 * MODERN TRANSFORMER CALCULATOR - UI LOGIC
 * v2.5.0 (Updated for New UI)
 * ================================================
 */

// Global state
let currentResults = null;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Modern Calculator UI loaded');
});

// ========== PRESETS ==========
function loadPreset(size) {
    const presets = {
        'small': { mva: 10, hv: 33, lv: 11, impedance: 7.5, cooling: 'ONAN', tapChangerType: 'OCTC', tappingRange: 10, tappingSide: 'HV', powerFactor: 0.85 },
        'medium': { mva: 50, hv: 132, lv: 33, impedance: 10, cooling: 'ONAN/ONAF', tapChangerType: 'OCTC', tappingRange: 10, tappingSide: 'HV', powerFactor: 0.85 },
        'large': { mva: 160, hv: 220, lv: 66, impedance: 12.5, cooling: 'ONAN/ONAF', tapChangerType: 'OLTC', tappingRange: 10, tappingSide: 'HV', powerFactor: 0.85 },
        'ultra': { mva: 250, hv: 400, lv: 132, impedance: 14, cooling: 'OFAF', tapChangerType: 'OLTC', tappingRange: 10, tappingSide: 'HV', powerFactor: 0.85 }
    };

    const p = presets[size];
    if (p) {
        document.getElementById('mva').value = p.mva;
        document.getElementById('hv').value = p.hv;
        document.getElementById('lv').value = p.lv;
        document.getElementById('impedance').value = p.impedance;
        document.getElementById('cooling').value = p.cooling;
        const tcEl = document.getElementById('tapChangerType');
        if (tcEl) tcEl.value = p.tapChangerType;
        const trEl = document.getElementById('tappingRange');
        if (trEl) trEl.value = p.tappingRange;
        const tsEl = document.getElementById('tappingSide');
        if (tsEl) tsEl.value = p.tappingSide;
        const pfEl = document.getElementById('powerFactor');
        if (pfEl) pfEl.value = p.powerFactor;
    }
}

// ========== CALCULATION TRIGGER ==========
window.calculateDesign = function () {
    // Show loading state
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';
    const rcHide = document.getElementById('resultsContent') || document.getElementById('resultsContainer');
    if (rcHide) rcHide.style.display = 'none';

    // Collect inputs
    const inputs = {
        mva: parseFloat(document.getElementById('mva').value),
        hv: parseFloat(document.getElementById('hv').value),
        lv: parseFloat(document.getElementById('lv').value),
        frequency: parseFloat(document.getElementById('frequency').value),
        phases: parseInt(document.getElementById('phases').value),
        vectorGroup: document.getElementById('vectorGroup').value,
        cooling: document.getElementById('cooling').value,
        coreMaterial: document.getElementById('coreMaterial').value,
        windingMaterial: document.getElementById('windingMaterial').value,
        fluxDensity: parseFloat(document.getElementById('fluxDensity') ? document.getElementById('fluxDensity').value : 1.65),
        voltsPerTurn: parseFloat(document.getElementById('voltsPerTurn') ? document.getElementById('voltsPerTurn').value : 60),
        currentDensity: parseFloat(document.getElementById('currentDensity') ? document.getElementById('currentDensity').value : 2.5),
        impedance: parseFloat(document.getElementById('impedance') ? document.getElementById('impedance').value : 12.5),
        ambientTemp: parseFloat(document.getElementById('ambientTemp') ? document.getElementById('ambientTemp').value : 50),
        altitude: parseFloat(document.getElementById('altitude') ? document.getElementById('altitude').value : 1000),
        // Hidden/Default fields with correct type mapping
        tapChangerType: document.getElementById('tapChangerType')?.value || 'NONE',
        tappingRange: parseFloat(document.getElementById('tappingRange')?.value || '10'),
        tappingSide: document.getElementById('tappingSide')?.value || 'HV',
        powerFactor: parseFloat(document.getElementById('powerFactor')?.value || '0.85'),
        // Optional Guarantees (captured if present)
        guaranteedNoLoad: document.getElementById('guaranteedNoLoad') ? parseFloat(document.getElementById('guaranteedNoLoad').value) || null : null,
        guaranteedLoadLoss: document.getElementById('guaranteedLoadLoss') ? parseFloat(document.getElementById('guaranteedLoadLoss').value) || null : null
    };

    // Simulate progress bar
    const bar = document.getElementById('progressBar');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            performCalculationActual(inputs);
        } else {
            width += 5;
            bar.style.width = width + '%';
            bar.innerText = width + '%';
        }
    }, 20);
};

function performCalculationActual(inputs) {
    try {
        const results = TransformerCalculator.calculate(inputs);

        if (results.success) {
            currentResults = results;
            displayResults(results);

            // Hide loading, show results
            document.getElementById('loading').style.display = 'none';
            document.getElementById('progressBar').style.width = '0%';
            const rc = document.getElementById('resultsContent') || document.getElementById('resultsContainer');
            if (rc) rc.style.display = 'block';

            // Scroll to results
            const rcScroll = document.getElementById('resultsContent') || document.getElementById('resultsContainer');
            if (rcScroll) rcScroll.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Calculation Errors:\n' + results.errors.map(e => e.message).join('\n'));
            document.getElementById('loading').style.display = 'none';
        }
    } catch (error) {
        console.error(error);
        alert('Critical Error: ' + error.message);
        document.getElementById('loading').style.display = 'none';
    }
}

// ========== DISPLAY LOGIC ==========
function displayResults(results) {
    const calc = results.calculations;

    // Safe accessor — returns '—' if path is undefined
    const safe = (v, decimals = null) => {
        if (v === undefined || v === null || isNaN(v)) return '—';
        return decimals !== null ? Number(v).toFixed(decimals) : v;
    };

    const row = (label, value, unit = '', tip = '') => {
        const tipHtml = tip
            ? `<span title="${tip}" style="margin-left:4px;color:#888;cursor:help;font-size:0.85em;">ⓘ</span>`
            : '';
        return `<div class="result-row">
            <span class="result-label">${label}${tipHtml}</span>
            <span class="result-value">${value}<span class="result-unit">${unit ? ' ' + unit : ''}</span></span>
        </div>`;
    };

    const section = (title, icon, content) => `
        <div class="result-section">
            <h4 class="result-section-title">${icon} ${title}</h4>
            ${content}
        </div>`;

    // ── 1. Currents ──────────────────────────────────────────────
    const cur = calc.currents || {};
    const curHtml = section('Rated Currents', '📊',
        row('HV Current', safe(cur.hvCurrent, 2), 'A') +
        row('LV Current', safe(cur.lvCurrent, 2), 'A') +
        row('Current Ratio', safe(cur.currentRatio, 4))
    );

    // ── 2. Core Design ───────────────────────────────────────────
    const core = calc.coreDesign || {};
    const coreHtml = section('Core Design', '🔧',
        row('Core Diameter', safe(core.diameter, 1), 'mm', 'Diameter of circumscribing circle') +
        row('Net Core Area', safe(core.netArea, 1), 'cm²', 'Effective iron cross-section') +
        row('Flux (Φ)', safe(core.flux, 4), 'Wb') +
        row('HV Turns', safe(core.hvTurns), '', 'High Voltage winding turns') +
        row('LV Turns', safe(core.lvTurns), '', 'Low Voltage winding turns') +
        row('Volts / Turn', safe(core.voltsPerTurn, 3), 'V')
    );

    // ── 3. Winding Design ────────────────────────────────────────
    const wd = calc.windingDesign || {};
    const hvW = wd.hv || {};
    const lvW = wd.lv || {};
    const windHtml = section('Winding Design', '🌀',
        row('HV Inner Ø', safe(hvW.innerDiameter, 1), 'mm') +
        row('HV Outer Ø', safe(hvW.outerDiameter, 1), 'mm') +
        row('HV Radial Depth', safe(hvW.radialDepth, 1), 'mm') +
        row('LV Inner Ø', safe(lvW.innerDiameter, 1), 'mm') +
        row('LV Outer Ø', safe(lvW.outerDiameter, 1), 'mm') +
        row('Winding Height', safe(hvW.axialHeight, 1), 'mm')
    );

    // ── 4. Conductors ────────────────────────────────────────────
    const con = calc.conductors || {};
    const hvCon = con.hv || {};
    const lvCon = con.lv || {};
    const conHtml = section('Conductors & Resistance', '⚡',
        row('HV DC Resistance', safe(hvCon.dcResistance, 4), 'Ω') +
        row('HV AC Resistance', safe(hvCon.acResistance, 4), 'Ω') +
        row('LV DC Resistance', safe(lvCon.dcResistance, 6), 'Ω') +
        row('LV AC Resistance', safe(lvCon.acResistance, 6), 'Ω') +
        row('Current Density', safe((results.inputs || {}).currentDensity, 2), 'A/mm²')
    );

    // ── 5. Dimensions & Weights ──────────────────────────────────
    const dim = calc.dimensions || {};
    const wts = dim.weights || {};
    const tank = dim.tank || {};
    const dimHtml = section('Dimensions & Weights', '📐',
        row('Tank (L×W×H)', `${safe(tank.length)}×${safe(tank.width)}×${safe(tank.height)}`, 'mm') +
        row('Oil Volume', safe(dim.oil && dim.oil.volume, 0), 'L') +
        row('Core Weight', safe(wts.core, 0), 'kg') +
        row('Winding Weight', safe(wts.windings, 0), 'kg') +
        row('Oil Weight', safe(wts.oil, 0), 'kg') +
        row('Total Weight', safe(wts.total, 0), 'kg', 'Approximate transport weight')
    );

    // ── 6. Losses ────────────────────────────────────────────────
    const los = calc.losses || {};
    const copperLoss = los.copperLoss;
    const copperTotal = copperLoss && copperLoss.total != null ? safe(copperLoss.total, 2) : safe(los.loadLoss, 2);
    const lossHtml = section('Loss Analysis', '📉',
        row('No-Load (Core) Loss', safe(los.coreLoss, 2), 'kW', 'Hysteresis + eddy current loss') +
        row('Load (Copper) Loss', copperTotal, 'kW', 'I²R loss at rated current') +
        row('Stray Loss', safe(los.strayLoss, 2), 'kW') +
        row('Total Loss', safe(los.totalLoss, 2), 'kW') +
        row('Efficiency', safe(los.efficiency, 4), '%')
    );

    // ── 7. Temperature ───────────────────────────────────────────
    const tmp = calc.temperature || {};
    const rises = tmp.rises || {};
    const tmpHtml = section('Temperature Rise (IEC 60076-2)', '🌡️',
        row('Top Oil Rise', safe(rises.topOil, 1), '°C') +
        row('Avg Winding Rise', safe(rises.averageWinding, 1), '°C') +
        row('Hot Spot Temp', safe((tmp.absolute || {}).hotSpot, 1), '°C') +
        row('110% Overload Hot Spot', safe((tmp.overload || {}).hotSpotTemp, 1), '°C')
    );

    // ── 8. Impedance ─────────────────────────────────────────────
    const imp = calc.impedance || {};
    const impHtml = section('Impedance (IEC 60076-5)', '⚡',
        row('% Resistance', safe(imp.percentResistance, 4), '%') +
        row('% Reactance', safe(imp.percentReactance, 3), '%') +
        row('% Impedance', safe(imp.percentImpedance, 2), '%') +
        row('Target Impedance', safe(imp.targetImpedance, 2), '%') +
        row('X/R Ratio', safe(imp.xRRatio, 2))
    );

    // ── 9. Short Circuit ─────────────────────────────────────────
    const sc = calc.shortCircuit || {};
    const scC = sc.currents || {};
    const scF = sc.forces || {};
    const scS = sc.stresses || {};
    const scHtml = section('Short Circuit (IEC 60076-5)', '⚡',
        row('SC Current (RMS)', safe(scC.rms, 0), 'A') +
        row('SC Current (Peak)', safe(scC.peak, 0), 'A') +
        row('Radial Force', safe(scF.radial, 1), 'kN') +
        row('Axial Force', safe(scF.axial, 1), 'kN') +
        row('Hoop Stress', safe(scS.hoop, 1), 'MPa') +
        row('Safety Factor', safe(scS.safetyFactor, 2)) +
        row('Withstand Status', sc.status === 'PASS'
            ? '<span class="compliance-badge badge-pass">PASS</span>'
            : '<span class="compliance-badge badge-fail">FAIL</span>', '')
    );

    // ── 10. BIL — Insulation Levels ──────────────────────────────
    const adv = calc.advanced || {};
    const params = adv.parameters || {};
    const bilData = adv.bil || {};
    const hvBil = bilData.hv || {};
    const lvBil = bilData.lv || {};
    const hvClr = hvBil.clearance || {};
    const bilHtml = section('Insulation Levels (BIL) — IEC 60076-3', '🛡️',
        row('HV Voltage Class', safe(hvBil.label), '', 'HV voltage class') +
        row('HV BIL', safe(hvBil.bil), 'kV peak', 'Basic Impulse Level') +
        row('HV Chopped Wave BIL', safe(hvBil.chopped), 'kV peak') +
        row('HV Power Freq Withstand', safe(hvBil.powerFreq), 'kV rms') +
        row('HV Min Oil Clearance', safe(hvClr.oil), 'mm') +
        row('HV Min Air Clearance', safe(hvClr.air), 'mm') +
        row('LV Voltage Class', safe(lvBil.label), '') +
        row('LV BIL', safe(lvBil.bil), 'kV peak') +
        row('LV Power Freq Withstand', safe(lvBil.powerFreq), 'kV rms') +
        row('Noise Level', safe(params.noiseLevel, 1), 'dB', 'Estimated per IEC 60076-10')
    );

    // ── 11. INR Material Cost Breakdown ──────────────────────────
    const costINR = adv.costINR || {};
    const brkd = costINR.breakdown || {};
    const econ = adv.economics || {};
    const buildCostRows = () => {
        if (!costINR.sellingPrice) {
            const fmt$ = v => (v != null && !isNaN(v)) ? '$' + Number(v).toLocaleString() : '—';
            return row('Estimated Price (USD)', fmt$(econ.estimatedPrice), '', 'Materials × 2.5') +
                row('Total Ownership Cost', fmt$(econ.totalOwnershipCost), '');
        }
        return Object.values(brkd).map(b => row(b.label, b.fmt, '')).join('') +
            row('Labor (15%)', costINR.laborCost && costINR.laborCost.fmt, '') +
            row('Overhead (12%)', costINR.overheadCost && costINR.overheadCost.fmt, '') +
            row('Total Manufacturing Cost', costINR.totalCost && costINR.totalCost.fmt, '') +
            row('Selling Price (25% margin)', costINR.sellingPrice && costINR.sellingPrice.fmt, '');
    };
    const costHtml = section('Material Cost Estimate (INR)', '💰', buildCostRows());

    // ── 12. OLTC / Tap Extremes ───────────────────────────────────
    let tapHtml = '';
    const tapEx = calc.tapExtremes || {};
    if (tapEx.applicable) {
        const minT = tapEx.minimumTap || {};
        const nomT = tapEx.nominal || {};
        const maxT = tapEx.maximumTap || {};
        const tapBadge = s => {
            if (s === 'CRITICAL') return '<span class="compliance-badge badge-fail">CRITICAL</span>';
            if (s === 'WARNING') return '<span class="compliance-badge" style="background:#fef3c7;color:#92400e;border:1px solid #fcd34d;">WARN</span>';
            if (s === 'RATED') return '<span class="compliance-badge" style="background:#dbeafe;color:#1e3a8a;border:1px solid #93c5fd;">RATED</span>';
            return '<span class="compliance-badge badge-pass">OK</span>';
        };
        const tableRows = `
            <thead style="background:#f8faff;">
                <tr>
                    <th style="padding:8px 12px;text-align:left;font-size:0.8em;color:#666;">Position</th>
                    <th style="padding:8px 12px;text-align:right;font-size:0.8em;color:#666;">Tap %</th>
                    <th style="padding:8px 12px;text-align:right;font-size:0.8em;color:#666;">Voltage (kV)</th>
                    <th style="padding:8px 12px;text-align:right;font-size:0.8em;color:#666;">Flux (T)</th>
                    <th style="padding:8px 12px;text-align:right;font-size:0.8em;color:#666;">V/Turn</th>
                    <th style="padding:8px 12px;text-align:center;font-size:0.8em;color:#666;">Status</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #f0f3f7;">
                    <td style="padding:8px 12px;font-weight:600;">Min Tap</td>
                    <td style="padding:8px 12px;text-align:right;">${minT.position || '—'}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(minT.voltage, 2)}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(minT.fluxDensity, 3)}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(minT.voltsPerTurn, 3)}</td>
                    <td style="padding:8px 12px;text-align:center;">${tapBadge(minT.status)}</td>
                </tr>
                <tr style="background:#fafbfd;border-bottom:1px solid #f0f3f7;">
                    <td style="padding:8px 12px;font-weight:600;">Nominal</td>
                    <td style="padding:8px 12px;text-align:right;">0%</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(nomT.voltage, 2)}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(nomT.fluxDensity, 3)}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(nomT.voltsPerTurn, 3)}</td>
                    <td style="padding:8px 12px;text-align:center;">${tapBadge('RATED')}</td>
                </tr>
                <tr>
                    <td style="padding:8px 12px;font-weight:600;">Max Tap</td>
                    <td style="padding:8px 12px;text-align:right;">${maxT.position || '—'}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(maxT.voltage, 2)}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(maxT.fluxDensity, 3)}</td>
                    <td style="padding:8px 12px;text-align:right;">${safe(maxT.voltsPerTurn, 3)}</td>
                    <td style="padding:8px 12px;text-align:center;">${tapBadge(maxT.status)}</td>
                </tr>
            </tbody>`;
        tapHtml = `<div class="result-section" style="grid-column:1 / -1;">
            <h4 class="result-section-title">🔄 OCTC Tap Extremes (IEC 60076-1) — Tapping Side: ${tapEx.tappingSide || '?'}, Range: ±${tapEx.tappingRange || '?'}%</h4>
            <div style="padding:12px 16px;">
                <table style="width:100%;border-collapse:collapse;font-size:0.9em;">${tableRows}</table>
                ${tapEx.warnings && tapEx.warnings.length ? `<div style="margin-top:10px;padding:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;font-size:0.85em;color:#92400e;">
                    ⚠️ ${tapEx.warnings.map(w => w.message).join('<br>⚠️ ')}</div>` : ''}
            </div>
        </div>`;
    } else {
        tapHtml = section('Tap Changer', '🔄',
            row('Type', (calc.tapExtremes && !calc.tapExtremes.applicable)
                ? 'N/A (OCTC only)' : safe(null))
        );
    }

    // ── 11. IEC Validation ───────────────────────────────────────
    let validHtml = '';
    if (results.validation && results.validation.margins) {
        const statusColor = results.validation.compliance.status === 'COMPLIANT' ? '#198754' : '#dc3545';
        const statusIcon = results.validation.compliance.status === 'COMPLIANT' ? '✅' : '❌';
        let cards = results.validation.margins.map(m => {
            const bg = m.status === 'CRITICAL' ? '#fff5f5' : m.status === 'SAFE' ? '#f0fdf4' : '#fffbeb';
            const color = m.status === 'CRITICAL' ? '#dc3545' : m.status === 'SAFE' ? '#198754' : '#d39e00';
            return `<div style="border:1px solid ${color};background:${bg};border-radius:8px;padding:10px;text-align:center;">
                <div style="font-weight:700;color:${color};font-size:0.85em;">${m.parameter}</div>
                <div style="font-size:1.3em;font-weight:700;margin:4px 0;">${m.value} ${m.unit}</div>
                <div style="font-size:0.8em;color:#666;">Limit: ${m.limit} ${m.unit}</div>
                <div style="font-size:0.8em;font-weight:700;color:${color};">Margin: ${m.margin}</div>
            </div>`;
        }).join('');
        validHtml = `<div class="result-section" style="grid-column:1 / -1;">
            <h4 class="result-section-title" style="display:flex;justify-content:space-between;">
                🛡️ IEC 60076 Compliance Audit
                <span style="color:${statusColor};font-size:0.9em;">${statusIcon} ${results.validation.compliance.status}</span>
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;padding:12px 16px;">
                ${cards}
            </div>
        </div>`;
    }

    // ── Charts row ───────────────────────────────────────────────
    const chartsHtml = `
        <div style="grid-column:1 / -1; background:#fff; border-radius:0;">
            <h4 class="result-section-title" style="border-radius:0;">📊 Visual Analysis</h4>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:20px;">
                <div style="background:#fff;border-radius:12px;border:1px solid #e8edf2;padding:16px;display:flex;align-items:center;justify-content:center;min-height:220px;">
                    <canvas id="summaryChart" style="max-height:200px;"></canvas>
                </div>
                <div style="background:#fff;border-radius:12px;border:1px solid #e8edf2;padding:16px;display:flex;align-items:center;justify-content:center;min-height:220px;">
                    <canvas id="lossesChart" style="max-height:200px;"></canvas>
                </div>
                <div style="background:#fff;border-radius:12px;border:1px solid #e8edf2;padding:16px;display:flex;align-items:center;justify-content:center;min-height:220px;">
                    <canvas id="weightChart" style="max-height:200px;"></canvas>
                </div>
                <div style="background:#fff;border-radius:12px;border:1px solid #e8edf2;padding:16px;display:flex;align-items:center;justify-content:center;min-height:220px;">
                    <canvas id="temperatureChart" style="max-height:200px;"></canvas>
                </div>
                <div style="background:#fff;border-radius:12px;border:1px solid #e8edf2;padding:16px;display:flex;align-items:center;justify-content:center;min-height:220px;grid-column:span 2;">
                    <canvas id="forcesChart" style="max-height:200px;width:100%;"></canvas>
                </div>
            </div>
        </div>`;

    // ── NEW SECTIONS from enhanced 10-advanced.js ─────────────────

    // 10b. Altitude Derating (IEC 60076-2)
    const altData = adv.altitude || {};
    const altBadge = s => s === 'PASS'
        ? '<span class="compliance-badge badge-pass">PASS</span>'
        : '<span class="compliance-badge badge-fail">FAIL</span>';
    const altHtml = section('Altitude Derating — IEC 60076-2', '🏔️',
        row('Installation Altitude', safe(altData.altitude), 'm') +
        row('Altitude Excess (above 1000m)', safe(altData.excessAltitude), 'm') +
        row('Derating Factor', safe(altData.deratingFactor), '', 'Multiplier on temperature limits') +
        row('Derating %', safe(altData.deratingPercent), '') +
        row('Adj Top Oil Limit', safe(altData.adjustedTopOilLimit), '°C') +
        row('Adj Winding Limit', safe(altData.adjustedWindingLimit), '°C') +
        row('Actual Top Oil Rise', safe(altData.currentTopOilRise), '°C') +
        row('Actual Winding Rise', safe(altData.currentWindingRise), '°C') +
        row('Top Oil Compliance', altBadge(altData.topOilCompliance) || '—', '') +
        row('Winding Compliance', altBadge(altData.windingCompliance) || '—', '') +
        row('Status', altBadge(altData.overallStatus) || '—', '') +
        `<div style="padding:10px 0;font-size:0.88em;color:#555;">${altData.recommendation || ''}</div>`
    );

    // 10c. Multi-PF Voltage Regulation
    const reg = adv.regulation || {};
    const regHtml = section('Voltage Regulation at Different Power Factors — IEC 60076-1', '📊',
        row('Resistance %R', safe(reg.percentR, 3), '%') +
        row('Reactance %X', safe(reg.percentX, 3), '%') +
        row('Regulation @ Unity PF', safe(reg.regulationUnity, 3), '%') +
        row('Regulation @ 0.8 PF Lag', safe(reg.regulationLag08, 3), '%') +
        row('Regulation @ 0.6 PF Lag', safe(reg.regulationLag06, 3), '%') +
        row('Regulation @ 0.8 PF Lead', safe(reg.regulationLead08, 3), '% (leading = boost)')
    );

    // 10d. Cooling System Design
    const cool = adv.cooling || {};
    const coolHtml = section('Cooling System Design', '❄️',
        row('Cooling Type', safe(cool.coolingType), '') +
        row('Total Losses', safe(cool.totalLossW), 'W') +
        row('Heat Dissipation Coefficient', safe(cool.heatDissipCoeff), 'W/m²·°C') +
        row('Required Dissipation Surface', safe(cool.requiredSurface), 'm²') +
        row('Tank Surface Available', safe(cool.tankSurface), 'm²') +
        row('Extra Surface Needed', safe(cool.extraSurface), 'm²') +
        row('Cooling Tubes Required', safe(cool.tubesRequired), '') +
        row('Radiator Panels', safe(cool.radiatorPanels), '') +
        row('Fans Required', safe(cool.fansRequired), '') +
        row('Oil Pump Required', cool.pumpRequired ? 'Yes' : 'No', '') +
        `<div style="padding:10px 0;font-size:0.88em;color:#555;">${cool.recommendation || ''}</div>`
    );

    // 10e. Loss Guarantee Check
    const lg = adv.lossGuarantee || {};
    const lgBadge = s => s === 'PASS'
        ? '<span class="compliance-badge badge-pass">PASS</span>'
        : '<span class="compliance-badge badge-fail">FAIL</span>';
    const lgHtml = section('Loss Guarantee Check', '📋',
        row('No-Load Loss (Calculated)', safe(lg.noLoad && lg.noLoad.calculated, 2), 'kW') +
        row('No-Load Loss (Guaranteed)', safe(lg.noLoad && lg.noLoad.guaranteed, 2), 'kW') +
        row('No-Load Margin', safe(lg.noLoad && lg.noLoad.margin, 1), '%') +
        row('No-Load Status', lgBadge(lg.noLoad && lg.noLoad.status) || '—', '') +
        row('Load Loss (Calculated)', safe(lg.load && lg.load.calculated, 2), 'kW') +
        row('Load Loss (Guaranteed)', safe(lg.load && lg.load.guaranteed, 2), 'kW') +
        row('Load Margin', safe(lg.load && lg.load.margin, 1), '%') +
        row('Load Status', lgBadge(lg.load && lg.load.status) || '—', '') +
        row('Overall Result', lgBadge(lg.overall) || '—', '')
    );

    // 10f. OLTC design with full tap table
    const oltcData = adv.oltc || {};
    let oltcHtml = '';
    if (oltcData.present) {
        const tapRows = (oltcData.tapTable || []).map(t =>
            `<tr style="border-bottom:1px solid #f0f3f7;">
                <td style="padding:6px 10px;font-weight:${t.position === 'NOMINAL' ? 700 : 400};">${t.position}</td>
                <td style="padding:6px 10px;text-align:right;">${t.percent}%</td>
                <td style="padding:6px 10px;text-align:right;">${t.hvVoltage}</td>
                <td style="padding:6px 10px;text-align:right;">${t.current}</td>
                <td style="padding:6px 10px;text-align:right;">${t.turnsRatio}</td>
            </tr>`).join('');
        oltcHtml = `<div class="result-section" style="grid-column:1 / -1;">
            <h4 class="result-section-title">🔄 OLTC Design — ${oltcData.type}, ${oltcData.tapRange}, ${oltcData.tapSteps} steps, ${oltcData.stepPercent}%/step</h4>
            <div style="padding:12px 16px;">
                ${row('Tap Changer Type', oltcData.type, '')} 
                ${row('Tapping Range', oltcData.tapRange, '')}
                ${row('Number of Steps', safe(oltcData.tapSteps), '')}
                ${row('Step Voltage', safe(oltcData.stepVoltage, 2), 'kV')}
                ${row('Rated Current', safe(oltcData.ratedCurrent, 1), 'A')}
                <div style="margin-top:14px;"><strong>Full Tap Position Table:</strong></div>
                <table style="width:100%;border-collapse:collapse;font-size:0.88em;margin-top:8px;">
                    <thead style="background:#f8faff;">
                        <tr>
                            <th style="padding:6px 10px;text-align:left;color:#666;">Position</th>
                            <th style="padding:6px 10px;text-align:right;color:#666;">Tap %</th>
                            <th style="padding:6px 10px;text-align:right;color:#666;">HV kV</th>
                            <th style="padding:6px 10px;text-align:right;color:#666;">Current A</th>
                            <th style="padding:6px 10px;text-align:right;color:#666;">Turns Ratio</th>
                        </tr>
                    </thead>
                    <tbody>${tapRows}</tbody>
                </table>
            </div>
        </div>`;
    } else {
        oltcHtml = section('Tap Changer', '🔄', row('Configuration', 'No tap changer (NONE selected)', ''));
    }

    // 10g. Efficiency warning
    const effWarn = adv.efficiencyWarning || {};
    let effWarnHtml = '';
    if (effWarn.hasIssue) {
        effWarnHtml = `<div class="result-section" style="grid-column:1/-1;
            background:linear-gradient(135deg,#f39c12,#e67e22);border-left-color:#e67e22;">
            <h4 class="result-section-title" style="color:white;border-color:rgba(255,255,255,0.4);">⚠️ EFFICIENCY WARNING</h4>
            <div style="padding:14px 16px;">
                <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;margin-bottom:12px;">
                    <p style="color:white;font-size:15px;font-weight:600;margin:0;">${effWarn.message}</p>
                    <p style="color:white;margin:8px 0 0;font-size:14px;">Deficit: ${effWarn.deficit}%</p>
                </div>
                <div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:8px;">
                    <p style="color:white;font-weight:600;margin:0;">💡 Recommended Fix:</p>
                    <p style="color:white;margin:6px 0 0;">✅ ${effWarn.recommendation}</p>
                    <p style="color:white;margin:4px 0 0;font-style:italic;font-size:13px;">${effWarn.expectedImprovement}</p>
                </div>
            </div>
        </div>`;
    }

    // ── Inrush Current ────────────────────────────────────────────
    const inr = adv.inrush || {};
    const inrushHtml = section('Inrush Current — IEC 60076-1 Annex B', '⚡',
        row('Peak Inrush Current', safe(inr.peakInrush, 0), 'A peak', 'Worst-case: zero-crossing energisation with full residual flux') +
        row('RMS Inrush (1st cycle)', safe(inr.rmsInrush, 0), 'A rms') +
        row('Multiple of Rated (HV)', safe(inr.multipleOfRated, 1), '× I_rated') +
        row('Peak Flux at Inrush', safe(inr.bPeak, 2), 'T', 'Rated + residual flux') +
        row('Residual Flux Factor', safe(inr.residualFluxFactor), '', 'Fraction of rated flux remaining after de-energisation') +
        row('Decay Time Constant τ', safe(inr.decayTimeConstant), 's') +
        row('Decays to 2% of Peak after', safe(inr.decayTo2PctCycles), 'cycles')
    );

    // ── Oil BDV ───────────────────────────────────────────────────
    const bdv = adv.oilBDV || {};
    const bdvBadge = s => s === 'PASS'
        ? '<span class="compliance-badge badge-pass">PASS</span>'
        : '<span class="compliance-badge badge-fail">FAIL</span>';
    const bdvHtml = section('Oil Dielectric Strength (BDV) — IEC 60296', '🛢️',
        row('Oil Grade', safe(bdv.oilGrade)) +
        row('New Oil Dielectric Strength', safe(bdv.newOilBDV), 'kV/mm') +
        row('Service Oil Limit (×0.75)', safe(bdv.serviceBDV), 'kV/mm') +
        row('HV Eff. Field Strength', safe((bdv.hv || {}).fieldStrength), 'kV/mm') +
        row('HV BDV Margin', safe((bdv.hv || {}).margin), '%') +
        row('HV Status', bdvBadge((bdv.hv || {}).status) || '—', '') +
        row('LV Eff. Field Strength', safe((bdv.lv || {}).fieldStrength), 'kV/mm') +
        row('LV BDV Margin', safe((bdv.lv || {}).margin), '%') +
        row('LV Status', bdvBadge((bdv.lv || {}).status) || '—', '') +
        row('Overall', bdvBadge(bdv.overall) || '—', '')
    );

    // ── Tank Pressure ─────────────────────────────────────────────
    const tp = adv.tankPressure || {};
    const tpBadge = s => s === 'PASS'
        ? '<span class="compliance-badge badge-pass">PASS</span>'
        : '<span class="compliance-badge" style="background:#fff7ed;color:#92400e;border:1px solid #fcd34d;">⚠️ ' + s + '</span>';
    const tankPressureHtml = section('Tank Design Pressure — IEC 60076-1 Annex A', '🔩',
        row('Tank Height', safe(tp.tankHeight_m), 'm') +
        row('Oil Volume', safe(tp.oilVolume_L), 'L') +
        row('Oil Expansion (normal load)', safe(tp.oilExpansion_normal_L), 'L') +
        row('Oil Expansion (fault)', safe(tp.oilExpansion_fault_L), 'L') +
        row('Hydrostatic Pressure', safe(tp.hydrostaticPressure_kPa), 'kPa') +
        row('Thermal Pressure (load)', safe(tp.thermalPressure_kPa), 'kPa') +
        row('Normal Design Pressure', safe(tp.designPressure_kPa), 'kPa') +
        row('Normal Limit (75 kPa)', tpBadge(tp.normalStatus) || '—', '') +
        row('Fault Pressure (incl. arc)', safe(tp.faultPressure_kPa), 'kPa') +
        row('Fault Limit (150 kPa)', tpBadge(tp.faultStatus) || '—', '') +
        `<div style="padding:10px 0;font-size:0.88em;color:#555;">${tp.recommendation || ''}</div>`
    );

    // ── Assemble all into resultsContent ─────────────────────────
    const container = document.getElementById('resultsContent') || document.getElementById('resultsContainer');
    if (!container) { console.error('No results container found'); return; }

    container.innerHTML = `
        <div class="results-inner">
            ${effWarnHtml}
            ${curHtml}${coreHtml}${windHtml}${conHtml}${dimHtml}${lossHtml}${tmpHtml}${impHtml}${scHtml}
            ${bilHtml}${altHtml}${regHtml}${coolHtml}${lgHtml}${oltcHtml}${costHtml}
            ${inrushHtml}${bdvHtml}${tankPressureHtml}
            ${tapHtml}${validHtml}${chartsHtml}
        </div>
    `;
    container.style.display = 'block';

    // Render charts now that canvases exist in DOM
    if (typeof generateAllCharts === 'function') {
        try {
            generateAllCharts(results.calculations);
        } catch (e) {
            console.warn('Chart render error:', e);
        }
    }
}


// Helper to inject validation container if missing
function createValidationContainer() {
    const container = document.createElement('div');
    container.id = 'validationContainer';
    container.className = 'result-section';
    container.style.marginTop = '20px';
    container.style.padding = '20px';
    container.style.background = '#f8f9fa';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #e9ecef';

    // Insert after summary results
    const summary = document.getElementById('summaryResults');
    if (summary && summary.parentNode) {
        summary.parentNode.appendChild(container);
    }
    return container;
}

// Export for external use
window.createValidationContainer = createValidationContainer;

/**
 * Handle Design Freeze
 */
window.handleFreezeDesign = function () {
    if (!currentResults) {
        alert('Please run a calculation first.');
        return;
    }

    // 1. Generate Work Order ID
    const date = new Date();
    const year = date.getFullYear();
    const id = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const woId = `WO-${year}-${id}`;
    const revId = 'REV-A';

    // 2. Create Manufacturing Snapshot
    const snapshot = {
        wo: woId,
        revision: revId,
        status: 'Frozen',
        stage: 'design', // Initial Stage
        customer: document.getElementById('calc_customer')?.value || 'Pending Assignment',
        rating: currentResults.inputs.mva,
        voltage: `${currentResults.inputs.hv}/${currentResults.inputs.lv}`,
        timestamp: date.toISOString(),
        lastUpdated: date.toISOString(),
        lastUpdatedBy: 'Engineering Team',

        // Detailed Engineering Data
        designData: currentResults,

        // Comparison Data (Mocking "Actuals" for Phase 3 demo)
        actuals: null
    };

    console.log('❄️ Design Frozen:', snapshot);

    // 3. Persist to "Manufacturing Database" (localStorage)
    try {
        const dbString = localStorage.getItem('transformer_db');
        let db = dbString ? JSON.parse(dbString) : [];
        if (!Array.isArray(db)) db = [];

        db.push(snapshot);
        localStorage.setItem('transformer_db', JSON.stringify(db));

        console.log('💾 Saved to Manufacturing DB:', db.length, 'records');
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        alert('Error saving design to local database.');
        return;
    }

    // 4. UI Feedback
    const btn = document.getElementById('btn-freeze');
    if (btn) {
        btn.innerHTML = `🔒 Frozen (${woId})`;
        btn.disabled = true;
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-secondary');
    }

    alert(`Design Frozen Successfully!\n\nWork Order Generated: ${woId}\n\nThis design is now active in the manufacturing system (Digital Twin).`);
};

// ========== UTILS & EXPORT ==========
window.exportToExcel = function () {
    if (typeof exportExcel === 'function') exportExcel();
    else alert('Export module not loaded');
};

window.exportAsPDFHTML = function () {
    if (typeof exportPDF === 'function') exportPDF();
    else alert('Export module not loaded');
};

window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('darkModeBtn');
    if (document.body.classList.contains('dark-mode')) {
        btn.innerText = '☀️ Light Mode';
    } else {
        btn.innerText = '🌙 Dark Mode';
    }
};

window.saveToLocalStorage = function () {
    const ids = ['mva', 'frequency', 'hv', 'lv', 'phases', 'vectorGroup', 'cooling', 'coreMaterial',
        'windingMaterial', 'fluxDensity', 'voltsPerTurn', 'impedance', 'currentDensity',
        'ambientTemp', 'altitude', 'tapChangerType', 'tappingRange', 'tappingSide', 'powerFactor',
        'minEfficiency', 'designMode'];
    const data = { timestamp: new Date().getTime() };
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });
    localStorage.setItem('transformer_draft', JSON.stringify(data));
    const btn = event && event.target;
    if (btn) { btn.textContent = '✅ Saved!'; setTimeout(() => { btn.textContent = '💾 Save Draft'; }, 1500); }
    else alert('Draft saved!');
};

window.loadFromLocalStorage = function () {
    const dataStr = localStorage.getItem('transformer_draft');
    if (!dataStr) { alert('No draft found.'); return; }
    try {
        const data = JSON.parse(dataStr);
        Object.keys(data).forEach(id => {
            const el = document.getElementById(id);
            if (el && data[id] !== undefined) el.value = data[id];
        });
        const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : '?';
        const btn = event && event.target;
        if (btn) { btn.textContent = '✅ Loaded!'; setTimeout(() => { btn.textContent = '📂 Load Draft'; }, 1500); }
        else alert(`Draft loaded (saved ${ts})`);
    } catch {
        alert('Failed to load draft.');
    }
};

// Export for external use
window.loadPreset = loadPreset;
