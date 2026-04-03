const db = require('../config/database');

class TransformerService {
    /**
     * Get all transformers with optional filters
     */
    findAll(filters = {}) {
        let query = 'SELECT * FROM transformers WHERE 1=1';
        const params = [];

        if (filters.customerId) {
            query += ' AND customerId = ?';
            params.push(filters.customerId);
        }

        if (filters.stage) {
            query += ' AND stage = ?';
            params.push(filters.stage);
        }

        query += ' ORDER BY createdAt DESC';

        const transformers = db.prepare(query).all(...params);

        return transformers.map(t => this._parseTransformer(t));
    }

    /**
     * Find transformer by work order
     */
    findByWO(wo) {
        const transformer = db.prepare('SELECT * FROM transformers WHERE wo = ?').get(wo);
        if (!transformer) {
            return null;
        }

        return this._parseTransformer(transformer);
    }

    /**
     * Create new transformer
     */
    create(transformerData) {
        const stmt = db.prepare(`
            INSERT INTO transformers (wo, customerId, customer, rating, hv, lv, stage, designData, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            transformerData.wo,
            transformerData.customerId,
            transformerData.customer,
            transformerData.rating,
            transformerData.hv,
            transformerData.lv,
            transformerData.stage || 'design',
            transformerData.designData ? JSON.stringify(transformerData.designData) : null,
            transformerData.createdBy
        );

        return this.findByWO(transformerData.wo);
    }

    /**
     * Update transformer
     */
    update(wo, transformerData) {
        const stmt = db.prepare(`
            UPDATE transformers
            SET customer = ?, customerId = ?, rating = ?, hv = ?, lv = ?,
                designData = ?, stage = ?, currentStage = ?, stageProgress = ?,
                stageHistory = ?, actuals = ?, updatedAt = datetime('now'), updatedBy = ?
            WHERE wo = ?
        `);

        stmt.run(
            transformerData.customer || null,
            transformerData.customerId || null,
            transformerData.rating || null,
            transformerData.hv || null,
            transformerData.lv || null,
            transformerData.designData ? JSON.stringify(transformerData.designData) : null,
            transformerData.stage,
            transformerData.currentStage || null,
            transformerData.stageProgress || 0,
            transformerData.stageHistory ? JSON.stringify(transformerData.stageHistory) : null,
            transformerData.actuals ? JSON.stringify(transformerData.actuals) : null,
            transformerData.updatedBy,
            wo
        );

        return this.findByWO(wo);
    }

    /**
     * Delete transformer
     */
    delete(wo) {
        const stmt = db.prepare('DELETE FROM transformers WHERE wo = ?');
        const result = stmt.run(wo);
        return result.changes > 0;
    }

    /**
     * Toggle customer visibility for a transformer's checklist.
     * When visible=true, customer users are allowed to view the checklist.
     */
    setCustomerVisible(wo, visible, updatedBy) {
        const stmt = db.prepare(`
            UPDATE transformers
            SET customerVisible = ?,
                customerVisibleUpdatedBy = ?,
                customerVisibleUpdatedAt = datetime('now')
            WHERE wo = ?
        `);
        const result = stmt.run(visible ? 1 : 0, updatedBy, wo);
        if (result.changes === 0) {
            return null;
        }
        return this.findByWO(wo);
    }

    /**
     * Parse transformer from database (convert JSON strings to objects)
     * Safely handles corrupted JSON data by returning null instead of crashing
     */
    _parseTransformer(transformer) {
        const safeParse = (str, fieldName) => {
            if (!str) return null;
            try {
                return JSON.parse(str);
            } catch (error) {
                console.warn(`Warning: Failed to parse ${fieldName} for transformer ${transformer.wo}:`, error.message);
                return null;
            }
        };
        
        return {
            ...transformer,
            customerVisible: transformer.customerVisible === 1,
            designData: safeParse(transformer.designData, 'designData'),
            actuals: safeParse(transformer.actuals, 'actuals'),
            stageHistory: safeParse(transformer.stageHistory, 'stageHistory')
        };
    }
}

module.exports = new TransformerService();
