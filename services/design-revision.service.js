const crypto = require('crypto');
const db = require('../config/database');

class DesignRevisionService {
    /**
     * Create new design revision with calculation hash
     */
    createRevision(wo, designData, metadata) {
        return db.transaction(() => {
            // Calculate hash of design data (SERVER-SIDE ONLY)
            const calculationHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(designData))
                .digest('hex');

            // Get next revision number
            const latest = db.prepare(`
                SELECT MAX(revision) as maxRev 
                FROM design_revisions 
                WHERE wo = ?
            `).get(wo);

            const nextRevision = (latest?.maxRev || 0) + 1;

            // Insert frozen revision
            const stmt = db.prepare(`
                INSERT INTO design_revisions (
                    wo, revision, designData, calculationHash,
                    validationStatus, validationErrors, validationWarnings,
                    warningsAcknowledgedBy, warningsAcknowledgedAt,
                    calculatorVersion, engineVersion, createdBy, notes, frozen
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `);

            stmt.run(
                wo,
                nextRevision,
                JSON.stringify(designData),
                calculationHash,
                metadata.validationStatus || 'PASS',
                metadata.validationErrors ? JSON.stringify(metadata.validationErrors) : null,
                metadata.validationWarnings ? JSON.stringify(metadata.validationWarnings) : null,
                metadata.warningsAcknowledgedBy || null,
                metadata.warningsAcknowledgedAt || null,
                metadata.calculatorVersion || '2.0.0',
                metadata.engineVersion || 'IEC-60076-2024',
                metadata.createdBy,
                metadata.notes || null
            );

            return {
                wo,
                revision: nextRevision,
                calculationHash
            };
        })();
    }

    /**
     * Get all revisions for a transformer
     */
    getRevisions(wo) {
        const rows = db.prepare(`
            SELECT * FROM design_revisions 
            WHERE wo = ? 
            ORDER BY revision DESC
        `).all(wo);

        return rows.map(row => ({
            ...row,
            designData: JSON.parse(row.designData),
            validationErrors: row.validationErrors ? JSON.parse(row.validationErrors) : null,
            validationWarnings: row.validationWarnings ? JSON.parse(row.validationWarnings) : null
        }));
    }

    /**
     * Get specific revision
     */
    getRevision(wo, revision) {
        const row = db.prepare(`
            SELECT * FROM design_revisions 
            WHERE wo = ? AND revision = ?
        `).get(wo, revision);

        if (!row) {
            return null;
        }

        return {
            ...row,
            designData: JSON.parse(row.designData),
            validationErrors: row.validationErrors ? JSON.parse(row.validationErrors) : null,
            validationWarnings: row.validationWarnings ? JSON.parse(row.validationWarnings) : null
        };
    }

    /**
     * Verify calculation hash
     */
    verifyCalculationHash(wo, revision) {
        const row = db.prepare(`
            SELECT designData, calculationHash 
            FROM design_revisions 
            WHERE wo = ? AND revision = ?
        `).get(wo, revision);

        if (!row) {
            return { valid: false, error: 'Revision not found' };
        }

        const calculatedHash = crypto
            .createHash('sha256')
            .update(row.designData)
            .digest('hex');

        const valid = calculatedHash === row.calculationHash;

        return {
            valid,
            storedHash: row.calculationHash,
            calculatedHash,
            status: valid ? 'VERIFIED' : 'TAMPERED'
        };
    }

    /**
     * Get next revision number
     */
    getNextRevision(wo) {
        const latest = db.prepare(`
            SELECT MAX(revision) as maxRev 
            FROM design_revisions 
            WHERE wo = ?
        `).get(wo);

        return (latest?.maxRev || 0) + 1;
    }
}

module.exports = new DesignRevisionService();
