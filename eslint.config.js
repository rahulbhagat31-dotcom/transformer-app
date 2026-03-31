const js = require('@eslint/js');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
    {
        ignores: [
            '**/node_modules/**',
            '**/backups/**',
            '**/logs/**',
            // Calculation engine: large computation modules remain excluded.
            // core/ (5 files) is now linted — lift modules incrementally later.
            'public/js/calculation-engine/modules/**',
            'public/js/calculation-engine/index.js',
            'public/js/calculation-engine/orchestrator.js'
        ]
    },

    // Backend (Node / CommonJS)
    {
        files: [
            '**/*.js'
        ],
        ignores: [
            'public/**/*.js'
        ],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                Buffer: 'readonly',
                fetch: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly'
            }
        },
        rules: {
            indent: ['error', 4],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'no-undef': 'error',
            'no-redeclare': 'error',
            'no-unreachable': 'error',
            'no-constant-condition': 'warn',
            'prefer-const': 'warn',
            'no-var': 'warn',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'brace-style': ['error', '1tbs'],
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 2 }],
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ]
        }
    },

    // Frontend (browser, non-module scripts)
    {
        files: [
            'public/**/*.js'
        ],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                location: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                URLSearchParams: 'readonly',
                alert: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly'
            }
        },
        rules: {
            indent: ['error', 4],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 2 }]
        }
    }
    ,

    // Tests (allow common test globals + browser-y globals)
    {
        files: [
            'tests/**/*.js'
        ],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                window: 'readonly',
                TransformerCalculator: 'readonly'
            }
        }
    }
];
