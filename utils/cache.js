const NodeCache = require('node-cache');
const logger = require('./logger');

// Create cache instance
// stdTTL: 600 seconds (10 minutes)
// checkperiod: 120 seconds (check for expired keys every 2 minutes)
const cache = new NodeCache({
    stdTTL: 600,
    checkperiod: 120,
    useClones: false // Better performance, but be careful with mutations
});

// Cache statistics
const stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined
 */
function get(key) {
    if (!key || typeof key !== 'string') {
        logger.warn('Cache get: invalid key', { key });
        return undefined;
    }
    
    const value = cache.get(key);
    if (value !== undefined) {
        stats.hits++;
        logger.debug(`Cache HIT: ${key}`);
    } else {
        stats.misses++;
        logger.debug(`Cache MISS: ${key}`);
    }
    return value;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} Success
 */
function set(key, value, ttl) {
    if (!key || typeof key !== 'string') {
        logger.warn('Cache set: invalid key', { key });
        return false;
    }
    if (value === undefined) {
        logger.warn('Cache set: cannot cache undefined value', { key });
        return false;
    }
    
    stats.sets++;
    const success = cache.set(key, value, ttl);
    if (success) {
        logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
function del(key) {
    if (!key || typeof key !== 'string') {
        logger.warn('Cache del: invalid key', { key });
        return 0;
    }
    stats.deletes++;
    const deleted = cache.del(key);
    logger.debug(`Cache DELETE: ${key}`);
    return deleted;
}

/**
 * Clear all cache
 */
function flush() {
    cache.flushAll();
    logger.info('Cache FLUSHED');
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getStats() {
    const cacheStats = cache.getStats();
    const totalRequests = stats.hits + stats.misses;
    return {
        ...stats,
        hitRate: totalRequests > 0 ? stats.hits / totalRequests : 0,
        keys: cache.keys().length,
        ...cacheStats
    };
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'checklist:*')
 */
function invalidatePattern(pattern) {
    const keys = cache.keys();
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deleted = 0;

    keys.forEach(key => {
        if (regex.test(key)) {
            cache.del(key);
            deleted++;
        }
    });

    logger.info(`Cache invalidated: ${deleted} keys matching "${pattern}"`);
    return deleted;
}

/**
 * Wrapper for caching async functions
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<*>} Cached or fresh value
 */
async function wrap(key, fn, ttl) {
    const cached = get(key);
    if (cached !== undefined) {
        return cached;
    }

    const value = await fn();
    set(key, value, ttl);
    return value;
}

module.exports = {
    get,
    set,
    del,
    flush,
    getStats,
    invalidatePattern,
    wrap,
    cache // Export raw cache for advanced usage
};
