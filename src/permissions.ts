import fs from 'node:fs';
import path from 'node:path';

function chmodShFile(filePath: string, dryRun: boolean): void {
  if (dryRun) return;
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // Non-critical if filesystem does not support POSIX permissions
  }
}

function chmodShFilesIn(scriptsDir: string, dryRun: boolean): string[] {
  const modified: string[] = [];
  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory()) return modified;
  const files = fs.readdirSync(scriptsDir);
  for (const file of files) {
    if (!file.endsWith('.sh')) continue;
    const filePath = path.join(scriptsDir, file);
    modified.push(filePath);
    chmodShFile(filePath, dryRun);
  }
  return modified;
}

/**
 * Ensures all bash scripts in agent and skill directories have executable permissions (0o755).
 *
 * @param targetDir - Root directory containing .agents and skills.
 * @param dryRun - When true, simulates permission changes without modifying disk.
 * @returns Array of file paths that were modified or would be modified.
 */
export function makeScriptsExecutable(targetDir: string, dryRun = false): string[] {
  const agentScriptsDir = path.join(targetDir, '.agents', 'scripts');
  const modified = chmodShFilesIn(agentScriptsDir, dryRun);
  const skillsDir = path.join(targetDir, '.agents', 'skills');
  if (!fs.existsSync(skillsDir)) return modified;
  const skills = fs.readdirSync(skillsDir);
  for (const skill of skills) {
    const scriptsDir = path.join(skillsDir, skill, 'scripts');
    modified.push(...chmodShFilesIn(scriptsDir, dryRun));
  }
  return modified;
}

export default { makeScriptsExecutable };
