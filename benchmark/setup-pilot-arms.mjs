/**
 * Sets up the three real-agent pilot arms under a given work root:
 *   arm-a-control : plain TypeScript starter (no governance files)
 *   arm-b-hooks   : plain starter + azcodr hooks/guard files (unintercepted here)
 *   arm-c-azcodr  : full azcodr scaffold + lets-build bootstrap (backend, TS)
 *
 * All three arms are then handed to subagent sessions that execute the ten
 * benchmark tickets sequentially. See REAL-AGENT-RUNBOOK.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { scaffold } from '../lib/scaffold.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      outDir: 'dist',
      rootDir: 'src',
      esModuleInterop: true,
      skipLibCheck: true
    },
    include: ['src']
  },
  null,
  2
);

function writeBaseTsProject(dir) {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tests'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: path.basename(dir),
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: { test: 'node --test tests/', build: 'tsc -p tsconfig.json' },
        devDependencies: { typescript: '5.7.3' }
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG, 'utf-8');
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'export const version = "base";\n', 'utf-8');
}

function copyHooksOnlySet(dest) {
  // Ship the same enforcement files a scaffolded project gets, but without
  // AGENTS.md / docs/rules / memory.md (the "prompt pack").
  fs.mkdirSync(path.join(dest, '.agents', 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(dest, '.agents', 'lib'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, '.agents', 'hooks.json'), path.join(dest, '.agents', 'hooks.json'));
  fs.copyFileSync(
    path.join(ROOT, '.agents', 'scripts', 'agent_guard.js'),
    path.join(dest, '.agents', 'scripts', 'agent_guard.js')
  );
  fs.copyFileSync(
    path.join(ROOT, '.agents', 'scripts', 'boundary_guard.js'),
    path.join(dest, '.agents', 'scripts', 'boundary_guard.js')
  );
  for (const f of fs.readdirSync(path.join(ROOT, '.agents', 'lib'))) {
    fs.copyFileSync(path.join(ROOT, '.agents', 'lib', f), path.join(dest, '.agents', 'lib', f));
  }
}

export function setupArms(workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-pilot-'))) {
  const armA = path.join(workRoot, 'arm-a-control');
  const armB = path.join(workRoot, 'arm-b-hooks');
  const armC = path.join(workRoot, 'arm-c-azcodr');
  const armD = path.join(workRoot, 'arm-d-scaffold-only');

  writeBaseTsProject(armA);
  writeBaseTsProject(armB);
  copyHooksOnlySet(armB);

  scaffold({ targetDir: armC, force: false, noGit: true });
  writeBaseTsProject(armD);
  scaffold({ targetDir: armD, force: true, noGit: true });

  return { workRoot, armA, armB, armC, armD };
}

if (process.argv[1] && process.argv[1].endsWith('setup-pilot-arms.mjs')) {
  const arms = setupArms();
  console.log(JSON.stringify(arms, null, 2));
}