/**
 * Argument parsing for the azcodr CLI.
 *
 * Table-driven: every boolean flag is one Map entry, so adding a flag cannot
 * raise the complexity of the parser itself.
 */
export interface CliParsedOptions {
    targetDir: string | null;
    force: boolean;
    noGit: boolean;
    dryRun: boolean;
    silent: boolean;
    terminal: 'help' | 'version' | 'unknown-flag' | 'extra-arg' | null;
    message?: string;
}
export type BooleanFlagKey = 'force' | 'noGit' | 'dryRun' | 'silent';
export declare function emptyOptions(): Omit<CliParsedOptions, 'terminal' | 'message'>;
export declare const BOOLEAN_FLAGS: Map<string, BooleanFlagKey>;
export interface ArgOutcome {
    terminal: 'help' | 'version' | 'unknown-flag' | 'extra-arg' | null;
    message?: string;
}
export declare function applyArg(state: Omit<CliParsedOptions, 'terminal' | 'message'>, arg: string): ArgOutcome;
export declare function parseArgs(rawArgs: readonly string[]): CliParsedOptions;
declare const _default: {
    emptyOptions: typeof emptyOptions;
    BOOLEAN_FLAGS: Map<string, BooleanFlagKey>;
    applyArg: typeof applyArg;
    parseArgs: typeof parseArgs;
};
export default _default;
//# sourceMappingURL=cli-parse.d.ts.map