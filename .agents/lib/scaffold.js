import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ScaffoldError, ERROR_CODES } from './errors.js';
import { runGit } from './git.js';
import { assertInside, isProtectedTarget, getTemplateDir } from './guards.js';
import { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile } from './links.js';
import { makeScriptsExecutable } from './permissions.js';
import { isInsideGitWorkTree, initGit, installPrePushHook } from './repo.js';
import { purgeAzcodrTests } from './purge-tests.js';
import { bootstrapWorkspace } from './topology.js';
export { getTemplateDir, purgeAzcodrTests, bootstrapWorkspace };
/**
 * Canonical list of template files and directories copied into a new workspace.
 *
 * Only universally useful, non-opinionated items are included. Opinionated
 * content (docs/rules, .agents/skills, .github workflows) is not shipped;
 * projects opt in via `harness.yaml` and the `azcodr check` command.
 */
export const TEMPLATE_ITEMS = [
    'AGENTS.md',
    'memory.md',
    'README.md',
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
/**
 * Minimal npm manifest for a Node-ecosystem scaffold.
 *
 * No test runner, linter or coverage tool is named: those are project choices,
 * and hard-coding one is how a Go or Python project ends up with commands it
 * cannot run. `harness.yaml` and the recorded interview fill these in.
 */
function starterPackageJson(resolvedTarget) {
    const projectName = path.basename(resolvedTarget) || 'my-project';
    return {
        name: projectName,
        version: '0.1.0',
        type: 'module',
        private: true,
        description: 'Project scaffolded with the azcodr workspace toolkit',
        scripts: {
            check: 'npx azcodr check',
            validate: 'npx azcodr check'
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
    actions.push(...ensureStarterPackageJson(resolvedTarget, dryRun));
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
    const purgeActions = purgeAzcodrTests(resolvedTarget, dryRun);
    actions.push(...purgeActions);
    const gitInitialized = initGit(resolvedTarget, { noGit, dryRun });
    if (gitInitialized) {
        actions.push('git: initialize repository');
        const hookResult = installPrePushHook(resolvedTarget, { dryRun });
        if (hookResult.action)
            actions.push(hookResult.action);
    }
    if (options.topology || options.language) {
        const bootResult = bootstrapWorkspace(resolvedTarget, {
            topology: options.topology,
            language: options.language,
            dryRun,
            allowProtected: Boolean(process.env.AZCODR_ALLOW_PROTECTED === '1')
        });
        actions.push(...bootResult.actions);
    }
    return { success: true, targetDir: resolvedTarget, gitInitialized, dryRun, actions };
}
export { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, isInsideGitWorkTree, initGit, installPrePushHook, runGit, assertInside, ScaffoldError, ERROR_CODES, isProtectedTarget };
/**
 * Unified azcodr scaffolding functions, guards, utilities, and constants module.
 */
export default {
    scaffold, validateTarget, copyTemplate, ensureSymlink,
    ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable,
    isInsideGitWorkTree, initGit, installPrePushHook, getTemplateDir, runGit,
    assertInside, TEMPLATE_ITEMS, ScaffoldError, ERROR_CODES, isProtectedTarget,
    purgeAzcodrTests
};
//# sourceMappingURL=scaffold.js.map