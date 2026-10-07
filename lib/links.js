'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 * Uses exact directory listing (not existsSync, which lies on case-insensitive systems).
 */
function namesDifferOnlyByCase(linkName, targetFileName) {
  if (linkName.toLowerCase() !== targetFileName.toLowerCase()) return false;
  return linkName !== targetFileName;
}

function readDirEntries(targetDir) {
  try {
    return fs.readdirSync(targetDir);
  } catch {
    return null;
  }
}

function bothEntriesExist({ targetDir, linkName, targetFileName, entries }) {
  if (!entries.includes(targetFileName) || !entries.includes(linkName)) return false;
  try {
    fs.lstatSync(path.join(targetDir, targetFileName));
    fs.lstatSync(path.join(targetDir, linkName));
    return true;
  } catch {
    return false;
  }
}

function accessiblePair(targetPath, linkPath) {
  // Case-insensitive collision: the listing holds one spelling while both
  // paths resolve. Verify the entries are accessible (throws on disk error).
  if (!fs.existsSync(targetPath) || !fs.existsSync(linkPath)) return false;
  try {
    fs.lstatSync(targetPath);
    fs.lstatSync(linkPath);
  } catch {
    return false;
  }
  return true;
}

function isSameCaseInsensitiveFile(targetDir, linkName, targetFileName) {
  if (linkName === targetFileName) return true;
  if (!namesDifferOnlyByCase(linkName, targetFileName)) return false;
  const entries = readDirEntries(targetDir);
  if (entries === null) return false;
  if (bothEntriesExist({ targetDir, linkName, targetFileName, entries })) {
    return !fs.lstatSync(path.join(targetDir, linkName)).isSymbolicLink();
  }
  const targetPath = path.join(targetDir, targetFileName);
  const linkPath = path.join(targetDir, linkName);
  return accessiblePair(targetPath, linkPath);
}

function removeIfExists(linkPath) {
  try {
    fs.lstatSync(linkPath);
    fs.rmSync(linkPath, { force: true });
  } catch {
    // Path does not exist, proceed
  }
}

function copyFallback(targetDir, linkName, targetFileName) {
  // Fallback if environment (e.g., certain Windows configs) prevents symlink creation
  const sourceFile = path.resolve(targetDir, targetFileName);
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, path.join(targetDir, linkName));
  }
}

/**
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 */
function ensureSymlink({ targetDir, linkName, targetFileName, dryRun = false }) {
  if (dryRun) return true;
  if (isSameCaseInsensitiveFile(targetDir, linkName, targetFileName)) return true;
  const linkPath = path.join(targetDir, linkName);
  removeIfExists(linkPath);
  try {
    fs.symlinkSync(targetFileName, linkPath, 'file');
    return true;
  } catch {
    copyFallback(targetDir, linkName, targetFileName);
    return true;
  }
}

/**
 * Creates a symlink, falling back to a text pointer (not a full copy).
 * Used for .github/copilot-instructions.md where a full AGENTS.md copy would
 * break relative markdown links (they resolve from .github/, not root).
 */
function ensureSymlinkOrPointer({ targetDir, linkName, targetFileName, dryRun = false }) {
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

module.exports = {
  isSameCaseInsensitiveFile,
  ensureSymlink,
  ensureSymlinkOrPointer
};
