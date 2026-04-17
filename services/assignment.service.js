/**
 * AssignmentService — links users to specific Work Orders.
 *
 * Provides granular object-level authorization beyond global RBAC:
 *   - A production engineer can only edit checklists for WOs they are assigned to.
 *   - Admins and quality engineers are exempt (they have global access).
 *   - Assignments are managed by admins via /assignments routes.
 */
const db = require('../config/database');

// Roles that bypass per-WO assignment checks
const GLOBAL_ACCESS_ROLES = ['admin', 'quality'];

class AssignmentService {
    /**
     * Create the user_assignments table if it does not exist.
     * Called once at server startup.
     */
    ensureTable() {
        db.exec(`
            CREATE TABLE IF NOT EXISTS user_assignments (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                userId     TEXT NOT NULL,
                wo         TEXT NOT NULL,
                assignedBy TEXT NOT NULL,
                assignedAt TEXT DEFAULT (datetime('now')),
                expiresAt  TEXT,          -- NULL means no expiry
                notes      TEXT,
                UNIQUE(userId, wo),
                FOREIGN KEY (userId) REFERENCES users(userId),
                FOREIGN KEY (wo)     REFERENCES transformers(wo)
            );
            CREATE INDEX IF NOT EXISTS idx_assignments_user ON user_assignments(userId);
            CREATE INDEX IF NOT EXISTS idx_assignments_wo   ON user_assignments(wo);
        `);
    }

    /* ─────────────────────────────────────────────────────────────
     * AUTHORIZATION CHECK
     * ───────────────────────────────────────────────────────────── */

    /**
     * Returns true if the user is authorised to access the given WO.
     * - Admins and quality roles always pass.
     * - All other roles must have a valid, non-expired assignment.
     *
     * @param {string} userId
     * @param {string} role
     * @param {string} wo
     */
    isAuthorised(userId, role, wo) {
        if (GLOBAL_ACCESS_ROLES.includes(role)) {
            return true;
        }

        const row = db.prepare(`
            SELECT id FROM user_assignments
            WHERE userId = ?
              AND wo     = ?
              AND (expiresAt IS NULL OR expiresAt > datetime('now'))
        `).get(userId, wo);

        return !!row;
    }

    /* ─────────────────────────────────────────────────────────────
     * CRUD — for the admin /assignments routes
     * ───────────────────────────────────────────────────────────── */

    /**
     * Assign a user to a WO.
     * Upserts: if the assignment already exists, updates expiresAt / notes.
     */
    assign(userId, wo, assignedBy, { expiresAt = null, notes = null } = {}) {
        db.prepare(`
            INSERT INTO user_assignments (userId, wo, assignedBy, expiresAt, notes)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(userId, wo) DO UPDATE SET
                assignedBy = excluded.assignedBy,
                assignedAt = datetime('now'),
                expiresAt  = excluded.expiresAt,
                notes      = excluded.notes
        `).run(userId, wo, assignedBy, expiresAt, notes);

        return this.getAssignment(userId, wo);
    }

    /**
     * Revoke a user's assignment to a WO.
     */
    revoke(userId, wo) {
        return db.prepare('DELETE FROM user_assignments WHERE userId = ? AND wo = ?')
            .run(userId, wo).changes > 0;
    }

    /**
     * Get a single assignment.
     */
    getAssignment(userId, wo) {
        return db.prepare('SELECT * FROM user_assignments WHERE userId = ? AND wo = ?').get(userId, wo);
    }

    /**
     * List all assignments for a given WO.
     */
    getAssignmentsForWO(wo) {
        return db.prepare(`
            SELECT a.*, u.name, u.role, u.department
            FROM   user_assignments a
            LEFT JOIN users u ON u.userId = a.userId
            WHERE  a.wo = ?
            ORDER  BY a.assignedAt DESC
        `).all(wo);
    }

    /**
     * List all WOs assigned to a given user.
     */
    getAssignmentsForUser(userId) {
        return db.prepare(`
            SELECT a.*, t.customer, t.stage, t.rating
            FROM   user_assignments a
            LEFT JOIN transformers t ON t.wo = a.wo
            WHERE  a.userId = ?
              AND (a.expiresAt IS NULL OR a.expiresAt > datetime('now'))
            ORDER  BY a.assignedAt DESC
        `).all(userId);
    }

    /**
     * Remove all expired assignments (maintenance cleanup).
     */
    purgeExpired() {
        return db.prepare('DELETE FROM user_assignments WHERE expiresAt IS NOT NULL AND expiresAt <= datetime(\'now\')')
            .run().changes;
    }
}

module.exports = new AssignmentService();
