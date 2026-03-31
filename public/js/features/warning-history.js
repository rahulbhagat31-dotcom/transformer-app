/**
 * Warning History Tracking System
 * Tracks validation warnings across multiple designs
 * Enables trend analysis and design comparison
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'transformer_warning_history';
    const MAX_HISTORY_ITEMS = 50; // Keep last 50 designs

    /**
     * Save warnings to history
     * @param {Object} designData - Design data with warnings
     */
    function saveWarningHistory(designData) {
        try {
            const history = getWarningHistory();

            const historyItem = {
                id: generateDesignId(),
                timestamp: new Date().toISOString(),
                designName: designData.designName || `Design ${history.length + 1}`,
                inputs: {
                    mva: designData.inputs.mva,
                    hv: designData.inputs.hv,
                    lv: designData.inputs.lv,
                    cooling: designData.inputs.cooling,
                    fluxDensity: designData.inputs.fluxDensity,
                    currentDensity: designData.inputs.currentDensity
                },
                warnings: designData.warnings || [],
                warningCount: (designData.warnings || []).length,
                highSeverityCount: (designData.warnings || []).filter(w => w.severity === 'high').length,
                mediumSeverityCount: (designData.warnings || []).filter(w => w.severity === 'medium').length,
                lowSeverityCount: (designData.warnings || []).filter(w => w.severity === 'low').length
            };

            history.unshift(historyItem); // Add to beginning

            // Limit history size
            if (history.length > MAX_HISTORY_ITEMS) {
                history.splice(MAX_HISTORY_ITEMS);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            console.log(`✅ Saved warning history: ${historyItem.id}`);

            return historyItem.id;
        } catch (error) {
            console.error('Error saving warning history:', error);
            return null;
        }
    }

    /**
     * Get warning history from localStorage
     * @returns {Array} History items
     */
    function getWarningHistory() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading warning history:', error);
            return [];
        }
    }

    /**
     * Get specific history item by ID
     * @param {string} id - Design ID
     * @returns {Object|null} History item
     */
    function getHistoryItem(id) {
        const history = getWarningHistory();
        return history.find(item => item.id === id) || null;
    }

    /**
     * Delete history item
     * @param {string} id - Design ID
     */
    function deleteHistoryItem(id) {
        try {
            const history = getWarningHistory();
            const filtered = history.filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            console.log(`✅ Deleted history item: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting history item:', error);
            return false;
        }
    }

    /**
     * Clear all history
     */
    function clearHistory() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('✅ Cleared warning history');
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }

    /**
     * Analyze warning trends
     * @param {number} limit - Number of recent designs to analyze
     * @returns {Object} Trend analysis
     */
    function analyzeWarningTrends(limit = 10) {
        const history = getWarningHistory().slice(0, limit);

        if (history.length === 0) {
            return {
                available: false,
                message: 'No history available'
            };
        }

        // Calculate averages
        const avgWarnings = history.reduce((sum, item) => sum + item.warningCount, 0) / history.length;
        const avgHigh = history.reduce((sum, item) => sum + item.highSeverityCount, 0) / history.length;

        // Trend direction
        const recent = history.slice(0, Math.min(5, history.length));
        const older = history.slice(5, Math.min(10, history.length));

        let trend = 'stable';
        if (recent.length > 0 && older.length > 0) {
            const recentAvg = recent.reduce((sum, item) => sum + item.warningCount, 0) / recent.length;
            const olderAvg = older.reduce((sum, item) => sum + item.warningCount, 0) / older.length;

            if (recentAvg < olderAvg * 0.8) {
                trend = 'improving';
            } else if (recentAvg > olderAvg * 1.2) {
                trend = 'worsening';
            }
        }

        // Most common warning categories
        const categoryCount = {};
        history.forEach(item => {
            (item.warnings || []).forEach(warning => {
                const cat = warning.category || 'Other';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
        });

        const topCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));

        return {
            available: true,
            designCount: history.length,
            averages: {
                totalWarnings: Math.round(avgWarnings * 10) / 10,
                highSeverity: Math.round(avgHigh * 10) / 10
            },
            trend: trend,
            topCategories: topCategories,
            latest: history[0],
            oldest: history[history.length - 1]
        };
    }

    /**
     * Compare two designs
     * @param {string} id1 - First design ID
     * @param {string} id2 - Second design ID
     * @returns {Object} Comparison results
     */
    function compareDesigns(id1, id2) {
        const design1 = getHistoryItem(id1);
        const design2 = getHistoryItem(id2);

        if (!design1 || !design2) {
            return {
                available: false,
                message: 'One or both designs not found'
            };
        }

        return {
            available: true,
            design1: {
                name: design1.designName,
                timestamp: design1.timestamp,
                warnings: design1.warningCount,
                high: design1.highSeverityCount
            },
            design2: {
                name: design2.designName,
                timestamp: design2.timestamp,
                warnings: design2.warningCount,
                high: design2.highSeverityCount
            },
            comparison: {
                warningDelta: design2.warningCount - design1.warningCount,
                highDelta: design2.highSeverityCount - design1.highSeverityCount,
                improvement: design2.warningCount < design1.warningCount
            }
        };
    }

    /**
     * Generate unique design ID
     */
    function generateDesignId() {
        return 'design_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Export history as JSON
     */
    function exportHistory() {
        const history = getWarningHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `warning_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    // Export for use
    if (typeof window !== 'undefined') {
        window.WarningHistory = {
            save: saveWarningHistory,
            getHistory: getWarningHistory,
            getItem: getHistoryItem,
            deleteItem: deleteHistoryItem,
            clear: clearHistory,
            analyzeTrends: analyzeWarningTrends,
            compareDesigns: compareDesigns,
            export: exportHistory
        };
    }

    console.log('✅ Warning history tracking initialized');
})();
