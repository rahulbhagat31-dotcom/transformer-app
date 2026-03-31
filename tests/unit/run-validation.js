global.TransformerCalculator = require('./index.js');
global.window = {
    TransformerCalculator: global.TransformerCalculator
};

require('./validation.test.js');

if (!window.ValidationTest || typeof window.ValidationTest.run !== 'function') {
    console.error('Validation test runner was not initialized.');
    process.exit(1);
}

const result = window.ValidationTest.run();

if (!result || !result.allPassed) {
    process.exit(1);
}
