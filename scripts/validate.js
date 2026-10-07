#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  let root = '';
  for (const arg of argv) {
    if (arg === '--fix') continue;
    if (!root) root = arg;
  }
  return root || process.cwd();
}

/**
 * Reporter seam. Tests inject a collector so assertions can read the exact
 * pass/warn/fail outcome instead of scraping stdout.
 */
/**
 * The three target spellings a harness-parity file may legitimately use.
 * Pure so it can be unit-tested without touching the filesystem.
 */
function isValidAgentsTargetFn(target, agentsFile) {
  const normalized = target.replace(/\\/g, '/');
  const rootNormalized = agentsFile.replace(/\\/g, '/');
  return normalized === 'AGENTS.md' || normalized === './AGENTS.md' || normalized === rootNormalized;
}

/**
 * Decides whether a harness-parity entry is healthy, drifted, or outright wrong.
 *
 * Kept free of filesystem I/O (callers pass in what lstat/readlink/readFile
 * observed) because symlink creation is unavailable on some hosts — Windows
 * without Developer Mode returns EPERM — so the symlink verdicts are otherwise
 * unreachable in CI on the platform matrix that matters most.
 */
function evaluateParityTarget(ctx) {
  const {
    label,
    allowCopyFallback,
    agentsContent,
    agentsContentMissing,
    agentsFile,
    entries,
    isSymlink,
    linkTarget,
    isFile,
    content
  } = ctx;

  const isCopilot = label.endsWith('copilot-instructions.md');

  if (isSymlink) {
    const normalized = linkTarget.replace(/\\/g, '/');
    const ok = isCopilot
      ? (normalized === '../AGENTS.md'
        || normalized === agentsFile.replace(/\\/g, '/')
        || normalized === 'AGENTS.md')
      : isValidAgentsTargetFn(linkTarget, agentsFile);
    if (ok) return { kind: 'pass', message: `${label} is a valid symlink to AGENTS.md.` };
    return { kind: 'fail', message: `${label} points to '${linkTarget}' instead of 'AGENTS.md'.` };
  }

  if (isFile) {
    const trimmed = content.trim();
    if (trimmed === 'AGENTS.md' || trimmed === './AGENTS.md' || trimmed === agentsFile) {
      return { kind: 'pass', message: `${label} is a text pointer to AGENTS.md (symlink fallback).` };
    }
    if (isCopilot && content.includes('AGENTS.md')) {
      return { kind: 'pass', message: `${label} references AGENTS.md (symlink fallback).` };
    }
    if (allowCopyFallback && !agentsContentMissing && agentsContent && content === agentsContent) {
      return {
        kind: 'warn',
        message: `${label} is a byte-identical copy of AGENTS.md (Windows symlink fallback; drift risk).`
      };
    }
    if (label === 'agents.md'
      && !entries.includes('agents.md')
      && entries.includes('AGENTS.md')) {
      return {
        kind: 'pass',
        message: 'agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).'
      };
    }
    return { kind: 'fail', message: `${label} is not a symbolic link.` };
  }

  // Anything lstat saw that is neither a symlink nor a regular file (a
  // directory sitting in a parity slot, a socket, a device node).
  return { kind: 'fail', message: `${label} is neither a symlink nor a regular file.` };
}

/**
 * Creates the lowercase parity link, preferring a real symlink and falling back
 * to a text pointer. Never throws: an unrecoverable workspace is reported so
 * the caller can surface it.
 *
 * @returns {{created: boolean, strategy: 'symlink'|'pointer'|null, reason: string|null}}
 */
function createLowercaseParityLink(lowerPath, fsImpl = fs) {
  try {
    fsImpl.symlinkSync('AGENTS.md', lowerPath);
    return { created: true, strategy: 'symlink', reason: null };
  } catch (symlinkErr) {
    // Symlinks unavailable (Windows without Developer Mode): a text pointer
    // preserves the invariant without duplicating content.
    try {
      fsImpl.writeFileSync(lowerPath, 'AGENTS.md\n', 'utf-8');
      return { created: true, strategy: 'pointer', reason: null };
    } catch (writeErr) {
      return {
        created: false,
        strategy: null,
        reason: `symlink failed (${symlinkErr.code || symlinkErr.message}); pointer write failed (${writeErr.code || writeErr.message})`
      };
    }
  }
}

/**
 * Reads a UTF-8 text file, reporting rather than throwing on failure.
 *
 * Unguarded readFileSync calls crashed the whole run on a directory named
 * `*.md`, an unreadable file, or a broken symlink, aborting every later phase
 * and emitting a stack trace instead of a verdict.
 */
function readTextOrFail(filePath, label, fail) {
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile()) {
      fail(`${label} is not a regular file (${st.isDirectory() ? 'it is a directory' : 'special file'}).`);
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    fail(`Could not read ${label}: ${err.code || err.message}`);
    return null;
  }
}

/** Recursively collects markdown files under `root`. */
function walkMarkdown(root, label, fail = () => {}) {
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      fail(`Could not list ${label} directory ${dir}: ${err.code || err.message}`);
      continue;
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name.toLowerCase().endsWith('.md')) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

/** Lists skill directories, skipping symlinks that cannot be resolved. */
function readSkillFolders(skillsDir, fail) {
  let entries = [];
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch (err) {
    fail(`Could not list skills directory: ${err.code || err.message}`);
    return [];
  }
  const folders = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    folders.push(entry.name);
  }
  return folders;
}

function createReporter(sink = console) {
  return {
    pass: (msg) => sink.log(`  ✅ ${msg}`),
    warn: (msg) => sink.log(`  ⚠️  ${msg}`),
    fail: (msg) => sink.log(`  ❌ ${msg}`),
    log: (msg) => sink.log(msg),
    heading: (msg) => sink.log(msg)
  };
}

/**
 * Parses the ADR Master Index table and the ADR entry headings out of memory.md.
 *
 * Stirling-engine shipped 9 accepted ADRs while its index still read
 * "No decisions recorded yet" and validate.js reported SUCCESS — the index is a
 * derived view, so it needs its own fitness function rather than trusting that
 * whoever adds an ADR remembers to also update the table.
 */
function stripHtmlComments(text) {
  // Remove HTML comments, tolerating unclosed ones. A stray `<!--` from an
  // editor's "comment selection" must not silently hide every ADR after it.
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!--[\s\S]*$/, '');
}

/**
 * Removes fenced code blocks so that examples inside documentation are not
 * mistaken for real content. Without this, a rule file whose only H1 and
 * "Core Mandate" lines sit inside a ```md fence satisfies both checks, and a
 * `#### ADR-001` shown as an example is counted as a real decision.
 */
function stripFencedCode(text) {
  return text.replace(/^([ \t]*)(```|~~~)[\s\S]*?^\1\2[ \t]*$/gm, '');
}

function parseAdrLedger(memoryText) {
  const withoutComments = stripFencedCode(stripHtmlComments(memoryText));

  const entryIds = [...withoutComments.matchAll(/^####\s+ADR-(\d+)/gm)].map((m) => Number(m[1]));

  // Any heading-ish line mentioning an ADR that is NOT a well-formed h4 entry.
  // Catches the escapes that would otherwise silently downgrade the ledger to
  // "clean slate": wrong heading depth, blockquoted, and missing space.
  const malformed = [...withoutComments.matchAll(/^[^|\n]*#{1,6}[ \t]*\S*ADR-(\d+)/gim)]
    .map((m) => Number(m[1]))
    .filter((id) => !entryIds.includes(id));

  const indexIds = [];
  const tableRows = withoutComments.split('\n').filter((line) => /^\s*\|/.test(line));
  for (const row of tableRows) {
    // Skip the header and separator rows.
    if (/^\s*\|[\s|:-]+\|\s*$/.test(row)) continue;
    const cells = row.split('|');
    const first = cells[1];
    if (first === undefined) continue;
    const m = first.match(/ADR-(\d+)/);
    if (m) indexIds.push(Number(m[1]));
  }

  const duplicateIds = entryIds.filter((id, i) => entryIds.indexOf(id) !== i);

  return { entryIds, indexIds, malformed, duplicateIds: [...new Set(duplicateIds)] };
}

/**
 * Fails when an ADR exists but is absent from the Master Index table, or when
 * the index advertises an ADR that has no entry. Returns 'indexed' when there
 * is at least one ADR entry to cross-check, otherwise 'clean-slate'.
 */
function checkAdrIndexConsistency(workspaceRoot, fail, pass) {
  const memoryFile = path.join(workspaceRoot, 'memory.md');
  if (!fs.existsSync(memoryFile)) return 'clean-slate';

  const ledgerText = readTextOrFail(memoryFile, 'memory.md', fail);
  if (ledgerText === null) return 'clean-slate';

  const { entryIds, indexIds, malformed, duplicateIds } = parseAdrLedger(ledgerText);

  // Match the ledger's own ADR-001 zero-padded convention so messages can be
  // grepped back to the offending heading.
  const label = (id) => `ADR-${String(id).padStart(3, '0')}`;

  // A malformed heading must fail loudly. Previously any non-`####` heading
  // (`###`, blockquoted, no space) produced zero entries, which silently
  // downgraded the ledger to "clean slate" and disabled the entire phase --
  // the exact rot this function exists to catch.
  for (const id of malformed) {
    fail(
      `${label(id)} appears in memory.md with a non-standard heading. ` +
      'ADR entries must use exactly "#### ADR-NNN: Title" at h4.'
    );
  }
  for (const id of duplicateIds) {
    fail(`${label(id)} has more than one entry heading in memory.md.`);
  }

  // Fail closed: an index that advertises an ADR must have a matching entry,
  // even when no well-formed entry was parsed at all.
  if (entryIds.length === 0 && indexIds.length === 0) {
    if (malformed.length === 0) return 'clean-slate';
    return 'inconsistent';
  }

  const indexed = new Set(indexIds);
  const missingFromIndex = entryIds.filter((id) => !indexed.has(id));
  const missingEntry = indexIds.filter((id) => !entryIds.includes(id));

  for (const id of missingFromIndex) {
    fail(`${label(id)} exists in memory.md but is missing from the ADR Master Index table.`);
  }
  for (const id of missingEntry) {
    fail(`ADR Master Index lists ${label(id)} but no matching entry exists in memory.md.`);
  }

  const clean = missingFromIndex.length === 0
    && missingEntry.length === 0
    && malformed.length === 0
    && duplicateIds.length === 0;

  if (clean) {
    pass(`ADR Master Index matches all ${entryIds.length} ADR entries in memory.md.`);
    return 'indexed';
  }
  return 'inconsistent';
}

/**
 * The glossary is the second derived view that silently rots: an empty
 * ubiquitous-language table alongside a populated ADR ledger means the DDD
 * governance layer was scaffolded but never exercised.
 */
function checkGlossaryPopulated(workspaceRoot, fail, pass, warn) {
  const glossary = path.join(workspaceRoot, 'docs', 'knowledge', 'ubiquitous_language.md');
  if (!fs.existsSync(glossary)) {
    fail('Missing docs/knowledge/ubiquitous_language.md (required once ADRs exist).');
    return;
  }
  const raw = readTextOrFail(glossary, 'ubiquitous_language.md', fail);
  if (raw === null) return;

  // Explicit, greppable opt-out for the template repo itself. Its glossary is
  // deliberately blank because it ships downstream as a starting point (see
  // commit 8b5e0ae). A scaffolded project that finds this marker copied into it
  // gets a warning telling it to delete the marker.
  if (/azcodr:glossary-waived/.test(raw)) {
    const isTemplateItself = path.basename(workspaceRoot) === 'azcodr';
    if (isTemplateItself) {
      pass('ubiquitous_language.md is intentionally blank (template waiver).');
    } else {
      warn('ubiquitous_language.md carries the azcodr template waiver; delete the marker and define this project\'s vocabulary.');
    }
    return;
  }

  const withoutComments = raw.replace(/<!--[\s\S]*?-->/g, '');
  const rows = withoutComments.split('\n').filter((line) => /^\s*\|/.test(line));
  // Header + separator + one placeholder row = still a template.
  const realTerms = rows.slice(2).filter((line) => !/No domain terms defined yet/i.test(line));
  if (realTerms.length === 0) {
    fail('ubiquitous_language.md has no domain terms, but memory.md records ADRs. Define the vocabulary during Domain Discovery.');
  }
}

function runValidation(workspaceRoot, reporter = createReporter()) {
  // Counters live here, not on the reporter: an injected reporter only needs
  // pass/warn/fail to observe outcomes, and the tally must not depend on the
  // reporter's shape.
  let errors = 0;
  let warnings = 0;
  const pass = reporter.pass;
  const warn = (msg) => { warnings += 1; reporter.warn(msg); };
  const fail = (msg) => { errors += 1; reporter.fail(msg); };

  reporter.heading(`🔍 Validating Agentic Architecture in: ${workspaceRoot}`);
  reporter.log('--------------------------------------------------------------');

  reporter.heading('1. Checking Root Configuration & Symlinks...');
  const agentsFile = path.join(workspaceRoot, 'AGENTS.md');
  let agentsText = null;
  if (!fs.existsSync(agentsFile)) {
    fail(`Missing root AGENTS.md at ${agentsFile}`);
  } else {
    pass('AGENTS.md exists.');
    agentsText = readTextOrFail(agentsFile, 'AGENTS.md', fail);
    if (agentsText !== null) {
      // A 0-byte root contract passed the line budget (''.split('\n').length
      // is 1). Progressive disclosure with an empty root file discloses nothing.
      if (agentsText.trim().length === 0) {
        fail('AGENTS.md is empty; the root agent contract must define its operating rules.');
      } else {
        const lines = agentsText.split('\n').length;
        if (lines <= 120) pass(`AGENTS.md line count is lean: ${lines} lines (<= 120).`);
        else if (lines <= 150) warn(`AGENTS.md line count is getting large: ${lines} lines (warn > 120).`);
        else fail(`AGENTS.md exceeds maximum line limit: ${lines} lines (max 150).`);
      }
    }
  }

  // Used only to detect a byte-identical harness copy. Reuse the already-guarded
// read so an unreadable AGENTS.md cannot abort the run at this point.
const agentsContent = agentsText === null ? '' : agentsText;

  function checkParity(filePath, label, allowCopyFallback) {
    let stat = null;
    try { stat = fs.lstatSync(filePath); } catch { fail(`${label} is missing.`); return; }

    let entries = [];
    try { entries = fs.readdirSync(workspaceRoot); } catch { /* verdict degrades to a plain fail */ }

    const isSymlink = stat.isSymbolicLink();
    let linkTarget = null;
    if (isSymlink) {
      try {
        linkTarget = fs.readlinkSync(filePath);
      } catch (err) {
        // A symlink that lstat sees but readlink cannot resolve (dangling on
        // Windows, or a race) must be reported, never silently downgraded to a
        // regular file that might then "pass" as a valid pointer.
        fail(`${label} readlink failed: ${err.message}`);
        return;
      }
    }

    const isFile = !isSymlink && stat.isFile();
    let content = '';
    if (isFile) {
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        fail(`${label} could not be read: ${err.message}`);
        return;
      }
    }

    const verdict = evaluateParityTarget({
      label,
      allowCopyFallback,
      agentsContent,
      agentsContentMissing: !agentsContent,
      agentsFile,
      entries,
      isSymlink,
      linkTarget,
      isFile,
      content
    });

    if (verdict.kind === 'pass') pass(verdict.message);
    else if (verdict.kind === 'warn') warn(verdict.message);
    else fail(verdict.message);
  }

  checkParity(path.join(workspaceRoot, 'CLAUDE.md'), 'CLAUDE.md', true);
  const lowerPath = path.join(workspaceRoot, 'agents.md');

  /**
   * Restores lowercase agents.md parity on case-sensitive filesystems, where it
   * cannot be committed alongside AGENTS.md from a case-insensitive system.
   * Prefers a real symlink, falls back to a text pointer.
   *
   * Extracted so both outcomes -- created and unrecoverable -- are reachable in
   * tests without depending on host symlink support.
   */
  function restoreLowercaseParity() {
    const outcome = createLowercaseParityLink(lowerPath, fs);
    if (outcome.created) {
      pass('Created agents.md parity link to AGENTS.md (case-sensitive filesystem).');
    } else {
      // Read-only workspace: checkParity below reports agents.md as unsatisfied.
      warn(`Could not restore agents.md parity: ${outcome.reason}`);
    }
    checkParity(lowerPath, 'agents.md', true);
  }

  // An unreadable root degrades to an empty listing, which routes every file
  // through checkParity and reports each one individually.
  let rootEntries = [];
  try {
    rootEntries = fs.readdirSync(workspaceRoot);
  } catch {
    rootEntries = [];
  }

  if (rootEntries.includes('AGENTS.md') && !rootEntries.includes('agents.md')) {
    // No exact 'agents.md' in the listing. On a case-insensitive filesystem the
    // lower-cased path resolves to AGENTS.md itself, so the invariant already
    // holds and MUST NOT be "restored": writing here would overwrite the very
    // file it is trying to point at. Only repair on a genuinely
    // case-sensitive filesystem, where the two paths are distinct entries.
    if (fs.existsSync(lowerPath)) {
      pass('agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).');
    } else {
      restoreLowercaseParity();
    }
  } else {
    checkParity(lowerPath, 'agents.md', true);
  }
  checkParity(path.join(workspaceRoot, 'GEMINI.md'), 'GEMINI.md', true);
  checkParity(path.join(workspaceRoot, '.cursorrules'), '.cursorrules', true);
  checkParity(path.join(workspaceRoot, '.windsurfrules'), '.windsurfrules', true);
  const githubDir = path.join(workspaceRoot, '.github');
  if (fs.existsSync(githubDir) && fs.statSync(githubDir).isDirectory()) {
    const copilot = path.join(githubDir, 'copilot-instructions.md');
    if (fs.existsSync(copilot)) {
      checkParity(copilot, '.github/copilot-instructions.md', true);
    } else {
      warn('.github/copilot-instructions.md is missing (run scaffold to restore harness parity).');
    }
    if (!fs.existsSync(path.join(githubDir, 'workflows'))) {
      warn('.github/workflows is missing (CI will not run in scaffolded projects).');
    }
  }

  if (fs.existsSync(path.join(workspaceRoot, '.gitignore'))) pass('.gitignore exists.');
  else fail('Missing .gitignore');

  let validatedRules = 0;
  reporter.log('');
  reporter.heading('2. Checking Progressive Disclosure Rules...');
  const rulesDir = path.join(workspaceRoot, 'docs', 'rules');
  if (!fs.existsSync(rulesDir) || !fs.statSync(rulesDir).isDirectory()) {
    fail(`Missing docs/rules directory at ${rulesDir}`);
  } else {
    // Recurse, and match the extension case-insensitively. The previous flat
    // readdir missed docs/rules/sub/*.md and *.MD entirely, so the reported
    // count could be a lie and a 200KB rule could go unvalidated.
    const files = walkMarkdown(rulesDir, 'rule', fail);
    let count = 0;
    for (const fp of files) {
      count += 1;
      const name = path.relative(rulesDir, fp);
      const content = readTextOrFail(fp, `Rule ${name}`, fail);
      if (content === null) continue;
      const stat = fs.statSync(fp);
      // Strip fenced code so a documentation example cannot satisfy either
      // structural check.
      const structural = stripFencedCode(content);
      if (!/^# /m.test(structural)) fail(`Rule ${name} missing H1 header (# Title)`);
      if (!/^> \*\*Core Mandate:\*\*/m.test(structural)) warn(`Rule ${name} missing standardized '> **Core Mandate:**' summary`);
      if (stat.size > 24000) warn(`Rule ${name} exceeds 24KB token-economy cap (${stat.size} bytes)`);
    }
    // Progressive disclosure with zero rules defeats the purpose of the
    // directory, so an empty one is a failure, not a pass.
    if (count === 0) fail('docs/rules contains no .md rule files; progressive disclosure has nothing to disclose.');
    validatedRules = count;
    pass(`Validated ${count} modular rule files in docs/rules/.`);
  }

  let validatedSkills = 0;
  reporter.log('');
  reporter.heading('3. Checking Specialized Skills (.agents/skills)...');
  const skillsDir = path.join(workspaceRoot, '.agents', 'skills');
  if (!fs.existsSync(skillsDir)) {
    fail(`Missing .agents/skills directory at ${skillsDir}`);
  } else {
    const folders = readSkillFolders(skillsDir, fail);
    let count = 0;
    for (const skill of folders) {
      count += 1;
      const skillFile = path.join(skillsDir, skill, 'SKILL.md');
      if (!fs.existsSync(skillFile)) { fail(`Skill '${skill}' missing SKILL.md`); continue; }
      const content = readTextOrFail(skillFile, `Skill '${skill}'`, fail);
      if (content === null) continue;
      const lines = content.split('\n');
      if (lines[0].trim() !== '---') { fail(`Skill '${skill}' missing opening front matter delimiter (---)`); continue; }
      const closingIdx = lines.slice(1).findIndex((l) => l.trim() === '---');
      if (closingIdx === -1) fail(`Skill '${skill}' missing closing front matter delimiter (---)`);
      // Scope metadata lookups to the front-matter block only. Searching the
      // whole file let body prose or a fenced example satisfy the checks.
      const frontMatter = closingIdx === -1 ? '' : lines.slice(1, closingIdx + 1).join('\n');
      const nameMatch = frontMatter.match(/^name:\s*(.+)$/m);
      if (!nameMatch || nameMatch[1].trim() !== skill) fail(`Skill '${skill}' front matter 'name:' does not match directory name`);
      const descMatch = frontMatter.match(/^description:\s*(.+)$/m);
      // YAML block scalars (>- / |) put the real text on following indented
      // lines. Reading only the `>-` marker measured a 2-char "description" and
      // defeated the 1024-char context-budget cap, so fold them in.
      let desc = descMatch ? descMatch[1].trim() : '';
      if (/^[>|][-+]?$/.test(desc)) {
        const afterDesc = frontMatter.slice(frontMatter.indexOf(descMatch ? descMatch[0] : '') + (descMatch ? descMatch[0].length : 0));
        const folded = afterDesc.split('\n')
          .filter((l) => /^\s+\S/.test(l))
          .map((l) => l.trim())
          .join(' ');
        desc = folded.trim();
      }
      if (!desc) {
        fail(`Skill '${skill}' missing front matter 'description:'`);
      } else {
        if (!/^Use when/i.test(desc)) warn(`Skill '${skill}' description should start with imperative 'Use when...'`);
        if (!/do not use/i.test(desc)) warn(`Skill '${skill}' description should specify negative boundaries ('Do not use for...')`);
        if (desc.length > 1024) fail(`Skill '${skill}' description exceeds 1024 chars (${desc.length} chars)`);
      }
      if (lines.length > 500) warn(`Skill '${skill}' exceeds 500 lines (${lines.length} lines). Offload details to references/.`);
      else pass(`Skill '${skill}': ${lines.length} lines, description valid (${desc.length} chars).`);
      if (!/What NOT to do/i.test(content) && !/Gotchas/i.test(content)) {
        warn(`Skill '${skill}' missing mandatory 'Gotchas & What NOT to Do' section`);
      }
    }
    validatedSkills = count;
    pass(`Validated ${count} skills in .agents/skills/.`);
  }

  reporter.log('');
  reporter.heading('4. Checking Markdown Internal Links & Cross-References...');
  const broken = [];
  let totalLinks = 0;
  // Loop protection for the symlink-following walk below.
  let rootRealPath = '';
  try { rootRealPath = fs.realpathSync(workspaceRoot); } catch { rootRealPath = ''; }
  const visitedRealPaths = new Set([rootRealPath]);
  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      // A silently-skipped subtree yields "0 broken links" derived from zero
      // coverage, which is the worst outcome a checker can produce: a green
      // result that proves nothing. Report what could not be read instead.
      if (err instanceof RangeError) {
        // Stack exhaustion (needs a tree thousands of levels deep -- not
        // reproducible portably). Abort loudly rather than pretending clean.
        fail(`Directory traversal exhausted the stack at ${path.relative(workspaceRoot, dir) || '.'}; link validation is incomplete.`);
        return;
      }
      warn(`Skipped unreadable directory ${path.relative(workspaceRoot, dir) || '.'}: ${err.code || err.message}`);
      return;
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      // Symlinks and junctions report neither isDirectory() nor isFile(), so
      // they were previously skipped entirely -- a linked docs tree got zero
      // link coverage. Follow them with a visited-realpath set for loop safety.
      if (entry.isDirectory()) {
        walk(full);
      // Symlink following is unreachable on Windows without Developer Mode, so the
      // isSymbolicLink() arm is covered only on hosts that allow it.
      } else if (entry.isSymbolicLink()) {
        let real = null;
        try { real = fs.realpathSync(full); } catch { real = null; }
        if (real === null) {
          warn(`Skipped dangling symlink ${path.relative(workspaceRoot, full)}`);
          continue;
        }
        if (visitedRealPaths.has(real)) continue;
        visitedRealPaths.add(real);
        let st = null;
        try { st = fs.statSync(full); } catch { st = null; }
        if (st && st.isDirectory()) walk(full);
        else if (full.endsWith('.md')) checkFile(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        checkFile(full);
      }
    }
  }
  function checkFile(filePath) {
    // An unreadable markdown file must be reported, not allowed to abort the
    // entire validation run: the remaining files still need checking.
    const content = readTextOrFail(filePath, `markdown file ${path.relative(workspaceRoot, filePath)}`, fail);
    if (content === null) return;

    const dir = path.dirname(filePath);
    // Fenced examples are not links.
    const live = stripFencedCode(content);

    const checkTarget = (rawTarget, display) => {
      let target = rawTarget.trim();
      if (!target) return;
      // Link titles: [x](./a.md "Title") and 'Title' / (Title).
      target = target.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/, '').trim();
      // Angle-bracket destinations: [x](<./a.md>)
      const angled = target.match(/^<([^>]*)>$/);
      if (angled) target = angled[1].trim();
      // Strip a query string; strip a fragment.
      target = target.split('#')[0].split('?')[0];
      if (!target) return;
      // Schemes, case-insensitively. Protocol-relative and Windows absolute
      // paths are external too.
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return;
      if (target.startsWith('//')) return;
      if (/^[a-z]:[\\/]/i.test(target)) return;
      // Percent-decode so ./exists%2emd resolves like a renderer would.
      let decoded = target;
      try { decoded = decodeURIComponent(target); } catch { decoded = target; }
      totalLinks += 1;
      const resolved = path.normalize(path.join(dir, decoded));
      if (!fs.existsSync(resolved)) {
        broken.push(`${path.relative(workspaceRoot, filePath)} -> ${display}`);
      }
    };

    // Inline links: [text](target). Tolerates nested brackets in the link text,
    // which previously made `[click [here] now](./x)` unmatchable.
    const inline = /\[((?:[^\][]|\[[^\][]*\])*)\]\(([^)]*)\)/g;
    let m;
    while ((m = inline.exec(live)) !== null) {
      checkTarget(m[2], m[2].trim() || '(empty target)');
    }

    // Reference-style definitions: [ref]: ./target
    const reference = /^\s{0,3}\[[^\]]+\]:\s*(\S+)/gm;
    while ((m = reference.exec(live)) !== null) {
      checkTarget(m[1], m[1]);
    }

    // HTML anchors: <a href="./target">
    const html = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi;
    while ((m = html.exec(live)) !== null) {
      checkTarget(m[1], m[1]);
    }
  }
  walk(workspaceRoot);
  if (broken.length === 0) pass(`Validated ${totalLinks} internal links across workspace (0 broken links).`);
  else for (const b of broken) fail(`Broken markdown link: ${b}`);

  reporter.log('');
  reporter.heading('5. Checking Memory & ADR Ledger...');
  const memoryFile = path.join(workspaceRoot, 'memory.md');
  if (!fs.existsSync(memoryFile)) {
    fail('Missing memory.md ADR ledger.');
  } else {
    // readTextOrFail already reported any read failure; skip the analysis.
    const mem = readTextOrFail(memoryFile, 'memory.md', fail);
    if (mem !== null) {
    const { entryIds } = parseAdrLedger(mem);
    const withoutComments = stripFencedCode(stripHtmlComments(mem));
    if (!/^# /m.test(mem)) fail('memory.md missing H1 header');
    // Uses the same parser as phase 6. The previous unanchored
    // `/#### ADR-/` disagreed with phase 6's anchored form, so the validator
    // contradicted itself within a single run.
    else if (entryIds.length > 0) pass('memory.md contains ADR entries with valid envelope.');
    else pass('memory.md is a clean slate (no ADRs yet; record ADR-001 during /lets-build).');
    // Template ADRs start well past ADR-024. Match any ID >= 25 regardless of
    // zero padding. The previous alternation (`0?2[5-9]|[3-9]\d`) missed
    // ADR-030 because `0?` consumed the leading zero and then `[3-9]\d`
    // required the *remaining* digits to start at 3+.
    const highestAdr = Math.max(0, ...entryIds);
    if (highestAdr >= 25 && /azcodr/i.test(mem)) {
      warn('memory.md may contain template-internal ADRs; fresh projects must start at ADR-001.');
    }
    }
  }

  reporter.log('');
  reporter.heading('6. Checking ADR Index Consistency...');
  const adrConsistency = checkAdrIndexConsistency(workspaceRoot, fail, pass);
  if (adrConsistency === 'indexed' || adrConsistency === 'inconsistent') {
    checkGlossaryPopulated(workspaceRoot, fail, pass, warn);
  }

  reporter.log('');
  reporter.log('--------------------------------------------------------------');
  if (errors === 0) {
    reporter.log(`🎉 SUCCESS: All agentic configurations are valid and healthy! (${warnings} warnings)`);
  } else {
    reporter.log(`🚨 FAILURE: Found ${errors} error(s) and ${warnings} warning(s) in agentic configurations.`);
  }

  return {
    errors,
    warnings,
    validatedRules,
    validatedSkills,
    totalLinks,
    brokenLinks: broken
  };
}

function main(argv = process.argv.slice(2), exit = process.exit) {
  const workspaceRoot = path.resolve(parseArgs(argv));
  const result = runValidation(workspaceRoot);
  return exit(result.errors === 0 ? 0 : 1);
}

module.exports = {
  runValidation,
  parseArgs,
  createReporter,
  main,
  parseAdrLedger,
  checkAdrIndexConsistency,
  checkGlossaryPopulated,
  evaluateParityTarget,
  isValidAgentsTarget: isValidAgentsTargetFn,
  createLowercaseParityLink,
  stripHtmlComments,
  stripFencedCode,
  walkMarkdown
};

/* v8 ignore next 2 -- CLI entry: only reachable when this file is invoked
   directly, which the in-process test runner never does. main() itself is fully
   covered via tests/validate-parity.test.js with an injected exit(). */
/**
 * NOTE: this module is a library. It never self-executes, so importing it from
 * a test or another tool cannot trigger validation or call process.exit().
 * The CLI entry point lives in `scripts/validate-cli.js`.
 */
