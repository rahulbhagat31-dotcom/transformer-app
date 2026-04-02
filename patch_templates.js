const fs = require('fs');

const f = 'c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/questions-module.js';
let c = fs.readFileSync(f, 'utf8');

// The file is currently not an ES module. I will just prepend the templates instead of importing to avoid ES module errors.
const templates = fs.readFileSync('c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/questions-templates.js', 'utf8')
                    .replace(/export const/g, 'const');

c = templates + '\n\n' + c;

// Replace container.innerHTML = `<div style="max-width:640px... </div>`;
const p1Start = c.indexOf('<div style="max-width:640px;margin:0 auto;">');
if (p1Start !== -1) {
    const p1End = c.indexOf('</div>`;', p1Start) + 8;
    
    // Instead of replacing the whole block with regex which might fail,
    // I can just replace the variable building part.
    // Actually, I can just leave standard JS replacement.
   const blockToReplace = c.substring(p1Start - 1, p1End);
   c = c.replace(blockToReplace, 'sectionsTemplate(sections, ICONS.map(ic => `<button onclick="document.getElementById(\\'newSectIcon\\').value=\\'${ic}\\';this.parentElement.querySelectorAll(\\'button\\').forEach(b=>b.style.outline=\\'none\\');this.style.outline=\\'2px solid #3b82f6\\';" style="width:36px;height:36px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:18px;background:#fff;cursor:pointer;">${ic}</button>`).join(\'\'), COLORS.map(c => `<button onclick="document.getElementById(\\'newSectColor\\').value=\\'${c.hex}\\';this.parentElement.querySelectorAll(\\'button\\').forEach(b=>b.style.outline=\\'none\\');this.style.outline=\\'2px solid #1e293b\\';" title="${c.name}" style="width:32px;height:32px;border-radius:50%;background:${c.hex};border:2px solid rgba(0,0,0,0.1);cursor:pointer;"></button>`).join(\'\'));');
}

const p2Start = c.indexOf('<div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 300px;gap:24px;">');
if (p2Start !== -1) {
    const p2End = c.indexOf('</div>`;', p2Start) + 8;
    const blockToReplace = c.substring(p2Start - 1, p2End);
    c = c.replace(blockToReplace, 'examLinksTemplate(sectionsHtml, \'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ChooseSection\', linkListHtml, \'(IP placeholder)\');');
}

fs.writeFileSync(f, c);
console.log('Templates applied successfully');
