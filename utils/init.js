const bcrypt = require('bcrypt');
const { FILES } = require('../config/paths');
const db = require('../config/database');

// Constants are now imported from config/paths
const { USERS: USERS_FILE, TRANSFORMERS: TRANSFORMERS_FILE, BOMS: BOMS_FILE, DOCUMENTS: DOCUMENTS_FILE, CHECKLISTS: CHECKLISTS_FILE } = FILES;

/**
 * Initialize users file - DEPRECATED
 * Users are now stored in SQLite 'users' table.
 */
function initUsersFile() {
    // No-op
}

/**
 * Initialize data files - DEPRECATED
 * Data is now stored in SQLite tables.
 */
function initDataFiles() {
    // No-op
}

/**
 * Seed default users into SQLite when the users table is empty.
 * Ensures login works on first run when the app uses the database.
 */
async function seedDefaultUsersIfNeeded() {
    try {
        const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
        if (count.cnt > 0) {
            console.log(`✅ SQLite users table has ${count.cnt} users`);
            return;
        }

        console.log('🌱 Seeding default users into SQLite...');

        // In production, seed with passwords from environment variables or skip
        const defaultUsers = [];
        if (process.env.NODE_ENV === 'production') {
            if (process.env.SEED_ADMIN_PASSWORD) {
                defaultUsers.push(
                    { userId: 'admin', password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10), name: 'Senior Engineer', role: 'admin', email: 'admin@company.com', department: 'Management', customerId: null }
                );
            }
            // Skip seeding demo accounts in production unless explicitly configured
            if (defaultUsers.length === 0) {
                console.log('⚠️  Production mode: No seed users created (set SEED_ADMIN_PASSWORD in .env to create admin)');
                return;
            }
        } else {
            defaultUsers.push(
                { userId: 'admin', password: await bcrypt.hash('admin123', 10), name: 'Senior Engineer', role: 'admin', email: 'admin@company.com', department: 'Management', customerId: null },
                { userId: 'quality', password: await bcrypt.hash('qc123', 10), name: 'Priya Sharma', role: 'quality', email: 'priya@company.com', department: 'Quality Control', customerId: null },
                { userId: 'production', password: await bcrypt.hash('prod123', 10), name: 'Amit Singh', role: 'production', email: 'amit@company.com', department: 'Production', customerId: null },
                { userId: 'customer1', password: await bcrypt.hash('cust123', 10), name: 'UPPTCL', role: 'customer', email: 'upptcl@customer.com', department: null, customerId: 'CUST001' }
            );
        }

        const insert = db.prepare(
            `INSERT OR IGNORE INTO users (userId, password, name, role, email, department, customerId)
             VALUES (@userId, @password, @name, @role, @email, @department, @customerId)`
        );
        const insertMany = db.transaction((users) => {
            for (const u of users) {
                insert.run(u);
            }
        });
        insertMany(defaultUsers);
        console.log(`✅ Seeded ${defaultUsers.length} default users into SQLite`);
    } catch (err) {
        console.error('⚠️  Could not seed SQLite users (table may not exist yet):', err.message);
    }
}

module.exports = {
    initUsersFile,
    initDataFiles,
    seedDefaultUsersIfNeeded,
    USERS_FILE,
    TRANSFORMERS_FILE,
    BOMS_FILE,
    DOCUMENTS_FILE,
    CHECKLISTS_FILE
};