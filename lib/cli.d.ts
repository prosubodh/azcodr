import type { ScaffoldOptions, ScaffoldResult } from './scaffold.js';
import { printHelp, printVersion } from './cli-help.js';
import type { CliParsedOptions } from './cli-parse.js';
import { askQuestion } from './cli-target.js';
export interface CliIo {
    out?: (msg: string) => void;
    err?: (msg: string) => void;
    exit?: (code: number) => void | number;
    stdin?: NodeJS.ReadableStream & {
        isTTY?: boolean;
    };
    stdout?: NodeJS.WritableStream;
    cwd?: string;
    templateDir?: string;
    scaffold?: (options?: ScaffoldOptions) => ScaffoldResult;
    validate?: (workspaceRoot: string, reporter?: any) => {
        errors: number;
        warnings: number;
    } | Promise<{
        errors: number;
        warnings: number;
    }>;
    boundaries?: (parsed: CliParsedOptions, io: any) => Promise<void | number>;
    prompt?: (parsed: CliParsedOptions, io: any) => void | number;
    add?: (parsed: CliParsedOptions, io: any) => void | number;
    script?: (parsed: CliParsedOptions, io: any) => void | number;
}
export interface NormalizedCliIo {
    out: (msg: string) => void;
    err: (msg: string) => void;
    exit: (code: number) => void | number;
    stdin: NodeJS.ReadableStream & {
        isTTY?: boolean;
    };
    stdout: NodeJS.WritableStream;
    cwd: string;
    templateDir: string;
    scaffoldFn: (options?: ScaffoldOptions) => ScaffoldResult;
    validateFn: (workspaceRoot: string, reporter?: any) => {
        errors: number;
        warnings: number;
    } | Promise<{
        errors: number;
        warnings: number;
    }>;
    boundariesFn: (parsed: CliParsedOptions, io: any) => Promise<void | number>;
    promptFn: (parsed: CliParsedOptions, io: any) => void | number;
    addFn: (parsed: CliParsedOptions, io: any) => void | number;
    scriptFn: (parsed: CliParsedOptions, io: any) => void | number;
}
export declare function runCli(rawArgs?: string[], io?: CliIo): Promise<void | number>;
export declare function main(): Promise<void>;
export { printHelp, printVersion, askQuestion };
declare const _default: {
    runCli: typeof runCli;
    main: typeof main;
    printHelp: typeof printHelp;
    printVersion: typeof printVersion;
    askQuestion: typeof askQuestion;
};
export default _default;
//# sourceMappingURL=cli.d.ts.map