/**
 * Machine-readable failure codes.
 *
 * Consumers branch on `err.code`, never on message text: a wording change must
 * never be a breaking change (learned from typed-settings, where `docs/errors.md`
 * explicitly tells users not to regex the message). Pinned by
 * tests/error-codes.test.js.
 */
export const ERROR_CODES = {
  E_TARGET_IS_TEMPLATE: 'Cannot scaffold into the azcodr template directory itself',
  E_TARGET_NOT_EMPTY: 'Target directory is not empty',
  E_TARGET_IS_PROTECTED: 'Refusing to scaffold into a protected system directory',
  E_GIT_ARGS_INVALID: 'runGit requires a non-empty argv array',
  E_GIT_BLOCKED: 'Blocked git subcommand',
  E_PATH_ESCAPE: 'Path escapes allowed root'
} as const;

export type ScaffoldErrorCode = keyof typeof ERROR_CODES;

export interface ScaffoldErrorShape extends Error {
  name: 'ScaffoldError';
  code: ScaffoldErrorCode;
}

export class ScaffoldError extends Error implements ScaffoldErrorShape {
  override readonly name: 'ScaffoldError' = 'ScaffoldError';
  readonly code: ScaffoldErrorCode;

  constructor(code: ScaffoldErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export default { ERROR_CODES, ScaffoldError };
