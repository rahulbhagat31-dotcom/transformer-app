const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const targetFile = path.join(baseDir, 'public', 'js', 'features', 'questions-module.js');
const templatesFile = path.join(baseDir, 'public', 'js', 'features', 'questions-templates.js');

let content = fs.readFileSync(targetFile, 'utf8');
const templates = fs
    .readFileSync(templatesFile, 'utf8')
    .replace(/export const/g, 'const');

content = `${templates}

${content}`;

const p1Start = content.indexOf('<div style="max-width:640px;margin:0 auto;">');
if (p1Start !== -1) {
    const p1End = content.indexOf('</div>`;', p1Start);
    if (p1End !== -1) {
        const blockToReplace = content.substring(p1Start, p1End + 7);
        content = content.replace(blockToReplace, 'sectionsTemplate(sections, ICONS, COLORS);');
    }
}

const p2Start = content.indexOf(
    '<div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 300px;gap:24px;">'
);
if (p2Start !== -1) {
    const p2End = content.indexOf('</div>`;', p2Start);
    if (p2End !== -1) {
        const blockToReplace = content.substring(p2Start, p2End + 7);
        content = content.replace(blockToReplace, 'examLinksTemplate(sectionsHtml, linkListHtml);');
    }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Templates applied successfully');
