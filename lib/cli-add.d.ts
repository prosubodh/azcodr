import type { CliParsedOptions } from './cli-parse.js';
export interface AddIo {
    out: (msg: string) => void;
    err: (msg: string) => void;
    exit: (code: number) => void | number;
    cwd: string;
}
export declare function handleAddCommand(parsed: CliParsedOptions, io: AddIo): void | number;
declare const _default: {
    handleAddCommand: typeof handleAddCommand;
};
export default _default;
//# sourceMappingURL=cli-add.d.ts.map