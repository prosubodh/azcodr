import fs from 'node:fs';
import path from 'node:path';

export interface ToolCallInfo {
  name: string;
  args?: Record<string, unknown>;
}

export interface TranscriptStep {
  stepIndex: number;
  source: string;
  type: string;
  status?: string;
  createdAt?: string;
  content?: string;
  thinking?: string;
  toolCalls?: ToolCallInfo[];
}

export interface FormatOptions {
  title?: string;
  sessionId?: string;
  includeThinking?: boolean;
}

export interface ExportResult {
  outputPath: string;
  stepCount: number;
}

function parseJsonLine(line: string, index: number): TranscriptStep | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const raw = JSON.parse(trimmed) as Record<string, unknown>;
    const toolCallsRaw = Array.isArray(raw.tool_calls) ? raw.tool_calls : [];
    const toolCalls: ToolCallInfo[] = toolCallsRaw.map((tc: any) => ({
      name: String(tc.name || ''),
      args: typeof tc.args === 'object' && tc.args !== null ? tc.args : undefined
    }));

    return {
      stepIndex: typeof raw.step_index === 'number' ? raw.step_index : index,
      source: String(raw.source || 'UNKNOWN'),
      type: String(raw.type || 'UNKNOWN'),
      status: typeof raw.status === 'string' ? raw.status : undefined,
      createdAt: typeof raw.created_at === 'string' ? raw.created_at : undefined,
      content: typeof raw.content === 'string' ? raw.content : undefined,
      thinking: typeof raw.thinking === 'string' ? raw.thinking : undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  } catch {
    return null;
  }
}

export function parseTranscriptJsonl(jsonlContent: string): TranscriptStep[] {
  const lines = jsonlContent.split(/\r?\n/);
  const steps: TranscriptStep[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const parsed = parseJsonLine(lines[i] as string, i);
    if (parsed) steps.push(parsed);
  }
  return steps;
}

function cleanUserPrompt(content: string): string {
  const match = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i);
  return match ? match[1]!.trim() : content.trim();
}

function formatUserInput(step: TranscriptStep): string {
  const time = step.createdAt ? ` (${step.createdAt})` : '';
  const body = step.content ? cleanUserPrompt(step.content) : '(empty)';
  return `### User${time}\n\n${body}\n`;
}

function formatAssistant(step: TranscriptStep, includeThinking: boolean): string {
  let out = '';
  if (includeThinking && step.thinking && step.thinking.trim() !== '') {
    out += `<details><summary>Thought Process</summary>\n\n${step.thinking.trim()}\n\n</details>\n\n`;
  }
  if (step.content && step.content.trim() !== '') {
    out += `### Assistant\n\n${step.content.trim()}\n\n`;
  }
  if (step.toolCalls && step.toolCalls.length > 0) {
    for (const tc of step.toolCalls) {
      out += `**Tool Call:** \`${tc.name}\`\n`;
      if (tc.args && Object.keys(tc.args).length > 0) {
        out += '```json\n' + JSON.stringify(tc.args, null, 2) + '\n```\n\n';
      }
    }
  }
  return out;
}

export function formatTranscriptToMarkdown(
  steps: TranscriptStep[],
  options: FormatOptions = {}
): string {
  const title = options.title || 'Conversation History Export';
  const includeThinking = options.includeThinking ?? true;
  let md = `# ${title}\n\n`;
  if (options.sessionId) md += `- **Session ID:** \`${options.sessionId}\`\n`;
  md += `- **Exported At:** ${new Date().toISOString()}\n`;
  md += `- **Total Interleaved Steps:** ${steps.length}\n\n---\n\n`;

  for (const step of steps) {
    if (step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT') {
      md += formatUserInput(step) + '\n---\n\n';
    } else {
      const assistantText = formatAssistant(step, includeThinking);
      if (assistantText.trim().length > 0) {
        md += assistantText + '\n---\n\n';
      }
    }
  }
  return md;
}

export function exportConversationToFile(
  transcriptPath: string,
  outputPath: string,
  options: FormatOptions = {}
): ExportResult {
  const raw = fs.readFileSync(transcriptPath, 'utf-8');
  const steps = parseTranscriptJsonl(raw);
  const md = formatTranscriptToMarkdown(steps, options);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, md, 'utf-8');

  return { outputPath, stepCount: steps.length };
}

export default {
  parseTranscriptJsonl,
  formatTranscriptToMarkdown,
  exportConversationToFile
};
