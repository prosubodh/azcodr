import type { CliParsedOptions, CliCommand } from './cli-parse.js';
export interface ScriptIo {
    out?: (msg: string) => void;
    err?: (msg: string) => void;
    exit?: (code: number) => void | number;
    cwd?: string;
    spawn?: (file: string, args: string[], options: {
        cwd: string;
        shell: false;
        stdio: any;
    }) => {
        status: number | null;
        error?: Error;
    };
}
export declare const SCRIPT_COMMANDS: Set<CliCommand>;
export declare function isScriptCommand(cmd: CliCommand): boolean;
export declare function handleScriptCommand(parsed: CliParsedOptions, io: ScriptIo): void | number;
declare const _default: {
    isScriptCommand: typeof isScriptCommand;
    handleScriptCommand: typeof handleScriptCommand;
};
export default _default;
//# sourceMappingURL=cli-scripts.d.ts.map