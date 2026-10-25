import { findSourceFiles } from './boundaries.js';
import type { BoundaryReport, BoundaryRule } from './boundaries.js';
import type { CliParsedOptions } from './cli-parse.js';
export { findSourceFiles };
export interface BoundaryIo {
    out: (msg: string) => void;
    err: (msg: string) => void;
    exit: (code: number) => void | number;
    cwd: string;
}
export declare function resolveBoundaryTarget(targetDir: string | null, cwd: string): string;
/**
 * Converts declared layer rules into boundary-engine rules.
 *
 * Layer rules live in the project's configuration, so a run with no config
 * performs cycle detection only and never invents a layer vocabulary.
 */
export declare function declaredLayerRules(root: string): BoundaryRule[];
export declare function formatBoundaryReport(targetDir: string, report: BoundaryReport, out: (msg: string) => void): void;
export declare function handleBoundariesCommand(parsed: CliParsedOptions, io: BoundaryIo): Promise<void | number>;
declare const _default: {
    resolveBoundaryTarget: typeof resolveBoundaryTarget;
    formatBoundaryReport: typeof formatBoundaryReport;
    handleBoundariesCommand: typeof handleBoundariesCommand;
};
export default _default;
//# sourceMappingURL=cli-boundaries.d.ts.map