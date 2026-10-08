import type { BoundaryReport } from './boundaries.js';
import type { CliParsedOptions } from './cli-parse.js';
export interface BoundaryIo {
    out: (msg: string) => void;
    err: (msg: string) => void;
    exit: (code: number) => void | number;
    cwd: string;
}
export declare function resolveBoundaryTarget(targetDir: string | null, cwd: string): string;
export declare function formatBoundaryReport(targetDir: string, report: BoundaryReport, out: (msg: string) => void): void;
export declare function handleBoundariesCommand(parsed: CliParsedOptions, io: BoundaryIo): Promise<void | number>;
declare const _default: {
    resolveBoundaryTarget: typeof resolveBoundaryTarget;
    formatBoundaryReport: typeof formatBoundaryReport;
    handleBoundariesCommand: typeof handleBoundariesCommand;
};
export default _default;
//# sourceMappingURL=cli-boundaries.d.ts.map