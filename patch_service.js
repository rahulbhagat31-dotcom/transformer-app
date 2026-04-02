const fs = require('fs');

const routeFile = 'c:/Users/Hina/OneDrive/Desktop/transformer/routes/questions.routes.js';
let content = fs.readFileSync(routeFile, 'utf8');

// 1. Remove DB require and insert Service require
content = content.replace('const db = require(\'../config/database\');', 'const questionService = require(\'../services/questions.service\');');

// 2. Remove getSections() and sectionKeys() helpers from routes because we'll use service
content = content.replace(/function getSections\(\) \{\s+return db\.prepare\('SELECT \* FROM exam_sections'\)\.all\(\);\s+\}/, '');
content = content.replace(/function sectionKeys\(\) \{\s+return getSections\(\)\.map\(s => s\.key\);\s+\}/, '');

// Since these are gone, we use questionService.getSections().map() inline for sectionKeys
content = content.replace(/sectionKeys\(\)/g, 'questionService.getSections().map(s => s.key)');
content = content.replace(/getSections\(\)/g, 'questionService.getSections()');

// 3. GET /
content = content.replace(/const qs = db\.prepare\('SELECT \* FROM exam_questions ORDER BY section, createdAt DESC'\)\.all\(\);/,
    'const qs = questionService.getAllQuestions();');

// 4. POST /
content = content.replace(/db\.prepare\(`[\s\S]*?`\)\.run\([^;]+\);[\s]+const q = db\.prepare\('SELECT \* FROM exam_questions WHERE id = \?'\)\.get\(id\);/,
    'const q = questionService.addQuestion({id, section, text: text.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(), correctOption, createdBy: req.user?.username || \'admin\'});');

// 5. GET /exam/:section
content = content.replace(/const all = db\.prepare\('SELECT \* FROM exam_questions WHERE section = \?'\)\.all\(section\);/,
    'const all = questionService.getQuestionsBySection(section);');

// 6. POST /exam/submit
content = content.replace(/const allQs = db\.prepare\('SELECT \* FROM exam_questions WHERE section = \?'\)\.all\(section\);/,
    'const allQs = questionService.getQuestionsBySection(section);');

content = content.replace(/db\.prepare\(`[\s\S]*?`\)\.run\([^;]+\);/,
    'questionService.addResult({ examId, section, operatorName: operatorName.trim(), score, total, percentage, passed, answerKey: JSON.stringify(answerKey) });');

// 7. DELETE /:id
content = content.replace(/const q = db\.prepare\('SELECT id FROM exam_questions WHERE id = \?'\)\.get\(req\.params\.id\);/,
    'const q = questionService.getQuestionById(req.params.id);');
content = content.replace(/db\.prepare\('DELETE FROM exam_questions WHERE id = \?'\)\.run\(req\.params\.id\);/,
    'questionService.deleteQuestion(req.params.id);');

// 8. PUT /:id
content = content.replace(/const info = db\.prepare\(`[\s\S]*?`\)\.run\([^;]+\);/,
    'const info = questionService.updateQuestion(req.params.id, {section, text: text.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(), correctOption});');
content = content.replace(/const updatedQ = db\.prepare\('SELECT \* FROM exam_questions WHERE id = \?'\)\.get\(req\.params\.id\);/,
    'const updatedQ = questionService.getQuestionById(req.params.id);');

// 9. GET /results
content = content.replace(/const results = db\.prepare\([\s\S]*?`\)\.all\(\);/,
    'const results = questionService.getAllResults();');

// 10. GET /results/:examId
content = content.replace(/const row = db\.prepare\('SELECT \* FROM exam_results WHERE examId = \?'\)\.get\(req\.params\.examId\);/,
    'const row = questionService.getResultById(req.params.examId);');

// 11. POST /sections
content = content.replace(/const existing = db\.prepare\('SELECT key FROM exam_sections WHERE key = \?'\)\.get\(slug\);/,
    'const existing = questionService.getSectionBySlug(slug);');
content = content.replace(/db\.prepare\('INSERT INTO exam_sections[^;]+\)\.run\([^;]+\);/,
    'questionService.addSection(slug, label.trim(), newColor, newIcon);');

// 12. DELETE /sections/:key
content = content.replace(/const info = db\.prepare\('DELETE FROM exam_sections WHERE key = \?'\)\.run\(req\.params\.key\);/,
    'const info = questionService.deleteSection(req.params.key);');


fs.writeFileSync(routeFile, content);
console.log('Service layer extracted successfully');
