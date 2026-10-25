/**
 * Error raised when a configuration file exists but cannot be used.
 */
export class HarnessConfigError extends Error {
  /** 1-based line number of the offending content, or 0 when not line-specific. */
  public readonly line: number;

  constructor(message: string, line = 0) {
    super(message);
    this.name = 'HarnessConfigError';
    this.line = line;
  }
}

export default { HarnessConfigError };
