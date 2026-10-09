import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ScaffoldError, ERROR_CODES } from './errors.js';
import { runGit } from './git.js';
import { assertInside, isProtectedTarget, getTemplateDir } from './guards.js';
import { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile } from './links.js';
import { makeScriptsExecutable } from './permissions.js';
import { isInsideGitWorkTree, initGit } from './repo.js';
import { writeStarterCi } from './starter-ci.js';
export { getTemplateDir };
/**
 * Canonical list of template files and directories copied into a new workspace.
 */
export const TEMPLATE_ITEMS = [
    'AGENTS.md',
    'memory.md',
    'README.md',
    'docs',
    '.agents',
    '.github',
    'scripts',
    '.gitignore',
    '.editorconfig',
    'LICENSE'
];
function rejectTemplateSelf(resolvedTarget, resolvedTemplate) {
    if (resolvedTarget !== resolvedTemplate)
        return;
    throw new ScaffoldError('E_TARGET_IS_TEMPLATE', `${ERROR_CODES.E_TARGET_IS_TEMPLATE}: ${resolvedTarget}`);
}
function rejectProtectedTarget(resolvedTarget, templateDir, allowProtected) {
    if (allowProtected)
        return;
    if (!isProtectedTarget(resolvedTarget, { templateDir }))
        return;
    throw new ScaffoldError('E_TARGET_IS_PROTECTED', `${ERROR_CODES.E_TARGET_IS_PROTECTED}: ${resolvedTarget}. ` +
        'Scaffolding there would overwrite personal or system files. Choose a project subdirectory instead.');
}
function rejectNonEmptyTarget(resolvedTarget, force) {
    const entries = fs.readdirSync(resolvedTarget);
    if (entries.length === 0 || force)
        return;
    throw new ScaffoldError('E_TARGET_NOT_EMPTY', `${ERROR_CODES.E_TARGET_NOT_EMPTY} (${entries.length} items found: ${resolvedTarget}). ` +
        'Use --force to overwrite existing files.');
}
/**
 * Validates the target directory to ensure it is suitable for scaffolding.
 *
 * @param targetDir - Target directory path to validate.
 * @param options - Validation options including force, dry-run, and protected overrides.
 * @throws {ScaffoldError} When target is invalid, protected, or non-empty without force.
 */
export function validateTarget(targetDir, options = {}) {
    const { templateDir = getTemplateDir(), force = false, dryRun = false, allowProtected = false } = options;
    const resolvedTarget = path.resolve(targetDir);
    const resolvedTemplate = path.resolve(templateDir);
    rejectTemplateSelf(resolvedTarget, resolvedTemplate);
    rejectProtectedTarget(resolvedTarget, templateDir, allowProtected);
    if (!fs.existsSync(resolvedTarget)) {
        if (!dryRun)
            fs.mkdirSync(resolvedTarget, { recursive: true });
        return;
    }
    rejectNonEmptyTarget(resolvedTarget, force);
}
function resolveTemplateItem(resolvedTemplate, item) {
    if (item === 'memory.md') {
        const memTpl = path.join(resolvedTemplate, 'data', 'memory.template');
        if (fs.existsSync(memTpl))
            return memTpl;
    }
    let srcPath = path.join(resolvedTemplate, item);
    if (item === '.gitignore' && !fs.existsSync(srcPath)) {
        const npmIgnorePath = path.join(resolvedTemplate, '.npmignore');
        if (fs.existsSync(npmIgnorePath))
            srcPath = npmIgnorePath;
    }
    return srcPath;
}
function copyTemplateItems(resolvedTarget, resolvedTemplate, dryRun) {
    const actions = [];
    for (const item of TEMPLATE_ITEMS) {
        const srcPath = resolveTemplateItem(resolvedTemplate, item);
        if (!fs.existsSync(srcPath))
            continue;
        const destPath = path.join(resolvedTarget, item);
        assertInside(resolvedTemplate, srcPath);
        assertInside(resolvedTarget, destPath);
        actions.push(`copy: ${item} -> ${destPath}`);
        if (!dryRun)
            fs.cpSync(srcPath, destPath, { recursive: true, force: true, dereference: false });
    }
    return actions;
}
function ensureHarnessParity(resolvedTarget, dryRun) {
    const links = [
        ['CLAUDE.md', 'AGENTS.md'],
        ['agents.md', 'AGENTS.md'],
        ['GEMINI.md', 'AGENTS.md'],
        ['.cursorrules', 'AGENTS.md'],
        ['.windsurfrules', 'AGENTS.md']
    ];
    const actions = [];
    for (const [linkName, targetFileName] of links) {
        actions.push(`symlink: ${linkName} -> ${targetFileName}`);
        ensureSymlink({ targetDir: resolvedTarget, linkName, targetFileName, dryRun });
    }
    return actions;
}
function ensureCopilotParity(resolvedTarget, dryRun) {
    const githubDir = path.join(resolvedTarget, '.github');
    if (!dryRun && !fs.existsSync(githubDir))
        fs.mkdirSync(githubDir, { recursive: true });
    ensureSymlinkOrPointer({
        targetDir: githubDir,
        linkName: 'copilot-instructions.md',
        targetFileName: '../AGENTS.md',
        dryRun
    });
    return ['symlink: .github/copilot-instructions.md -> ../AGENTS.md'];
}
function starterPackageJson(resolvedTarget) {
    const projectName = path.basename(resolvedTarget) || 'my-project';
    return {
        name: projectName,
        version: '0.1.0',
        type: 'module',
        private: true,
        description: 'Scaffolded with the azcodr architecture governance toolkit',
        scripts: {
            test: 'node --test',
            'test:coverage': 'jest --coverage',
            lint: 'echo "No linter configured yet. Run /lets-build to configure toolchain."',
            boundaries: 'node .agents/scripts/boundary_guard.js',
            smoke: 'node .agents/scripts/smoke_test.js',
            validate: 'node scripts/validate-cli.js'
        }
    };
}
function ensureStarterPackageJson(resolvedTarget, dryRun) {
    const pkgJsonPath = path.join(resolvedTarget, 'package.json');
    if (fs.existsSync(pkgJsonPath))
        return [];
    if (dryRun)
        return ['create: package.json'];
    const starterPkg = starterPackageJson(resolvedTarget);
    fs.writeFileSync(pkgJsonPath, JSON.stringify(starterPkg, null, 2) + '\n', 'utf-8');
    return ['create: package.json'];
}
function chmodTemplateScripts(inspectDir, dryRun) {
    const actions = [];
    const scripts = makeScriptsExecutable(inspectDir, dryRun);
    for (const script of scripts) {
        actions.push(`chmod: +x ${path.relative(inspectDir, script)}`);
    }
    return actions;
}
/**
 * Recursively copies template files into the target directory and sets up symlinks and permissions.
 * Socket note: filesystem access is scoped to templateDir -> targetDir only (assertInside).
 *
 * @param targetDir - Destination directory path.
 * @param templateDir - Source template directory path.
 * @param options - Copy options including dry-run flag.
 * @returns Array of recorded scaffolding action descriptions.
 */
export function copyTemplate(targetDir, templateDir = getTemplateDir(), options = {}) {
    const { dryRun = false } = options;
    const resolvedTarget = path.resolve(targetDir);
    const resolvedTemplate = path.resolve(templateDir);
    if (!dryRun && !fs.existsSync(resolvedTarget)) {
        fs.mkdirSync(resolvedTarget, { recursive: true });
    }
    const actions = copyTemplateItems(resolvedTarget, resolvedTemplate, dryRun);
    actions.push(...ensureHarnessParity(resolvedTarget, dryRun));
    actions.push(...ensureCopilotParity(resolvedTarget, dryRun));
    actions.push(...ensureStarterPackageJson(resolvedTarget, dryRun));
    actions.push(...writeStarterCi(resolvedTarget, dryRun));
    const inspectDir = dryRun ? resolvedTemplate : resolvedTarget;
    actions.push(...chmodTemplateScripts(inspectDir, dryRun));
    return actions;
}
/**
 * High-level orchestration function to scaffold the azcodr workspace into targetDir.
 *
 * @param options - Scaffolding options.
 * @returns Result object containing success flag, target directory, and action log.
 */
export function scaffold(options = {}) {
    const { targetDir = process.cwd(), force = false, noGit = false, templateDir = getTemplateDir(), dryRun = false } = options;
    const resolvedTarget = path.resolve(targetDir);
    validateTarget(resolvedTarget, { templateDir, force, dryRun });
    const actions = copyTemplate(resolvedTarget, templateDir, { dryRun });
    const gitInitialized = initGit(resolvedTarget, { noGit, dryRun });
    if (gitInitialized)
        actions.push('git: initialize repository');
    return { success: true, targetDir: resolvedTarget, gitInitialized, dryRun, actions };
}
export { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, isInsideGitWorkTree, initGit, runGit, assertInside, ScaffoldError, ERROR_CODES, isProtectedTarget };
export default {
    scaffold, validateTarget, copyTemplate, ensureSymlink,
    ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable,
    isInsideGitWorkTree, initGit, getTemplateDir, runGit,
    assertInside, TEMPLATE_ITEMS, ScaffoldError, ERROR_CODES, isProtectedTarget
};
//# sourceMappingURL=scaffold.js.map