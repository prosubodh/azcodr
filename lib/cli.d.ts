import type { ScaffoldOptions, ScaffoldResult } from './scaffold.js';
import { askQuestion } from './cli-target.js';
export declare function printHelp(out?: (msg: string) => void): void;
export declare function printVersion(out?: (msg: string) => void): void;
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
}
export declare function runCli(rawArgs?: string[], io?: CliIo): Promise<void | number>;
export declare function main(): Promise<void>;
export { askQuestion };
declare const _default: {
    runCli: typeof runCli;
    main: typeof main;
    printHelp: typeof printHelp;
    printVersion: typeof printVersion;
    askQuestion: typeof askQuestion;
};
export default _default;
//# sourceMappingURL=cli.d.ts.map