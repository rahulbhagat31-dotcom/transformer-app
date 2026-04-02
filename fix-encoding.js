const fs = require('fs');
const path = require('path');

const replacements = [
    { search: /âœ•/g, replace: '✖' },
    { search: /â€”/g, replace: '—' },
    { search: /â€“/g, replace: '–' },
    { search: /â€¦/g, replace: '…' },
    { search: /Ãƒâ€šÃ‚&deg;/g, replace: '°' },
    { search: /ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â /g, replace: '-' },
    { search: /âœ…/g, replace: '✅' },
    { search: /âš /g, replace: '⚠️' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;

            for (const { search, replace } of replacements) {
                content = content.replace(search, replace);
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

// target public folder
const publicDir = path.join(__dirname, 'public');
processDirectory(publicDir);

console.log('✅ Encoding fixes complete');
