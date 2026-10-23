import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface InstallWorkflowOptions {
  dryRun?: boolean;
  force?: boolean;
}

export interface InstallWorkflowResult {
  installed: boolean;
  action?: string;
  reason?: string;
  filePath?: string;
}

export interface WorkflowDescriptor {
  filename: string;
  templateFile: string;
  description: string;
}

export const WORKFLOW_DESCRIPTORS: Record<string, WorkflowDescriptor> = {
  ci: {
    filename: 'ci.yml',
    templateFile: 'ci.template',
    description: 'continuous integration workflow'
  },
  publish: {
    filename: 'publish.yml',
    templateFile: 'publish.template',
    description: 'release and publishing workflow'
  }
};

function resolveTemplatePath(templateFileName: string): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '..', 'data', templateFileName);
}

function checkExistingWorkflow(
  destFile: string,
  filename: string,
  force?: boolean
): { shouldProceed: boolean; result?: InstallWorkflowResult } {
  if (!fs.existsSync(destFile) || force) {
    return { shouldProceed: true };
  }
  const existingContent = fs.readFileSync(destFile, 'utf-8');
  if (existingContent.includes('azcodr')) {
    return {
      shouldProceed: false,
      result: { installed: false, reason: `Workflow ${filename} already installed.`, filePath: destFile }
    };
  }
  return {
    shouldProceed: false,
    result: {
      installed: false,
      reason: `Custom workflow ${filename} already exists; skipping overwrite (use --force to overwrite).`,
      filePath: destFile
    }
  };
}

export function installWorkflowTemplate(
  targetDir: string,
  workflowKey: 'ci' | 'publish' | string,
  options: InstallWorkflowOptions = {}
): InstallWorkflowResult {
  const descriptor = WORKFLOW_DESCRIPTORS[workflowKey];
  if (!descriptor) {
    return { installed: false, reason: `Unknown workflow type: ${workflowKey}` };
  }

  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  const destFile = path.join(workflowsDir, descriptor.filename);

  const check = checkExistingWorkflow(destFile, descriptor.filename, options.force);
  if (!check.shouldProceed && check.result) {
    return check.result;
  }

  const templatePath = resolveTemplatePath(descriptor.templateFile);
  if (!fs.existsSync(templatePath)) {
    return { installed: false, reason: `Workflow template ${descriptor.templateFile} not found.` };
  }

  const action = `install: .github/workflows/${descriptor.filename} (${descriptor.description})`;
  if (options.dryRun) {
    return { installed: true, action, filePath: destFile };
  }

  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  fs.writeFileSync(destFile, content, 'utf-8');

  return { installed: true, action, filePath: destFile };
}

export default { WORKFLOW_DESCRIPTORS, installWorkflowTemplate };
