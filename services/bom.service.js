/**
 * BOM Service — SQLite CRUD for bom_files table
 */
const db = require('../config/database');

/**
 * Create a new BOM record
 */
function create(data) {
    const stmt = db.prepare(`
        INSERT INTO bom_files (wo, customerId, filename, filepath, uploadedBy, uploadedAt)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.wo,
        data.customerId || null,
        data.filename,
        data.filepath,
        data.uploadedBy,
        data.uploadedAt || new Date().toISOString()
    );

    return findById(result.lastInsertRowid);
}

/**
 * Find all BOMs for a work order
 */
function findByWO(wo) {
    return db.prepare('SELECT * FROM bom_files WHERE wo = ? ORDER BY uploadedAt DESC').all(wo);
}

/**
 * Find a BOM by its primary key
 */
function findById(id) {
    return db.prepare('SELECT * FROM bom_files WHERE id = ?').get(id) || null;
}

/**
 * Delete a BOM record
 */
function remove(id) {
    const result = db.prepare('DELETE FROM bom_files WHERE id = ?').run(id);
    return result.changes > 0;
}

/**
 * Get all BOMs (admin use)
 */
function findAll(filters = {}) {
    let query = 'SELECT * FROM bom_files WHERE 1=1';
    const params = [];

    if (filters.customerId) {
        query += ' AND customerId = ?';
        params.push(filters.customerId);
    }

    query += ' ORDER BY uploadedAt DESC';
    return db.prepare(query).all(...params);
}

module.exports = { create, findByWO, findById, remove, findAll };
