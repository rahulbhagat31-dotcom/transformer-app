const fs = require('fs');
const txt = fs.readFileSync('D:/New folder/backup project/Transformer Mcq/transformer/public/js/ui.js', 'utf8');

let out = `/* ===============================
   MCQ EXAM SYSTEM — Imported Frontend Logic
================================ */

let _allQuestions = [];
let _currentQFilter = 'all';

`;

const qStart = txt.indexOf('function switchQTab');
out += txt.substring(qStart);

fs.writeFileSync('c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/questions-module.js', out);
console.log('Successfully copied questions-module.js');
