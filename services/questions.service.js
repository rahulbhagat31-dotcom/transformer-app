const db = require('../config/database');

class QuestionService {
    getSections() {
        return db.prepare('SELECT * FROM exam_sections').all();
    }

    getSectionBySlug(slug) {
        return db.prepare('SELECT key FROM exam_sections WHERE key = ?').get(slug);
    }

    addSection(key, label, color, icon) {
        db.prepare('INSERT INTO exam_sections (key, label, color, icon) VALUES (?, ?, ?, ?)').run(key, label, color, icon);
        return { key, label, color, icon };
    }

    deleteSection(key) {
        return db.prepare('DELETE FROM exam_sections WHERE key = ?').run(key);
    }

    getAllQuestions() {
        return db.prepare('SELECT * FROM exam_questions ORDER BY section, createdAt DESC').all();
    }

    addQuestion(q) {
        db.prepare(`
            INSERT INTO exam_questions (id, section, text, optionA, optionB, optionC, optionD, correctOption, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(q.id, q.section, q.text, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, q.createdBy);
        return db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(q.id);
    }

    deleteQuestion(id) {
        return db.prepare('DELETE FROM exam_questions WHERE id = ?').run(id);
    }

    getQuestionsBySection(section) {
        return db.prepare('SELECT * FROM exam_questions WHERE section = ?').all(section);
    }

    getQuestionById(id) {
        return db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(id);
    }

    updateQuestion(id, q) {
        return db.prepare('UPDATE exam_questions SET section=?, text=?, optionA=?, optionB=?, optionC=?, optionD=?, correctOption=? WHERE id=?')
            .run(q.section, q.text, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, id);
    }

    addResult(result) {
        db.prepare(`
            INSERT INTO exam_results (examId, section, operatorName, score, total, percentage, passed, answerKey)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(result.examId, result.section, result.operatorName, result.score, result.total, result.percentage, result.passed, result.answerKey);
    }

    getAllResults() {
        return db.prepare('SELECT examId, section, operatorName, submittedAt, score, total, percentage FROM exam_results ORDER BY submittedAt DESC').all();
    }

    getResultById(examId) {
        return db.prepare('SELECT * FROM exam_results WHERE examId = ?').get(examId);
    }
}

module.exports = new QuestionService();
