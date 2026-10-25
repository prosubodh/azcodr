/**
 * Error raised when a configuration file exists but cannot be used.
 */
export class HarnessConfigError extends Error {
    /** 1-based line number of the offending content, or 0 when not line-specific. */
    line;
    constructor(message, line = 0) {
        super(message);
        this.name = 'HarnessConfigError';
        this.line = line;
    }
}
export default { HarnessConfigError };
//# sourceMappingURL=harness-error.js.map