import path from 'node:path';
import { inspectCommand } from './agent-guard-command.js';
import { inspectFileWrite } from './agent-guard-file.js';
import { inspectTddRequirement, readTddState, writeTddState } from './agent-guard-tdd.js';
function parseEnvelope(raw) {
    try {
        const trimmed = raw.trim();
        if (!trimmed.startsWith('{'))
            return null;
        return JSON.parse(trimmed);
    }
    catch {
        return null;
    }
}
/**
 * Reads a string value under any of the supplied keys, comparing key names
 * case- and separator-insensitively. Agent harnesses are inconsistent about
 * casing (`target_file` vs `TargetFile` vs `targetFile`), so an exact-match
 * list silently misses real payloads.
 */
function extractKey(input, keys) {
    const normalize = (value) => value.replace(/[_\-\s]/g, '').toLowerCase();
    const wanted = new Set(keys.map(normalize));
    for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string' && wanted.has(normalize(key)))
            return value;
    }
    return undefined;
}
function extractFilePath(input) {
    return extractKey(input, ['targetFile', 'filePath', 'path', 'file']);
}
function extractCommand(input) {
    return extractKey(input, ['commandLine', 'command', 'cmd']);
}
function inspectPreCommand(cmd) {
    const violation = inspectCommand(cmd);
    if (violation.blocked)
        return { allowed: false, reason: violation.reason, source: 'command' };
    return { allowed: true };
}
function inspectPreFile(filePath, input, options) {
    if (options.skipFileRules)
        return { allowed: true };
    const fileDecision = inspectFileWrite({
        filePath,
        incomingContent: extractKey(input, ['fileContent', 'content', 'file_text', 'text', 'CodeContent']),
        replacementContent: extractKey(input, ['replacementContent', 'replacement', 'new_string', 'new_str']),
        targetContent: extractKey(input, ['targetContent', 'target', 'old_string', 'old_str']),
        maxLines: options.maxFileLines,
        excludePaths: options.excludeFilePaths
    });
    if (fileDecision.blocked) {
        return { allowed: false, reason: fileDecision.reason, source: 'file' };
    }
    const root = options.workspaceRoot ?? process.cwd();
    const state = readTddState(path.join(root, '.agents', '.session-state.json'));
    const tddDecision = inspectTddRequirement(filePath, state, options.tdd ?? { enforceTestFirst: false });
    if (tddDecision.blocked)
        return { allowed: false, reason: tddDecision.reason, source: 'tdd' };
    return { allowed: true };
}
/**
 * Inspects a tool-use request before execution.
 *
 * Command safety is always active. File-size and test-first rules run only to
 * the extent the project has declared them in `harness.yaml`.
 *
 * @param rawInput - Raw command string, JSON envelope, or argv slice.
 * @param options - Project-declared enforcement settings.
 * @returns Guard decision indicating whether tool execution is permitted.
 */
function findFirstObject(sources, keys) {
    for (const src of sources) {
        if (!src || typeof src !== 'object')
            continue;
        const rec = src;
        for (const key of keys) {
            const val = rec[key];
            if (val && typeof val === 'object')
                return val;
        }
    }
    return null;
}
function extractPayload(raw) {
    const nested = findFirstObject([raw], ['toolCall', 'tool_call']);
    const fromNested = findFirstObject([nested], ['args', 'parameters', 'arguments']);
    if (fromNested)
        return fromNested;
    const direct = findFirstObject([raw], ['tool_input', 'input', 'parameters', 'arguments', 'args']);
    return direct ?? raw;
}
export function inspectPreTool(rawInput, options = {}) {
    const env = parseEnvelope(rawInput);
    if (env && typeof env === 'object') {
        const record = extractPayload(env);
        const cmd = extractCommand(record);
        if (cmd)
            return inspectPreCommand(cmd);
        const targetFile = extractFilePath(record);
        if (targetFile)
            return inspectPreFile(targetFile, record, options);
        return { allowed: true };
    }
    return inspectPreCommand(rawInput);
}
export { inspectCommand, inspectFileWrite, inspectTddRequirement, readTddState, writeTddState };
export default { inspectPreTool, inspectCommand, inspectFileWrite, inspectTddRequirement };
//# sourceMappingURL=agent-guard.js.map