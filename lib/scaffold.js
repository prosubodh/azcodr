'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const TEMPLATE_ITEMS = [
  'AGENTS.md',
  'memory.md',
  'README.md',
  'docs',
  '.agents',
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
    throw new Error(`Cannot scaffold into the azcodr template directory itself: ${resolvedTarget}`);
  }

  if (!fs.existsSync(resolvedTarget)) {
    if (!dryRun) {
      fs.mkdirSync(resolvedTarget, { recursive: true });
    }
    return;
  }

  const entries = fs.readdirSync(resolvedTarget);
  if (entries.length > 0 && !force) {
    throw new Error(
      `Target directory is not empty (${entries.length} items found: ${resolvedTarget}). ` +
      `Use --force to overwrite existing files.`
    );
  }
}

/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 */
function isSameCaseInsensitiveFile(targetDir, linkName, targetFileName) {
  if (linkName.toLowerCase() !== targetFileName.toLowerCase()) {
    return false;
  }
  const targetPath = path.join(targetDir, targetFileName);
  const linkPath = path.join(targetDir, linkName);
  try {
    if (fs.existsSync(targetPath) && fs.existsSync(linkPath)) {
      return !fs.lstatSync(linkPath).isSymbolicLink();
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
    const stat = fs.lstatSync(linkPath);
    if (stat) {
      fs.rmSync(linkPath, { force: true });
    }
  } catch {
    // Path does not exist, proceed
  }

  try {
    fs.symlinkSync(targetFileName, linkPath);
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

  // GitHub Copilot harness parity
  const githubDir = path.join(resolvedTarget, '.github');
  if (!dryRun && !fs.existsSync(githubDir)) {
    fs.mkdirSync(githubDir, { recursive: true });
  }
  actions.push(`symlink: .github/copilot-instructions.md -> ../AGENTS.md`);
  ensureSymlink(githubDir, 'copilot-instructions.md', '../AGENTS.md', dryRun);

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
          'test:coverage': 'node --test --experimental-test-coverage',
          lint: 'echo "No linter configured yet. Run /lets-build to configure toolchain."',
          validate: 'bash .agents/skills/agentic-architect/scripts/validate_agentic_configs.sh'
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
 */
function isInsideGitWorkTree(targetDir) {
  try {
    const checkDir = fs.existsSync(targetDir) ? targetDir : path.dirname(targetDir);
    const out = cp.execSync('git rev-parse --is-inside-work-tree', {
      cwd: checkDir,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8'
    });
    return out.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Initializes a git repository in the target directory if not already inside one.
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
      cp.execSync('git init -b main -q', { cwd: targetDir, stdio: 'ignore' });
    } catch {
      cp.execSync('git init -q', { cwd: targetDir, stdio: 'ignore' });
      try {
        cp.execSync('git branch -m main', { cwd: targetDir, stdio: 'ignore' });
      } catch {
        // Non-critical if branch rename fails
      }
    }

    try {
      cp.execSync('git add -A', { cwd: targetDir, stdio: 'ignore' });
      try {
        cp.execSync('git commit -q -m "chore: initial scaffold from azcodr template"', {
          cwd: targetDir,
          stdio: 'ignore'
        });
      } catch {
        cp.execSync('git -c user.name="azcodr" -c user.email="azcodr@local" commit -q -m "chore: initial scaffold from azcodr template"', {
          cwd: targetDir,
          stdio: 'ignore'
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
  isSameCaseInsensitiveFile,
  makeScriptsExecutable,
  isInsideGitWorkTree,
  initGit,
  getTemplateDir,
  TEMPLATE_ITEMS
};
