const fs = require('fs');

const currentHtmlSource = 'c:/Users/Hina/OneDrive/Desktop/transformer/public/index.html';
const currentHtmlTxt = fs.readFileSync(currentHtmlSource, 'utf8');
const lines1 = currentHtmlTxt.split('\n');
let start1 = -1; let end1 = -1;
for(let i=0; i<lines1.length; i++){
    if(lines1[i].includes('id="questions"')) {
        start1 = i;
    }
    if(start1 > -1 && lines1[i].includes('</section>') && i > start1) {
        end1 = i; break;
    }
}
if(start1 > -1) {
    fs.writeFileSync('c:/Users/Hina/OneDrive/Desktop/transformer/current_mcq_html.txt', lines1.slice(start1, end1+1).join('\n'));
}

const backupUiSource = 'D:/New folder/backup project/Transformer Mcq/transformer/public/js/ui.js';
const backupUiTxt = fs.readFileSync(backupUiSource, 'utf8');
const questionsMethods = backupUiTxt.split('\n').filter(l => /function\s+(loadQuestions|addQuestion|deleteQuestion|editQuestion|switchQTab|loadExamResults|generateExamLink|toggleQR|submitEditQuestion|closeEditQuestionModal|openAnswerKey|closeAnswerKey)/.test(l));
fs.writeFileSync('c:/Users/Hina/OneDrive/Desktop/transformer/backup_ui_methods.txt', questionsMethods.join('\n'));
