import type { ValidationContext } from './types.js';
/**
 * Linter gate files each language profile is expected to carry.
 *
 * This is a presence check, not an opinion about which linter to use: a
 * project declares its own tooling in harness.yaml. The map exists so a
 * bootstrapped workspace is not silently missing its gate.
 */
export declare const TOOLCHAIN_FILES: Readonly<Record<string, readonly string[]>>;
/**
 * Reads the language recorded by the workspace bootstrapper.
 *
 * @param workspaceRoot - Workspace to inspect.
 * @returns The declared language, or null when no profile exists.
 */
export declare function readProfileLanguage(workspaceRoot: string): string | null;
/**
 * Gate files expected for a language.
 *
 * @param language - Declared language, or null.
 * @returns The expected file names, empty when nothing is expected.
 */
export declare function expectedToolchainFiles(language: string | null | undefined): readonly string[];
/**
 * Reports toolchain gates declared by a workspace profile but absent on disk.
 *
 * @param ctx - Validation context.
 */
export declare function phaseToolchain(ctx: ValidationContext): void;
//# sourceMappingURL=toolchain.d.ts.map