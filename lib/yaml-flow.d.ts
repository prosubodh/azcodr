/**
 * Low-level scalar and flow-collection parsing for the supported YAML subset.
 *
 * Kept separate from the block-structure parser so both stay small. Every
 * construct outside the supported subset raises YamlSubsetError rather than
 * being silently coerced, because a misparsed config is worse than no config.
 */
/**
 * Error raised when input falls outside the supported YAML subset.
 * Carries the 1-based source line so callers can point the user at it.
 */
export declare class YamlSubsetError extends Error {
    /** 1-based line number in the source document that triggered the failure. */
    readonly line: number;
    constructor(message: string, line: number);
}
/**
 * Converts a plain scalar token into its typed value.
 *
 * Recognises quoted strings, booleans, nulls and numbers; everything else is
 * returned verbatim as a string.
 */
export declare function coerceScalar(token: string, line: number): unknown;
/**
 * Result of a flow-collection parse: the value plus the unconsumed remainder.
 */
export interface FlowResult {
    /** The parsed collection or scalar. */
    value: unknown;
    /** Input text remaining after the closing delimiter. */
    rest: string;
}
/**
 * Parses an inline flow collection (`[a, b]`, `{x: 1}`, or a bare scalar).
 *
 * @param input - Text beginning at the value to parse.
 * @param line - Source line number reported on failure.
 * @returns The parsed value and any unconsumed trailing text.
 */
export declare function parseFlow(input: string, line: number): FlowResult;
//# sourceMappingURL=yaml-flow.d.ts.map