const fs = require('fs');
const htmlSource = 'D:/New folder/backup project/Transformer Mcq/transformer/public/index.html';
const txt = fs.readFileSync(htmlSource, 'utf8');
const lines = txt.split('\n');
let start = -1;
let end = -1;
for(let i=0; i<lines.length; i++){
    if(lines[i].includes('id="questions"')) {
        start = i;
    }
    if(start > -1 && lines[i].includes('</section>') && i > start) {
        end = i;
        break;
    }
}
if(start > -1) {
    fs.writeFileSync('c:/Users/Hina/OneDrive/Desktop/transformer/mcq_html.txt', lines.slice(start, end+1).join('\n'));
} else {
    console.log('Section not found');
}
