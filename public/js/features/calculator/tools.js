/**
 * ================================================
 * CALCULATOR TOOLS
 * Advanced Features: Compare Designs, Diagrams, Cost Estimator
 * ================================================
 */

/**
 * 1. COMPARE DESIGNS
 * Compare current design inputs against a saved design set
 */
window.compareDesigns = function () {
    const sets = JSON.parse(localStorage.getItem('calculatorDesignSets') || '[]');
    if (sets.length === 0) {
        alert('No saved designs found to compare with. Save a design first!');
        return;
    }

    // specific UI handling to select a design would normally go here
    // For simplicity, we'll prompt the user
    const list = sets.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
    const choice = prompt(`Select a design to compare with current inputs:\n\n${list}`);
    const idx = parseInt(choice, 10) - 1;

    if (isNaN(idx) || idx < 0 || idx >= sets.length) return;

    const saved = sets[idx].inputs;
    const current = window.collectInputs(); // from enhancements.js

    const comparison = [
        { label: 'Rating (MVA)', key: 'mva' },
        { label: 'HV Voltage (kV)', key: 'hv' },
        { label: 'LV Voltage (kV)', key: 'lv' },
        { label: 'Flux Density (T)', key: 'fluxDensity' },
        { label: 'Current Density', key: 'currentDensity' },
        { label: 'Impedance (%)', key: 'impedance' }
    ];

    let resultMsg = `Comparing Current vs "${sets[idx].name}":\n\n`;

    comparison.forEach(item => {
        const currVal = current[item.key] || '-';
        const savedVal = saved[item.key] || '-';
        const diff = (parseFloat(currVal) - parseFloat(savedVal)).toFixed(2);
        const diffStr = isNaN(diff) ? '' : `(Diff: ${diff > 0 ? '+' : ''}${diff})`;

        resultMsg += `${item.label}:\n   Current: ${currVal}\n   Saved:   ${savedVal} ${diffStr}\n\n`;
    });

    alert(resultMsg);
};

/**
 * 2. TAP CHANGER DIAGRAM
 * Shows a schematic based on selected type
 */
window.showTapChangerDiagram = function () {
    const type = document.getElementById('tapChangerType')?.value;
    if (!type || type === 'NONE') {
        alert('Please select a Tap Changer type first.');
        return;
    }

    const title = type === 'OCTC' ? 'Off-Circuit Tap Changer (OCTC)' : 'On-Load Tap Changer (OLTC)';
    const description = type === 'OCTC'
        ? '⚠️ MUST BE DE-ENERGIZED BEFORE OPERATION.\nTaps are changed manually via a handwheel on the cover.'
        : '⚡ Can be operated while energized.\nUses a diverter switch to transition between taps without arcing.';

    // In a real app, this would open a modal with an SVG
    // For now, we'll use a stylized alert/modal simulation
    const asciiDiagram = type === 'OCTC'
        ? `
      HV Winding
         │
    ┌────┴────┐
    │  5 4 3  │ <── Mobile Contact
    │  ● ● ●  │
    │  2 1    │
    └────┬────┘
         │
      To Bushing
        `
        : `
      HV Winding
         │
    ┌────┴────┐    Selector
    │ 1 2 3 4 │    Switch
    └────┬────┘
         │
    ┌────┴────┐    Diverter
    │  R   R  │    Switch
    └───┬─┬───┘
        │ │
      Output
        `;

    alert(`${title}\n\n${description}\n\nSchematic:\n${asciiDiagram}`);
};

/**
 * 3. COST ESTIMATOR
 * Estimate basic material cost based on weight inputs (simulated)
 */
window.estimateCost = function () {
    // Attempt to read calculated weights from the DOM or State
    // Since we don't have easy access to internal calculation state variables here,
    // we'll try to read from the result tables if populated, or ask for inputs.

    // Check if calculation has run (results hidden/shown)
    const summaryTab = document.getElementById('summary-tab');
    if (!summaryTab || summaryTab.style.display === 'none') {
        // Try fallback to reading inputs and approximating
        // or just alert user to calculate first
    }

    // For this mock tool, we'll define standard rates
    const RATES = {
        copper: 9.5,   // $ per kg
        aluminum: 4.2, // $ per kg
        crgo: 3.8,     // $ per kg
        oil: 1.5,      // $ per liter (approx kg)
        steel: 1.2     // $ per kg (tank)
    };

    // We can simulate fetching these from the "results" object if we exposed it globally
    // or parse from the displayed HTML table

    // Let's assume we can read the "Total Weight" from summary
    const totalWeightEl = document.getElementById('summary-weight');
    const totalWeight = parseFloat(totalWeightEl?.textContent);

    if (!totalWeight || isNaN(totalWeight)) {
        alert('Please run a calculation first to generate weight data.');
        return;
    }

    // Approx breakdown if not granular (Simulated for the tool demo)
    const coreWeight = totalWeight * 0.30;
    const windingWeight = totalWeight * 0.25;
    const oilWeight = totalWeight * 0.25;
    const tankWeight = totalWeight * 0.20;

    const coreCost = coreWeight * RATES.crgo;
    const windingCost = windingWeight * RATES.copper; // Assuming copper for high cost est
    const oilCost = oilWeight * RATES.oil;
    const tankCost = tankWeight * RATES.steel;

    const totalMaterialCost = coreCost + windingCost + oilCost + tankCost;
    const laborOverhead = totalMaterialCost * 0.40; // 40% overhead
    const totalCost = totalMaterialCost + laborOverhead;

    const msg = `
💰 Cost Estimation (USD)
------------------------
Material Costs:
- Core (CRGO):    $${coreCost.toFixed(2)}  (${Math.round(coreWeight)} kg)
- Winding (Cu):   $${windingCost.toFixed(2)}  (${Math.round(windingWeight)} kg)
- Oil:            $${oilCost.toFixed(2)}  (${Math.round(oilWeight)} kg)
- Tank (Steel):   $${tankCost.toFixed(2)}  (${Math.round(tankWeight)} kg)
------------------------
Subtotal Materials: $${totalMaterialCost.toFixed(2)}
Labor & Overhead:   $${laborOverhead.toFixed(2)}
------------------------
TOTAL ESTIMATE:     $${totalCost.toFixed(2)}

*Based on current market rates.
    `;

    alert(msg);
};
