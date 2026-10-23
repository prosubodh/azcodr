import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  isBranchProtected,
  parseProtectedBranchesFromHarness,
  resolveProtectedBranches,
  evaluatePushedRefs,
  DEFAULT_PROTECTED_BRANCHES
} from '../scripts/pre-push.js';

describe('Git Pre-Push Hook', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-prepush-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('parseProtectedBranchesFromHarness', () => {
    test('extracts branch list from harness config format', () => {
      const yaml = `version: 1
checks:
  - id: protected-branches
    enabled: true
    params:
      branches:
        - main
        - master
        - staging
        - uat
        - "release/*"
`;
      const branches = parseProtectedBranchesFromHarness(yaml);
      assert.deepStrictEqual(branches, ['main', 'master', 'staging', 'uat', 'release/*']);
    });

    test('returns empty array when protected-branches check is absent', () => {
      const yaml = `version: 1\npacks: [clean-code]\n`;
      assert.deepStrictEqual(parseProtectedBranchesFromHarness(yaml), []);
    });
  });

  describe('resolveProtectedBranches', () => {
    test('resolves from harness.yaml if present in directory', () => {
      const harnessPath = path.join(tmpDir, 'harness.yaml');
      fs.writeFileSync(
        harnessPath,
        'version: 1\nchecks:\n  - id: protected-branches\n    params:\n      branches:\n        - dev\n        - prod\n',
        'utf-8'
      );
      const branches = resolveProtectedBranches(tmpDir);
      assert.deepStrictEqual(branches, ['dev', 'prod']);
    });

    test('falls back to DEFAULT_PROTECTED_BRANCHES when no config exists', () => {
      const branches = resolveProtectedBranches(tmpDir);
      assert.deepStrictEqual(branches, DEFAULT_PROTECTED_BRANCHES);
    });

    test('prefers AZCODR_PROTECTED_BRANCHES env variable when set', () => {
      const oldEnv = process.env.AZCODR_PROTECTED_BRANCHES;
      try {
        process.env.AZCODR_PROTECTED_BRANCHES = 'uat,client/*';
        const branches = resolveProtectedBranches(tmpDir);
        assert.deepStrictEqual(branches, ['uat', 'client/*']);
      } finally {
        if (oldEnv === undefined) delete process.env.AZCODR_PROTECTED_BRANCHES;
        else process.env.AZCODR_PROTECTED_BRANCHES = oldEnv;
      }
    });
  });

  describe('evaluatePushedRefs', () => {
    test('detects push targeting protected branch', () => {
      const stdin = 'refs/heads/feat 1234 refs/heads/main 5678\n';
      const violations = evaluatePushedRefs(stdin, ['main', 'master']);
      assert.deepStrictEqual(violations, ['main']);
    });

    test('detects multiple violations', () => {
      const stdin = 'refs/heads/feat 1234 refs/heads/main 5678\nrefs/heads/test 1234 refs/heads/staging 5678\n';
      const violations = evaluatePushedRefs(stdin, ['main', 'staging']);
      assert.deepStrictEqual(violations, ['main', 'staging']);
    });

    test('passes clean when pushing topic branches', () => {
      const stdin = 'refs/heads/feat/login 1234 refs/heads/feat/login 5678\n';
      const violations = evaluatePushedRefs(stdin, ['main', 'master']);
      assert.deepStrictEqual(violations, []);
    });

    test('detects wildcard glob branch violations', () => {
      const stdin = 'refs/heads/local 1234 refs/heads/release/2.0.0 5678\n';
      const violations = evaluatePushedRefs(stdin, ['main', 'release/*']);
      assert.deepStrictEqual(violations, ['release/2.0.0']);
    });
  });
});
