/**
 * Seed Script: Inserts 3 test transformer records into the SQLite database.
 * Run once with:  node scripts/seed-test-data.js
 */

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'transformer.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ─── Helper ───────────────────────────────────────────────
function now() {
    return new Date().toISOString();
}

// ─── 1. Ensure test customers exist ───────────────────────
const customers = [
    { id: 'CUST001', name: 'UPPTCL', displayName: 'UP Power Transmission Corp. Ltd' },
    { id: 'CUST002', name: 'PGCIL', displayName: 'Power Grid Corp. of India Ltd' },
    { id: 'CUST003', name: 'MSEDCL', displayName: 'Maharashtra State Electricity Dist. Co. Ltd' }
];

const insertCustomer = db.prepare(`
    INSERT OR IGNORE INTO customers (id, name, displayName, status, createdAt)
    VALUES (@id, @name, @displayName, 'active', @createdAt)
`);
for (const c of customers) {
    insertCustomer.run({ ...c, createdAt: now() });
}
console.log('✅ Customers seeded');

// ─── 2. Transformer records ────────────────────────────────
const transformerData = [
    {
        wo: 'WO-2025-001',
        customerId: 'CUST001',
        customer: 'UPPTCL',
        rating: 1000,
        hv: 33000,
        lv: 433,
        stage: 'vpd',
        currentStage: 'vpd',
        stageProgress: 65,
        createdBy: 'admin',
        createdAt: '2025-11-01T08:00:00.000Z',
        updatedAt: '2026-02-09T12:52:50.000Z',
        updatedBy: 'admin',
        designData: JSON.stringify({
            phase: 3, frequency: 50, cooling: 'ONAN', vectorGroup: 'Dyn11',
            impedance: { percentImpedance: 4.5 },
            winding: { noLoadLoss: 1.8, loadLoss: 10.2 },
            dimensions: { weights: { core: 2800 } }
        }),
        stageHistory: JSON.stringify([
            { stage: 'winding', startedAt: '2025-11-01T08:00:00.000Z', completedAt: '2025-11-20T17:00:00.000Z', completedBy: 'production', duration: '19 days', notes: 'Completed without issues' },
            { stage: 'vpd', startedAt: '2025-11-21T08:00:00.000Z', completedAt: null, completedBy: null, duration: null, notes: 'Drying cycle 2 of 3 in progress' }
        ])
    },
    {
        wo: 'WO-2025-002',
        customerId: 'CUST002',
        customer: 'PGCIL',
        rating: 5000,
        hv: 132000,
        lv: 11000,
        stage: 'tanking',
        currentStage: 'tanking',
        stageProgress: 40,
        createdBy: 'admin',
        createdAt: '2025-12-05T09:30:00.000Z',
        updatedAt: '2026-02-15T10:00:00.000Z',
        updatedBy: 'admin',
        designData: JSON.stringify({
            phase: 3, frequency: 50, cooling: 'ONAF', vectorGroup: 'YNd1',
            impedance: { percentImpedance: 8.0 },
            winding: { noLoadLoss: 5.5, loadLoss: 38.0 },
            dimensions: { weights: { core: 12000 } }
        }),
        stageHistory: JSON.stringify([
            { stage: 'winding', startedAt: '2025-12-05T09:30:00.000Z', completedAt: '2026-01-02T17:00:00.000Z', completedBy: 'production', duration: '28 days', notes: 'HV winding complete, LV re-wound once' },
            { stage: 'vpd', startedAt: '2026-01-03T08:00:00.000Z', completedAt: '2026-01-15T17:00:00.000Z', completedBy: 'production', duration: '12 days', notes: '3-cycle drying completed' },
            { stage: 'coreCoil', startedAt: '2026-01-16T08:00:00.000Z', completedAt: '2026-02-01T17:00:00.000Z', completedBy: 'production', duration: '16 days', notes: 'Core assembly complete, QA signed off' },
            { stage: 'tanking', startedAt: '2026-02-02T08:00:00.000Z', completedAt: null, completedBy: null, duration: null, notes: 'Tank welding in progress' }
        ])
    },
    {
        wo: 'WO-2026-003',
        customerId: 'CUST003',
        customer: 'MSEDCL',
        rating: 250,
        hv: 11000,
        lv: 433,
        stage: 'completed',
        currentStage: 'completed',
        stageProgress: 100,
        createdBy: 'admin',
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-02-18T08:00:00.000Z',
        updatedBy: 'admin',
        designData: JSON.stringify({
            phase: 3, frequency: 50, cooling: 'ONAN', vectorGroup: 'Dyn11',
            impedance: { percentImpedance: 4.0 },
            winding: { noLoadLoss: 0.55, loadLoss: 3.25 },
            dimensions: { weights: { core: 680 } }
        }),
        stageHistory: JSON.stringify([
            { stage: 'winding', startedAt: '2026-01-10T10:00:00.000Z', completedAt: '2026-01-20T17:00:00.000Z', completedBy: 'production', duration: '10 days', notes: 'Smooth winding, no rework' },
            { stage: 'vpd', startedAt: '2026-01-21T08:00:00.000Z', completedAt: '2026-01-28T17:00:00.000Z', completedBy: 'production', duration: '7 days', notes: 'VPD drying in 2 cycles' },
            { stage: 'coreCoil', startedAt: '2026-01-29T08:00:00.000Z', completedAt: '2026-02-05T17:00:00.000Z', completedBy: 'production', duration: '7 days', notes: 'Core & coil assembly completed' },
            { stage: 'tanking', startedAt: '2026-02-06T08:00:00.000Z', completedAt: '2026-02-10T17:00:00.000Z', completedBy: 'production', duration: '4 days', notes: 'Tank sealed and pressure tested' },
            { stage: 'tankFilling', startedAt: '2026-02-11T08:00:00.000Z', completedAt: '2026-02-12T12:00:00.000Z', completedBy: 'production', duration: '1.5 days', 'notes': 'Oil filling complete, no leaks' },
            { stage: 'testing', startedAt: '2026-02-13T08:00:00.000Z', completedAt: '2026-02-17T17:00:00.000Z', completedBy: 'quality', duration: '4 days', notes: 'Ratio, IR, DGA — all tests passed' },
            { stage: 'completed', startedAt: '2026-02-18T08:00:00.000Z', completedAt: '2026-02-18T08:00:00.000Z', completedBy: 'admin', duration: '—', notes: 'Dispatched to site 2026-02-20' }
        ])
    }
];

const insertTransformer = db.prepare(`
    INSERT OR REPLACE INTO transformers
        (wo, customerId, customer, rating, hv, lv, stage, currentStage,
         stageProgress, stageHistory, designData, createdBy, createdAt, updatedAt, updatedBy)
    VALUES
        (@wo, @customerId, @customer, @rating, @hv, @lv, @stage, @currentStage,
         @stageProgress, @stageHistory, @designData, @createdBy, @createdAt, @updatedAt, @updatedBy)
`);

for (const t of transformerData) {
    insertTransformer.run(t);
    console.log(`✅ Transformer inserted: ${t.wo} (${t.rating} kVA, ${t.hv / 1000}/${t.lv} V, Stage: ${t.stage})`);
}

// ─── 3. Stage status rows ──────────────────────────────────

const stageStatusMap = {
    'WO-2025-001': {
        winding: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2025-11-20T17:00:00.000Z', completedBy: 'production' },
        vpd: { status: 'in-progress', completionPercentage: 65, locked: 0 },
        coreCoil: { status: 'pending', completionPercentage: 0, locked: 0 },
        tanking: { status: 'pending', completionPercentage: 0, locked: 0 },
        tankFilling: { status: 'pending', completionPercentage: 0, locked: 0 }
    },
    'WO-2025-002': {
        winding: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-01-02T17:00:00.000Z', completedBy: 'production' },
        vpd: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-01-15T17:00:00.000Z', completedBy: 'production' },
        coreCoil: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-02-01T17:00:00.000Z', completedBy: 'production' },
        tanking: { status: 'in-progress', completionPercentage: 40, locked: 0 },
        tankFilling: { status: 'pending', completionPercentage: 0, locked: 0 }
    },
    'WO-2026-003': {
        winding: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-01-20T17:00:00.000Z', completedBy: 'production' },
        vpd: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-01-28T17:00:00.000Z', completedBy: 'production' },
        coreCoil: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-02-05T17:00:00.000Z', completedBy: 'production' },
        tanking: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-02-10T17:00:00.000Z', completedBy: 'production' },
        tankFilling: { status: 'completed', completionPercentage: 100, locked: 1, completedAt: '2026-02-12T17:00:00.000Z', completedBy: 'production' }
    }
};

const insertStageStatus = db.prepare(`
    INSERT OR REPLACE INTO transformer_stage_status
        (wo, stage, status, completionPercentage, completedAt, completedBy, locked, lastUpdated)
    VALUES
        (@wo, @stage, @status, @completionPercentage, @completedAt, @completedBy, @locked, @lastUpdated)
`);

for (const [wo, stages] of Object.entries(stageStatusMap)) {
    for (const [stage, info] of Object.entries(stages)) {
        insertStageStatus.run({
            wo, stage,
            status: info.status,
            completionPercentage: info.completionPercentage,
            completedAt: info.completedAt || null,
            completedBy: info.completedBy || null,
            locked: info.locked,
            lastUpdated: now()
        });
    }
}
console.log('✅ Stage status rows seeded');

// ─── 4. Sample audit log entries ──────────────────────────
const auditEntries = [
    { userId: 'admin', username: 'Senior Engineer', role: 'admin', action: 'TRANSFORMER_CREATED', entityType: 'transformer', entityId: 'WO-2025-001', details: '1000 kVA, 33kV/433V ONAN transformer registered', timestamp: '2025-11-01T08:05:00.000Z' },
    { userId: 'production', username: 'Rahul Kumar', role: 'production', action: 'CHECKLIST_SAVE', entityType: 'checklist', entityId: 'WO-2025-001', details: 'Winding stage checklist saved — items 1-5', timestamp: '2025-11-05T10:30:00.000Z' },
    { userId: 'production', username: 'Rahul Kumar', role: 'production', action: 'STAGE_COMPLETED', entityType: 'transformer', entityId: 'WO-2025-001', details: 'Winding stage completed and locked', timestamp: '2025-11-20T17:00:00.000Z' },
    { userId: 'admin', username: 'Senior Engineer', role: 'admin', action: 'TRANSFORMER_CREATED', entityType: 'transformer', entityId: 'WO-2025-002', details: '5000 kVA, 132kV/11kV ONAF transformer registered', timestamp: '2025-12-05T09:35:00.000Z' },
    { userId: 'production', username: 'Amit Singh', role: 'production', action: 'CHECKLIST_SAVE', entityType: 'checklist', entityId: 'WO-2025-002', details: 'Winding stage — HV winding complete, LV rework', timestamp: '2025-12-20T14:00:00.000Z' },
    { userId: 'quality', username: 'QA Engineer', role: 'quality', action: 'QA_APPROVED', entityType: 'checklist', entityId: 'WO-2025-002', details: 'Core Coil stage QA approved', timestamp: '2026-02-01T17:00:00.000Z' },
    { userId: 'admin', username: 'Senior Engineer', role: 'admin', action: 'TRANSFORMER_CREATED', entityType: 'transformer', entityId: 'WO-2026-003', details: '250 kVA, 11kV/433V ONAN transformer registered', timestamp: '2026-01-10T10:05:00.000Z' },
    { userId: 'production', username: 'Ravi Sharma', role: 'production', action: 'STAGE_COMPLETED', entityType: 'transformer', entityId: 'WO-2026-003', details: 'All stages completed — dispatched to site', timestamp: '2026-02-18T08:00:00.000Z' },
    { userId: 'quality', username: 'QA Engineer', role: 'quality', action: 'SUPERVISOR_SIGN_OFF', entityType: 'checklist', entityId: 'WO-2026-003', details: 'Final QA sign-off completed. All routine tests passed', timestamp: '2026-02-17T17:00:00.000Z' }
];

const insertAudit = db.prepare(`
    INSERT INTO audit_logs (timestamp, userId, username, role, action, entityType, entityId, details)
    VALUES (@timestamp, @userId, @username, @role, @action, @entityType, @entityId, @details)
`);

for (const entry of auditEntries) {
    insertAudit.run(entry);
}
console.log('✅ Audit log entries seeded');

console.log('\n🎉 Seed complete! 3 transformers added:');
console.log('   WO-2025-001 → UPPTCL    | 1000 kVA | 33kV/433V  | Stage: VPD (65%)');
console.log('   WO-2025-002 → PGCIL     | 5000 kVA | 132kV/11kV | Stage: Tanking (40%)');
console.log('   WO-2026-003 → MSEDCL    |  250 kVA | 11kV/433V  | Stage: Completed ✅');

db.close();
