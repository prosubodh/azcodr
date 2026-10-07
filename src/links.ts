import fs from 'node:fs';
import path from 'node:path';

export interface EnsureSymlinkOptions {
  targetDir: string;
  linkName: string;
  targetFileName: string;
  dryRun?: boolean;
}

interface BothEntriesExistOptions {
  targetDir: string;
  linkName: string;
  targetFileName: string;
  entries: readonly string[];
}

function namesDifferOnlyByCase(linkName: string, targetFileName: string): boolean {
  if (linkName.toLowerCase() !== targetFileName.toLowerCase()) return false;
  return linkName !== targetFileName;
}

function readDirEntries(targetDir: string): string[] | null {
  try {
    return fs.readdirSync(targetDir);
  } catch {
    return null;
  }
}

function bothEntriesExist(options: BothEntriesExistOptions): boolean {
  const { targetDir, linkName, targetFileName, entries } = options;
  if (!entries.includes(targetFileName) || !entries.includes(linkName)) return false;
  try {
    fs.lstatSync(path.join(targetDir, targetFileName));
    fs.lstatSync(path.join(targetDir, linkName));
    return true;
  } catch {
    return false;
  }
}

function accessiblePair(targetPath: string, linkPath: string): boolean {
  if (!fs.existsSync(targetPath) || !fs.existsSync(linkPath)) return false;
  try {
    fs.lstatSync(targetPath);
    fs.lstatSync(linkPath);
    return true;
  } catch {
    return false;
  }
}

function removeIfExists(linkPath: string): void {
  try {
    fs.lstatSync(linkPath);
    fs.rmSync(linkPath, { force: true });
  } catch {
    // Path does not exist, proceed
  }
}

function copyFallback(targetDir: string, linkName: string, targetFileName: string): void {
  const sourceFile = path.resolve(targetDir, targetFileName);
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, path.join(targetDir, linkName));
  }
}

/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 * Uses exact directory listing (not existsSync, which lies on case-insensitive systems).
 */
export function isSameCaseInsensitiveFile(
  targetDir: string,
  linkName: string,
  targetFileName: string
): boolean {
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

/**
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 */
export function ensureSymlink(options: EnsureSymlinkOptions): boolean {
  const { targetDir, linkName, targetFileName, dryRun = false } = options;
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
export function ensureSymlinkOrPointer(options: EnsureSymlinkOptions): boolean {
  const { targetDir, linkName, targetFileName, dryRun = false } = options;
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

export default {
  isSameCaseInsensitiveFile,
  ensureSymlink,
  ensureSymlinkOrPointer
};
