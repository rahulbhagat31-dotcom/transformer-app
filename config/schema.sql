-- ============================================
-- TRANSFORMER MANUFACTURING SYSTEM
-- Database Schema - Production Grade
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'quality', 'production', 'customer')),
    department TEXT,
    customerId TEXT,
    customerName TEXT,
    permissions TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

-- Transformers Table
CREATE TABLE IF NOT EXISTS transformers (
    wo TEXT PRIMARY KEY,
    customerId TEXT,
    customer TEXT,
    rating REAL,
    hv REAL,
    lv REAL,
    stage TEXT DEFAULT 'design',
    currentStage TEXT,
    stageProgress INTEGER DEFAULT 0,
    stageHistory TEXT,
    designData TEXT,
    actuals TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    updatedBy TEXT,
    FOREIGN KEY (customerId) REFERENCES users(customerId)
);

-- Design Revisions Table (IMMUTABLE)
CREATE TABLE IF NOT EXISTS design_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo TEXT NOT NULL,
    revision INTEGER NOT NULL,
    designData TEXT NOT NULL,
    calculationHash TEXT NOT NULL,
    
    validationStatus TEXT CHECK(validationStatus IN ('PASS', 'WARNINGS_ACKNOWLEDGED', 'ERRORS')) NOT NULL,
    validationErrors TEXT,
    validationWarnings TEXT,
    warningsAcknowledgedBy TEXT,
    warningsAcknowledgedAt TEXT,
    
    calculatorVersion TEXT NOT NULL,
    engineVersion TEXT NOT NULL,
    
    createdBy TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    notes TEXT,
    
    frozen INTEGER DEFAULT 1 CHECK(frozen IN (0, 1)),
    
    UNIQUE(wo, revision),
    FOREIGN KEY (wo) REFERENCES transformers(wo),
    FOREIGN KEY (createdBy) REFERENCES users(userId)
);

-- Trigger: Prevent UPDATE on frozen revisions
CREATE TRIGGER IF NOT EXISTS prevent_frozen_revision_update
BEFORE UPDATE ON design_revisions
WHEN OLD.frozen = 1
BEGIN
    SELECT RAISE(ABORT, 'Frozen revisions are immutable');
END;

-- Trigger: Prevent DELETE on frozen revisions
CREATE TRIGGER IF NOT EXISTS prevent_frozen_revision_delete
BEFORE DELETE ON design_revisions
WHEN OLD.frozen = 1
BEGIN
    SELECT RAISE(ABORT, 'Frozen revisions cannot be deleted');
END;

-- Audit Logs Table (HASH CHAIN)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT (datetime('now')),
    userId TEXT NOT NULL,
    username TEXT,
    role TEXT,
    action TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    details TEXT,
    ipAddress TEXT,
    
    previousHash TEXT NOT NULL,
    currentHash TEXT NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users(userId)
);

-- Checklists Table
CREATE TABLE IF NOT EXISTS checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo TEXT NOT NULL,
    stage TEXT NOT NULL,
    items TEXT NOT NULL,
    locked INTEGER DEFAULT 0,
    qaApproved INTEGER,
    rejectionReason TEXT,
    completedBy TEXT,
    lastUpdated TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (wo) REFERENCES transformers(wo)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transformers_customer ON transformers(customerId);
CREATE INDEX IF NOT EXISTS idx_transformers_stage ON transformers(stage);
CREATE INDEX IF NOT EXISTS idx_revisions_wo ON design_revisions(wo, revision DESC);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_logs(currentHash);
CREATE INDEX IF NOT EXISTS idx_checklists_wo ON checklists(wo, stage);
