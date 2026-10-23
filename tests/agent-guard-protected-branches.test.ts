import assert from 'node:assert/strict';
import {
  isBranchProtected,
  extractPushTargetBranches,
  inspectCommand,
  DEFAULT_PROTECTED_BRANCHES
} from '../src/agent-guard-command.js';

describe('Dynamic Protected Branch Interception', () => {
  describe('isBranchProtected', () => {
    test('matches default protected branches (main and master)', () => {
      assert.strictEqual(isBranchProtected('main', DEFAULT_PROTECTED_BRANCHES), true);
      assert.strictEqual(isBranchProtected('master', DEFAULT_PROTECTED_BRANCHES), true);
      assert.strictEqual(isBranchProtected('MAIN', DEFAULT_PROTECTED_BRANCHES), true);
      assert.strictEqual(isBranchProtected('feat/login', DEFAULT_PROTECTED_BRANCHES), false);
    });

    test('supports exact matches on custom branches', () => {
      const protectedList = ['main', 'master', 'staging', 'uat', 'prod', 'dev', 'develop'];
      assert.strictEqual(isBranchProtected('staging', protectedList), true);
      assert.strictEqual(isBranchProtected('uat', protectedList), true);
      assert.strictEqual(isBranchProtected('prod', protectedList), true);
      assert.strictEqual(isBranchProtected('dev', protectedList), true);
      assert.strictEqual(isBranchProtected('develop', protectedList), true);
      assert.strictEqual(isBranchProtected('feat/staging-sync', protectedList), false);
    });

    test('supports glob wildcard matching (e.g. release/*, client/*)', () => {
      const patterns = ['main', 'release/*', 'client/*', 'tenant/*'];
      assert.strictEqual(isBranchProtected('release/1.0.0', patterns), true);
      assert.strictEqual(isBranchProtected('release/2026-Q1', patterns), true);
      assert.strictEqual(isBranchProtected('client/acme', patterns), true);
      assert.strictEqual(isBranchProtected('tenant/1234', patterns), true);
      assert.strictEqual(isBranchProtected('release-notes', patterns), false);
      assert.strictEqual(isBranchProtected('fix/client-bug', patterns), false);
    });
  });

  describe('extractPushTargetBranches', () => {
    test('extracts explicit target branch from standard push command', () => {
      assert.deepStrictEqual(extractPushTargetBranches('git push origin main'), ['main']);
      assert.deepStrictEqual(extractPushTargetBranches('git push origin staging'), ['staging']);
      assert.deepStrictEqual(extractPushTargetBranches('git push -u origin uat'), ['uat']);
      assert.deepStrictEqual(extractPushTargetBranches('git push --set-upstream origin prod'), ['prod']);
    });

    test('extracts target branch from refspecs and colons', () => {
      assert.deepStrictEqual(extractPushTargetBranches('git push origin HEAD:main'), ['main']);
      assert.deepStrictEqual(extractPushTargetBranches('git push origin HEAD:refs/heads/main'), ['main']);
      assert.deepStrictEqual(extractPushTargetBranches('git push origin :staging'), ['staging']);
      assert.deepStrictEqual(extractPushTargetBranches('git push origin +main'), ['main']);
    });

    test('identifies --all flag as targeting wildcard', () => {
      assert.deepStrictEqual(extractPushTargetBranches('git push --all origin'), ['*']);
    });

    test('returns empty array when no target branch is specified', () => {
      assert.deepStrictEqual(extractPushTargetBranches('git push'), []);
      assert.deepStrictEqual(extractPushTargetBranches('git push origin'), []);
      assert.deepStrictEqual(extractPushTargetBranches('ls -la'), []);
    });
  });

  describe('inspectCommand with protected branches', () => {
    test('blocks direct push to main and master by default', () => {
      const r1 = inspectCommand('git push origin main');
      assert.strictEqual(r1.blocked, true);
      assert.ok(r1.reason?.includes('main'));

      const r2 = inspectCommand('git push origin master');
      assert.strictEqual(r2.blocked, true);
      assert.ok(r2.reason?.includes('master'));

      const r3 = inspectCommand('git push origin HEAD:main');
      assert.strictEqual(r3.blocked, true);
    });

    test('allows pushing feature branches by default', () => {
      const r = inspectCommand('git push origin feat/cool-feature');
      assert.strictEqual(r.blocked, false);
    });

    test('blocks custom protected branches when provided in options', () => {
      const opts = { protectedBranches: ['main', 'staging', 'uat', 'client/*'] };

      const rStaging = inspectCommand('git push origin staging', opts);
      assert.strictEqual(rStaging.blocked, true);
      assert.ok(rStaging.reason?.includes('staging'));

      const rClient = inspectCommand('git push origin client/mega-corp', opts);
      assert.strictEqual(rClient.blocked, true);
      assert.ok(rClient.reason?.includes('client/mega-corp'));

      const rFeat = inspectCommand('git push origin feat/mega-corp', opts);
      assert.strictEqual(rFeat.blocked, false);
    });

    test('respects AZCODR_PROTECTED_BRANCHES environment variable fallback', () => {
      const oldEnv = process.env.AZCODR_PROTECTED_BRANCHES;
      try {
        process.env.AZCODR_PROTECTED_BRANCHES = 'dev,prod,release/*';
        const rDev = inspectCommand('git push origin dev');
        assert.strictEqual(rDev.blocked, true);

        const rRelease = inspectCommand('git push origin release/v2.0', {
          currentBranch: 'release/v2.0'
        });
        assert.strictEqual(rRelease.blocked, true);
      } finally {
        if (oldEnv === undefined) delete process.env.AZCODR_PROTECTED_BRANCHES;
        else process.env.AZCODR_PROTECTED_BRANCHES = oldEnv;
      }
    });

    test('blocks bare git push when currentBranch is protected', () => {
      const r = inspectCommand('git push', { currentBranch: 'main' });
      assert.strictEqual(r.blocked, true);
      assert.ok(r.reason?.includes('main'));
    });

    test('allows bare git push when currentBranch is not protected', () => {
      const r = inspectCommand('git push', { currentBranch: 'feat/test-branch' });
      assert.strictEqual(r.blocked, false);
    });
  });
});
