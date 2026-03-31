/**
 * ================================================
 * MODERN TRANSFORMER CALCULATOR - CHARTS
 * v2.1.0 - Chart.js Visualizations (corrected data paths)
 * ================================================
 */

// Chart instances
let charts = {
    summary: null,
    losses: null,
    temperature: null,
    forces: null,
    weight: null
};

// Chart colors
const chartColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#17a2b8',
    purple: '#9b59b6',
    teal: '#1abc9c',
    orange: '#e67e22',
    pink: '#e91e63'
};

// Safe number helper
function n(v, fallback = 0) {
    const x = parseFloat(v);
    return isFinite(x) ? x : fallback;
}

// ========== GENERATE ALL CHARTS ==========
function generateAllCharts(calc) {
    generateSummaryChart(calc);
    generateLossesChart(calc);
    generateTemperatureChart(calc);
    generateForcesChart(calc);
    generateWeightChart(calc);
}

// ========== 1. EFFICIENCY DOUGHNUT ==========
function generateSummaryChart(calc) {
    const ctx = document.getElementById('summaryChart');
    if (!ctx) return;
    if (charts.summary) charts.summary.destroy();

    const efficiency = n(calc.losses && calc.losses.efficiency, 98);

    charts.summary = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Efficiency', 'Losses'],
            datasets: [{
                data: [efficiency, 100 - efficiency],
                backgroundColor: [chartColors.success, '#fee2e2'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Transformer Efficiency',
                    font: { size: 15, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.label + ': ' + ctx.parsed.toFixed(2) + '%'
                    }
                }
            }
        },
        plugins: [{
            id: 'centerText',
            afterDraw(chart) {
                const { ctx: c, chartArea: a } = chart;
                const cx = (a.left + a.right) / 2;
                const cy = (a.top + a.bottom) / 2;
                c.save();
                c.font = 'bold 26px Inter, sans-serif';
                c.fillStyle = chartColors.success;
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText(efficiency.toFixed(2) + '%', cx, cy);
                c.restore();
            }
        }]
    });
}

// ========== 2. LOSS BREAKDOWN PIE ==========
function generateLossesChart(calc) {
    const ctx = document.getElementById('lossesChart');
    if (!ctx) return;
    if (charts.losses) charts.losses.destroy();

    const los = calc.losses || {};
    const cop = los.copperLoss || {};
    // stray = breakdown.tank + breakdown.structural if available, else strayLoss
    const stray = n(cop.stray, n(los.strayLoss, 0));
    const hvCop = n(cop.hv, n(cop.total, 0) * 0.6);
    const lvCop = n(cop.lv, n(cop.total, 0) * 0.4);

    charts.losses = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Core Loss', 'HV Copper', 'LV Copper', 'Stray Loss'],
            datasets: [{
                data: [n(los.coreLoss), hvCop, lvCop, stray],
                backgroundColor: [chartColors.primary, chartColors.warning, chartColors.orange, chartColors.purple],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } },
                title: { display: true, text: 'Loss Distribution (kW)', font: { size: 15, weight: 'bold' } },
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            const v = ctx.parsed;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            return ctx.label + ': ' + v.toFixed(2) + ' kW (' + ((v / total) * 100).toFixed(1) + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ========== 3. TEMPERATURE PROFILE LINE ==========
function generateTemperatureChart(calc) {
    const ctx = document.getElementById('temperatureChart');
    if (!ctx) return;
    if (charts.temperature) charts.temperature.destroy();

    // Correct paths: absolute.ambient, absolute.topOil, absolute.hotSpot, rises.averageWinding
    const abs = (calc.temperature && calc.temperature.absolute) || {};
    const rises = (calc.temperature && calc.temperature.rises) || {};
    const ambient = n(abs.ambient, 40);
    const topOil = n(abs.topOil, ambient + n(rises.topOil, 30));
    const avgWinding = ambient + n(rises.averageWinding, 40);
    const hotSpot = n(abs.hotSpot, topOil + 15);

    charts.temperature = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ambient', 'Top Oil', 'Avg Winding', 'Hot Spot'],
            datasets: [{
                label: 'Temperature (°C)',
                data: [ambient, topOil, avgWinding, hotSpot],
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderColor: chartColors.danger,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 7,
                pointHoverRadius: 9,
                pointBackgroundColor: chartColors.danger,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Temperature Profile (°C)', font: { size: 15, weight: 'bold' } },
                tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(1) + ' °C' } }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Temperature (°C)', font: { weight: 'bold' } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ========== 4. SHORT CIRCUIT FORCES BAR ==========
function generateForcesChart(calc) {
    const ctx = document.getElementById('forcesChart');
    if (!ctx) return;
    if (charts.forces) charts.forces.destroy();

    // Correct: shortCircuit.forces has {radial, axial} only
    const f = (calc.shortCircuit && calc.shortCircuit.forces) || {};
    const radial = n(f.radial);
    const axial = n(f.axial);
    const resultant = Math.sqrt(radial * radial + axial * axial);

    charts.forces = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Radial Force', 'Axial Force', 'Resultant'],
            datasets: [{
                label: 'Force (kN)',
                data: [radial, axial, resultant],
                backgroundColor: [chartColors.primary, chartColors.warning, chartColors.danger],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Short Circuit Forces (kN)', font: { size: 15, weight: 'bold' } },
                tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(1) + ' kN' } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Force (kN)', font: { weight: 'bold' } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ========== 5. WEIGHT DISTRIBUTION DOUGHNUT ==========
function generateWeightChart(calc) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    if (charts.weight) charts.weight.destroy();

    // Correct: dimensions.weights = {core, windings, tank, oil, total}
    const wts = (calc.dimensions && calc.dimensions.weights) || {};
    const core = n(wts.core);
    const windings = n(wts.windings);
    const tank = n(wts.tank);
    const oil = n(wts.oil);
    // Accessories = total - (core + windings + tank + oil), floored at 0
    const accessories = Math.max(0, n(wts.total) - core - windings - tank - oil);

    charts.weight = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Core', 'Windings', 'Tank', 'Oil', 'Accessories'],
            datasets: [{
                data: [core, windings, tank, oil, accessories],
                backgroundColor: [
                    chartColors.primary, chartColors.warning,
                    chartColors.info, chartColors.teal, chartColors.purple
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } },
                title: { display: true, text: 'Weight Distribution', font: { size: 15, weight: 'bold' } },
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            const v = ctx.parsed;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            return ctx.label + ': ' + v.toLocaleString() + ' kg (' + ((v / total) * 100).toFixed(1) + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ========== DESTROY ALL CHARTS ==========
function destroyAllCharts() {
    Object.values(charts).forEach(c => { if (c) c.destroy(); });
    charts = { summary: null, losses: null, temperature: null, forces: null, weight: null };
}

// Export for external use
window.generateAllCharts = generateAllCharts;
window.destroyAllCharts = destroyAllCharts;
