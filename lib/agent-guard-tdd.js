import fs from 'node:fs';
import path from 'node:path';
import { matchGlob } from './harness-resolve.js';
/** Extensions treated as non-code regardless of configuration. */
const DEFAULT_NON_CODE = ['.md', '.json', '.yml', '.yaml', '.txt', '.toml', '.lock', '.svg', '.png', '.ipynb'];
/** Conventional test layouts recognised even without configuration. */
const DEFAULT_TEST_PATHS = ['tests', 'test', '__tests__', 'spec', 'specs'];
function toPosix(value) {
    return value.replace(/\\/g, '/');
}
/**
 * Identifies whether a path is a test artefact using built-in conventions.
 *
 * @param filePath - File path to inspect.
 * @returns True if the path matches a conventional test layout.
 */
export function isTestFile(filePath) {
    const norm = toPosix(filePath).toLowerCase();
    const segments = norm.split('/');
    if (segments.some((s) => DEFAULT_TEST_PATHS.includes(s)))
        return true;
    return /\.(test|spec)\.[a-z0-9]+$/i.test(norm);
}
/**
 * Identifies whether a path is a non-code asset or configuration file.
 *
 * @param filePath - File path to inspect.
 * @returns True if the extension indicates non-code content.
 */
export function isNonCodeFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return DEFAULT_NON_CODE.includes(ext);
}
/**
 * Identifies production source code using the project's declared globs.
 *
 * Segment-aware: `app/**` matches `app/models.py` but not `myapp/models.py`.
 * With no configured production paths nothing is production code.
 *
 * @param filePath - File path to inspect.
 * @param rules - Project-declared path classifications.
 * @returns True if the path is production source subject to test-first rules.
 */
function matchesExtension(rel, extensions) {
    const lower = rel.toLowerCase();
    for (const ext of extensions) {
        if (lower.endsWith(ext.toLowerCase()))
            return true;
    }
    return false;
}
export function isProductionFile(filePath, rules) {
    const rel = toPosix(filePath);
    if (isNonCodeFile(rel))
        return false;
    if (isTestFile(rel))
        return false;
    if (matchesExtension(rel, rules.nonCodeExtensions))
        return false;
    if (rules.testPaths.some((glob) => matchGlob(rel, glob)))
        return false;
    return rules.productionPaths.some((glob) => matchGlob(rel, glob));
}
/**
 * Loads session test-first tracking state, defaulting to unrecorded.
 *
 * @param stateFile - Path to the persistent session state JSON file.
 * @returns Parsed SessionTddState object.
 */
export function readTddState(stateFile) {
    if (!fs.existsSync(stateFile))
        return { lastFailingTestRecorded: false };
    try {
        return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
    catch {
        return { lastFailingTestRecorded: false };
    }
}
/**
 * Persists session state, failing silently so a write error cannot interrupt work.
 *
 * @param stateFile - Path to the persistent session state JSON file.
 * @param state - State to record.
 */
export function writeTddState(stateFile, state) {
    try {
        fs.mkdirSync(path.dirname(stateFile), { recursive: true });
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    }
    catch {
        // Fail-safe: never crash the agent because state could not be persisted.
    }
}
/**
 * Checks whether an edit is permitted under RED-before-GREEN rules.
 *
 * Fails open in every ambiguous case: an unconfigured project, or a rule with
 * no production paths declared, blocks nothing.
 *
 * @param filePath - Path of file being edited.
 * @param state - Current session state.
 * @param config - Project-declared enforcement settings.
 * @returns Decision result indicating whether the edit is blocked.
 */
function resolveTddRules(config) {
    return {
        productionPaths: config.productionPaths ?? [],
        testPaths: config.testPaths ?? [],
        nonCodeExtensions: config.nonCodeExtensions ?? []
    };
}
function buildBlockedResult(filePath) {
    return {
        blocked: true,
        isProductionFile: true,
        reason: `Test-first: '${path.basename(filePath)}' is a configured production path and cannot be ` +
            'edited before a failing test (RED) has been recorded and observed.'
    };
}
export function inspectTddRequirement(filePath, state, config) {
    const rules = resolveTddRules(config);
    const prod = isProductionFile(filePath, rules);
    if (!config.enforceTestFirst) {
        return { blocked: false, isProductionFile: prod, reason: 'Test-first enforcement is not enabled.' };
    }
    if (rules.productionPaths.length === 0) {
        return {
            blocked: false,
            isProductionFile: false,
            reason: 'Test-first is enabled but no production paths are configured, so no file is protected.'
        };
    }
    if (!prod) {
        return { blocked: false, isProductionFile: false, reason: 'Not a configured production path.' };
    }
    if (state.lastFailingTestRecorded) {
        return { blocked: false, isProductionFile: true, reason: 'A failing test has been recorded.' };
    }
    return buildBlockedResult(filePath);
}
export default {
    isTestFile,
    isNonCodeFile,
    isProductionFile,
    readTddState,
    writeTddState,
    inspectTddRequirement
};
//# sourceMappingURL=agent-guard-tdd.js.map