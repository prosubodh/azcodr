import fs from 'node:fs';
import path from 'node:path';
/**
 * Linter gate files each language profile is expected to carry.
 *
 * This is a presence check, not an opinion about which linter to use: a
 * project declares its own tooling in harness.yaml. The map exists so a
 * bootstrapped workspace is not silently missing its gate.
 */
export const TOOLCHAIN_FILES = {
    typescript: ['eslint.config.js'],
    javascript: ['eslint.config.js'],
    deno: ['eslint.config.js'],
    bun: ['eslint.config.js'],
    python: ['ruff.toml'],
    rust: ['clippy.toml'],
    go: ['.golangci.yml'],
    java: ['checkstyle.xml'],
    csharp: ['.editorconfig'],
    cpp: ['.clang-tidy'],
    c: ['.clang-tidy'],
    generic: []
};
/**
 * Reads the language recorded by the workspace bootstrapper.
 *
 * @param workspaceRoot - Workspace to inspect.
 * @returns The declared language, or null when no profile exists.
 */
export function readProfileLanguage(workspaceRoot) {
    const profile = path.join(workspaceRoot, '.azcodr', 'workspace-profile.env');
    if (!fs.existsSync(profile))
        return null;
    const match = /^language=(.+)$/m.exec(fs.readFileSync(profile, 'utf-8'));
    return match?.[1]?.trim() ?? null;
}
/**
 * Gate files expected for a language.
 *
 * @param language - Declared language, or null.
 * @returns The expected file names, empty when nothing is expected.
 */
export function expectedToolchainFiles(language) {
    if (!language)
        return [];
    return TOOLCHAIN_FILES[language] ?? [];
}
/**
 * Reports toolchain gates declared by a workspace profile but absent on disk.
 *
 * @param ctx - Validation context.
 */
export function phaseToolchain(ctx) {
    ctx.log('');
    ctx.heading('7. Checking Toolchain Enforcement...');
    const language = readProfileLanguage(ctx.workspaceRoot);
    if (language === null) {
        ctx.skip('No workspace profile; nothing to enforce.');
        return;
    }
    const expected = expectedToolchainFiles(language);
    if (expected.length === 0) {
        ctx.pass(`Language '${language}' declares no toolchain configs; nothing to enforce.`);
        return;
    }
    const missing = expected.filter((name) => !fs.existsSync(path.join(ctx.workspaceRoot, name)));
    for (const name of missing) {
        ctx.fail(`Missing toolchain gate '${name}' for language '${language}'.`);
    }
    if (missing.length === 0) {
        ctx.pass(`Toolchain gates present for language '${language}' (${expected.join(', ')}).`);
    }
}
//# sourceMappingURL=toolchain.js.map