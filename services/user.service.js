const db = require('../config/database');

class UserService {
    /**
     * Get all users
     */
    findAll() {
        const users = db.prepare('SELECT * FROM users').all();
        return users.map(user => ({
            ...user,
            permissions: user.permissions ? JSON.parse(user.permissions) : []
        }));
    }

    /**
     * Find user by userId
     */
    findByUserId(userId) {
        const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
        if (!user) {
            return null;
        }

        return {
            ...user,
            permissions: user.permissions ? JSON.parse(user.permissions) : []
        };
    }

    /**
     * Create new user
     */
    create(userData) {
        const stmt = db.prepare(`
            INSERT INTO users (userId, password, name, email, role, department, customerId, customerName, permissions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            userData.userId,
            userData.password,
            userData.name,
            userData.email || null,
            userData.role,
            userData.department || null,
            userData.customerId || null,
            userData.customerName || null,
            userData.permissions ? JSON.stringify(userData.permissions) : null
        );

        return this.findByUserId(userData.userId);
    }

    /**
     * Update user
     */
    update(userId, userData) {
        const stmt = db.prepare(`
            UPDATE users 
            SET name = ?, email = ?, role = ?, department = ?, customerId = ?, customerName = ?, permissions = ?
            WHERE userId = ?
        `);

        stmt.run(
            userData.name,
            userData.email || null,
            userData.role,
            userData.department || null,
            userData.customerId || null,
            userData.customerName || null,
            userData.permissions ? JSON.stringify(userData.permissions) : null,
            userId
        );

        return this.findByUserId(userId);
    }

    /**
     * Change a user's password
     */
    changePassword(userId, hashedPassword) {
        const stmt = db.prepare('UPDATE users SET password = ? WHERE userId = ?');
        const result = stmt.run(hashedPassword, userId);
        return result.changes > 0;
    }

    /**
     * Delete user
     */
    delete(userId) {
        const stmt = db.prepare('DELETE FROM users WHERE userId = ?');
        const result = stmt.run(userId);
        return result.changes > 0;
    }
}

module.exports = new UserService();
