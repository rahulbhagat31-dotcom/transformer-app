/**
 * ================================================
 * CALCULATOR PRESET TEMPLATES
 * Industry-Standard Transformer Configurations
 * ================================================
 */

const TRANSFORMER_PRESETS = {
    distribution_25: {
        name: 'Distribution 25 MVA',
        specs: '25 MVA, 132/33 kV, ONAN',
        data: {
            mva: 25,
            hv: 132,
            lv: 33,
            frequency: 50,
            phases: 3,
            vectorGroup: 'Dyn11',
            cooling: 'ONAN',
            coreMaterial: 'CRGO',
            windingMaterial: 'Copper',
            fluxDensity: 1.65,
            voltsPerTurn: 18,
            impedance: 10,
            currentDensity: 2.8,
            tapChangerType: 'OLTC',
            tappingRange: 10,
            ambientTemp: 50,
            altitude: 1000,
            installationType: 'outdoor',
            minEfficiency: 99.0,
            designMode: 'efficiency'
        }
    },

    power_160: {
        name: 'Power 160 MVA',
        specs: '160 MVA, 220/66 kV, ONAN/ONAF',
        data: {
            mva: 160,
            hv: 220,
            lv: 66,
            frequency: 50,
            phases: 3,
            vectorGroup: 'Dyn11',
            cooling: 'ONAF',
            coreMaterial: 'CRGO',
            windingMaterial: 'Copper',
            fluxDensity: 1.70,
            voltsPerTurn: 60,
            impedance: 12.5,
            currentDensity: 2.5,
            tapChangerType: 'OLTC',
            tappingRange: 15,
            ambientTemp: 50,
            altitude: 1000,
            installationType: 'outdoor',
            minEfficiency: 99.5,
            designMode: 'efficiency'
        }
    },

    ehv_400: {
        name: 'EHV 400 MVA',
        specs: '400 MVA, 400/220 kV, OFAF',
        data: {
            mva: 400,
            hv: 400,
            lv: 220,
            frequency: 50,
            phases: 3,
            vectorGroup: 'YNyn0d1',
            cooling: 'OFAF',
            coreMaterial: 'CRGO',
            windingMaterial: 'Copper',
            fluxDensity: 1.75,
            voltsPerTurn: 100,
            impedance: 15,
            currentDensity: 2.2,
            tapChangerType: 'OLTC',
            tappingRange: 20,
            ambientTemp: 50,
            altitude: 1000,
            installationType: 'outdoor',
            minEfficiency: 99.7,
            designMode: 'efficiency'
        }
    },

    industrial_50: {
        name: 'Industrial 50 MVA',
        specs: '50 MVA, 66/11 kV, ONAN',
        data: {
            mva: 50,
            hv: 66,
            lv: 11,
            frequency: 50,
            phases: 3,
            vectorGroup: 'Dyn11',
            cooling: 'ONAN',
            coreMaterial: 'CRGO',
            windingMaterial: 'Copper',
            fluxDensity: 1.68,
            voltsPerTurn: 25,
            impedance: 11,
            currentDensity: 2.6,
            tapChangerType: 'OLTC',
            tappingRange: 12,
            ambientTemp: 50,
            altitude: 1000,
            installationType: 'indoor',
            minEfficiency: 99.2,
            designMode: 'efficiency'
        }
    }
};

/**
 * Load a preset template into the calculator
 */
function loadPreset(presetKey) {
    const preset = TRANSFORMER_PRESETS[presetKey];
    if (!preset) {
        console.error('Preset not found:', presetKey);
        return;
    }

    const data = preset.data;

    // Populate all fields
    document.getElementById('mva').value = data.mva;
    document.getElementById('hv').value = data.hv;
    document.getElementById('lv').value = data.lv;
    document.getElementById('frequency').value = data.frequency;
    document.getElementById('phases').value = data.phases;
    document.getElementById('vectorGroup').value = data.vectorGroup;
    document.getElementById('cooling').value = data.cooling;
    document.getElementById('coreMaterial').value = data.coreMaterial;
    document.getElementById('windingMaterial').value = data.windingMaterial;
    document.getElementById('fluxDensity').value = data.fluxDensity;
    document.getElementById('voltsPerTurn').value = data.voltsPerTurn;
    document.getElementById('impedance').value = data.impedance;
    document.getElementById('currentDensity').value = data.currentDensity;

    // Optional fields
    if (document.getElementById('tapChangerType')) {
        document.getElementById('tapChangerType').value = data.tapChangerType;
    }
    if (document.getElementById('tappingRange')) {
        document.getElementById('tappingRange').value = data.tappingRange;
    }
    if (document.getElementById('ambientTemp')) {
        document.getElementById('ambientTemp').value = data.ambientTemp;
    }
    if (document.getElementById('altitude')) {
        document.getElementById('altitude').value = data.altitude;
    }
    if (document.getElementById('installationType')) {
        document.getElementById('installationType').value = data.installationType;
    }
    if (document.getElementById('minEfficiency')) {
        document.getElementById('minEfficiency').value = data.minEfficiency;
    }
    if (document.getElementById('designMode')) {
        document.getElementById('designMode').value = data.designMode;
    }

    // Show success message
    showToast(`✅ Loaded template: ${preset.name}`, 'success');

    // Trigger validation on all fields
    validateAllInputs();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('📋 Preset templates loaded:', Object.keys(TRANSFORMER_PRESETS).length);

// Export for external use
window.loadPreset = loadPreset;
