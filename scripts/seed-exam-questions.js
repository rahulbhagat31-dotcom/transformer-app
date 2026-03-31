/**
 * Seed sample MCQ questions for all 3 sections
 * Run with: node scripts/seed-exam-questions.js
 */
const db = require('../config/database');

const questions = [
    // Winding
    { section: 'winding', text: 'What type of conductor is most commonly used in HV transformer windings?', optionA: 'Aluminium foil', optionB: 'Continuously transposed conductor (CTC)', optionC: 'Solid copper bar', optionD: 'Steel wire', correctOption: 'B' },
    { section: 'winding', text: 'What is the purpose of transposition in winding conductors?', optionA: 'To reduce copper loss', optionB: 'To improve mechanical strength', optionC: 'To equalize induced EMF in all strands and reduce eddy current losses', optionD: 'To increase insulation thickness', correctOption: 'C' },
    { section: 'winding', text: 'Which insulation material is applied between disc coils in a transformer winding?', optionA: 'Mica tape', optionB: 'Pressboard spacers', optionC: 'PVC sheets', optionD: 'Glass fibre cloth', correctOption: 'B' },
    { section: 'winding', text: 'What is the inner most winding usually placed on the core?', optionA: 'HV winding', optionB: 'LV winding', optionC: 'Tertiary winding', optionD: 'Regulating winding', correctOption: 'B' },
    { section: 'winding', text: 'In continuous disc winding, each disc consists of:', optionA: 'One turn wound in a flat spiral', optionB: 'Multiple turns wound in a flat spiral', optionC: 'Helical coils stacked vertically', optionD: 'A single layer of conductors', correctOption: 'B' },

    // Core Building
    { section: 'core', text: 'What material is primarily used for transformer core laminations?', optionA: 'Cast iron', optionB: 'Silicon steel (CRGO)', optionC: 'Copper alloy', optionD: 'Carbon steel', correctOption: 'B' },
    { section: 'core', text: 'What does CRGO stand for in transformer cores?', optionA: 'Cold Rolled Grain Oriented', optionB: 'Core Reinforced Grain Optimised', optionC: 'Copper Reinforced Grain Oriented', optionD: 'Cold Rolled Grade One', correctOption: 'A' },
    { section: 'core', text: 'Why is the core made of thin laminations instead of a solid block?', optionA: 'To improve mechanical strength', optionB: 'To reduce material cost', optionC: 'To reduce eddy current losses', optionD: 'To increase flux density', correctOption: 'C' },
    { section: 'core', text: 'What is the typical stacking factor for CRGO laminations?', optionA: '0.5 to 0.6', optionB: '0.97 to 0.98', optionC: '0.70 to 0.80', optionD: '1.0', correctOption: 'B' },
    { section: 'core', text: 'In a 3-phase transformer, the core limbs are separated by:', optionA: 'Copper plates', optionB: 'Pressboard barriers', optionC: 'Yoke sections', optionD: 'Air gaps', correctOption: 'C' },

    // Tanking
    { section: 'tanking', text: 'What is the primary purpose of transformer oil in a power transformer?', optionA: 'Only for cooling', optionB: 'Only for insulation', optionC: 'Both insulation and cooling', optionD: 'Mechanical support', correctOption: 'C' },
    { section: 'tanking', text: 'Before oil filling, the transformer tank should be:', optionA: 'Painted on the inside', optionB: 'Vacuum dried and leak tested', optionC: 'Heated to 200°C', optionD: 'Filled with nitrogen gas', correctOption: 'B' },
    { section: 'tanking', text: 'What level of vacuum is typically applied during oil impregnation?', optionA: 'Above 500 mbar', optionB: 'Between 0.1 and 1 mbar', optionC: 'Exactly 100 mbar', optionD: 'No vacuum is needed', correctOption: 'B' },
    { section: 'tanking', text: 'Which device is fitted on the transformer tank to relieve sudden pressure surges?', optionA: 'Buchholz relay', optionB: 'Pressure relief device (PRD)', optionC: 'Winding temperature indicator', optionD: 'Oil level gauge', correctOption: 'B' },
    { section: 'tanking', text: 'What test is performed immediately after oil filling to check tank integrity?', optionA: 'No-load loss test', optionB: 'Impulse test', optionC: 'Pressure leak test', optionD: 'Dielectric strength test', correctOption: 'C' }
];

const insert = db.prepare(`
    INSERT OR IGNORE INTO exam_questions (id, section, text, optionA, optionB, optionC, optionD, correctOption, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((qs) => {
    for (const q of qs) {
        insert.run(Date.now().toString() + Math.random().toString().slice(2, 6), q.section, q.text, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, 'seed');
    }
});

insertMany(questions);

const counts = db.prepare('SELECT section, COUNT(*) as cnt FROM exam_questions GROUP BY section').all();
console.log('✅ Questions seeded:');
counts.forEach(r => console.log(`   ${r.section}: ${r.cnt} questions`));
process.exit(0);
