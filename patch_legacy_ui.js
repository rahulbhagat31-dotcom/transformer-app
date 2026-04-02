const fs = require('fs');

const filesToPatch = [
    'c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/ui.js',
    'c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/checklist-ui.js'
];

for (const file of filesToPatch) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/function loadQuestions\b/g, 'function _legacy_loadQuestions');
        content = content.replace(/window\.loadQuestions = loadQuestions;/g, '// window.loadQuestions = loadQuestions;');
        content = content.replace(/function switchQTab\b/g, 'function _legacy_switchQTab');
        content = content.replace(/window\.switchQTab = switchQTab;/g, '// window.switchQTab = switchQTab;');
        fs.writeFileSync(file, content);
    }
}
console.log('Successfully patched legacy UI files to remove conflicts!');
