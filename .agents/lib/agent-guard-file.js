import fs from 'node:fs';
import path from 'node:path';
import { matchGlob } from './harness-resolve.js';
/**
 * Counts lines, treating a trailing newline as a terminator rather than an
 * extra line, so a file whose last line is exactly at the limit still fits.
 *
 * @param text - Input string to evaluate.
 * @returns Total count of lines.
 */
export function countLines(text) {
    if (!text)
        return 0;
    const normalized = text.endsWith('\n') ? text.slice(0, -1) : text;
    return normalized.split('\n').length;
}
/**
 * Reads an existing file from disk and returns its current line count.
 *
 * @param filePath - Path of file to inspect.
 * @returns Total number of lines, or 0 if unreadable or non-existent.
 */
export function readExistingLines(filePath) {
    if (!fs.existsSync(filePath))
        return 0;
    try {
        return countLines(fs.readFileSync(filePath, 'utf-8'));
    }
    catch {
        return 0;
    }
}
function calculateProjectedLines(currentLines, input) {
    if (input.incomingContent !== undefined) {
        return countLines(input.incomingContent);
    }
    if (input.replacementContent !== undefined) {
        const added = countLines(input.replacementContent);
        const removed = input.targetContent !== undefined ? countLines(input.targetContent) : 1;
        return Math.max(0, currentLines + added - removed);
    }
    return currentLines;
}
function excluded(filePath, patterns) {
    const rel = filePath.replace(/\\/g, '/');
    return patterns.some((pattern) => matchGlob(rel, pattern));
}
function checkBudgetViolation(name, lines, maxLines) {
    const { current, projected } = lines;
    if (current > maxLines) {
        if (projected >= current) {
            return {
                blocked: true,
                reason: `Line budget: '${name}' currently has ${current} lines (limit: ${maxLines}). ` +
                    'Non-shrinking edits to an over-budget file are blocked. Reduce it, or raise the ' +
                    "project's configured budget, before adding more."
            };
        }
        return { blocked: false };
    }
    if (projected > maxLines) {
        return {
            blocked: true,
            reason: `Line budget: '${name}' would grow to ${projected} lines (limit: ${maxLines}). ` +
                'Split it into focused units, or raise the configured budget.'
        };
    }
    return { blocked: false };
}
function evaluate(params) {
    const { filePath, currentLines, projectedLines, maxLines, excludePaths } = params;
    const base = { currentLines, projectedLines, maxLines };
    if (maxLines === null) {
        return { ...base, blocked: false, reason: 'No line budget is configured for this project.' };
    }
    if (excludePaths.length > 0 && excluded(filePath, excludePaths)) {
        return {
            ...base,
            blocked: false,
            reason: `'${path.basename(filePath)}' is excluded from the line budget by configuration.`
        };
    }
    const outcome = checkBudgetViolation(path.basename(filePath), { current: currentLines, projected: projectedLines }, maxLines);
    return { ...base, ...outcome };
}
/**
 * Checks a proposed file write or edit against the configured line budget.
 *
 * With no `maxLines` the check is inert: a file of any size is permitted. This
 * is deliberate — a line budget is a project decision, not a universal law.
 *
 * @param input - File path, proposed content and configured budget.
 * @returns Decision result indicating whether the write is blocked.
 */
export function inspectFileWrite(input) {
    return evaluate({
        filePath: input.filePath,
        currentLines: readExistingLines(input.filePath),
        projectedLines: calculateProjectedLines(readExistingLines(input.filePath), input),
        maxLines: input.maxLines ?? null,
        excludePaths: input.excludePaths ?? []
    });
}
export default { countLines, readExistingLines, inspectFileWrite };
//# sourceMappingURL=agent-guard-file.js.map