/**
 * ESLint flat config for this repository.
 *
 * These thresholds are azcodr's own engineering choice, declared here rather
 * than imposed on consuming projects. Nothing in the toolkit ships them.
 *
 *   max-lines ............. Maximum lines per file (300).
 *   max-lines-per-function  Maximum lines per function (30).
 *   complexity ............ Maximum 10 per function.
 *   max-params ............ Limit function arguments to 3 or fewer.
 *
 * Blank lines are skipped; comments count toward the limit, because long files
 * dilute agent attention regardless of how many of those lines are blank.
 *
 * Dependency-direction gates live in tests/architecture.test.ts instead: they
 * need no ESLint plugin and therefore add no supply-chain surface.
 */

export default [
  {
    ignores: ['coverage/**', 'scratch/**', '.agents/**', '**/*.d.ts']
  },
  {
    // Authored TypeScript source under src/** is verified by typecheck; runnable JavaScript is linted here:
    files: ['bin/**/*.js', 'lib/**/*.js', 'tests/**/*.test.js', 'eslint.config.js'],
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
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: false }],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: false }],
      complexity: ['error', 10],
      'max-params': ['error', 3],
      'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }],
      'no-undef': 'error'
    }
  },
  {
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
    }
  }
];
