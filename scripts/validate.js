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

function main() {
  const workspaceRoot = path.resolve(parseArgs(process.argv.slice(2)));
  let errors = 0;
  let warnings = 0;

  const pass = (msg) => console.log(`  ✅ ${msg}`);
  const warn = (msg) => { warnings += 1; console.log(`  ⚠️  ${msg}`); };
  const fail = (msg) => { errors += 1; console.log(`  ❌ ${msg}`); };

  console.log(`🔍 Validating Agentic Architecture in: ${workspaceRoot}`);
  console.log('--------------------------------------------------------------');

  console.log('1. Checking Root Configuration & Symlinks...');
  const agentsFile = path.join(workspaceRoot, 'AGENTS.md');
  if (!fs.existsSync(agentsFile)) {
    fail(`Missing root AGENTS.md at ${agentsFile}`);
  } else {
    pass('AGENTS.md exists.');
    const lines = fs.readFileSync(agentsFile, 'utf-8').split('\n').length;
    if (lines <= 120) pass(`AGENTS.md line count is lean: ${lines} lines (<= 120).`);
    else if (lines <= 150) warn(`AGENTS.md line count is getting large: ${lines} lines (warn > 120).`);
    else fail(`AGENTS.md exceeds maximum line limit: ${lines} lines (max 150).`);
  }

  const agentsContent = fs.existsSync(agentsFile) ? fs.readFileSync(agentsFile, 'utf-8') : '';

  function isValidAgentsTarget(target) {
    return target === 'AGENTS.md' || target === './AGENTS.md' || target === agentsFile;
  }

  function checkParity(filePath, label, allowCopyFallback) {
    let stat = null;
    try { stat = fs.lstatSync(filePath); } catch { fail(`${label} is missing.`); return; }
    if (stat.isSymbolicLink()) {
      let target = '';
      try { target = fs.readlinkSync(filePath); } catch { fail(`${label} readlink failed.`); return; }
      const ok = label.endsWith('copilot-instructions.md')
        ? (target === '../AGENTS.md' || target === agentsFile || target === 'AGENTS.md')
        : isValidAgentsTarget(target);
      if (ok) pass(`${label} is a valid symlink to AGENTS.md.`);
      else fail(`${label} points to '${target}' instead of 'AGENTS.md'.`);
      return;
    }
    if (stat.isFile()) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const trimmed = content.trim();
      if (trimmed === 'AGENTS.md' || trimmed === './AGENTS.md' || trimmed === agentsFile) {
        pass(`${label} is a text pointer to AGENTS.md (symlink fallback).`);
        return;
      }
      if (label.endsWith('copilot-instructions.md') && content.includes('AGENTS.md')) {
        pass(`${label} references AGENTS.md (symlink fallback).`);
        return;
      }
      if (allowCopyFallback && agentsContent && content === agentsContent) {
        warn(`${label} is a byte-identical copy of AGENTS.md (Windows symlink fallback; drift risk).`);
        return;
      }
      if (label === 'agents.md') {
        try {
          const entries = fs.readdirSync(workspaceRoot);
          if (!entries.includes('agents.md') && entries.includes('AGENTS.md')) {
            pass('agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).');
            return;
          }
        } catch { /* fall through */ }
      }
      fail(`${label} is not a symbolic link.`);
      return;
    }
    fail(`${label} is neither a symlink nor a regular file.`);
  }

  checkParity(path.join(workspaceRoot, 'CLAUDE.md'), 'CLAUDE.md', true);
  const lowerPath = path.join(workspaceRoot, 'agents.md');
  try {
    const entries = fs.readdirSync(workspaceRoot);
    const hasUpper = entries.includes('AGENTS.md');
    const hasLowerExact = entries.includes('agents.md');
    if (hasUpper && !hasLowerExact) {
      let appearsSame = false;
      try { appearsSame = fs.existsSync(lowerPath); } catch { appearsSame = false; }
      if (appearsSame) {
        pass('agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).');
      } else {
        checkParity(lowerPath, 'agents.md', true);
      }
    } else {
      checkParity(lowerPath, 'agents.md', true);
    }
  } catch {
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

  console.log('');
  console.log('2. Checking Progressive Disclosure Rules...');
  const rulesDir = path.join(workspaceRoot, 'docs', 'rules');
  if (!fs.existsSync(rulesDir)) {
    fail(`Missing docs/rules directory at ${rulesDir}`);
  } else {
    const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
    let count = 0;
    for (const name of files) {
      count += 1;
      const fp = path.join(rulesDir, name);
      const content = fs.readFileSync(fp, 'utf-8');
      const stat = fs.statSync(fp);
      if (!/^# /m.test(content)) fail(`Rule ${name} missing H1 header (# Title)`);
      if (!/^> \*\*Core Mandate:\*\*/m.test(content)) warn(`Rule ${name} missing standardized '> **Core Mandate:**' summary`);
      if (stat.size > 24000) warn(`Rule ${name} exceeds 24KB token-economy cap (${stat.size} bytes)`);
    }
    pass(`Validated ${count} modular rule files in docs/rules/.`);
  }

  console.log('');
  console.log('3. Checking Specialized Skills (.agents/skills)...');
  const skillsDir = path.join(workspaceRoot, '.agents', 'skills');
  if (!fs.existsSync(skillsDir)) {
    fail(`Missing .agents/skills directory at ${skillsDir}`);
  } else {
    const folders = fs.readdirSync(skillsDir).filter((f) => fs.statSync(path.join(skillsDir, f)).isDirectory());
    let count = 0;
    for (const skill of folders) {
      count += 1;
      const skillFile = path.join(skillsDir, skill, 'SKILL.md');
      if (!fs.existsSync(skillFile)) { fail(`Skill '${skill}' missing SKILL.md`); continue; }
      const content = fs.readFileSync(skillFile, 'utf-8');
      const lines = content.split('\n');
      if (lines[0].trim() !== '---') { fail(`Skill '${skill}' missing opening front matter delimiter (---)`); continue; }
      const closing = lines.slice(1).findIndex((l) => l.trim() === '---');
      if (closing === -1) fail(`Skill '${skill}' missing closing front matter delimiter (---)`);
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      if (!nameMatch || nameMatch[1].trim() !== skill) fail(`Skill '${skill}' front matter 'name:' does not match directory name`);
      const descMatch = content.match(/^description:\s*(.+)$/m);
      const desc = descMatch ? descMatch[1].trim() : '';
      if (!desc) {
        fail(`Skill '${skill}' missing front matter 'description:'`);
      } else {
        if (!/^Use when/.test(desc)) warn(`Skill '${skill}' description should start with imperative 'Use when...'`);
        if (!/do not use/i.test(desc)) warn(`Skill '${skill}' description should specify negative boundaries ('Do not use for...')`);
        if (desc.length > 1024) fail(`Skill '${skill}' description exceeds 1024 chars (${desc.length} chars)`);
      }
      if (lines.length > 500) warn(`Skill '${skill}' exceeds 500 lines (${lines.length} lines). Offload details to references/.`);
      else pass(`Skill '${skill}': ${lines.length} lines, description valid (${desc.length} chars).`);
      if (!/What NOT to do/i.test(content) && !/Gotchas/i.test(content)) {
        warn(`Skill '${skill}' missing mandatory 'Gotchas & What NOT to Do' section`);
      }
    }
    pass(`Validated ${count} skills in .agents/skills/.`);
  }

  console.log('');
  console.log('4. Checking Markdown Internal Links & Cross-References...');
  const broken = [];
  let totalLinks = 0;
  function walk(dir) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) checkFile(full);
    }
  }
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dir = path.dirname(filePath);
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const target = m[2].trim();
      if (/^(https?:|mailto:|#|conversation:\/\/|file:\/\/)/.test(target)) continue;
      const clean = target.split('#')[0];
      if (!clean) continue;
      totalLinks += 1;
      if (!fs.existsSync(path.normalize(path.join(dir, clean)))) {
        broken.push(`${path.relative(workspaceRoot, filePath)} -> ${target}`);
      }
    }
  }
  walk(workspaceRoot);
  if (broken.length === 0) pass(`Validated ${totalLinks} internal links across workspace (0 broken links).`);
  else for (const b of broken) fail(`Broken markdown link: ${b}`);

  console.log('');
  console.log('5. Checking Memory & ADR Ledger...');
  const memoryFile = path.join(workspaceRoot, 'memory.md');
  if (!fs.existsSync(memoryFile)) {
    fail('Missing memory.md ADR ledger.');
  } else {
    const mem = fs.readFileSync(memoryFile, 'utf-8');
    const withoutComments = mem.replace(/<!--[\s\S]*?-->/g, '');
    if (!/^# /m.test(mem)) fail('memory.md missing H1 header');
    else if (/#### ADR-/.test(withoutComments)) pass('memory.md contains ADR entries with valid envelope.');
    else pass('memory.md is a clean slate (no ADRs yet; record ADR-001 during /lets-build).');
    if (/ADR-025|ADR-028/.test(withoutComments) && /azcodr/i.test(mem)) {
      warn('memory.md may contain template-internal ADRs; fresh projects must start at ADR-001.');
    }
  }

  console.log('');
  console.log('--------------------------------------------------------------');
  if (errors === 0) {
    console.log(`🎉 SUCCESS: All agentic configurations are valid and healthy! (${warnings} warnings)`);
    process.exit(0);
  } else {
    console.log(`🚨 FAILURE: Found ${errors} error(s) and ${warnings} warning(s) in agentic configurations.`);
    process.exit(1);
  }
}

main();
