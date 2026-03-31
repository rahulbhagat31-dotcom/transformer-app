const requiredVars = [
    'NODE_ENV',
    'DB_PATH',
    'JWT_SECRET'
];

console.log('='.repeat(60));
console.log('PRODUCTION ENVIRONMENT VERIFICATION');
console.log('='.repeat(60));
console.log('');

let allPresent = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    const present = !!value;
    const masked = varName === 'JWT_SECRET' && value
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : value;

    console.log(`  ${varName}: ${present ? '✓' : '✗'} ${masked || 'NOT SET'}`);

    if (!present) {
        allPresent = false;
    }
});

console.log('');

// Additional checks
console.log('ADDITIONAL CHECKS:');
console.log(`  NODE_ENV === 'production': ${process.env.NODE_ENV === 'production' ? '✓' : '✗'}`);
console.log(`  JWT_SECRET length >= 32: ${process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32 ? '✓' : '✗'}`);
console.log('');

console.log('='.repeat(60));
console.log(`Status: ${allPresent && process.env.NODE_ENV === 'production' ? 'READY ✓' : 'NOT READY ✗'}`);
console.log('='.repeat(60));

if (!allPresent || process.env.NODE_ENV !== 'production') {
    process.exit(1);
}
