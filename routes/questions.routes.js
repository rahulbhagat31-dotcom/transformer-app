/**
 * questions.routes.js
 * Same API surface as the "transformer deep" questions.routes.js,
 * but backed by SQLite (exam_questions / exam_results tables) instead of JSON files.
 *
 * Endpoints (identical to source):
 *   GET    /questions                    – all questions
 *   POST   /questions                    – add question (admin only)
 *   GET    /questions/exam/:section      – N random questions (no auth, correct answer stripped)
 *   POST   /questions/exam/submit        – submit exam answers
 *   DELETE /questions/:id                – delete question (admin only)
 *   GET    /questions/results            – all results summary (admin only)
 *   GET    /questions/results/:examId    – single result with answer key (admin only)
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/auth');
const questionService = require('../services/questions.service');


const EXAM_SIZE = 20; // questions per exam (matches deep folder default)

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


// ── GET /questions/sections  – list all sections (public) ────────────────────
router.get('/sections', (req, res) => {
    try {
        res.json({ success: true, data: questionService.getSections() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── POST /questions/sections  – add a section (admin-only) ───────────────────
router.post('/sections', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const { key, label, color, icon } = req.body;
        if (!key || !label) {
            return res.status(400).json({ success: false, error: 'key and label are required' });
        }
        const slug = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const existing = questionService.getSectionBySlug(slug);
        if (existing) {
            return res.status(400).json({ success: false, error: 'Section key already exists' });
        }
        const newColor = color || '#64748b';
        const newIcon = icon || '📋';
        questionService.addSection(slug, label.trim(), newColor, newIcon);
        res.json({ success: true, data: { key: slug, label: label.trim(), color: newColor, icon: newIcon } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── DELETE /questions/sections/:key  – remove a section (admin-only) ─────────
router.delete('/sections/:key', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const info = questionService.deleteSection(req.params.key);
        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Section not found' });
        }
        res.json({ success: true, message: 'Section deleted' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── GET /questions  – all questions ─────────────────────────────────────────
router.get('/', authenticate, (req, res) => {
    try {
        const qs = questionService.getAllQuestions();
        // Map to match deep folder format: { id, section, text, options:{A,B,C,D}, correctOption, createdAt, createdBy }
        const formatted = qs.map(q => ({
            id: q.id,
            section: q.section,
            text: q.text,
            options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
            correctOption: q.correctOption,
            createdAt: q.createdAt,
            createdBy: q.createdBy
        }));
        res.json({ success: true, data: formatted });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── POST /questions  – add MCQ question (admin only) ────────────────────────
router.post('/', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const { text, section, optionA, optionB, optionC, optionD, correctOption } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Question text is required' });
        }
        if (!questionService.getSections().map(s => s.key).includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section' });
        }
        if (!optionA || !optionB || !optionC || !optionD) {
            return res.status(400).json({ success: false, error: 'All four options (A-D) are required' });
        }
        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
            return res.status(400).json({ success: false, error: 'Correct option must be A, B, C or D' });
        }

        const id = Date.now().toString() + '_' + Math.random().toString(36).slice(2, 8);
        const q = questionService.addQuestion({id, section, text: text.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(), correctOption, createdBy: req.user?.username || 'admin'});
        const newQ = {
            id: q.id,
            section: q.section,
            text: q.text,
            options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
            correctOption: q.correctOption,
            createdAt: q.createdAt,
            createdBy: q.createdBy
        };
        res.json({ success: true, data: newQ });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── GET /questions/exam/:section  – N random questions (no auth, strips answer)
// ⚠️ MUST be before /:id route so Express doesn't match 'exam' as an id
router.get('/exam/:section', (req, res) => {
    try {
        const section = req.params.section.toLowerCase();
        if (!questionService.getSections().map(s => s.key).includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section' });
        }

        const all = questionService.getQuestionsBySection(section);
        // Allow ?count=N in URL; clamp between 1 and total available
        const requested = parseInt(req.query.count, 10);
        const count = (!isNaN(requested) && requested > 0) ? Math.min(requested, all.length) : Math.min(EXAM_SIZE, all.length);
        const pool = shuffle(all).slice(0, count);

        // Strip correct answer before sending to client
        const safe = pool.map(({ id, text, optionA, optionB, optionC, optionD }) => ({
            id,
            text,
            options: { A: optionA, B: optionB, C: optionC, D: optionD }
        }));
        res.json({ success: true, section, count, total: safe.length, data: safe });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── POST /questions/exam/submit  – submit exam answers ───────────────────────
// ⚠️ MUST be before /:id route
router.post('/exam/submit', authenticate, (req, res) => {
    try {
        const { section, operatorName, answers } = req.body;
        // answers: [{ questionId, chosen }]

        if (!section || !questionService.getSections().map(s => s.key).includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section' });
        }
        if (!operatorName || !operatorName.trim()) {
            return res.status(400).json({ success: false, error: 'Operator name is required' });
        }
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, error: 'Answers are required' });
        }

        const allQs = questionService.getQuestionsBySection(section);
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

        const examId = Date.now().toString() + '_' + Math.random().toString(36).slice(2, 8);
        questionService.addResult({ examId, section, operatorName: operatorName.trim(), score, total, percentage, passed, answerKey: JSON.stringify(answerKey) });

        console.log(`📝 Exam: ${operatorName} | ${section} | ${score}/${total} (${percentage}%) | ${passed ? 'PASS' : 'FAIL'}`);

        res.json({
            success: true,
            data: {
                examId,
                section,
                operatorName: operatorName.trim(),
                submittedAt: new Date().toISOString(),
                score,
                total,
                percentage,
                answerKey
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── DELETE /questions/:id  – delete question (admin only) ───────────────────
router.delete('/:id', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const q = questionService.getQuestionById(req.params.id);
        if (!q) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }
        questionService.deleteQuestion(req.params.id);
        res.json({ success: true, message: 'Question deleted' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── GET /questions/results  – all results (admin only) ──────────────────────
router.get('/results', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const results = questionService.getAllResults();
        res.json({ success: true, data: results });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── GET /questions/results/:examId  – single result with answer key (admin) ─
router.get('/results/:examId', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const row = questionService.getResultById(req.params.examId);
        if (!row) {
            return res.status(404).json({ success: false, error: 'Result not found' });
        }
        row.answerKey = JSON.parse(row.answerKey || '[]');
        res.json({ success: true, data: row });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});


// ── PUT /questions/:id  – edit question (admin only) ────────────────────────
router.put('/:id', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const { text, section, optionA, optionB, optionC, optionD, correctOption } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Question text is required' });
        }
        if (!questionService.getSections().map(s => s.key).includes(section)) {
            return res.status(400).json({ success: false, error: 'Invalid section' });
        }
        if (!optionA || !optionB || !optionC || !optionD) {
            return res.status(400).json({ success: false, error: 'All four options (A-D) are required' });
        }
        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
            return res.status(400).json({ success: false, error: 'Correct option must be A, B, C or D' });
        }
        const info = questionService.updateQuestion(req.params.id, {section, text: text.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(), correctOption});
        if (info.changes === 0) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }
        const updatedQ = questionService.getQuestionById(req.params.id);
        res.json({ success: true, data: { id: updatedQ.id, section: updatedQ.section, text: updatedQ.text, options: { A: updatedQ.optionA, B: updatedQ.optionB, C: updatedQ.optionC, D: updatedQ.optionD }, correctOption: updatedQ.correctOption } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
