/**
 * Machine-readable failure codes.
 *
 * Consumers branch on `err.code`, never on message text: a wording change must
 * never be a breaking change (learned from typed-settings, where `docs/errors.md`
 * explicitly tells users not to regex the message). Pinned by
 * tests/error-codes.test.js.
 */
export const ERROR_CODES = {
  /** Target directory matches template repository root itself. */
  E_TARGET_IS_TEMPLATE: 'Cannot scaffold into the azcodr template directory itself',
  /** Target directory exists and already contains non-empty files without --force. */
  E_TARGET_NOT_EMPTY: 'Target directory is not empty',
  /** Target path matches protected system, home, or root directory. */
  E_TARGET_IS_PROTECTED: 'Refusing to scaffold into a protected system directory',
  /** runGit invoked with empty or missing argument array. */
  E_GIT_ARGS_INVALID: 'runGit requires a non-empty argv array',
  /** Attempted git subcommand not in the explicit allowlist. */
  E_GIT_BLOCKED: 'Blocked git subcommand',
  /** Relative path navigation escapes allowed root directory. */
  E_PATH_ESCAPE: 'Path escapes allowed root'
} as const;

/**
 * Union of valid machine-readable error codes for scaffolding failures.
 */
export type ScaffoldErrorCode = keyof typeof ERROR_CODES;

/**
 * Structural interface contract for errors thrown by the scaffolder.
 */
export interface ScaffoldErrorShape extends Error {
  /** Error class discriminator name. */
  name: 'ScaffoldError';
  /** Machine-readable error code. */
  code: ScaffoldErrorCode;
}

/**
 * Custom error class thrown by scaffolding operations, carrying a machine-readable code.
 */
export class ScaffoldError extends Error implements ScaffoldErrorShape {
  /** Error class name identifier. */
  override readonly name: 'ScaffoldError' = 'ScaffoldError';
  /** Machine-readable error code identifying failure cause. */
  readonly code: ScaffoldErrorCode;

  /**
   * Constructs a new ScaffoldError instance.
   *
   * @param code - Machine-readable error code.
   * @param message - Human-readable explanation of the error.
   */
  constructor(code: ScaffoldErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export default { ERROR_CODES, ScaffoldError };
