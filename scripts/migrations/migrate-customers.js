const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const customersJsonPath = path.join(__dirname, '../data/customers.json');

function migrateCustomers() {
    console.log('🔄 Starting Customer Migration...');

    // 1. Create Table
    console.log('📦 Creating customers table...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            displayName TEXT,
            logo TEXT,
            primaryColor TEXT,
            secondaryColor TEXT,
            status TEXT DEFAULT 'active',
            plan TEXT,
            contactEmail TEXT,
            contactPhone TEXT,
            address TEXT,
            website TEXT,
            settings TEXT, 
            subscription TEXT, 
            createdAt TEXT DEFAULT (datetime('now'))
        );
    `);

    // 2. Load JSON Data
    if (fs.existsSync(customersJsonPath)) {
        console.log('📖 Reading customers.json...');
        const customers = JSON.parse(fs.readFileSync(customersJsonPath, 'utf8'));

        console.log(`🚀 Migrating ${customers.length} customers...`);

        const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO customers (
                id, name, displayName, logo, primaryColor, secondaryColor, 
                status, plan, contactEmail, contactPhone, address, website, 
                settings, subscription, createdAt
            ) VALUES (
                @id, @name, @displayName, @logo, @primaryColor, @secondaryColor,
                @status, @plan, @contactEmail, @contactPhone, @address, @website,
                @settings, @subscription, @createdAt
            )
        `);

        db.transaction(() => {
            for (const c of customers) {
                insertStmt.run({
                    id: c.id,
                    name: c.name,
                    displayName: c.displayName,
                    logo: c.logo,
                    primaryColor: c.primaryColor,
                    secondaryColor: c.secondaryColor,
                    status: c.status,
                    plan: c.plan,
                    contactEmail: c.contactEmail,
                    contactPhone: c.contactPhone,
                    address: c.address,
                    website: c.website,
                    settings: JSON.stringify(c.settings || {}),
                    subscription: JSON.stringify(c.subscription || {}),
                    createdAt: c.createdAt
                });
            }
        })();
        console.log('✅ Customers migrated successfully.');
    } else {
        console.log('⚠️ No customers.json found. Skipping data migration.');
    }
}

migrateCustomers();
