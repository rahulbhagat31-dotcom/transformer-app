const transformerService = require('../services/transformer.service');
const { successResponse, errorResponse } = require('../utils/response');
const { STAGE_ORDER } = require('../utils/stageControl');

const STAGE_LABELS = {
    design: 'Design',
    winding: 'Winding',
    vpd: 'VPD',
    coreCoil: 'Core/Coil',
    tanking: 'Tanking',
    tankFilling: 'Tank Filling',
    testing: 'Testing',
    completed: 'Completed'
};

/**
 * Get overall production analytics
 * GET /analytics
 */
exports.getStats = async (req, res) => {
    try {
        const transformers = transformerService.findAll();

        // 1. Throughput (units created per month — last 6 months)
        const throughput = calculateThroughput(transformers);

        // 2. Stage distribution (real counts from SQLite)
        const stageDistribution = calculateStageDistribution(transformers);

        // 3. Lead time (real calculation from createdAt to completed)
        const leadTimeStats = calculateLeadTime(transformers);

        // 4. Stage efficiency (avg days per stage from stageHistory)
        const stageEfficiency = calculateStageEfficiency(transformers);

        // 5. Quality index (ratio of completed to total)
        const qualityIndex = calculateQualityIndex(transformers);

        // 6. Summary KPIs
        const total = transformers.length;
        const inProgress = transformers.filter(t => t.stage && t.stage !== 'completed' && t.stage !== 'design').length;
        const completed = transformers.filter(t => t.stage === 'completed').length;
        const inDesign = transformers.filter(t => !t.stage || t.stage === 'design').length;

        // Calculate efficiency from real data
        const efficiencyVal = stageEfficiency.overallEfficiency;

        res.json(successResponse({
            summary: {
                total,
                inDesign,
                inProgress,
                completed,
                avgLeadTime: `${leadTimeStats.avg}d`,
                qualityIndex: `${qualityIndex}%`,
                efficiency: efficiencyVal
            },
            charts: {
                throughput,
                stageDistribution,
                stageEfficiency,
                leadTime: leadTimeStats
            }
        }, 'Analytics data loaded'));

    } catch (error) {
        console.error('❌ Analytics Error:', error);
        res.status(500).json(errorResponse(error));
    }
};

/**
 * Throughput: units created per month (last 6 months)
 */
function calculateThroughput(transformers) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const counts = new Array(12).fill(0);

    transformers.forEach(t => {
        if (t.createdAt) {
            const date = new Date(t.createdAt);
            if (date.getFullYear() === currentYear) {
                counts[date.getMonth()]++;
            }
        }
    });

    const currentMonth = new Date().getMonth();
    const labels = [];
    const data = [];

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        if (m < 0) {
            m += 12;
        }
        labels.push(months[m]);
        data.push(counts[m]);
    }

    return { labels, data };
}

/**
 * Stage distribution: how many transformers are in each stage
 */
function calculateStageDistribution(transformers) {
    const counts = {};
    STAGE_ORDER.forEach(s => {
        counts[s] = 0;
    });

    transformers.forEach(t => {
        const stage = t.stage || 'design';
        if (counts[stage] !== undefined) {
            counts[stage]++;
        } else if (counts['design'] !== undefined) {
            counts['design']++; // Default fallback
        }
    });

    return {
        labels: STAGE_ORDER.map(s => STAGE_LABELS[s]),
        data: STAGE_ORDER.map(s => counts[s])
    };
}

/**
 * Lead time: average days from creation to completion
 */
function calculateLeadTime(transformers) {
    const completed = transformers.filter(t => t.stage === 'completed' && t.createdAt && t.updatedAt);

    if (completed.length === 0) {
        return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const durations = completed.map(t => {
        const start = new Date(t.createdAt);
        const end = new Date(t.updatedAt); // Use updatedAt as approximate completion time if not tracked else
        // Ideally we should use the stageHistory 'completed' entry, but this is a decent fallback
        return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    });

    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return { avg, min, max, count: completed.length };
}

/**
 * Stage efficiency: average days spent in each stage (from stageHistory)
 */
function calculateStageEfficiency(transformers) {
    const stageDurations = {};
    STAGE_ORDER.forEach(s => {
        stageDurations[s] = [];
    });

    transformers.forEach(t => {
        // We need to parse stageHistory if it's a string (though service should handle this)
        let history = t.stageHistory;
        if (typeof history === 'string') {
            try {
                history = JSON.parse(history);
            } catch {
                history = [];
            }
        }

        if (!Array.isArray(history)) {
            return;
        }

        history.forEach(entry => {
            if (entry.stage && entry.startedAt && entry.completedAt && stageDurations[entry.stage]) {
                const days = (new Date(entry.completedAt) - new Date(entry.startedAt)) / (1000 * 60 * 60 * 24);
                if (days >= 0) {
                    stageDurations[entry.stage].push(days);
                }
            }
        });
    });

    const avgDays = STAGE_ORDER.map(s => {
        const arr = stageDurations[s];
        return arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;
    });

    // Overall efficiency: simplified metric (just % of transformers with valid stage history)
    const withHistory = transformers.filter(t => {
        const h = typeof t.stageHistory === 'string' ? JSON.parse(t.stageHistory) : t.stageHistory;
        return Array.isArray(h) && h.length > 0;
    }).length;

    const overallEfficiency = transformers.length > 0
        ? `${Math.round((withHistory / transformers.length) * 100)}%`
        : '0%';

    return {
        labels: STAGE_ORDER.map(s => STAGE_LABELS[s]),
        avgDays,
        overallEfficiency
    };
}

/**
 * Quality index: % of transformers that reached 'completed' stage
 */
function calculateQualityIndex(transformers) {
    if (transformers.length === 0) {
        return 0;
    }
    const completed = transformers.filter(t => t.stage === 'completed').length;
    return Math.round((completed / transformers.length) * 100);
}
