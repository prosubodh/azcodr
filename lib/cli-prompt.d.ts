import type { CliParsedOptions } from './cli-parse.js';
export interface PromptIo {
    out: (msg: string) => void;
    err: (msg: string) => void;
    exit: (code: number) => void | number;
    cwd: string;
}
export declare function handlePromptCommand(parsed: CliParsedOptions, io: PromptIo): void | number;
declare const _default: {
    handlePromptCommand: typeof handlePromptCommand;
};
export default _default;
//# sourceMappingURL=cli-prompt.d.ts.map