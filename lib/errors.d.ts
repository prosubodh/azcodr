/**
 * Machine-readable failure codes.
 *
 * Consumers branch on `err.code`, never on message text: a wording change must
 * never be a breaking change (learned from typed-settings, where `docs/errors.md`
 * explicitly tells users not to regex the message). Pinned by
 * tests/error-codes.test.js.
 */
export declare const ERROR_CODES: {
    readonly E_TARGET_IS_TEMPLATE: "Cannot scaffold into the azcodr template directory itself";
    readonly E_TARGET_NOT_EMPTY: "Target directory is not empty";
    readonly E_TARGET_IS_PROTECTED: "Refusing to scaffold into a protected system directory";
    readonly E_GIT_ARGS_INVALID: "runGit requires a non-empty argv array";
    readonly E_GIT_BLOCKED: "Blocked git subcommand";
    readonly E_PATH_ESCAPE: "Path escapes allowed root";
};
export type ScaffoldErrorCode = keyof typeof ERROR_CODES;
export interface ScaffoldErrorShape extends Error {
    name: 'ScaffoldError';
    code: ScaffoldErrorCode;
}
export declare class ScaffoldError extends Error implements ScaffoldErrorShape {
    readonly name: 'ScaffoldError';
    readonly code: ScaffoldErrorCode;
    constructor(code: ScaffoldErrorCode, message: string);
}
declare const _default: {
    ERROR_CODES: {
        readonly E_TARGET_IS_TEMPLATE: "Cannot scaffold into the azcodr template directory itself";
        readonly E_TARGET_NOT_EMPTY: "Target directory is not empty";
        readonly E_TARGET_IS_PROTECTED: "Refusing to scaffold into a protected system directory";
        readonly E_GIT_ARGS_INVALID: "runGit requires a non-empty argv array";
        readonly E_GIT_BLOCKED: "Blocked git subcommand";
        readonly E_PATH_ESCAPE: "Path escapes allowed root";
    };
    ScaffoldError: typeof ScaffoldError;
};
export default _default;
//# sourceMappingURL=errors.d.ts.map