const fs = require('fs');
const f = 'c:/Users/Hina/OneDrive/Desktop/transformer/routes/questions.routes.js';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/SECTIONS/g, 'sectionKeys()');
c = c.replace(/sectionKeys\(\)\.includes/g, 'sectionKeys().includes');

if (!c.includes('/sections')) {
    const sectRoutes = `
// ── GET /questions/sections  – list all sections (public) ────────────────────
router.get('/sections', (req, res) => {
    try { res.json({ success: true, data: getSections() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── POST /questions/sections  – add a section (admin-only) ───────────────────
router.post('/sections', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const { key, label, color, icon } = req.body;
        if (!key || !label) return res.status(400).json({ success: false, error: 'key and label are required' });
        const slug = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const existing = db.prepare('SELECT key FROM exam_sections WHERE key = ?').get(slug);
        if (existing) return res.status(400).json({ success: false, error: 'Section key already exists' });
        const newColor = color || '#64748b';
        const newIcon = icon || '📋';
        db.prepare('INSERT INTO exam_sections (key, label, color, icon) VALUES (?, ?, ?, ?)').run(slug, label.trim(), newColor, newIcon);
        res.json({ success: true, data: { key: slug, label: label.trim(), color: newColor, icon: newIcon } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── DELETE /questions/sections/:key  – remove a section (admin-only) ─────────
router.delete('/sections/:key', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const info = db.prepare('DELETE FROM exam_sections WHERE key = ?').run(req.params.key);
        if (info.changes === 0) return res.status(404).json({ success: false, error: 'Section not found' });
        res.json({ success: true, message: 'Section deleted' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
`;
    c = c.replace('// ── GET /questions  – all questions', sectRoutes + '\n// ── GET /questions  – all questions');
}

if (!c.includes('router.put(')) {
    const putRoute = `
// ── PUT /questions/:id  – edit question (admin only) ────────────────────────
router.put('/:id', authenticate, requireRole(['admin']), (req, res) => {
    try {
        const { text, section, optionA, optionB, optionC, optionD, correctOption } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ success: false, error: 'Question text is required' });
        if (!sectionKeys().includes(section)) return res.status(400).json({ success: false, error: 'Invalid section' });
        if (!optionA || !optionB || !optionC || !optionD) return res.status(400).json({ success: false, error: 'All four options (A-D) are required' });
        if (!['A', 'B', 'C', 'D'].includes(correctOption)) return res.status(400).json({ success: false, error: 'Correct option must be A, B, C or D' });
        const info = db.prepare('UPDATE exam_questions SET section=?, text=?, optionA=?, optionB=?, optionC=?, optionD=?, correctOption=? WHERE id=?').run(section, text.trim(), optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim(), correctOption, req.params.id);
        if (info.changes === 0) return res.status(404).json({ success: false, error: 'Question not found' });
        const updatedQ = db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: { id: updatedQ.id, section: updatedQ.section, text: updatedQ.text, options: { A: updatedQ.optionA, B: updatedQ.optionB, C: updatedQ.optionC, D: updatedQ.optionD }, correctOption: updatedQ.correctOption } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
`;
    c = c.replace('module.exports = router;', putRoute + '\nmodule.exports = router;');
}

fs.writeFileSync(f, c);
console.log('Successfully patched routes');
