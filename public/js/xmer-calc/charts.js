/* ===============================
   CHARTS & GRAPHS MODULE
   Real-time visual results
   For Transformer Design Calculator
================================ */

/**
 * Create all charts after calculation
 */
function createCharts(results, inputs) {
    // Destroy existing charts if they exist
    destroyExistingCharts();

    // Create charts
    createEfficiencyChart(results, inputs);
    createLossDistributionChart(results);
    createLoadCurrentChart(results);
    createTemperatureChart(results);
    createVoltageRegulationChart(results, inputs);
}

/**
 * Destroy existing charts to prevent memory leaks
 */
function destroyExistingCharts() {
    // In Chart.js v2, we iterate over Chart.instances
    for (const [, chart] of Object.entries(Chart.instances)) {
        chart.destroy();
    }
}

/**
 * 1. EFFICIENCY vs LOAD CHART
 */
function createEfficiencyChart(results, inputs) {
    const ctx = document.getElementById('efficiencyChart');
    if (!ctx) return;

    const loads = [0.25, 0.5, 0.75, 1.0, 1.25];
    const coreLoss = parseFloat(results.losses.coreLoss);
    const copperLoss = parseFloat(results.losses.totalCopperLoss);
    const rating = inputs.mva * 1000; // kW

    const efficiencies = loads.map(load => {
        const totalLoss = coreLoss + (copperLoss * load * load);
        const output = rating * load;
        const input = output + totalLoss;
        return ((output / input) * 100).toFixed(3);
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['25% Load', '50% Load', '75% Load', '100% Load', '125% Load'],
            datasets: [{
                label: 'Efficiency (%)',
                data: efficiencies,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Efficiency vs Load Curve',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    min: 98,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Efficiency (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Load'
                    }
                }
            }
        }
    });
}

/**
 * 2. LOSS DISTRIBUTION PIE CHART
 */
function createLossDistributionChart(results) {
    const ctx = document.getElementById('lossChart');
    if (!ctx) return;

    const coreLoss = parseFloat(results.losses.coreLoss);
    const hvCopperLoss = parseFloat(results.losses.hvCopperLoss);
    const lvCopperLoss = parseFloat(results.losses.lvCopperLoss);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Core Loss (No-load)', 'HV Copper Loss', 'LV Copper Loss'],
            datasets: [{
                data: [coreLoss, hvCopperLoss, lvCopperLoss],
                backgroundColor: [
                    '#e74c3c',
                    '#3498db',
                    '#f39c12'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Loss Distribution at Full Load',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toFixed(2)} kW (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 3. LOAD vs CURRENT CHART
 */
function createLoadCurrentChart(results) {
    const ctx = document.getElementById('currentChart');
    if (!ctx) return;

    const hvRated = parseFloat(results.currents.hvCurrent);
    const lvRated = parseFloat(results.currents.lvCurrent);
    const loads = [0, 0.25, 0.5, 0.75, 1.0, 1.25];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: loads.map(l => `${(l * 100).toFixed(0)}%`),
            datasets: [
                {
                    label: 'HV Current (A)',
                    data: loads.map(l => (hvRated * l).toFixed(2)),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'LV Current (A)',
                    data: loads.map(l => (lvRated * l).toFixed(2)),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Current vs Load',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Current (A)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Load (%)'
                    }
                }
            }
        }
    });
}

/**
 * 4. TEMPERATURE RISE CHART
 */
function createTemperatureChart(results) {
    const ctx = document.getElementById('tempChart');
    if (!ctx) return;

    const loads = [0.25, 0.5, 0.75, 1.0, 1.25];
    const totalLoss = parseFloat(results.losses.totalLoss);

    const oilTemps = loads.map(load => {
        const lossAtLoad = parseFloat(results.losses.coreLoss) +
            (parseFloat(results.losses.totalCopperLoss) * load * load);
        return (lossAtLoad / totalLoss) * 50; // Approximate
    });

    const windingTemps = oilTemps.map(t => t + 10); // Winding is ~10°C higher

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['25% Load', '50% Load', '75% Load', '100% Load', '125% Load'],
            datasets: [
                {
                    label: 'Oil Temperature Rise (°C)',
                    data: oilTemps,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                },
                {
                    label: 'Winding Temperature Rise (°C)',
                    data: windingTemps,
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature Rise vs Load',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 70,
                    title: {
                        display: true,
                        text: 'Temperature Rise (°C)'
                    },
                    grid: {
                        color: function (context) {
                            if (context.tick.value === 55) return '#f39c12';
                            if (context.tick.value === 65) return '#e74c3c';
                            return 'rgba(0, 0, 0, 0.1)';
                        },
                        lineWidth: function (context) {
                            if (context.tick.value === 55 || context.tick.value === 65) return 2;
                            return 1;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 5. VOLTAGE REGULATION CHART
 */
function createVoltageRegulationChart(results, inputs) {
    const ctx = document.getElementById('regulationChart');
    if (!ctx) return;

    const loads = [0, 0.25, 0.5, 0.75, 1.0, 1.25];
    const impedance = inputs.impedance / 100;

    const regulationUPF = loads.map(load => (impedance * load * 100).toFixed(2));
    const regulationLag = loads.map(load => (impedance * load * 1.25 * 100).toFixed(2));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: loads.map(l => `${(l * 100).toFixed(0)}%`),
            datasets: [
                {
                    label: 'PF = 1.0 (Unity)',
                    data: regulationUPF,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'PF = 0.8 Lagging',
                    data: regulationLag,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Voltage Regulation vs Load',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Regulation (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Load (%)'
                    }
                }
            }
        }
    });
}

function addChartsSection() {
    // Append to advancedFeaturesContainer so it stays inside Tab 4 (Other & Summary)
    const container = document.getElementById('advancedFeaturesContainer');
    if (!container) return;

    const chartsHTML = `
        <div class="result-section" style="background: white;">
            <h4>📊 Performance Charts & Graphs</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <canvas id="efficiencyChart" style="height: 300px;"></canvas>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <canvas id="lossChart" style="height: 300px;"></canvas>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <canvas id="currentChart" style="height: 300px;"></canvas>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <canvas id="tempChart" style="height: 300px;"></canvas>
                </div>
            </div>
            
            <div style="margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <canvas id="regulationChart" style="height: 300px;"></canvas>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', chartsHTML);
}

// Export functions to window
window.createCharts = createCharts;
window.addChartsSection = addChartsSection;
window.destroyExistingCharts = destroyExistingCharts;

console.log('✅ Charts Module Loaded');