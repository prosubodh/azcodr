/**
 * ESLint flat config: the executable form of docs/rules/clean_code.md section 5.
 *
 * Every rule here traces to a documented fitness function, and the build fails
 * when any of them is violated ("If an AI attempt to add code violates any
 * fitness function, the build fails immediately." -- clean_code.md):
 *
 *   max-lines ............. Maximum 250-300 lines per file (gate: 300).
 *   max-lines-per-function  Maximum 20-30 lines per function (gate: 30).
 *   complexity ............ Maximum 10 per function.
 *   max-params ............ Limit function arguments to 3 or fewer.
 *
 * Blank lines are skipped (they are not complexity); comments count toward the
 * limit (they are token-economy load, which is what the file cap protects).
 *
 * Dependency-direction gates (import/no-restricted-paths, dependency-cruiser
 * equivalents) are enforced by tests/architecture.test.js instead: the zero
 * runtime dependency invariant and the shell-free process boundary are
 * asserted as tests, which need no ESLint plugins and therefore no extra
 * supply-chain surface.
 */

export default [
  {
    ignores: ['coverage/**', 'scratch/**']
  },
  {
    files: ['bin/**/*.js', 'lib/**/*.js', 'scripts/**/*.js', 'tests/**/*.test.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly'
      }
    },
    rules: {
      // clean_code.md section 5 fitness functions (build-failing).
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: false }],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: false }],
      complexity: ['error', 10],
      'max-params': ['error', 3],
      // Hygiene: an unused variable or an undefined global is always a defect.
      'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }],
      'no-undef': 'error'
    }
  },
  {
    // Test files assert behaviour; a 600-line test file is the same rot as a
    // 600-line source file, so the same file cap applies. Function-level caps
    // apply unchanged: a test callback over 30 lines is two tests.
    files: ['tests/**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    rules: {}
  }
];
