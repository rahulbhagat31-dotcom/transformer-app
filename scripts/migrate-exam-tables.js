/**
 * One-time migration: create exam_questions and exam_results tables
 * Run with: node scripts/migrate-exam-tables.js
 */
const db = require('../config/database');

db.exec(`
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
CREATE TABLE IF NOT EXISTS exam_results (
    examId TEXT PRIMARY KEY,
    section TEXT NOT NULL,
    operatorName TEXT NOT NULL,
    submittedAt TEXT DEFAULT (datetime('now')),
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    answerKey TEXT NOT NULL
);
`);

const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name LIKE \'exam%\'').all();
console.log('✅ Exam tables ready:', tables.map(r => r.name).join(', '));
process.exit(0);
