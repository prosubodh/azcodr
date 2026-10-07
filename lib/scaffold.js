'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

/**
 * Socket-hardened process boundary (Supply Chain: shell access).
 * Scaffolder must spawn `git`, but never via a shell string.
 * Uses execFileSync with argv (shell:false) and an explicit subcommand allowlist.
 * No network, no env exfiltration; cwd is constrained to targetDir callers.
 */
const GIT_ALLOWED_SUBCOMMANDS = new Set(['rev-parse', 'init', 'branch', 'add', 'commit']);

/**
 * Coded error type. Consumers branch on `err.code`, never on message text:
 * a wording change must never be a breaking change (learned from typed-settings,
 * where `docs/errors.md` explicitly tells users not to regex the message).
 * Documented codes are enumerated in ERROR_CODES below and pinned by
 * tests/error-codes.test.js.
 */
const ERROR_CODES = {
  E_TARGET_IS_TEMPLATE: 'Cannot scaffold into the azcodr template directory itself',
  E_TARGET_NOT_EMPTY: 'Target directory is not empty',
  E_GIT_ARGS_INVALID: 'runGit requires a non-empty argv array',
  E_GIT_BLOCKED: 'Blocked git subcommand',
  E_PATH_ESCAPE: 'Path escapes allowed root'
};

class ScaffoldError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ScaffoldError';
    this.code = code;
  }
}

function runGit(args, options = {}) {
  if (!Array.isArray(args) || args.length === 0) {
    throw new ScaffoldError('E_GIT_ARGS_INVALID', ERROR_CODES.E_GIT_ARGS_INVALID);
  }
  if (!GIT_ALLOWED_SUBCOMMANDS.has(args[0])) {
    throw new ScaffoldError('E_GIT_BLOCKED', `${ERROR_CODES.E_GIT_BLOCKED}: ${String(args[0])}`);
  }
  return cp.execFileSync('git', args, {
    encoding: 'utf-8',
    stdio: 'pipe',
    shell: false,
    ...options
  });
}

/**
 * Filesystem scope guard (Supply Chain: filesystem access).
 * Constrains all reads/writes to targetDir / templateDir.
 */
function assertInside(root, candidate, message) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(root, candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new ScaffoldError('E_PATH_ESCAPE', message || `${ERROR_CODES.E_PATH_ESCAPE}: ${candidate}`);
  }
}

const TEMPLATE_ITEMS = [
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

/**
 * Returns the root path to the azcodr template files.
 */
function getTemplateDir() {
  return path.resolve(__dirname, '..');
}

/**
 * Validates the target directory to ensure it is suitable for scaffolding.
 */
function validateTarget(targetDir, options = {}) {
  const { templateDir = getTemplateDir(), force = false, dryRun = false } = options;
  const resolvedTarget = path.resolve(targetDir);
  const resolvedTemplate = path.resolve(templateDir);

  if (resolvedTarget === resolvedTemplate) {
    throw new ScaffoldError(
      'E_TARGET_IS_TEMPLATE',
      `${ERROR_CODES.E_TARGET_IS_TEMPLATE}: ${resolvedTarget}`
    );
  }

  if (!fs.existsSync(resolvedTarget)) {
    if (!dryRun) {
      fs.mkdirSync(resolvedTarget, { recursive: true });
    }
    return;
  }

  const entries = fs.readdirSync(resolvedTarget);
  if (entries.length > 0 && !force) {
    throw new ScaffoldError(
      'E_TARGET_NOT_EMPTY',
      `${ERROR_CODES.E_TARGET_NOT_EMPTY} (${entries.length} items found: ${resolvedTarget}). ` +
      `Use --force to overwrite existing files.`
    );
  }
}

/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 * Uses exact directory listing (not existsSync, which lies on case-insensitive systems).
 */
function isSameCaseInsensitiveFile(targetDir, linkName, targetFileName) {
  if (linkName.toLowerCase() !== targetFileName.toLowerCase()) {
    return false;
  }
  if (linkName === targetFileName) {
    return true;
  }
  let entries;
  try {
    entries = fs.readdirSync(targetDir);
  } catch {
    return false;
  }
  const targetPath = path.join(targetDir, targetFileName);
  const linkPath = path.join(targetDir, linkName);
  const hasTargetExact = entries.includes(targetFileName);
  const hasLinkExact = entries.includes(linkName);
  try {
    if (hasTargetExact && hasLinkExact) {
      if (fs.existsSync(targetPath) && fs.existsSync(linkPath)) {
        return !fs.lstatSync(linkPath).isSymbolicLink();
      }
      return false;
    }
    if (fs.existsSync(targetPath) && fs.existsSync(linkPath)) {
      // Case-insensitive collision: verify entries are accessible (throws on disk error).
      fs.lstatSync(targetPath);
      fs.lstatSync(linkPath);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 */
function ensureSymlink(targetDir, linkName, targetFileName, dryRun = false) {
  if (dryRun) return true;

  if (isSameCaseInsensitiveFile(targetDir, linkName, targetFileName)) {
    return true;
  }

  const linkPath = path.join(targetDir, linkName);
  try {
    fs.lstatSync(linkPath);
    fs.rmSync(linkPath, { force: true });
  } catch {
    // Path does not exist, proceed
  }

  try {
    fs.symlinkSync(targetFileName, linkPath, 'file');
    return true;
  } catch {
    // Fallback if environment (e.g., certain Windows configs) prevents symlink creation
    const sourceFile = path.resolve(targetDir, targetFileName);
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, linkPath);
    }
    return true;
  }
}

/**
 * Creates a symlink, falling back to a text pointer (not a full copy).
 * Used for .github/copilot-instructions.md where a full AGENTS.md copy would
 * break relative markdown links (they resolve from .github/, not root).
 */
function ensureSymlinkOrPointer(targetDir, linkName, targetFileName, dryRun = false) {
  if (dryRun) return true;

  const linkPath = path.join(targetDir, linkName);
  try {
    try {
      fs.lstatSync(linkPath);
      const existing = fs.existsSync(linkPath) ? fs.readFileSync(linkPath, 'utf-8') : '';
      if (existing.trim() === targetFileName) return true;
      fs.rmSync(linkPath, { force: true });
    } catch {
      // Path does not exist, proceed
    }
    fs.symlinkSync(targetFileName, linkPath, 'file');
    return true;
  } catch {
    fs.writeFileSync(linkPath, `${targetFileName}\n`, 'utf-8');
    return true;
  }
}

/**
 * Ensures all bash scripts in agent and skill directories have executable permissions (0o755).
 */
function makeScriptsExecutable(targetDir, dryRun = false) {
  const modified = [];

  const agentScriptsDir = path.join(targetDir, '.agents', 'scripts');
  if (fs.existsSync(agentScriptsDir) && fs.statSync(agentScriptsDir).isDirectory()) {
    const files = fs.readdirSync(agentScriptsDir);
    for (const file of files) {
      if (file.endsWith('.sh')) {
        const filePath = path.join(agentScriptsDir, file);
        modified.push(filePath);
        if (!dryRun) {
          try {
            fs.chmodSync(filePath, 0o755);
          } catch {
            // Non-critical if filesystem does not support POSIX permissions
          }
        }
      }
    }
  }

  const skillsDir = path.join(targetDir, '.agents', 'skills');
  if (!fs.existsSync(skillsDir)) return modified;

  const skills = fs.readdirSync(skillsDir);
  for (const skill of skills) {
    const scriptsDir = path.join(skillsDir, skill, 'scripts');
    if (fs.existsSync(scriptsDir) && fs.statSync(scriptsDir).isDirectory()) {
      const files = fs.readdirSync(scriptsDir);
      for (const file of files) {
        if (file.endsWith('.sh')) {
          const filePath = path.join(scriptsDir, file);
          modified.push(filePath);
          if (!dryRun) {
            try {
              fs.chmodSync(filePath, 0o755);
            } catch {
              // Non-critical if filesystem does not support POSIX permissions
            }
          }
        }
      }
    }
  }
  return modified;
}

/**
 * Recursively copies template files into the target directory and sets up symlinks and permissions.
 * Socket note: filesystem access is scoped to templateDir -> targetDir only (assertInside).
 */
function copyTemplate(targetDir, templateDir = getTemplateDir(), options = {}) {
  const { dryRun = false } = options;
  const resolvedTarget = path.resolve(targetDir);
  const resolvedTemplate = path.resolve(templateDir);
  const actions = [];

  if (!dryRun && !fs.existsSync(resolvedTarget)) {
    fs.mkdirSync(resolvedTarget, { recursive: true });
  }

  for (const item of TEMPLATE_ITEMS) {
    let srcPath = path.join(resolvedTemplate, item);
    if (item === '.gitignore' && !fs.existsSync(srcPath)) {
      const npmIgnorePath = path.join(resolvedTemplate, '.npmignore');
      if (fs.existsSync(npmIgnorePath)) {
        srcPath = npmIgnorePath;
      }
    }
    if (!fs.existsSync(srcPath)) continue;

    const destPath = path.join(resolvedTarget, item);
    assertInside(resolvedTemplate, srcPath);
    assertInside(resolvedTarget, destPath);
    actions.push(`copy: ${item} -> ${destPath}`);

    if (!dryRun) {
      fs.cpSync(srcPath, destPath, { recursive: true, force: true, dereference: false });
    }
  }

  // Ensure harness parity symlinks per AGENTS.md mandate
  actions.push(`symlink: CLAUDE.md -> AGENTS.md`);
  ensureSymlink(resolvedTarget, 'CLAUDE.md', 'AGENTS.md', dryRun);

  actions.push(`symlink: agents.md -> AGENTS.md`);
  ensureSymlink(resolvedTarget, 'agents.md', 'AGENTS.md', dryRun);

  actions.push(`symlink: GEMINI.md -> AGENTS.md`);
  ensureSymlink(resolvedTarget, 'GEMINI.md', 'AGENTS.md', dryRun);

  actions.push(`symlink: .cursorrules -> AGENTS.md`);
  ensureSymlink(resolvedTarget, '.cursorrules', 'AGENTS.md', dryRun);

  actions.push(`symlink: .windsurfrules -> AGENTS.md`);
  ensureSymlink(resolvedTarget, '.windsurfrules', 'AGENTS.md', dryRun);

  // GitHub Copilot harness parity (text-pointer fallback preserves relative links)
  const githubDir = path.join(resolvedTarget, '.github');
  if (!dryRun && !fs.existsSync(githubDir)) {
    fs.mkdirSync(githubDir, { recursive: true });
  }
  actions.push(`symlink: .github/copilot-instructions.md -> ../AGENTS.md`);
  ensureSymlinkOrPointer(githubDir, 'copilot-instructions.md', '../AGENTS.md', dryRun);

  // Starter package.json for project scripts validation
  const pkgJsonPath = path.join(resolvedTarget, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    actions.push('create: package.json');
    if (!dryRun) {
      const projectName = path.basename(resolvedTarget) || 'my-project';
      const starterPkg = {
        name: projectName,
        version: '0.1.0',
        private: true,
        description: 'Scaffolded with azcodr enterprise architecture template',
        scripts: {
          test: 'node --test',
          'test:coverage': 'node scripts/test_coverage.js',
          lint: 'echo "No linter configured yet. Run /lets-build to configure toolchain."',
          validate: 'node scripts/validate-cli.js'
        }
      };
      fs.writeFileSync(pkgJsonPath, JSON.stringify(starterPkg, null, 2) + '\n', 'utf-8');
    }
  }

  // Ensure scripts are executable
  const inspectDir = dryRun ? resolvedTemplate : resolvedTarget;
  const scripts = makeScriptsExecutable(inspectDir, dryRun);
  for (const script of scripts) {
    actions.push(`chmod: +x ${path.relative(inspectDir, script)}`);
  }

  return actions;
}

/**
 * Detects whether targetDir is already inside an existing Git worktree.
 * Socket note: shell access is limited to `git rev-parse` via runGit (no shell).
 */
function isInsideGitWorkTree(targetDir) {
  try {
    const checkDir = fs.existsSync(targetDir) ? targetDir : path.dirname(targetDir);
    const out = runGit(['rev-parse', '--is-inside-work-tree'], {
      cwd: checkDir,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return String(out).trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Initializes a git repository in the target directory if not already inside one.
 * Socket note: only allowlisted `git init/branch/add/commit` via execFileSync, cwd scoped.
 */
function initGit(targetDir, options = {}) {
  const { noGit = false, dryRun = false } = options;
  if (noGit) return false;

  const gitDir = path.join(targetDir, '.git');
  if (fs.existsSync(gitDir)) return false;

  if (isInsideGitWorkTree(targetDir)) return false;

  if (dryRun) {
    return true;
  }

  try {
    try {
      runGit(['init', '-b', 'main', '-q'], { cwd: targetDir, stdio: 'ignore' });
    } catch {
      runGit(['init', '-q'], { cwd: targetDir, stdio: 'ignore' });
      try {
        runGit(['branch', '-m', 'main'], { cwd: targetDir, stdio: 'ignore' });
      } catch {
        // Non-critical if branch rename fails
      }
    }

    try {
      runGit(['add', '-A'], { cwd: targetDir, stdio: 'ignore' });
      try {
        runGit(['commit', '-q', '-m', 'chore: initial scaffold from azcodr template'], {
          cwd: targetDir,
          stdio: 'ignore'
        });
      } catch {
        runGit(['commit', '-q', '-m', 'chore: initial scaffold from azcodr template'], {
          cwd: targetDir,
          stdio: 'ignore',
          env: {
            ...process.env,
            GIT_AUTHOR_NAME: 'Subodh Khanal',
            GIT_AUTHOR_EMAIL: 'prosubodh@gmail.com',
            GIT_COMMITTER_NAME: 'Subodh Khanal',
            GIT_COMMITTER_EMAIL: 'prosubodh@gmail.com'
          }
        });
      }
    } catch {
      // Non-critical if initial commit fails
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * High-level orchestration function to scaffold the azcodr workspace into targetDir.
 */
function scaffold(options = {}) {
  const {
    targetDir = process.cwd(),
    force = false,
    noGit = false,
    templateDir = getTemplateDir(),
    dryRun = false,
    silent = false
  } = options;

  const resolvedTarget = path.resolve(targetDir);
  validateTarget(resolvedTarget, { templateDir, force, dryRun });
  const actions = copyTemplate(resolvedTarget, templateDir, { dryRun });
  const gitInitialized = initGit(resolvedTarget, { noGit, dryRun });
  if (gitInitialized) {
    actions.push('git: initialize repository');
  }

  return {
    success: true,
    targetDir: resolvedTarget,
    gitInitialized,
    dryRun,
    actions
  };
}

module.exports = {
  scaffold,
  validateTarget,
  copyTemplate,
  ensureSymlink,
  ensureSymlinkOrPointer,
  isSameCaseInsensitiveFile,
  makeScriptsExecutable,
  isInsideGitWorkTree,
  initGit,
  getTemplateDir,
  runGit,
  assertInside,
  TEMPLATE_ITEMS,
  ScaffoldError,
  ERROR_CODES
};
