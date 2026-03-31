/**
 * Exam Routes — MCQ Question Bank & Exam Runner
 * Adapted from transformer-deep questions.routes.js to use SQLite instead of JSON files.
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/auth');
const db = require('../config/database');

const SECTIONS = ['winding', 'core', 'tanking'];
const DEFAULT_EXAM_SIZE = 10;

function shuffle(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
}

// Apply auth to all routes
router.use(authenticate);

/* ─────────────────────────────────────────────────────────────
 * GET /exam/questions  — all questions (admin/quality only)
 * ───────────────────────────────────────────────────────────── */
router.get('/questions', requireRole(['admin', 'quality']), (req, res) => {
    try {
        const { section } = req.query;
        let rows;
        if (section && SECTIONS.includes(section)) {
            rows = db.prepare('SELECT * FROM exam_questions WHERE section = ? ORDER BY createdAt DESC').all(section);
        } else {
            rows = db.prepare('SELECT * FROM exam_questions ORDER BY section, createdAt DESC').all();
        }
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * POST /exam/questions  — add MCQ question (admin only)
 * ───────────────────────────────────────────────────────────── */
router.post('/questions', requireRole(['admin']), (req, res) => {
    try {
        const { text, section, optionA, optionB, optionC, optionD, correctOption } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Question text is required' });
        }
        if (!SECTIONS.includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section. Must be winding, core or tanking' });
        }
        if (!optionA || !optionB || !optionC || !optionD) {
            return res.status(400).json({ success: false, error: 'All four options (A–D) are required' });
        }
        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
            return res.status(400).json({ success: false, error: 'correctOption must be A, B, C or D' });
        }

        const id = Date.now().toString();
        db.prepare(`
            INSERT INTO exam_questions (id, section, text, optionA, optionB, optionC, optionD, correctOption, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, section, text.trim(), optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim(), correctOption, req.user?.username || 'admin');

        const q = db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(id);
        console.log(`✅ Question added: [${section}] ${text.substring(0, 50)}...`);
        res.json({ success: true, data: q });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * DELETE /exam/questions/:id — delete question (admin only)
 * ───────────────────────────────────────────────────────────── */
router.delete('/questions/:id', requireRole(['admin']), (req, res) => {
    try {
        const q = db.prepare('SELECT id FROM exam_questions WHERE id = ?').get(req.params.id);
        if (!q) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }
        db.prepare('DELETE FROM exam_questions WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Question deleted' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /exam/take/:section  — N random questions (strips correct answer)
 * ───────────────────────────────────────────────────────────── */
router.get('/take/:section', (req, res) => {
    try {
        const section = req.params.section.toLowerCase();
        if (!SECTIONS.includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section' });
        }

        const all = db.prepare('SELECT * FROM exam_questions WHERE section = ?').all(section);
        const requested = parseInt(req.query.count, 10);
        const count = (!isNaN(requested) && requested > 0) ? Math.min(requested, all.length) : Math.min(DEFAULT_EXAM_SIZE, all.length);
        const pool = shuffle(all).slice(0, count);

        // Strip correctOption before sending to client
        const safe = pool.map(({ id, text, optionA, optionB, optionC, optionD }) => ({
            id, text,
            options: { A: optionA, B: optionB, C: optionC, D: optionD }
        }));
        res.json({ success: true, section, count, total: safe.length, data: safe });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * POST /exam/submit  — submit exam answers, grade, store result
 * ───────────────────────────────────────────────────────────── */
router.post('/submit', (req, res) => {
    try {
        const { section, operatorName, answers } = req.body;
        // answers: [{ questionId, chosen }]

        if (!section || !SECTIONS.includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section' });
        }
        if (!operatorName || !operatorName.trim()) {
            return res.status(400).json({ success: false, error: 'Operator name is required' });
        }
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, error: 'Answers array is required' });
        }

        // Load all questions for this section to grade
        const allQs = db.prepare('SELECT * FROM exam_questions WHERE section = ?').all(section);
        const qMap = Object.fromEntries(allQs.map(q => [q.id, q]));

        let score = 0;
        const answerKey = answers.map(a => {
            const q = qMap[a.questionId];
            if (!q) {
                return null;
            }
            const correct = (a.chosen === q.correctOption);
            if (correct) {
                score++;
            }
            return {
                questionId: q.id,
                questionText: q.text,
                options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
                chosen: a.chosen,
                correctOption: q.correctOption,
                correct
            };
        }).filter(Boolean);

        const total = answerKey.length;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const passed = percentage >= 60 ? 1 : 0;

        const examId = Date.now().toString();
        db.prepare(`
            INSERT INTO exam_results (examId, section, operatorName, score, total, percentage, passed, answerKey)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(examId, section, operatorName.trim(), score, total, percentage, passed, JSON.stringify(answerKey));

        console.log(`📝 Exam submitted: ${operatorName} | ${section} | ${score}/${total} (${percentage}%) | ${passed ? 'PASS' : 'FAIL'}`);

        res.json({
            success: true,
            data: { examId, section, operatorName: operatorName.trim(), score, total, percentage, passed: !!passed, answerKey }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /exam/results  — all results summary (admin/quality)
 * ───────────────────────────────────────────────────────────── */
router.get('/results', requireRole(['admin', 'quality']), (req, res) => {
    try {
        const { section } = req.query;
        let rows;
        if (section && SECTIONS.includes(section)) {
            rows = db.prepare('SELECT examId, section, operatorName, submittedAt, score, total, percentage, passed FROM exam_results WHERE section = ? ORDER BY submittedAt DESC').all(section);
        } else {
            rows = db.prepare('SELECT examId, section, operatorName, submittedAt, score, total, percentage, passed FROM exam_results ORDER BY submittedAt DESC').all();
        }
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /exam/results/:examId  — full result with answer key (admin)
 * ───────────────────────────────────────────────────────────── */
router.get('/results/:examId', requireRole(['admin', 'quality']), (req, res) => {
    try {
        const row = db.prepare('SELECT * FROM exam_results WHERE examId = ?').get(req.params.examId);
        if (!row) {
            return res.status(404).json({ success: false, error: 'Result not found' });
        }
        row.answerKey = JSON.parse(row.answerKey || '[]');
        res.json({ success: true, data: row });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /exam/stats  — question bank stats (admin/quality)
 * ───────────────────────────────────────────────────────────── */
router.get('/stats', requireRole(['admin', 'quality']), (req, res) => {
    try {
        const questionStats = db.prepare(`
            SELECT section, COUNT(*) as count FROM exam_questions GROUP BY section
        `).all();
        const resultStats = db.prepare(`
            SELECT section,
                   COUNT(*) as attempts,
                   ROUND(AVG(percentage), 1) as avgScore,
                   SUM(passed) as passes
            FROM exam_results GROUP BY section
        `).all();
        res.json({ success: true, data: { questions: questionStats, results: resultStats } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
