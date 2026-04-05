/**
 * AuditRotationService — automated audit log archiving.
 *
 * Strategy:
 *   - Rows older than RETENTION_DAYS are moved to audit_logs_archive
 *     inside a single atomic transaction.
 *   - The archive table is created automatically if it does not exist.
 *   - A summary is returned so callers can log results.
 *   - Designed to be called on a recurring schedule (e.g. daily cron in server.js).
 */
const db = require('../config/database');

const RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS, 10) || 90;

class AuditRotationService {
    /**
     * Ensure the archive table exists (same schema as audit_logs).
     * Called once at startup rather than on every rotation run.
     */
    ensureArchiveTable() {
        db.exec(`
            CREATE TABLE IF NOT EXISTS audit_logs_archive (
                id INTEGER PRIMARY KEY,
                timestamp TEXT,
                userId TEXT NOT NULL,
                username TEXT,
                role TEXT,
                action TEXT NOT NULL,
                entityType TEXT,
                entityId TEXT,
                details TEXT,
                ipAddress TEXT,
                previousHash TEXT,
                currentHash TEXT,
                archivedAt TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_archive_timestamp ON audit_logs_archive(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_archive_entity    ON audit_logs_archive(entityType, entityId);
        `);
    }

    /**
     * Move all audit_logs rows older than RETENTION_DAYS to audit_logs_archive
     * in one atomic transaction.
     *
     * @returns {{ archived: number, cutoff: string, retentionDays: number }}
     */
    rotate() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
        const cutoffISO = cutoff.toISOString().slice(0, 19); // 'YYYY-MM-DDTHH:MM:SS'

        let archived = 0;

        db.transaction(() => {
            // 1. Copy old rows to archive
            const inserted = db.prepare(`
                INSERT OR IGNORE INTO audit_logs_archive
                    (id, timestamp, userId, username, role, action,
                     entityType, entityId, details, ipAddress,
                     previousHash, currentHash)
                SELECT id, timestamp, userId, username, role, action,
                       entityType, entityId, details, ipAddress,
                       previousHash, currentHash
                FROM   audit_logs
                WHERE  timestamp < ?
            `).run(cutoffISO);

            archived = inserted.changes;

            // 2. Delete the archived rows from the live table
            if (archived > 0) {
                db.prepare('DELETE FROM audit_logs WHERE timestamp < ?').run(cutoffISO);
            }
        })();

        return { archived, cutoff: cutoffISO, retentionDays: RETENTION_DAYS };
    }

    /**
     * Return row-count stats for both tables.
     */
    stats() {
        const live    = db.prepare('SELECT COUNT(*) AS n FROM audit_logs').get().n;
        const archive = db.prepare('SELECT COUNT(*) AS n FROM audit_logs_archive').get().n;
        const oldest  = db.prepare('SELECT MIN(timestamp) AS t FROM audit_logs').get().t;
        return { live, archive, oldest, retentionDays: RETENTION_DAYS };
    }
}

module.exports = new AuditRotationService();
