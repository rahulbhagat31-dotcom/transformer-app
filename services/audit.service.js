const crypto = require('crypto');
const db = require('../config/database');

class AuditService {
    /**
     * Log audit entry with hash chain
     */
    log(entry) {
        return db.transaction(() => {
            // Get previous hash
            const previous = db.prepare(`
                SELECT currentHash FROM audit_logs 
                ORDER BY id DESC LIMIT 1
            `).get();

            const previousHash = previous?.currentHash || '0'.repeat(64);

            // Prepare data for hashing
            const timestamp = new Date().toISOString();
            const dataToHash = JSON.stringify({
                timestamp,
                userId: entry.userId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                details: entry.details,
                previousHash
            });

            // Calculate current hash
            const currentHash = crypto
                .createHash('sha256')
                .update(dataToHash)
                .digest('hex');

            // Insert with hash chain
            const stmt = db.prepare(`
                INSERT INTO audit_logs (
                    timestamp, userId, username, role, action, entityType, entityId, 
                    details, ipAddress, previousHash, currentHash
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                timestamp,
                entry.userId,
                entry.username || null,
                entry.role || null,
                entry.action,
                entry.entityType || null,
                entry.entityId || null,
                entry.details ? JSON.stringify(entry.details) : null,
                entry.ipAddress || null,
                previousHash,
                currentHash
            );

            return currentHash;
        })();
    }

    /**
     * Get audit logs
     */
    getLogs(filters = {}) {
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (filters.entityType) {
            query += ' AND entityType = ?';
            params.push(filters.entityType);
        }

        if (filters.entityId) {
            query += ' AND entityId = ?';
            params.push(filters.entityId);
        }

        if (filters.userId) {
            query += ' AND userId = ?';
            params.push(filters.userId);
        }

        // Date range filtering in SQL (avoids fetching all rows then filtering in-memory)
        if (filters.startDate) {
            query += ' AND timestamp >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            // Include the full end day by appending end-of-day time
            query += ' AND timestamp <= ?';
            params.push(filters.endDate.length === 10
                ? `${filters.endDate} 23:59:59`
                : filters.endDate);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(filters.limit || 100);
        params.push(filters.offset || 0);

        const logs = db.prepare(query).all(...params);

        const countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1' +
            (filters.entityType ? ' AND entityType = ?' : '') +
            (filters.entityId ? ' AND entityId = ?' : '') +
            (filters.userId ? ' AND userId = ?' : '') +
            (filters.startDate ? ' AND timestamp >= ?' : '') +
            (filters.endDate ? ' AND timestamp <= ?' : '');

        const countParams = [];
        if (filters.entityType) {
            countParams.push(filters.entityType);
        }
        if (filters.entityId) {
            countParams.push(filters.entityId);
        }
        if (filters.userId) {
            countParams.push(filters.userId);
        }
        if (filters.startDate) {
            countParams.push(filters.startDate);
        }
        if (filters.endDate) {
            countParams.push(filters.endDate.length === 10 ? `${filters.endDate} 23:59:59` : filters.endDate);
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        return { data: logs, total };
    }

    /**
     * Verify hash chain integrity
     */
    verifyChain() {
        const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id ASC').all();

        let expectedPreviousHash = '0'.repeat(64);
        let legacySkipped = 0;
        let verified = 0;

        for (const log of logs) {
            // Skip legacy rows inserted before hash-chain feature was added
            if (!log.currentHash) {
                legacySkipped++;
                continue;
            }

            // Treat null previousHash (first row or legacy boundary) as baseline zeros
            const effectivePrevHash = log.previousHash || '0'.repeat(64);

            // Verify previous hash links correctly
            if (effectivePrevHash !== expectedPreviousHash) {
                return {
                    valid: false,
                    error: `Hash chain broken at log ${log.id}`,
                    expected: expectedPreviousHash,
                    actual: effectivePrevHash
                };
            }

            // Recalculate current hash — must match log() insertion exactly:
            // details was stored as JSON.stringify(entry.details), so parse it back
            // to get the original JS object before re-serialising the full payload.
            const dataToHash = JSON.stringify({
                timestamp: log.timestamp,
                userId: log.userId,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                details: log.details ? JSON.parse(log.details) : null,
                previousHash: effectivePrevHash
            });

            const calculatedHash = crypto
                .createHash('sha256')
                .update(dataToHash)
                .digest('hex');

            if (calculatedHash !== log.currentHash) {
                return {
                    valid: false,
                    error: `Hash mismatch at log ${log.id}`,
                    calculated: calculatedHash,
                    stored: log.currentHash
                };
            }

            expectedPreviousHash = log.currentHash;
            verified++;
        }

        return { valid: true, total: logs.length, verified, legacySkipped };
    }
}

module.exports = new AuditService();
