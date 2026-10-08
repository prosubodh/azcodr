import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
/**
 * Validates the agentic architecture and governance files of a workspace.
 *
 * @param workspaceRoot - Path to the workspace directory (defaults to cwd).
 * @param reporter - Optional custom reporter hooks.
 * @returns Object containing error and warning tallies and validation counts.
 */
export async function validate(workspaceRoot = process.cwd(), reporter) {
    const baseDir = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
    const scriptPath = path.resolve(baseDir, '../scripts/validate.js');
    const mod = await import(pathToFileURL(scriptPath).href);
    return mod.runValidation(path.resolve(workspaceRoot), reporter);
}
const noop = () => { };
/**
 * Creates a silent reporter that suppresses all status reports.
 */
export function createSilentReporter() {
    return { pass: noop, warn: noop, fail: noop, log: noop, heading: noop };
}
export default { validate, createSilentReporter };
//# sourceMappingURL=validate.js.map