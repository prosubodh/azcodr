import fs from 'node:fs';
import path from 'node:path';
import { readTextOrFail } from './io.js';
import { stripFencedCode, stripHtmlComments } from './text.js';
/**
 * Extracts ADR entry ids, index rows, and heading defects from a ledger.
 *
 * @param memoryText - Raw contents of the decision ledger.
 * @returns The recovered ledger structure.
 */
export function parseAdrLedger(memoryText) {
    const live = stripFencedCode(stripHtmlComments(memoryText));
    const entryIds = [...live.matchAll(/^####\s+ADR-(\d+)/gm)].map((m) => Number(m[1]));
    const malformed = [...live.matchAll(/^[^|\n]*#{1,6}[ \t]*\S*ADR-(\d+)/gim)]
        .map((m) => Number(m[1]))
        .filter((id) => !entryIds.includes(id));
    const indexIds = [];
    for (const row of live.split('\n').filter((line) => /^\s*\|/.test(line))) {
        if (/^\s*\|[\s|:-]+\|\s*$/.test(row))
            continue;
        // The row filter guarantees a leading pipe, so cell 1 always exists.
        const first = row.split('|')[1];
        const match = first.match(/ADR-(\d+)/);
        if (match)
            indexIds.push(Number(match[1]));
    }
    return {
        entryIds,
        indexIds,
        malformed,
        duplicateIds: [...new Set(entryIds.filter((id, i) => entryIds.indexOf(id) !== i))]
    };
}
/** Zero-pads an id so messages can be grepped back to the heading. */
function label(id) {
    return `ADR-${String(id).padStart(3, '0')}`;
}
function reportMalformedHeadings(parsed, fail) {
    for (const id of parsed.malformed) {
        fail(`${label(id)} appears with a non-standard heading. ` +
            'ADR entries must use exactly "#### ADR-NNN: Title" at h4.');
    }
    for (const id of parsed.duplicateIds) {
        fail(`${label(id)} has more than one entry heading.`);
    }
}
function reportIndexDrift(parsed, fail) {
    const indexed = new Set(parsed.indexIds);
    const missingFromIndex = parsed.entryIds.filter((id) => !indexed.has(id));
    const missingEntry = parsed.indexIds.filter((id) => !parsed.entryIds.includes(id));
    for (const id of missingFromIndex) {
        fail(`${label(id)} exists in memory.md but is missing from the ADR Master Index table.`);
    }
    for (const id of missingEntry) {
        fail(`ADR Master Index lists ${label(id)} but no matching entry exists in memory.md.`);
    }
    return missingFromIndex.length === 0 && missingEntry.length === 0;
}
/**
 * Cross-checks the master index against the ledger entries.
 *
 * Fails when an ADR exists but is absent from the index, or when the index
 * advertises an ADR with no entry.
 *
 * @param workspaceRoot - Workspace containing memory.md.
 * @param fail - Failure reporter.
 * @param pass - Pass reporter.
 * @returns Whether the ledger is indexed, empty, or inconsistent.
 */
export function checkAdrIndexConsistency(workspaceRoot, fail, pass) {
    const memoryFile = path.join(workspaceRoot, 'memory.md');
    if (!fs.existsSync(memoryFile))
        return 'clean-slate';
    const ledgerText = readTextOrFail(memoryFile, 'memory.md', fail);
    if (ledgerText === null)
        return 'clean-slate';
    const parsed = parseAdrLedger(ledgerText);
    reportMalformedHeadings(parsed, fail);
    // Fail closed: an index row must have a matching entry, even when no
    // well-formed entry was parsed at all.
    if (parsed.entryIds.length === 0 && parsed.indexIds.length === 0) {
        return parsed.malformed.length === 0 ? 'clean-slate' : 'inconsistent';
    }
    if (reportIndexDrift(parsed, fail) && parsed.malformed.length === 0 && parsed.duplicateIds.length === 0) {
        pass(`ADR Master Index matches all ${parsed.entryIds.length} ADR entries in memory.md.`);
        return 'indexed';
    }
    return 'inconsistent';
}
function reportWaiverOutcome(workspaceRoot, pass, warn) {
    if (path.basename(workspaceRoot) === 'azcodr') {
        pass('ubiquitous_language.md is intentionally blank (template waiver).');
        return;
    }
    warn("ubiquitous_language.md carries the azcodr template waiver; delete the marker and define this project's vocabulary.");
}
/**
 * The glossary is required once ADRs exist to prevent drift.
 *
 * @param workspaceRoot - Workspace to inspect.
 * @param verdicts - Reporter callbacks.
 */
export function checkGlossaryPopulated(workspaceRoot, verdicts) {
    const glossary = path.join(workspaceRoot, 'docs', 'knowledge', 'ubiquitous_language.md');
    if (!fs.existsSync(glossary)) {
        verdicts.fail('Missing docs/knowledge/ubiquitous_language.md (required once ADRs exist).');
        return;
    }
    const raw = readTextOrFail(glossary, 'ubiquitous_language.md', verdicts.fail);
    if (raw === null)
        return;
    if (/azcodr:glossary-waived/.test(raw)) {
        reportWaiverOutcome(workspaceRoot, verdicts.pass, verdicts.warn);
        return;
    }
    const rows = stripHtmlComments(raw).split('\n').filter((line) => /^\s*\|/.test(line));
    // Header + separator + one placeholder row is still a template.
    const realTerms = rows.slice(2).filter((line) => !/No domain terms defined yet/i.test(line));
    if (realTerms.length === 0) {
        verdicts.warn('ubiquitous_language.md has no domain terms. Populate it, or delete the file if this project does not maintain one.');
    }
}
//# sourceMappingURL=adr.js.map