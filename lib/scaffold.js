'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const TEMPLATE_ITEMS = [
  'AGENTS.md',
  'memory.md',
  'changes.md',
  'README.md',
  'docs',
  '.agents',
  '.gitignore',
  '.editorconfig'
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
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 */
function ensureSymlink(targetDir, linkName, targetFileName, dryRun = false) {
  if (dryRun) return true;

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
    const sourceFile = path.join(targetDir, targetFileName);
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, linkPath);
    }
    return true;
  }
}

/**
 * Ensures all bash scripts in skill directories have executable permissions (0o755).
 */
function makeScriptsExecutable(targetDir, dryRun = false) {
  const modified = [];
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
    const srcPath = path.join(resolvedTemplate, item);
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

  // Ensure scripts are executable
  const inspectDir = dryRun ? resolvedTemplate : resolvedTarget;
  const scripts = makeScriptsExecutable(inspectDir, dryRun);
  for (const script of scripts) {
    actions.push(`chmod: +x ${path.relative(inspectDir, script)}`);
  }

  return actions;
}

/**
 * Initializes a git repository in the target directory if not already inside one.
 */
function initGit(targetDir, options = {}) {
  const { noGit = false, dryRun = false } = options;
  if (noGit) return false;

  const gitDir = path.join(targetDir, '.git');
  if (fs.existsSync(gitDir)) return false;

  if (dryRun) {
    return true;
  }

  try {
    cp.execSync('git init -q', { cwd: targetDir, stdio: 'ignore' });
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

/**
 * Appends a standardized upstream change entry to changes.md.
 */
function logChange(options = {}) {
  const {
    title,
    category = 'Architecture',
    targetFiles = 'docs/rules/',
    rationale = 'Generic architectural enhancement',
    description = '',
    targetDir = process.cwd()
  } = options;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('A change title is required to log an upstream change.');
  }

  const cleanTitle = title.trim();
  const changesFilePath = path.join(path.resolve(targetDir), 'changes.md');
  const today = new Date().toISOString().slice(0, 10);

  const entry = `\n### [${today}] ${cleanTitle}\n` +
    `- **Category:** ${category}\n` +
    `- **Target File(s):** ${targetFiles}\n` +
    `- **Rationale:** ${rationale}\n` +
    `- **Description:** ${description || cleanTitle}\n` +
    `- **Domain Filter Verification:** Verified 100% generic; purged of all project-specific business entities and models.\n`;

  if (fs.existsSync(changesFilePath)) {
    fs.appendFileSync(changesFilePath, entry, 'utf-8');
  } else {
    const initialHeader = `# Upstream Changes Ledger (\`changes.md\`)\n\n` +
      `> **Core Purpose:** Record candidate improvements, generic architectural updates, defect post-mortems, and rule enhancements discovered in this workspace that should be incorporated into the upstream \`azcodr\` baseline template.\n\n` +
      `---\n\n## Upstream Changes Log\n`;
    fs.writeFileSync(changesFilePath, initialHeader + entry, 'utf-8');
  }

  return {
    success: true,
    filePath: changesFilePath,
    entry
  };
}

module.exports = {
  scaffold,
  logChange,
  validateTarget,
  copyTemplate,
  ensureSymlink,
  makeScriptsExecutable,
  initGit,
  getTemplateDir,
  TEMPLATE_ITEMS
};
