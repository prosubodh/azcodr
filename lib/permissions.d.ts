/**
 * Ensures all bash scripts in agent and skill directories have executable permissions (0o755).
 *
 * @param targetDir - Root directory containing .agents and skills.
 * @param dryRun - When true, simulates permission changes without modifying disk.
 * @returns Array of file paths that were modified or would be modified.
 */
export declare function makeScriptsExecutable(targetDir: string, dryRun?: boolean): string[];
declare const _default: {
    makeScriptsExecutable: typeof makeScriptsExecutable;
};
export default _default;
//# sourceMappingURL=permissions.d.ts.map