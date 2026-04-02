const fs = require('fs');

// P3.1: Remove _legacy_loadQuestions and _legacy_switchQTab
const filesToClean = [
    'c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/ui.js',
    'c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/checklist-ui.js'
];

for (const file of filesToClean) {
    if (fs.existsSync(file)) {
        let txt = fs.readFileSync(file, 'utf8');

        // Very basic cleaner: since these functions are at the END of the files (they were in ui.js),
        // we can just cut the file where `function _legacy_switchQTab` appears.
        // Actually, they are in the middle of ui.js.
        // I will use regex to remove the blocks.
        // The block starts with "/* ===============================" for MCQ EXAM SYSTEM
        // Let's just find that block and remove it.
        const blockStart = txt.indexOf('/* ===============================\n   MCQ EXAM SYSTEM — Frontend Logic');
        if (blockStart !== -1) {
            // Find the end by looking for "// Export" or end of file
            const exportStart = txt.indexOf('// Export', blockStart);
            if (exportStart !== -1) {
                txt = txt.substring(0, blockStart) + txt.substring(exportStart);
            }
        }

        // Remove exports
        txt = txt.replace(/\/\/ window\.loadQuestions = loadQuestions;/g, '');
        txt = txt.replace(/\/\/ window\.switchQTab = switchQTab;/g, '');
        txt = txt.replace(/window\.startExamSection = startExamSection;/g, '');
        txt = txt.replace(/window\.beginExam = beginExam;/g, '');
        txt = txt.replace(/window\.submitExam = submitExam;/g, '');
        txt = txt.replace(/window\.selectExamOption = selectExamOption;/g, '');
        txt = txt.replace(/window\.examGoNext = examGoNext;/g, '');
        txt = txt.replace(/window\.showExamAdmin = showExamAdmin;/g, '');
        txt = txt.replace(/window\.showExamResults = showExamResults;/g, '');
        txt = txt.replace(/window\.submitNewQuestion = submitNewQuestion;/g, '');
        txt = txt.replace(/window\.deleteExamQuestion = deleteExamQuestion;/g, '');

        fs.writeFileSync(file, txt);
    }
}

// P4.1 & P4.2: Fix routes/questions.routes.js
const routeFile = 'c:/Users/Hina/OneDrive/Desktop/transformer/routes/questions.routes.js';
if (fs.existsSync(routeFile)) {
    let rTxt = fs.readFileSync(routeFile, 'utf8');
    rTxt = rTxt.replace(/Invalid section\. Must be winding, core or tanking/g, 'Invalid section');
    rTxt = rTxt.replace(/const EXAM_SIZE = 3;/g, 'const EXAM_SIZE = 20;');
    fs.writeFileSync(routeFile, rTxt);
}

// Update index.html line that says 20-question, change it to generic or leave it because EXAM_SIZE is 20 now.

console.log('Kluster P3.1, P4.1, P4.2 fixes applied!');
