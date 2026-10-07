import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { ScaffoldError, ERROR_CODES } from './errors.js';
import { getTemplateDir } from './scaffold.js';
/**
 * Filesystem scope guard (Supply Chain: filesystem access).
 * Constrains all reads/writes to targetDir / templateDir.
 */
export function assertInside(root, candidate, message) {
    const resolvedRoot = path.resolve(root);
    const resolvedCandidate = path.resolve(root, candidate);
    const relative = path.relative(resolvedRoot, resolvedCandidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new ScaffoldError('E_PATH_ESCAPE', message || `${ERROR_CODES.E_PATH_ESCAPE}: ${candidate}`);
    }
}
/**
 * Normalizes a path for protected-target comparison. On Windows the filesystem
 * is case-insensitive, so `C:\Users\Name` and `c:\users\name` are the same
 * directory and must compare equal.
 */
export function normalizeForComparison(p) {
    const resolved = path.resolve(p);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
function readHomeDir() {
    try {
        return os.homedir();
    }
    catch {
        return '';
    }
}
function isFilesystemRoot(resolvedTarget) {
    return resolvedTarget === path.parse(resolvedTarget).root;
}
function isHomeOrParent(normalizedTarget, home) {
    if (!home)
        return false;
    if (normalizedTarget === normalizeForComparison(home))
        return true;
    const parent = path.dirname(path.resolve(home));
    return normalizedTarget === normalizeForComparison(parent);
}
function isTemplateAncestor(resolvedTarget, templateDir) {
    const resolvedTemplate = path.resolve(templateDir);
    const relative = path.relative(resolvedTarget, resolvedTemplate);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}
function resolvesToProtectedLocation(resolvedTarget, home) {
    // Symlink alias: a symlink to / or ~ must not bypass the lexical checks.
    let real = '';
    try {
        if (!fs.existsSync(resolvedTarget))
            return false;
        real = fs.realpathSync(resolvedTarget);
    }
    catch {
        return false;
    }
    if (real === path.parse(real).root)
        return true;
    return Boolean(home) && normalizeForComparison(real) === normalizeForComparison(home);
}
/**
 * Returns true when `targetDir` is a location the scaffolder must never write
 * into: the filesystem root, the user's home directory, the home directory's
 * parent (e.g. /home, C:\Users -- scaffolding there affects every user), or an
 * ancestor of the template itself (scaffolding into D:\projects would merge
 * the template into its own parent).
 *
 * Lexical comparison is not enough: a symlink pointing at home must also be
 * caught, so an existing target is resolved with realpath before comparing.
 */
export function isProtectedTarget(targetDir, options = {}) {
    const resolvedTarget = path.resolve(targetDir);
    const normalizedTarget = normalizeForComparison(resolvedTarget);
    if (isFilesystemRoot(resolvedTarget))
        return true;
    const home = readHomeDir();
    if (isHomeOrParent(normalizedTarget, home))
        return true;
    const { templateDir = getTemplateDir() } = options;
    if (isTemplateAncestor(resolvedTarget, templateDir))
        return true;
    return resolvesToProtectedLocation(resolvedTarget, home);
}
export default {
    assertInside,
    normalizeForComparison,
    isProtectedTarget
};
//# sourceMappingURL=guards.js.map