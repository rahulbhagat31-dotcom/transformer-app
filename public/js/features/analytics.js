/* ===============================
   📊 ADVANCED ANALYTICS MODULE
   Production Intelligence & Trends
================================ */

let analyticsCharts = {};

/**
 * Initialize Analytics on section show
 */
async function initAnalytics() {
    console.log('📊 Initializing Advanced Analytics...');
    await refreshAnalytics();
}

/**
 * Refresh all analytics data
 */
async function refreshAnalytics() {
    try {
        showAnalyticsLoading(true);

        // allSettled — one failing endpoint won't block the rest
        const results = await Promise.allSettled([
            apiCall('/transformers'),
            apiCall('/checklist/all'),
            apiCall('/audit')
        ]);

        const transformers = results[0].status === 'fulfilled' ? results[0].value : [];
        const checklists = results[1].status === 'fulfilled' ? results[1].value : [];
        const auditLogs = results[2].status === 'fulfilled' ? results[2].value : [];

        const data = processAnalyticsData(transformers, checklists, auditLogs);
        updateAnalyticsKPIs(data.summary);
        renderAnalyticsCharts(data.charts);

    } catch (error) {
        console.error('❌ Error refreshing analytics:', error);
        toastError('Failed to load analytics data', 'Analytics Error');
    } finally {
        showAnalyticsLoading(false);
    }
}

/**
 * Process raw data into analytics format
 */
function processAnalyticsData(transformers, _checklists, _auditLogs) {
    const rawTransformers = transformers.data || transformers || [];
    const throughput = calculateThroughputStats(rawTransformers);
    const inProd = rawTransformers.filter(t => t.status !== 'completed').length;
    const completed = rawTransformers.filter(t => t.status === 'completed').length;

    return {
        summary: {
            total: rawTransformers.length,
            inProduction: inProd,
            completed,
            qualityIndex: 98
        },
        charts: {
            throughput,
            stageHealth: {
                labels: ['Winding', 'VPD', 'Core', 'Tanking', 'Testing'],
                actual: [3.8, 2.1, 4.5, 3.2, 1.8],
                target: [3.5, 2.0, 4.0, 3.0, 2.0]
            },
            quality: {
                labels: ['Winding', 'VPD', 'Core', 'Tanking', 'Testing'],
                values: [4, 1, 6, 3, 0]
            },
            costs: {
                labels: ['Copper', 'Steel', 'Oil', 'Insulation', 'Tanks'],
                values: [42, 28, 15, 10, 5]
            }
        }
    };
}

function calculateThroughputStats(transformers) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const counts = new Array(12).fill(0);

    transformers.forEach(t => {
        if (t.createdAt) {
            const date = new Date(t.createdAt);
            if (date.getFullYear() === currentYear) counts[date.getMonth()]++;
        }
    });

    const currentMonth = new Date().getMonth();
    const labels = [], data = [];
    for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        if (m < 0) m += 12;
        labels.push(months[m]);
        data.push(counts[m]);
    }
    return { labels, data };
}

/**
 * Animated counter for KPI values
 */
function animateCounter(el, target, suffix = '', duration = 900) {
    const start = 0;
    const step = Math.ceil(duration / 60);
    const increment = target / (duration / step);
    let current = start;

    const timer = setInterval(() => {
        current = Math.min(current + increment, target);
        el.textContent = Math.round(current) + suffix;
        if (current >= target) {
            el.textContent = target + suffix;
            el.classList.add('counted');
            clearInterval(timer);
        }
    }, step);
}

/**
 * Update UI KPIs with animated counters
 */
function updateAnalyticsKPIs(summary) {
    const fields = [
        { id: 'kpiTotal', value: summary.total, suffix: '' },
        { id: 'kpiInProduction', value: summary.inProduction, suffix: '' },
        { id: 'kpiCompleted', value: summary.completed, suffix: '' },
        { id: 'kpiQuality', value: summary.qualityIndex, suffix: '%' }
    ];

    fields.forEach(({ id, value, suffix }, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('data-target', value);
        el.setAttribute('data-suffix', suffix);
        setTimeout(() => animateCounter(el, value, suffix), i * 80);
    });
}

/* ── Shared Chart.js defaults ── */
const CHART_DEFAULTS = {
    font: { family: '\'Inter\', \'Segoe UI\', sans-serif' },
    plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } } },
    animation: { duration: 900, easing: 'easeOutQuart' }
};

/**
 * Render all charts
 */
function renderAnalyticsCharts(chartsData) {
    destroyAnalyticsCharts();

    // 1. Production Trends — smooth gradient line
    const ctx1 = document.getElementById('productionChart');
    if (ctx1) {
        const grad1 = ctx1.getContext('2d').createLinearGradient(0, 0, 0, 220);
        grad1.addColorStop(0, 'rgba(102,126,234,0.5)');
        grad1.addColorStop(1, 'rgba(102,126,234,0.0)');

        analyticsCharts.throughput = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: chartsData.throughput.labels,
                datasets: [{
                    label: 'Units',
                    data: chartsData.throughput.data,
                    borderColor: '#667eea',
                    backgroundColor: grad1,
                    fill: true,
                    tension: 0.45,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#667eea',
                    pointBorderWidth: 2,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...CHART_DEFAULTS,
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                }
            }
        });
    }

    // 2. Stage Health — radar
    const ctx2 = document.getElementById('stageHealthChart');
    if (ctx2) {
        analyticsCharts.stageHealth = new Chart(ctx2, {
            type: 'radar',
            data: {
                labels: chartsData.stageHealth.labels,
                datasets: [
                    {
                        label: 'Actual Days',
                        data: chartsData.stageHealth.actual,
                        borderColor: '#f5576c',
                        backgroundColor: 'rgba(245,87,108,0.18)',
                        pointBackgroundColor: '#f5576c',
                        borderWidth: 2
                    },
                    {
                        label: 'Target Days',
                        data: chartsData.stageHealth.target,
                        borderColor: '#43e97b',
                        backgroundColor: 'rgba(67,233,123,0.18)',
                        pointBackgroundColor: '#43e97b',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...CHART_DEFAULTS,
                scales: { r: { ticks: { font: { size: 9 } } } }
            }
        });
    }

    // 3. Quality Heatmap — gradient bars
    const ctx3 = document.getElementById('qualityHeatmapChart');
    if (ctx3) {
        analyticsCharts.quality = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: chartsData.quality.labels,
                datasets: [{
                    label: 'Reworks',
                    data: chartsData.quality.values,
                    backgroundColor: chartsData.quality.values.map((_, i) =>
                        `hsl(${220 + i * 28}, 75%, ${55 + i * 5}%)`),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...CHART_DEFAULTS,
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                }
            }
        });
    }

    // 4. Cost Distribution — doughnut w/ cutout
    const ctx4 = document.getElementById('costBudgetChart');
    if (ctx4) {
        analyticsCharts.costs = new Chart(ctx4, {
            type: 'doughnut',
            data: {
                labels: chartsData.costs.labels,
                datasets: [{
                    data: chartsData.costs.values,
                    backgroundColor: ['#667eea', '#43e97b', '#f5576c', '#f093fb', '#4facfe'],
                    hoverOffset: 10,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                ...CHART_DEFAULTS
            }
        });
    }
}

/**
 * Destroy existing charts
 */
function destroyAnalyticsCharts() {
    Object.values(analyticsCharts).forEach(c => c && c.destroy());
    analyticsCharts = {};
}

/**
 * Show/Hide loading state
 */
function showAnalyticsLoading(loading) {
    const btn = document.querySelector('.analytics-refresh-btn');
    if (btn) {
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<span class="refresh-icon">⌛</span> Loading...'
            : '<span class="refresh-icon">🔄</span> Refresh';
    }
}

// Export
window.initAnalytics = initAnalytics;
window.refreshAnalytics = refreshAnalytics;

// Auto-init if dashboard is already the active section on page load
document.addEventListener('DOMContentLoaded', () => {
    const dash = document.getElementById('dashboardSection');
    if (dash && (dash.classList.contains('active') || dash.style.display !== 'none')) {
        initAnalytics();
    }
});

console.log('✅ Advanced Analytics Module Loaded');
