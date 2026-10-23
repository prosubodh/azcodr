import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseTranscriptJsonl,
  formatTranscriptToMarkdown,
  exportConversationToFile
} from '../src/conversation-export.js';

const SAMPLE_JSONL = `{"step_index":0,"source":"USER_EXPLICIT","type":"USER_INPUT","status":"DONE","created_at":"2026-10-23T07:36:23Z","content":"<USER_REQUEST>\\nhello world\\n</USER_REQUEST>"}
{"step_index":1,"source":"MODEL","type":"PLANNER_RESPONSE","status":"DONE","created_at":"2026-10-23T07:36:25Z","thinking":"Planning reply","content":"Hello there!","tool_calls":[{"name":"run_command","args":{"CommandLine":"ls"}}]}
`;

describe('Conversation Transcript Exporter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-export-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('parses jsonl transcript into structured steps', () => {
    const steps = parseTranscriptJsonl(SAMPLE_JSONL);
    assert.strictEqual(steps.length, 2);
    assert.strictEqual(steps[0]?.source, 'USER_EXPLICIT');
    assert.strictEqual(steps[0]?.type, 'USER_INPUT');
    assert.ok(steps[0]?.content?.includes('hello world'));

    assert.strictEqual(steps[1]?.source, 'MODEL');
    assert.strictEqual(steps[1]?.thinking, 'Planning reply');
    assert.strictEqual(steps[1]?.content, 'Hello there!');
    assert.strictEqual(steps[1]?.toolCalls?.[0]?.name, 'run_command');
  });

  test('formats parsed steps into readable portable Markdown', () => {
    const steps = parseTranscriptJsonl(SAMPLE_JSONL);
    const md = formatTranscriptToMarkdown(steps, { title: 'Test Session Export' });

    assert.ok(md.includes('# Test Session Export'));
    assert.ok(md.includes('### User'));
    assert.ok(md.includes('hello world'));
    assert.ok(md.includes('### Assistant'));
    assert.ok(md.includes('Hello there!'));
    assert.ok(md.includes('run_command'));
  });

  test('handles malformed JSON lines gracefully without crashing', () => {
    const withBadLine = `${SAMPLE_JSONL}not a json line\n{"step_index":2,"content":"step 2"}\n`;
    const steps = parseTranscriptJsonl(withBadLine);
    assert.strictEqual(steps.length, 3);
  });

  test('exports conversation directly to target file', () => {
    const transcriptPath = path.join(tmpDir, 'transcript.jsonl');
    fs.writeFileSync(transcriptPath, SAMPLE_JSONL, 'utf-8');

    const outputPath = path.join(tmpDir, 'export.md');
    const result = exportConversationToFile(transcriptPath, outputPath, {
      title: 'Exported Conversation'
    });

    assert.strictEqual(result.outputPath, outputPath);
    assert.strictEqual(result.stepCount, 2);
    assert.ok(fs.existsSync(outputPath));

    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('hello world'));
    assert.ok(content.includes('Hello there!'));
  });

  test('formats sessionId and respects includeThinking false', () => {
    const steps = parseTranscriptJsonl(SAMPLE_JSONL);
    const md = formatTranscriptToMarkdown(steps, {
      sessionId: 'sess-123',
      includeThinking: false
    });
    assert.ok(md.includes('sess-123'));
    assert.ok(!md.includes('Thought Process'));
  });

  test('handles empty user input gracefully', () => {
    const steps = parseTranscriptJsonl('{"step_index":0,"source":"USER_EXPLICIT","type":"USER_INPUT"}\n');
    const md = formatTranscriptToMarkdown(steps);
    assert.ok(md.includes('(empty)'));
  });

  test('handles assistant step without content and tool call with no args', () => {
    const jsonl = `{"step_index":0,"source":"MODEL","type":"PLANNER_RESPONSE","tool_calls":[{"name":"quick_check","args":{}}]}\n`;
    const steps = parseTranscriptJsonl(jsonl);
    const md = formatTranscriptToMarkdown(steps);
    assert.ok(md.includes('quick_check'));
  });

  test('skips empty assistant step without content, thinking, or tools', () => {
    const jsonl = `{"step_index":0,"source":"MODEL","type":"PLANNER_RESPONSE"}\n`;
    const steps = parseTranscriptJsonl(jsonl);
    const md = formatTranscriptToMarkdown(steps);
    assert.ok(!md.includes('### Assistant'));
  });
});
