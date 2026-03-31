/**
 * Document Service — SQLite CRUD for documents table
 */
const db = require('../config/database');

/**
 * Create a new document record
 */
function create(data) {
    const stmt = db.prepare(`
        INSERT INTO documents (wo, type, customerId, filename, filepath, uploadedBy, uploadedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.wo,
        data.type || 'general',
        data.customerId || null,
        data.filename,
        data.filepath,
        data.uploadedBy,
        data.uploadedAt || new Date().toISOString()
    );

    return findById(result.lastInsertRowid);
}

/**
 * Find all documents for a work order
 */
function findByWO(wo) {
    return db.prepare('SELECT * FROM documents WHERE wo = ? ORDER BY uploadedAt DESC').all(wo);
}

/**
 * Find a document by its primary key
 */
function findById(id) {
    return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) || null;
}

/**
 * Delete a document record
 */
function remove(id) {
    const result = db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return result.changes > 0;
}

/**
 * Find all documents with optional filters
 */
function findAll(filters = {}) {
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];

    if (filters.wo) {
        query += ' AND wo = ?';
        params.push(filters.wo);
    }
    if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
    }
    if (filters.customerId) {
        query += ' AND customerId = ?';
        params.push(filters.customerId);
    }

    query += ' ORDER BY uploadedAt DESC';
    return db.prepare(query).all(...params);
}

module.exports = { create, findByWO, findById, remove, findAll };
