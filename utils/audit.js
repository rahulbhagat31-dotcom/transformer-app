const auditService = require('../services/audit.service');

/**
 * Initialize audit log file (kept for backward compatibility — no-op now that we use SQLite)
 */
function initAuditFile() {
    // Audit logs are now stored in SQLite (audit_logs table)
    // This function is kept for backward compatibility with server.js startup
    console.log('✅ Audit logging: SQLite (audit_logs table)');
}

/**
 * Log an audit entry to SQLite
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @param {string} role - User role
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, APPROVE, REJECT, STAGE_CHANGE, etc.)
 * @param {string} entity - Entity type (transformer, bom, checklist, etc.)
 * @param {string} entityId - Entity ID
 * @param {object} changes - Changes made
 * @param {string} [reason] - Optional reason for action
 */
function logAudit(userId, username, role, action, entity, entityId, changes, _reason = null) {
    try {
        auditService.log({
            userId,
            username,
            role,
            action,
            entityType: entity,   // audit.service uses entityType
            entityId,
            details: changes,
            ipAddress: null        // IP not available here; set in route-level calls if needed
        });

        console.log(`📝 Audit: ${username} (${role}) ${action} ${entity} ${entityId}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error logging audit:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get audit logs from SQLite with optional filters
 * @param {object} filters - { entity, entityId, userId, startDate, endDate, limit, offset }
 */
function getAuditLogs(filters = {}) {
    try {
        // Map legacy 'entity' filter key to 'entityType' used by audit.service
        const serviceFilters = {
            entityType: filters.entity || filters.entityType,
            entityId: filters.entityId,
            userId: filters.userId,
            limit: filters.limit || 500,
            offset: filters.offset || 0
        };

        const result = auditService.getLogs(serviceFilters);
        let logs = result.data || [];

        // Apply date range filters (audit.service doesn't support date range natively)
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            logs = logs.filter(log => new Date(log.timestamp) >= startDate);
        }
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            logs = logs.filter(log => new Date(log.timestamp) <= endDate);
        }

        // Parse details JSON strings for consumers that expect objects
        return logs.map(log => ({
            ...log,
            entity: log.entityType,   // backward-compat alias
            changes: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : null
        }));
    } catch (error) {
        console.error('❌ Error getting audit logs:', error.message);
        return [];
    }
}

module.exports = {
    logAudit,
    getAuditLogs,
    initAuditFile
};