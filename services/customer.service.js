const db = require('../config/database');

class CustomerService {
    /**
     * Find all customers
     */
    findAll() {
        const rows = db.prepare('SELECT * FROM customers ORDER BY name').all();
        return rows.map(this._parseCustomer);
    }

    /**
     * Find customer by ID
     */
    findById(id) {
        const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        return row ? this._parseCustomer(row) : null;
    }

    /**
     * Create new customer
     */
    create(data) {
        const stmt = db.prepare(`
            INSERT INTO customers (
                id, name, displayName, logo, primaryColor, secondaryColor, 
                status, plan, contactEmail, contactPhone, address, website, 
                settings, subscription, createdAt
            ) VALUES (
                @id, @name, @displayName, @logo, @primaryColor, @secondaryColor,
                @status, @plan, @contactEmail, @contactPhone, @address, @website,
                @settings, @subscription, @createdAt
            )
        `);

        // Ensure JSON fields are stringified
        const customer = {
            ...data,
            settings: JSON.stringify(data.settings || {}),
            subscription: JSON.stringify(data.subscription || {})
        };

        stmt.run(customer);
        return this.findById(data.id);
    }

    /**
     * Update customer
     */
    update(id, updates) {
        const current = this.findById(id);
        if (!current) {
            return null;
        }

        // Merge updates
        const updated = { ...current, ...updates };

        // Prepare JSON fields if they are objects
        if (typeof updated.settings === 'object') {
            updated.settings = JSON.stringify(updated.settings);
        }
        if (typeof updated.subscription === 'object') {
            updated.subscription = JSON.stringify(updated.subscription);
        }

        const stmt = db.prepare(`
            UPDATE customers SET
                displayName = @displayName,
                logo = @logo,
                primaryColor = @primaryColor,
                secondaryColor = @secondaryColor,
                contactEmail = @contactEmail,
                contactPhone = @contactPhone,
                address = @address,
                website = @website,
                settings = @settings,
                subscription = @subscription
            WHERE id = @id
        `);

        stmt.run({ ...updated, id });
        return this.findById(id);
    }

    /**
     * Delete customer
     */
    delete(id) {
        const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Helper: Parse JSON fields from DB
     */
    _parseCustomer(row) {
        try {
            return {
                ...row,
                settings: row.settings ? JSON.parse(row.settings) : {},
                subscription: row.subscription ? JSON.parse(row.subscription) : {}
            };
        } catch (e) {
            console.error('Error parsing customer JSON:', e);
            return row;
        }
    }
}

module.exports = new CustomerService();
