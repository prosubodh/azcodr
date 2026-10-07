'use strict';

/**
 * Machine-readable failure codes.
 *
 * Consumers branch on `err.code`, never on message text: a wording change must
 * never be a breaking change (learned from typed-settings, where `docs/errors.md`
 * explicitly tells users not to regex the message). Pinned by
 * tests/error-codes.test.js.
 */
const ERROR_CODES = {
  E_TARGET_IS_TEMPLATE: 'Cannot scaffold into the azcodr template directory itself',
  E_TARGET_NOT_EMPTY: 'Target directory is not empty',
  E_TARGET_IS_PROTECTED: 'Refusing to scaffold into a protected system directory',
  E_GIT_ARGS_INVALID: 'runGit requires a non-empty argv array',
  E_GIT_BLOCKED: 'Blocked git subcommand',
  E_PATH_ESCAPE: 'Path escapes allowed root'
};

class ScaffoldError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ScaffoldError';
    this.code = code;
  }
}

module.exports = { ERROR_CODES, ScaffoldError };
