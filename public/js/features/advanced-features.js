/* ===============================
   ADVANCED FEATURES BUNDLE
   1. OLTC Design Calculator
   2. BIL & Insulation Calculator
   3. Cooling System Design
   Add this to calculation.js
================================ */

// ========================================
// 1️⃣ OLTC DESIGN CALCULATOR
// ========================================

/**
 * Calculate OLTC (On-Load Tap Changer) Design
 */
function calculateOLTC(inputs, results) {
    // Check if OLTC is required
    if (inputs.tapChangerType === 'NONE') {
        return {
            enabled: false,
            message: 'No Tap Changer specified'
        };
    }

    const oltc = {};
    oltc.enabled = true;
    oltc.type = inputs.tapChangerType; // OLTC or DETC

    // Standard tap ranges - now user-selectable
    const tapRanges = {
        5: { percent: 5, steps: 9 },
        10: { percent: 10, steps: 17 },
        15: { percent: 15, steps: 25 },
        20: { percent: 20, steps: 33 }
    };

    // Use user-selected tap range
    const selectedRange = tapRanges[inputs.tappingRange];
    oltc.tapRange = `±${inputs.tappingRange}%`;
    oltc.totalSteps = selectedRange.steps;
    oltc.percentRange = selectedRange.percent;

    // ... rest of the function stays the same ...
    // (keep all the existing calculations)

    // Voltage calculations
    const hvVoltage = inputs.hv * 1000;
    const voltageRange = hvVoltage * (selectedRange.percent / 100);
    const voltsPerStep = (voltageRange * 2) / (selectedRange.steps - 1);

    oltc.voltageRange = voltageRange.toFixed(0);
    oltc.voltsPerStep = voltsPerStep.toFixed(2);
    oltc.percentPerStep = (voltsPerStep / hvVoltage * 100).toFixed(3);

    oltc.minVoltage = ((hvVoltage - voltageRange) / 1000).toFixed(2);
    oltc.maxVoltage = ((hvVoltage + voltageRange) / 1000).toFixed(2);
    oltc.nominalVoltage = inputs.hv;

    const hvTurns = results.windings.hvTurns;
    const turnsPerStep = Math.round((hvTurns * (voltsPerStep / hvVoltage)));
    oltc.turnsPerStep = turnsPerStep;
    oltc.totalTappingTurns = turnsPerStep * (selectedRange.steps - 1);

    const baseCurrent = parseFloat(results.currents.hvCurrent);
    oltc.minTapCurrent = (baseCurrent * (hvVoltage / (hvVoltage - voltageRange))).toFixed(2);
    oltc.maxTapCurrent = (baseCurrent * (hvVoltage / (hvVoltage + voltageRange))).toFixed(2);
    oltc.nominalCurrent = baseCurrent.toFixed(2);

    oltc.oltcRating = inputs.mva;
    oltc.oltcType = inputs.hv >= 132 ? 'Resistor Type' : 'Vacuum Type';

    oltc.tapTable = generateTapTable(oltc, inputs, baseCurrent);

    return oltc;
}

/**
 * Generate complete tap position table
 */
function generateTapTable(oltc, inputs, _baseCurrent) {
    const table = [];
    const steps = oltc.totalSteps;
    const centerStep = Math.ceil(steps / 2);
    const hvVoltage = inputs.hv * 1000;
    const voltsPerStep = parseFloat(oltc.voltsPerStep);

    for (let i = 1; i <= steps; i++) {
        const stepFromNominal = i - centerStep;
        const voltage = hvVoltage + (stepFromNominal * voltsPerStep);
        const current = (inputs.mva * 1000000) / (Math.sqrt(3) * voltage);
        const percent = (stepFromNominal * parseFloat(oltc.percentPerStep)).toFixed(2);

        table.push({
            position: i,
            label: stepFromNominal === 0 ? 'NOMINAL' : (stepFromNominal > 0 ? `+${stepFromNominal}` : stepFromNominal),
            voltage: (voltage / 1000).toFixed(2),
            current: current.toFixed(2),
            percent: percent
        });
    }

    return table;
}

// ========================================
// 2️⃣ BIL & INSULATION CALCULATOR
// ========================================

/**
 * Calculate BIL (Basic Impulse Level) and Insulation Design
 */
function calculateBIL(inputs, _results) {
    const bil = {};

    // Standard BIL values based on system voltage (IEC 60076-3)
    const bilStandards = {
        11: { bil: 75, acTest: 28, oilBIL: 60 },
        22: { bil: 125, acTest: 50, oilBIL: 100 },
        33: { bil: 170, acTest: 70, oilBIL: 145 },
        66: { bil: 325, acTest: 140, oilBIL: 275 },
        110: { bil: 450, acTest: 185, oilBIL: 380 },
        132: { bil: 550, acTest: 230, oilBIL: 460 },
        220: { bil: 1050, acTest: 460, oilBIL: 900 },
        400: { bil: 1425, acTest: 630, oilBIL: 1200 }
    };

    // Select BIL based on HV voltage
    let bilData = bilStandards[11]; // default
    for (const [voltage, data] of Object.entries(bilStandards)) {
        if (inputs.hv >= parseInt(voltage)) {
            bilData = data;
        }
    }

    bil.lightningImpulse = bilData.bil; // kVp
    bil.acWithstand = bilData.acTest; // kV RMS
    bil.oilBIL = bilData.oilBIL; // kVp
    bil.systemVoltage = inputs.hv;

    // Clearance calculations (IEC 60076-3)
    // Formula: Clearance (mm) = k × BIL (kV)
    const k_oil = 3.5; // 3.5 mm per kV for oil

    bil.clearances = {
        hvToLV: Math.round((bil.lightningImpulse - 325) * k_oil / 1000 * 1000 + 200), // mm
        hvToTank: Math.round((bil.lightningImpulse) * k_oil / 1000 * 1000 + 50), // mm
        lvToTank: Math.round(150), // mm (standard)
        hvPhaseToPhase: Math.round((bil.lightningImpulse) * k_oil / 1000 * 1000), // mm
        lvPhaseToPhase: Math.round(100) // mm (standard)
    };

    // Insulation layer thicknesses
    bil.insulation = {
        hvTurnToTurn: Math.round(0.3 + (inputs.hv / 100) * 0.1), // mm
        hvLayerToLayer: Math.round(1.0 + (inputs.hv / 100) * 0.5), // mm
        lvTurnToTurn: 0.2, // mm
        lvLayerToLayer: 0.8, // mm
        mainInsulation: Math.round(5 + (inputs.hv / 20)), // mm
        endInsulation: Math.round(10 + (inputs.hv / 15)) // mm
    };

    // Creepage distances (surface path in air)
    bil.creepageDistances = {
        hvBushing: Math.round((bil.lightningImpulse / 15) * 25), // mm
        lvBushing: Math.round(150), // mm
        hvLead: Math.round((bil.lightningImpulse / 20) * 25) // mm
    };

    // Oil gap requirements
    bil.oilGaps = {
        hvToGround: Math.round(bil.oilBIL / 30), // mm (approx 30 kV/mm for oil)
        hvToLV: Math.round((bil.lightningImpulse - 325) / 25), // mm
        lvToGround: Math.round(50) // mm
    };

    // Insulation class
    if (inputs.hv >= 200) {
        bil.insulationClass = 'Class A (Extra High Voltage)';
    } else if (inputs.hv >= 66) {
        bil.insulationClass = 'Class A (High Voltage)';
    } else {
        bil.insulationClass = 'Class E (Medium Voltage)';
    }

    // Test requirements
    bil.tests = {
        routine: [
            'Applied Voltage Test (AC)',
            'Induced Overvoltage Test',
            'Measurement of Winding Resistance',
            'Measurement of Voltage Ratio',
            'Measurement of No-load Loss and Current',
            'Measurement of Impedance and Load Loss'
        ],
        type: [
            'Lightning Impulse Test',
            'Temperature Rise Test',
            'Short Circuit Test'
        ]
    };

    return bil;
}

// ========================================
// 3️⃣ COOLING SYSTEM DESIGN
// ========================================

/**
 * Calculate detailed cooling system design
 */
function calculateCoolingSystem(inputs, results) {
    const cooling = {};

    // Total heat to dissipate (losses)
    const totalLoss = parseFloat(results.losses.totalLoss); // kW
    cooling.heatToDissipate = totalLoss;

    // Ambient temperature (standard)
    const ambientTemp = 50; // °C (max ambient per IEC)
    const oilRiseLimit = 55; // °C
    const windingRiseLimit = 65; // °C

    cooling.ambientTemp = ambientTemp;
    cooling.maxOilTemp = ambientTemp + oilRiseLimit;
    cooling.maxWindingTemp = ambientTemp + windingRiseLimit;

    // Cooling coefficient (W/m²·°C)
    const coolingCoefficient = {
        'ONAN': 1.2,
        'ONAF': 2.2,
        'OFAF': 3.0,
        'ONAN/ONAF': 1.8
    };

    const coefficient = coolingCoefficient[inputs.cooling] || 1.2;
    cooling.coolingCoefficient = coefficient;

    // Required radiator surface area
    // Q = h × A × ΔT
    // A = Q / (h × ΔT)
    const deltaT = oilRiseLimit; // Temperature difference
    const radiatorArea = (totalLoss * 1000) / (coefficient * deltaT); // m²
    cooling.radiatorArea = radiatorArea.toFixed(1);

    // Number of radiator panels (assume 2.5 m² per panel)
    const areaPerPanel = 2.5;
    const numberOfPanels = Math.ceil(radiatorArea / areaPerPanel);
    cooling.numberOfPanels = numberOfPanels;

    // Radiator bank configuration
    if (numberOfPanels <= 20) {
        cooling.bankConfiguration = '1 Bank';
    } else if (numberOfPanels <= 40) {
        cooling.bankConfiguration = '2 Banks';
    } else if (numberOfPanels <= 60) {
        cooling.bankConfiguration = '3 Banks';
    } else {
        cooling.bankConfiguration = '4 Banks';
    }

    // Oil flow rate calculation (for forced circulation)
    // Q = m × Cp × ΔT
    // m = Q / (Cp × ΔT)
    const specificHeat = 2.1; // kJ/kg·°C for transformer oil
    const oilDensity = 880; // kg/m³
    const tempDrop = 15; // °C (oil temp drop through radiator)

    const massFlowRate = totalLoss / (specificHeat * tempDrop); // kg/s
    const volumeFlowRate = (massFlowRate / oilDensity) * 3600; // m³/hr
    const litersPerMinute = (volumeFlowRate * 1000) / 60; // L/min

    cooling.oilFlowRate = litersPerMinute.toFixed(0);

    // Fan requirements (for ONAF/OFAF)
    if (inputs.cooling.includes('ONAF') || inputs.cooling.includes('OFAF')) {
        // Air flow required (CFM - Cubic Feet per Minute)
        // Approximate: 400 CFM per kW of loss
        const cfmPerKW = 400;
        const totalCFM = totalLoss * cfmPerKW;
        const cfmPerFan = 5000; // Standard industrial fan
        const numberOfFans = Math.ceil(totalCFM / cfmPerFan);

        cooling.fans = {
            required: true,
            numberOfFans: numberOfFans,
            cfmPerFan: cfmPerFan,
            totalCFM: totalCFM.toFixed(0),
            motorPower: (numberOfFans * 0.75).toFixed(1) // kW per fan
        };
    } else {
        cooling.fans = {
            required: false
        };
    }

    // Pump requirements (for OFAF/OFWF)
    if (inputs.cooling.includes('OFAF')) {
        const pumpHead = 15; // meters (typical)
        const pumpEfficiency = 0.75;
        const pumpPower = (volumeFlowRate * pumpHead * oilDensity * 9.81) / (3600000 * pumpEfficiency); // kW

        cooling.pump = {
            required: true,
            flowRate: volumeFlowRate.toFixed(1),
            head: pumpHead,
            power: pumpPower.toFixed(2),
            numberOfPumps: inputs.mva >= 100 ? 2 : 1 // Redundancy for large transformers
        };
    } else {
        cooling.pump = {
            required: false
        };
    }

    // Oil volume in radiators
    const oilPerPanel = 80; // liters per panel (typical)
    cooling.radiatorOilVolume = (numberOfPanels * oilPerPanel).toFixed(0);

    // Total oil volume
    const totalOilVolume = inputs.mva * 400; // Approximate
    const tankOilVolume = totalOilVolume - parseInt(cooling.radiatorOilVolume);

    cooling.oilDistribution = {
        total: totalOilVolume.toFixed(0),
        inTank: tankOilVolume.toFixed(0),
        inRadiators: cooling.radiatorOilVolume
    };

    // Cooling effectiveness rating
    if (inputs.cooling === 'ONAN') {
        cooling.rating = {
            onan: inputs.mva,
            onaf: (inputs.mva * 1.33).toFixed(1),
            ofaf: (inputs.mva * 1.67).toFixed(1)
        };
    } else if (inputs.cooling === 'ONAN/ONAF') {
        cooling.rating = {
            onan: inputs.mva,
            onaf: (inputs.mva * 1.5).toFixed(1)
        };
    } else {
        cooling.rating = {
            rated: inputs.mva
        };
    }

    return cooling;
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================

/**
 * Display OLTC Results
 */
function displayOLTC(oltc) {
    let tapTableHTML = oltc.tapTable.map(tap => `
        <tr style="background: ${tap.label === 'NOMINAL' ? '#fffacd' : 'white'};">
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${tap.position}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: ${tap.label === 'NOMINAL' ? 'bold' : 'normal'};">
                ${tap.label}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${tap.voltage} kV</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${tap.current} A</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${tap.percent > 0 ? '+' : ''}${tap.percent}%</td>
        </tr>
    `).join('');

    const oltcHTML = `
        <div class="result-section" style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white;">
            <h4 style="color: white; border-color: white;">⚙️ OLTC (On-Load Tap Changer) Design</h4>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Tap Range</span>
                <span class="result-value" style="color: white;">${oltc.tapRange}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Total Tap Positions</span>
                <span class="result-value" style="color: white;">${oltc.totalSteps}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">steps</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Volts per Step</span>
                <span class="result-value" style="color: white;">${oltc.voltsPerStep}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">V</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Percent per Step</span>
                <span class="result-value" style="color: white;">${oltc.percentPerStep}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">%</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Voltage Range</span>
                <span class="result-value" style="color: white;">${oltc.minVoltage} kV to ${oltc.maxVoltage} kV</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Turns per Step</span>
                <span class="result-value" style="color: white;">${oltc.turnsPerStep}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">turns</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">OLTC Type</span>
                <span class="result-value" style="color: white;">${oltc.oltcType}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
            
            <div style="margin-top: 20px;">
                <h5 style="color: white; margin-bottom: 10px;">📊 Tap Position Table:</h5>
                <div style="overflow-x: auto; background: white; padding: 10px; border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse; color: #333;">
                        <thead>
                            <tr style="background: #8e44ad; color: white;">
                                <th style="padding: 10px; border: 1px solid #ddd;">Position</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Tap</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Voltage</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Current</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Variation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tapTableHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('resultsContainer').insertAdjacentHTML('beforeend', oltcHTML);
}

/**
 * Display BIL Results
 */
function displayBIL(bil) {
    const bilHTML = `
        <div class="result-section" style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); color: white;">
            <h4 style="color: white; border-color: white;">⚡ BIL & Insulation Design (IEC 60076-3)</h4>
            
            <h5 style="color: white; margin-top: 15px;">Test Levels:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Lightning Impulse (BIL)</span>
                <span class="result-value" style="color: white;">${bil.lightningImpulse}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">kVp</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">AC Withstand</span>
                <span class="result-value" style="color: white;">${bil.acWithstand}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">kV RMS</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Oil BIL</span>
                <span class="result-value" style="color: white;">${bil.oilBIL}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">kVp</span>
            </div>
            
            <h5 style="color: white; margin-top: 15px;">Clearance Distances:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">HV to LV</span>
                <span class="result-value" style="color: white;">${bil.clearances.hvToLV}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">HV to Tank</span>
                <span class="result-value" style="color: white;">${bil.clearances.hvToTank}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">LV to Tank</span>
                <span class="result-value" style="color: white;">${bil.clearances.lvToTank}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <h5 style="color: white; margin-top: 15px;">Insulation Thicknesses:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">HV Turn-to-Turn</span>
                <span class="result-value" style="color: white;">${bil.insulation.hvTurnToTurn}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">HV Layer-to-Layer</span>
                <span class="result-value" style="color: white;">${bil.insulation.hvLayerToLayer}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Main Insulation</span>
                <span class="result-value" style="color: white;">${bil.insulation.mainInsulation}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Insulation Class</span>
                <span class="result-value" style="color: white;">${bil.insulationClass}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
            
            <h5 style="color: white; margin-top: 15px;">Oil Gap Requirements:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">HV to Ground</span>
                <span class="result-value" style="color: white;">${bil.oilGaps.hvToGround}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">HV to LV</span>
                <span class="result-value" style="color: white;">${bil.oilGaps.hvToLV}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">LV to Ground</span>
                <span class="result-value" style="color: white;">${bil.oilGaps.lvToGround}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">mm</span>
            </div>
        </div>
    `;

    document.getElementById('resultsContainer').insertAdjacentHTML('beforeend', bilHTML);
}

/**
 * Display Cooling System Results
 */
function displayCooling(cooling) {
    let fanDetails = '';
    if (cooling.fans.required) {
        fanDetails = `
            <h5 style="margin-top: 15px;">🌀 Cooling Fans:</h5>
            <div class="result-row">
                <span class="result-label">Number of Fans</span>
                <span class="result-value">${cooling.fans.numberOfFans}</span>
                <span class="result-unit">units</span>
            </div>
            <div class="result-row">
                <span class="result-label">CFM per Fan</span>
                <span class="result-value">${cooling.fans.cfmPerFan}</span>
                <span class="result-unit">CFM</span>
            </div>
            <div class="result-row">
                <span class="result-label">Total Air Flow</span>
                <span class="result-value">${cooling.fans.totalCFM}</span>
                <span class="result-unit">CFM</span>
            </div>
            <div class="result-row">
                <span class="result-label">Fan Motor Power</span>
                <span class="result-value">${cooling.fans.motorPower}</span>
                <span class="result-unit">kW</span>
            </div>
        `;
    }

    let pumpDetails = '';
    if (cooling.pump.required) {
        pumpDetails = `
            <h5 style="margin-top: 15px;">💧 Oil Pump:</h5>
            <div class="result-row">
                <span class="result-label">Number of Pumps</span>
                <span class="result-value">${cooling.pump.numberOfPumps}</span>
                <span class="result-unit">units</span>
            </div>
            <div class="result-row">
                <span class="result-label">Flow Rate</span>
                <span class="result-value">${cooling.pump.flowRate}</span>
                <span class="result-unit">m³/hr</span>
            </div>
            <div class="result-row">
                <span class="result-label">Pump Head</span>
                <span class="result-value">${cooling.pump.head}</span>
                <span class="result-unit">meters</span>
            </div>
            <div class="result-row">
                <span class="result-label">Pump Power</span>
                <span class="result-value">${cooling.pump.power}</span>
                <span class="result-unit">kW</span>
            </div>
        `;
    }

    const coolingHTML = `
        <div class="result-section" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white;">
            <h4 style="color: white; border-color: white;">❄️ Cooling System Design</h4>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Heat to Dissipate</span>
                <span class="result-value" style="color: white;">${cooling.heatToDissipate}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">kW</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Cooling Coefficient</span>
                <span class="result-value" style="color: white;">${cooling.coolingCoefficient}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">W/m²·°C</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Ambient Temperature</span>
                <span class="result-value" style="color: white;">${cooling.ambientTemp}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">°C</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Max Oil Temperature</span>
                <span class="result-value" style="color: white;">${cooling.maxOilTemp}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">°C</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Max Winding Temperature</span>
                <span class="result-value" style="color: white;">${cooling.maxWindingTemp}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">°C</span>
            </div>
            
            <h5 style="color: white; margin-top: 15px;">🔧 Radiator System:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Radiator Surface Area</span>
                <span class="result-value" style="color: white;">${cooling.radiatorArea}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">m²</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Number of Radiator Panels</span>
                <span class="result-value" style="color: white;">${cooling.numberOfPanels}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">panels</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Bank Configuration</span>
                <span class="result-value" style="color: white;">${cooling.bankConfiguration}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
            
            <h5 style="color: white; margin-top: 15px;">🛢️ Oil Distribution:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Total Oil Volume</span>
                <span class="result-value" style="color: white;">${cooling.oilDistribution.total}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">liters</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Oil in Tank</span>
                <span class="result-value" style="color: white;">${cooling.oilDistribution.inTank}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">liters</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Oil in Radiators</span>
                <span class="result-value" style="color: white;">${cooling.oilDistribution.inRadiators}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">liters</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Oil Flow Rate</span>
                <span class="result-value" style="color: white;">${cooling.oilFlowRate}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">L/min</span>
            </div>
            
            ${fanDetails}
            ${pumpDetails}
            
            <h5 style="color: white; margin-top: 15px;">📊 Cooling Effectiveness:</h5>
            ${Object.entries(cooling.rating).map(([key, value]) => `
                <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                    <span class="result-label" style="color: white;">${key.toUpperCase()} Rating</span>
                    <span class="result-value" style="color: white;">${value}</span>
                    <span class="result-unit" style="color: rgba(255,255,255,0.7);">MVA</span>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('resultsContainer').insertAdjacentHTML('beforeend', coolingHTML);
}

// ========================================
// INTEGRATION FUNCTIONS
// ========================================

/**
 * Main function to calculate and display all advanced features
 * Call this from your main calculation function
 */
function calculateAndDisplayAdvancedFeatures(inputs, results) {
    console.log('🔧 Calculating Advanced Features...');

    // Calculate all advanced features
    const oltc = calculateOLTC(inputs, results);
    const bil = calculateBIL(inputs, results);
    const cooling = calculateCoolingSystem(inputs, results);
    const costs = calculateMaterialCost(inputs, results);

    // ⭐ ADD THIS: Check loss guarantees ⭐
    const lossCheck = checkLossGuarantees(inputs, results);

    // Display results
    if (oltc.enabled) {
        displayOLTC(oltc);
    }
    displayBIL(bil);
    displayCooling(cooling);
    displayCostEstimation(costs, inputs);

    // ⭐ ADD THIS: Display loss guarantee results ⭐
    if (lossCheck) {
        displayLossGuarantees(lossCheck, inputs);
    }

    console.log('✅ Advanced Features Calculated');

    return { oltc, bil, cooling, costs, lossCheck };
}

// Export functions to window for global access
window.calculateOLTC = calculateOLTC;
window.calculateBIL = calculateBIL;
window.calculateCoolingSystem = calculateCoolingSystem;
window.displayOLTC = displayOLTC;
window.displayBIL = displayBIL;
window.displayCooling = displayCooling;
window.calculateAndDisplayAdvancedFeatures = calculateAndDisplayAdvancedFeatures;
/* ===============================
   MATERIAL COST ESTIMATION MODULE
   Calculate transformer manufacturing cost
   Add this to calculation.js
================================ */

/**
 * Material prices (INR) - Update these based on current market rates
 */
const MATERIAL_PRICES = {
    // Core materials (per kg)
    crgoSteel: 180,      // CRGO Steel ₹180/kg
    crngoSteel: 120,     // CRNGO Steel ₹120/kg

    // Winding materials (per kg)
    copper: 650,         // Electrolytic Copper ₹650/kg
    aluminum: 220,       // Aluminum ₹220/kg

    // Insulation materials (per kg)
    pressboard: 350,     // Pressboard ₹350/kg
    paper: 180,          // Kraft paper ₹180/kg

    // Tank materials (per kg)
    tankSteel: 75,       // Mild steel ₹75/kg

    // Oil (per liter)
    transformerOil: 120, // Transformer oil ₹120/L

    // Bushings (per piece)
    hvBushing220kV: 85000,   // HV bushing 220kV ₹85,000
    hvBushing132kV: 55000,   // HV bushing 132kV ₹55,000
    hvBushing66kV: 35000,    // HV bushing 66kV ₹35,000
    hvBushing33kV: 18000,    // HV bushing 33kV ₹18,000
    lvBushing: 12000,        // LV bushing ₹12,000

    // Accessories (approximate)
    oltc: 1500000,       // OLTC ₹15,00,000
    radiatorPerM2: 2500, // Radiator ₹2,500/m²
    fanPerUnit: 8000,    // Cooling fan ₹8,000 each
    conservator: 45000,  // Conservator tank ₹45,000
    buchholzRelay: 25000,// Buchholz relay ₹25,000
    oltcControl: 350000, // OLTC control panel ₹3,50,000

    // Manufacturing overheads (%)
    laborCost: 0.15,     // 15% of material cost
    overheadCost: 0.12,  // 12% of material cost
    profitMargin: 0.25   // 25% markup
};

/**
 * Calculate complete material cost
 */
function calculateMaterialCost(inputs, results) {
    const costs = {};

    // 1. CORE MATERIAL COST
    const coreWeight = parseFloat(results.core.weight); // kg
    const corePrice = inputs.coreMaterial === 'CRGO' ?
        MATERIAL_PRICES.crgoSteel :
        MATERIAL_PRICES.crngoSteel;
    costs.coreSteel = {
        weight: coreWeight,
        pricePerKg: corePrice,
        total: coreWeight * corePrice,
        material: inputs.coreMaterial
    };

    // 2. WINDING MATERIAL COST
    costs.winding = calculateWindingCost(inputs, results);

    // 3. INSULATION MATERIAL COST
    costs.insulation = calculateInsulationCost(inputs, results);

    // 4. TANK & FITTINGS COST
    costs.tank = calculateTankCost(inputs, results);

    // 5. TRANSFORMER OIL COST
    costs.oil = calculateOilCost(inputs);

    // 6. BUSHINGS COST
    costs.bushings = calculateBushingsCost(inputs);

    // 7. COOLING SYSTEM COST
    costs.cooling = calculateCoolingCost(inputs, results);

    // 8. ACCESSORIES COST
    costs.accessories = calculateAccessoriesCost(inputs);

    // 9. CALCULATE TOTALS
    costs.subtotal =
        costs.coreSteel.total +
        costs.winding.total +
        costs.insulation.total +
        costs.tank.total +
        costs.oil.total +
        costs.bushings.total +
        costs.cooling.total +
        costs.accessories.total;

    // 10. MANUFACTURING COSTS
    costs.labor = costs.subtotal * MATERIAL_PRICES.laborCost;
    costs.overhead = costs.subtotal * MATERIAL_PRICES.overheadCost;
    costs.manufacturingCost = costs.subtotal + costs.labor + costs.overhead;

    // 11. SELLING PRICE
    costs.profit = costs.manufacturingCost * MATERIAL_PRICES.profitMargin;
    costs.sellingPrice = costs.manufacturingCost + costs.profit;

    // 12. COST PER KVA/MVA
    costs.costPerMVA = costs.sellingPrice / inputs.mva;
    costs.costPerKVA = costs.costPerMVA / 1000;

    return costs;
}

/**
 * Calculate winding material cost
 */
function calculateWindingCost(inputs, results) {
    const hvTurns = results.windings.hvTurns;
    const lvTurns = results.windings.lvTurns;
    const hvArea = parseFloat(results.conductors.hvArea); // mm²
    const lvArea = parseFloat(results.conductors.lvArea); // mm²

    // Calculate mean turn length (approximation)
    const hvMeanDia = parseFloat(results.windings.hvOuterDiameter); // mm
    const lvMeanDia = parseFloat(results.windings.lvInnerDiameter); // mm

    const hvTurnLength = Math.PI * hvMeanDia / 1000; // meters
    const lvTurnLength = Math.PI * lvMeanDia / 1000; // meters

    // Total conductor length
    const hvLength = hvTurns * hvTurnLength * 3; // 3 phases
    const lvLength = lvTurns * lvTurnLength * 3; // 3 phases

    // Volume in cubic meters
    const hvVolume = (hvLength * hvArea) / 1e9; // m³
    const lvVolume = (lvLength * lvArea) / 1e9; // m³

    // Density (Copper: 8960 kg/m³, Aluminum: 2700 kg/m³)
    const density = inputs.windingMaterial === 'Copper' ? 8960 : 2700;
    const price = inputs.windingMaterial === 'Copper' ?
        MATERIAL_PRICES.copper :
        MATERIAL_PRICES.aluminum;

    // Weight
    const hvWeight = hvVolume * density;
    const lvWeight = lvVolume * density;
    const totalWeight = hvWeight + lvWeight;

    return {
        hvWeight: hvWeight.toFixed(0),
        lvWeight: lvWeight.toFixed(0),
        totalWeight: totalWeight.toFixed(0),
        pricePerKg: price,
        total: totalWeight * price,
        material: inputs.windingMaterial
    };
}

/**
 * Calculate insulation cost
 */
function calculateInsulationCost(inputs, results) {
    // Approximate insulation weight (5-8% of core weight)
    const coreWeight = parseFloat(results.core.weight);
    const pressboardWeight = coreWeight * 0.05;
    const paperWeight = coreWeight * 0.03;

    const pressboardCost = pressboardWeight * MATERIAL_PRICES.pressboard;
    const paperCost = paperWeight * MATERIAL_PRICES.paper;

    return {
        pressboard: pressboardWeight.toFixed(0),
        paper: paperWeight.toFixed(0),
        total: pressboardCost + paperCost
    };
}

/**
 * Calculate tank cost
 */
function calculateTankCost(inputs, results) {
    // Approximate tank weight (20-25% of total transformer weight)
    const coreWeight = parseFloat(results.core.weight);
    const windingWeight = parseFloat(results.winding.totalWeight);
    const transformerWeight = coreWeight + windingWeight;
    const tankWeight = transformerWeight * 0.22;

    return {
        weight: tankWeight.toFixed(0),
        pricePerKg: MATERIAL_PRICES.tankSteel,
        total: tankWeight * MATERIAL_PRICES.tankSteel
    };
}

/**
 * Calculate oil quantity and cost
 */
function calculateOilCost(inputs) {
    // Approximate oil volume based on MVA rating
    // Rule of thumb: 350-450 liters per MVA for large transformers
    const litersPerMVA = 400;
    const oilVolume = inputs.mva * litersPerMVA;

    return {
        volume: oilVolume.toFixed(0),
        pricePerLiter: MATERIAL_PRICES.transformerOil,
        total: oilVolume * MATERIAL_PRICES.transformerOil
    };
}

/**
 * Calculate bushings cost
 */
function calculateBushingsCost(inputs) {
    let hvBushingPrice = 0;

    // Select bushing based on voltage
    if (inputs.hv >= 200) {
        hvBushingPrice = MATERIAL_PRICES.hvBushing220kV;
    } else if (inputs.hv >= 110) {
        hvBushingPrice = MATERIAL_PRICES.hvBushing132kV;
    } else if (inputs.hv >= 50) {
        hvBushingPrice = MATERIAL_PRICES.hvBushing66kV;
    } else {
        hvBushingPrice = MATERIAL_PRICES.hvBushing33kV;
    }

    const hvBushings = 3; // 3-phase
    const lvBushings = 3; // 3-phase

    return {
        hvCount: hvBushings,
        lvCount: lvBushings,
        hvPrice: hvBushingPrice,
        lvPrice: MATERIAL_PRICES.lvBushing,
        total: (hvBushings * hvBushingPrice) + (lvBushings * MATERIAL_PRICES.lvBushing)
    };
}

/**
 * Calculate cooling system cost
 */
function calculateCoolingCost(inputs, results) {
    const totalLoss = parseFloat(results.losses.totalLoss);

    // Radiator area (approx 1 m² per 1.2 kW loss)
    const radiatorArea = totalLoss / 1.2;
    const radiatorCost = radiatorArea * MATERIAL_PRICES.radiatorPerM2;

    // Fans for ONAF/OFAF
    let fanCount = 0;
    let fanCost = 0;

    if (inputs.cooling.includes('ONAF') || inputs.cooling.includes('OFAF')) {
        fanCount = Math.ceil(inputs.mva / 40); // 1 fan per 40 MVA
        fanCost = fanCount * MATERIAL_PRICES.fanPerUnit;
    }

    return {
        radiatorArea: radiatorArea.toFixed(1),
        radiatorCost: radiatorCost,
        fanCount: fanCount,
        fanCost: fanCost,
        total: radiatorCost + fanCost
    };
}

/**
 * Calculate accessories cost
 */
function calculateAccessoriesCost(inputs) {
    let total = 0;
    const items = [];

    // OLTC (for large power transformers)
    if (inputs.mva >= 50) {
        total += MATERIAL_PRICES.oltc + MATERIAL_PRICES.oltcControl;
        items.push({ name: 'OLTC with Control', cost: MATERIAL_PRICES.oltc + MATERIAL_PRICES.oltcControl });
    }

    // Conservator
    total += MATERIAL_PRICES.conservator;
    items.push({ name: 'Conservator Tank', cost: MATERIAL_PRICES.conservator });

    // Buchholz Relay
    total += MATERIAL_PRICES.buchholzRelay;
    items.push({ name: 'Buchholz Relay', cost: MATERIAL_PRICES.buchholzRelay });

    // Miscellaneous (gauges, valves, etc.) - 5% of total
    const misc = total * 0.05;
    total += misc;
    items.push({ name: 'Miscellaneous', cost: misc });

    return {
        items: items,
        total: total
    };
}

/**
 * Display cost estimation results
 */
function displayCostEstimation(costs, _inputs) {
    const costHTML = `
        <div class="result-section" style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white;">
            <h4 style="color: white; border-color: white;">💰 Material Cost Estimation</h4>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Core Material (${costs.coreSteel.material})</span>
                <span class="result-value" style="color: white;">${costs.coreSteel.weight} kg @ ₹${costs.coreSteel.pricePerKg}/kg</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.coreSteel.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Winding Material (${costs.winding.material})</span>
                <span class="result-value" style="color: white;">${costs.winding.totalWeight} kg @ ₹${costs.winding.pricePerKg}/kg</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.winding.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Insulation Materials</span>
                <span class="result-value" style="color: white;">Pressboard + Paper</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.insulation.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Tank & Fittings</span>
                <span class="result-value" style="color: white;">${costs.tank.weight} kg Steel</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.tank.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Transformer Oil</span>
                <span class="result-value" style="color: white;">${costs.oil.volume} Liters @ ₹${costs.oil.pricePerLiter}/L</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.oil.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Bushings (HV + LV)</span>
                <span class="result-value" style="color: white;">${costs.bushings.hvCount} HV + ${costs.bushings.lvCount} LV</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.bushings.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Cooling System</span>
                <span class="result-value" style="color: white;">${costs.cooling.radiatorArea} m² + ${costs.cooling.fanCount} Fans</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.cooling.total)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Accessories & OLTC</span>
                <span class="result-value" style="color: white;">${costs.accessories.items.length} Items</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.accessories.total)}</span>
            </div>
            
            <hr style="border-color: rgba(255,255,255,0.3); margin: 15px 0;">
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white; font-weight: bold;">💎 MATERIAL SUBTOTAL</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: yellow; font-weight: bold; font-size: 1.1em;">₹${formatIndianCurrency(costs.subtotal)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Labor Cost (15%)</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.labor)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Overhead Cost (12%)</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.overhead)}</span>
            </div>
            
            <hr style="border-color: rgba(255,255,255,0.3); margin: 15px 0;">
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white; font-weight: bold;">🏭 MANUFACTURING COST</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: yellow; font-weight: bold; font-size: 1.1em;">₹${formatIndianCurrency(costs.manufacturingCost)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Profit Margin (25%)</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.profit)}</span>
            </div>
            
            <hr style="border-color: rgba(255,255,255,0.3); margin: 15px 0;">
            
            <div class="result-row" style="color: white; border: 2px solid yellow; padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.1);">
                <span class="result-label" style="color: yellow; font-weight: bold; font-size: 1.2em;">💰 SELLING PRICE</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: yellow; font-weight: bold; font-size: 1.3em;">₹${formatIndianCurrency(costs.sellingPrice)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3); margin-top: 10px;">
                <span class="result-label" style="color: white;">Cost per MVA</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${formatIndianCurrency(costs.costPerMVA)}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Cost per kVA</span>
                <span class="result-value" style="color: white;"></span>
                <span class="result-unit" style="color: rgba(255,255,255,0.9);">₹${costs.costPerKVA.toFixed(2)}</span>
            </div>
        </div>
    `;

    document.getElementById('resultsContainer').insertAdjacentHTML('beforeend', costHTML);
}

/**
 * Format numbers in Indian currency style (lakhs, crores)
 */
function formatIndianCurrency(amount) {
    const num = Math.round(amount);
    if (num >= 10000000) { // 1 Crore
        return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) { // 1 Lakh
        return (num / 100000).toFixed(2) + ' L';
    } else if (num >= 1000) { // 1 Thousand
        return (num / 1000).toFixed(2) + ' K';
    } else {
        return num.toLocaleString('en-IN');
    }
}


// Export functions
window.calculateMaterialCost = calculateMaterialCost;
window.displayCostEstimation = displayCostEstimation;
window.formatIndianCurrency = formatIndianCurrency;
/**
 * Check if calculated losses meet guaranteed values
 */
function checkLossGuarantees(inputs, results) {
    const check = {};

    // Safe parsing with fallback for missing results
    const calculatedNoLoad = results && results.losses ? parseFloat(results.losses.coreLoss) : 0;
    const calculatedLoad = results && results.losses ? parseFloat(results.losses.totalCopperLoss) : 0;
    const calculatedEfficiency = results && results.losses ? parseFloat(results.losses.efficiency) : 0;

    check.noLoad = {
        calculated: !isNaN(calculatedNoLoad) ? calculatedNoLoad.toFixed(2) : 'N/A',
        guaranteed: inputs.guaranteedNoLoad ? parseFloat(inputs.guaranteedNoLoad).toFixed(2) : 'Not specified',
        status: inputs.guaranteedNoLoad && !isNaN(calculatedNoLoad) ?
            (calculatedNoLoad <= parseFloat(inputs.guaranteedNoLoad) ? 'PASS' : 'FAIL') : 'N/A'
    };

    check.load = {
        calculated: !isNaN(calculatedLoad) ? calculatedLoad.toFixed(2) : 'N/A',
        guaranteed: inputs.guaranteedLoadLoss ? parseFloat(inputs.guaranteedLoadLoss).toFixed(2) : 'Not specified',
        status: inputs.guaranteedLoadLoss && !isNaN(calculatedLoad) ?
            (calculatedLoad <= parseFloat(inputs.guaranteedLoadLoss) ? 'PASS' : 'FAIL') : 'N/A'
    };

    check.efficiency = {
        calculated: !isNaN(calculatedEfficiency) ? calculatedEfficiency.toFixed(2) : 'N/A',
        minimum: inputs.minEfficiency ? parseFloat(inputs.minEfficiency).toFixed(1) : 'Not specified',
        status: inputs.minEfficiency && !isNaN(calculatedEfficiency) ? 
            (calculatedEfficiency >= parseFloat(inputs.minEfficiency) ? 'PASS' : 'FAIL') : 'N/A'
    };

    check.environmental = {
        ambientTemp: inputs.ambientTemp,
        altitude: inputs.altitude,
        installationType: inputs.installationType,
        altitudeDerating: inputs.altitude > 1000 ? ((inputs.altitude - 1000) / 1000 * 5).toFixed(1) + '%' : 'None'
    };

    return check;
}

/**
 * Display loss guarantee check results
 */
function displayLossGuarantees(check, _inputs) {
    const html = `
        <div class="result-section" style="background: linear-gradient(135deg, #16a085 0%, #138871 100%); color: white;">
            <h4 style="color: white; border-color: white;">✅ Performance Guarantee Verification</h4>
            
            <h5 style="color: white; margin-top: 15px;">Loss Guarantees:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">No-Load Loss</span>
                <span class="result-value" style="color: white;">${check.noLoad.calculated} kW (Guaranteed: ${check.noLoad.guaranteed} kW)</span>
                <span class="compliance-badge badge-${check.noLoad.status === 'PASS' ? 'pass' : check.noLoad.status === 'FAIL' ? 'fail' : 'warning'}">${check.noLoad.status}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Load Loss</span>
                <span class="result-value" style="color: white;">${check.load.calculated} kW (Guaranteed: ${check.load.guaranteed} kW)</span>
                <span class="compliance-badge badge-${check.load.status === 'PASS' ? 'pass' : check.load.status === 'FAIL' ? 'fail' : 'warning'}">${check.load.status}</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Efficiency</span>
                <span class="result-value" style="color: white;">${check.efficiency.calculated}% (Minimum: ${check.efficiency.minimum}%)</span>
                <span class="compliance-badge badge-${check.efficiency.status === 'PASS' ? 'pass' : 'fail'}">${check.efficiency.status}</span>
            </div>
            
            <h5 style="color: white; margin-top: 15px;">Environmental Conditions:</h5>
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Ambient Temperature</span>
                <span class="result-value" style="color: white;">${check.environmental.ambientTemp}°C</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">Max</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Installation Altitude</span>
                <span class="result-value" style="color: white;">${check.environmental.altitude} m</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">AMSL</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Altitude Derating</span>
                <span class="result-value" style="color: white;">${check.environmental.altitudeDerating}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
            
            <div class="result-row" style="color: white; border-color: rgba(255,255,255,0.3);">
                <span class="result-label" style="color: white;">Installation Type</span>
                <span class="result-value" style="color: white;">${check.environmental.installationType.toUpperCase()}</span>
                <span class="result-unit" style="color: rgba(255,255,255,0.7);">-</span>
            </div>
        </div>
    `;

    document.getElementById('resultsContainer').insertAdjacentHTML('beforeend', html);
}

// Export the new functions
window.checkLossGuarantees = checkLossGuarantees;
window.displayLossGuarantees = displayLossGuarantees;

console.log('✅ Advanced Features Module Loaded');

console.log('✅ Advanced Features Module Loaded');