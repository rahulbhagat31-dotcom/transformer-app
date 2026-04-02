const fs = require('fs');

const currentHtmlPath = 'c:/Users/Hina/OneDrive/Desktop/transformer/public/index.html';
const currentHtml = fs.readFileSync(currentHtmlPath, 'utf8');

// 1. Extract the questions section from the backup html
const backupHtmlPath = 'D:/New folder/backup project/Transformer Mcq/transformer/public/index.html';
const backupHtml = fs.readFileSync(backupHtmlPath, 'utf8');

const backupStart = backupHtml.indexOf('<section id="questions"');
const backupEnd = backupHtml.indexOf('</section>', backupStart) + 10;
const targetSection = backupHtml.substring(backupStart, backupEnd);

// 2. Extract and replace in the current html
const curStart = currentHtml.indexOf('<section id="questions"');
const curEnd = currentHtml.indexOf('</section>', curStart) + 10;

let newHtml = currentHtml.substring(0, curStart) + targetSection + currentHtml.substring(curEnd);

// 3. Replace <script src="/js/features/exam.js"> with <script src="/js/features/questions-module.js">
newHtml = newHtml.replace('<script defer src="/js/features/exam.js"></script>', '<script defer src="/js/features/questions-module.js"></script>');

fs.writeFileSync(currentHtmlPath, newHtml);
console.log('Successfully replaced questions section in index.html and injected script!');
