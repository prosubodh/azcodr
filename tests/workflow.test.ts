import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  installWorkflowTemplate,
  WORKFLOW_DESCRIPTORS
} from '../src/workflow.js';

describe('Workflow template installer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-workflow-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('WORKFLOW_DESCRIPTORS defines canonical templates', () => {
    assert.ok(WORKFLOW_DESCRIPTORS.ci);
    assert.strictEqual(WORKFLOW_DESCRIPTORS.ci.filename, 'ci.yml');
    assert.strictEqual(WORKFLOW_DESCRIPTORS.ci.templateFile, 'ci.template');

    assert.ok(WORKFLOW_DESCRIPTORS.publish);
    assert.strictEqual(WORKFLOW_DESCRIPTORS.publish.filename, 'publish.yml');
    assert.strictEqual(WORKFLOW_DESCRIPTORS.publish.templateFile, 'publish.template');
  });

  test('returns error when unknown workflow is requested', () => {
    const res = installWorkflowTemplate(tmpDir, 'unknown-nonexistent-type');
    assert.strictEqual(res.installed, false);
    assert.ok(res.reason?.includes('Unknown workflow type'));
  });

  test('installs ci workflow when none exists', () => {
    const res = installWorkflowTemplate(tmpDir, 'ci');
    assert.strictEqual(res.installed, true);
    assert.ok(res.action?.includes('.github/workflows/ci.yml'));

    const destFile = path.join(tmpDir, '.github', 'workflows', 'ci.yml');
    assert.ok(fs.existsSync(destFile));
    const content = fs.readFileSync(destFile, 'utf-8');
    assert.ok(content.includes('name: CI'));
    assert.ok(content.includes('azcodr check'));
  });

  test('installs publish workflow when none exists', () => {
    const res = installWorkflowTemplate(tmpDir, 'publish');
    assert.strictEqual(res.installed, true);
    assert.ok(res.action?.includes('.github/workflows/publish.yml'));

    const destFile = path.join(tmpDir, '.github', 'workflows', 'publish.yml');
    assert.ok(fs.existsSync(destFile));
    const content = fs.readFileSync(destFile, 'utf-8');
    assert.ok(content.includes('name: Publish'));
    assert.ok(content.includes('azcodr check'));
  });

  test('detects already installed azcodr workflow without force', () => {
    const first = installWorkflowTemplate(tmpDir, 'ci');
    assert.strictEqual(first.installed, true);

    const second = installWorkflowTemplate(tmpDir, 'ci');
    assert.strictEqual(second.installed, false);
    assert.ok(second.reason?.includes('already installed'));
  });

  test('skips clobbering custom user workflow when force is false', () => {
    const workflowsDir = path.join(tmpDir, '.github', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });
    const ciFile = path.join(workflowsDir, 'ci.yml');
    const customText = '# Custom User CI\nname: CustomCI\n';
    fs.writeFileSync(ciFile, customText, 'utf-8');

    const res = installWorkflowTemplate(tmpDir, 'ci', { force: false });
    assert.strictEqual(res.installed, false);
    assert.ok(res.reason?.includes('Custom workflow'));
    assert.strictEqual(fs.readFileSync(ciFile, 'utf-8'), customText);
  });

  test('overwrites existing workflow when force is true', () => {
    const workflowsDir = path.join(tmpDir, '.github', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });
    const ciFile = path.join(workflowsDir, 'ci.yml');
    const customText = '# Custom User CI\nname: CustomCI\n';
    fs.writeFileSync(ciFile, customText, 'utf-8');

    const res = installWorkflowTemplate(tmpDir, 'ci', { force: true });
    assert.strictEqual(res.installed, true);
    assert.ok(res.action?.includes('.github/workflows/ci.yml'));
    const content = fs.readFileSync(ciFile, 'utf-8');
    assert.ok(content.includes('name: CI'));
  });

  test('honors dry-run without writing files or directories', () => {
    const res = installWorkflowTemplate(tmpDir, 'ci', { dryRun: true });
    assert.strictEqual(res.installed, true);
    assert.ok(res.action?.includes('.github/workflows/ci.yml'));

    const workflowsDir = path.join(tmpDir, '.github', 'workflows');
    assert.strictEqual(fs.existsSync(workflowsDir), false);
  });
});
