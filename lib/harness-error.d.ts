/**
 * Error raised when a configuration file exists but cannot be used.
 */
export declare class HarnessConfigError extends Error {
    /** 1-based line number of the offending content, or 0 when not line-specific. */
    readonly line: number;
    constructor(message: string, line?: number);
}
declare const _default: {
    HarnessConfigError: typeof HarnessConfigError;
};
export default _default;
//# sourceMappingURL=harness-error.d.ts.map