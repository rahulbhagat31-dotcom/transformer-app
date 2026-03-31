-- ============================================
-- TRANSFORMER MANUFACTURING SYSTEM
-- Production Database Schema (Simplified)
-- ============================================

-- Customers Table (must come before users due to FK)
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
    settings TEXT, -- JSON string
    subscription TEXT, -- JSON string
    createdAt TEXT DEFAULT (datetime('now'))
);

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
    updatedBy TEXT
);

-- Design Revisions Table
CREATE TABLE IF NOT EXISTS design_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo TEXT NOT NULL,
    revision INTEGER NOT NULL,
    designData TEXT NOT NULL,
    calculationHash TEXT,
    validationStatus TEXT DEFAULT 'PASS',
    validationErrors TEXT,
    validationWarnings TEXT,
    warningsAcknowledgedBy TEXT,
    warningsAcknowledgedAt TEXT,
    calculatorVersion TEXT DEFAULT '2.0.0',
    engineVersion TEXT DEFAULT 'IEC-60076-2024',
    createdBy TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    notes TEXT,
    frozen INTEGER DEFAULT 0,
    UNIQUE(wo, revision),
    FOREIGN KEY (wo) REFERENCES transformers(wo)
);
-- Migration: add columns to existing databases (safe to run multiple times — SQLite ignores duplicate columns)
ALTER TABLE design_revisions ADD COLUMN calculationHash TEXT;
ALTER TABLE design_revisions ADD COLUMN validationStatus TEXT DEFAULT 'PASS';
ALTER TABLE design_revisions ADD COLUMN validationErrors TEXT;
ALTER TABLE design_revisions ADD COLUMN validationWarnings TEXT;
ALTER TABLE design_revisions ADD COLUMN warningsAcknowledgedBy TEXT;
ALTER TABLE design_revisions ADD COLUMN warningsAcknowledgedAt TEXT;
ALTER TABLE design_revisions ADD COLUMN calculatorVersion TEXT DEFAULT '2.0.0';
ALTER TABLE design_revisions ADD COLUMN engineVersion TEXT DEFAULT 'IEC-60076-2024';

-- Migration: add customerVisible to transformers (0 = hidden from customer, 1 = visible to customer)
ALTER TABLE transformers ADD COLUMN customerVisible INTEGER DEFAULT 0;
ALTER TABLE transformers ADD COLUMN customerVisibleUpdatedBy TEXT;
ALTER TABLE transformers ADD COLUMN customerVisibleUpdatedAt TEXT;


-- Audit Logs Table
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
    previousHash TEXT,
    currentHash TEXT
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
    supervisorApproved INTEGER DEFAULT 0,
    supervisorApprovedBy TEXT,
    supervisorApprovedAt TEXT,
    lastUpdated TEXT DEFAULT (datetime('now')),
    UNIQUE(wo, stage),
    FOREIGN KEY (wo) REFERENCES transformers(wo)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transformers_customer ON transformers(customerId);
CREATE INDEX IF NOT EXISTS idx_transformers_stage ON transformers(stage);
CREATE INDEX IF NOT EXISTS idx_revisions_wo ON design_revisions(wo, revision DESC);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_checklists_wo ON checklists(wo, stage);

-- BOM Files Table
CREATE TABLE IF NOT EXISTS bom_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo TEXT NOT NULL,
    customerId TEXT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    uploadedBy TEXT NOT NULL,
    uploadedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (wo) REFERENCES transformers(wo)
);
CREATE INDEX IF NOT EXISTS idx_bom_wo ON bom_files(wo);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    customerId TEXT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    uploadedBy TEXT NOT NULL,
    uploadedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (wo) REFERENCES transformers(wo)
);
CREATE INDEX IF NOT EXISTS idx_documents_wo ON documents(wo);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(wo, type);


-- Transformer Stage Status Table (Replacess stageStatus.json)
CREATE TABLE IF NOT EXISTS transformer_stage_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wo TEXT NOT NULL,
    stage TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, in-progress, completed
    completionPercentage INTEGER DEFAULT 0,
    completedAt TEXT,
    completedBy TEXT,
    locked INTEGER DEFAULT 0,
    lockedAt TEXT,
    unlockedBy TEXT,
    unlockedAt TEXT,
    unlockReason TEXT,
    lastUpdated TEXT DEFAULT (datetime('now')),
    UNIQUE(wo, stage),
    FOREIGN KEY (wo) REFERENCES transformers(wo)
);
CREATE INDEX IF NOT EXISTS idx_stage_status_wo ON transformer_stage_status(wo);

-- Exam Questions Table (MCQ Bank)
CREATE TABLE IF NOT EXISTS exam_questions (
    id TEXT PRIMARY KEY,
    section TEXT NOT NULL CHECK(section IN ('winding','core','tanking')),
    text TEXT NOT NULL,
    optionA TEXT NOT NULL,
    optionB TEXT NOT NULL,
    optionC TEXT NOT NULL,
    optionD TEXT NOT NULL,
    correctOption TEXT NOT NULL CHECK(correctOption IN ('A','B','C','D')),
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_exam_questions_section ON exam_questions(section);

-- Exam Results Table
CREATE TABLE IF NOT EXISTS exam_results (
    examId TEXT PRIMARY KEY,
    section TEXT NOT NULL,
    operatorName TEXT NOT NULL,
    submittedAt TEXT DEFAULT (datetime('now')),
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    answerKey TEXT NOT NULL  -- JSON array
);
