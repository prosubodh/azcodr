import { YamlSubsetError, coerceScalar, parseFlow } from './yaml-flow.js';

export { YamlSubsetError };

/** A significant source line: indentation, trimmed content, and its 1-based number. */
interface Line {
  indent: number;
  text: string;
  no: number;
}

/** A parsed value plus the index of the first line not consumed by it. */
interface BlockResult {
  value: unknown;
  next: number;
}

function updateQuotes(ch: string | undefined, inSingle: boolean, inDouble: boolean): [boolean, boolean] {
  if (ch === "'" && !inDouble) return [!inSingle, inDouble];
  if (ch === '"' && !inSingle) return [inSingle, !inDouble];
  return [inSingle, inDouble];
}

function stripComment(raw: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    [inSingle, inDouble] = updateQuotes(ch, inSingle, inDouble);
    if (ch === '#' && !inSingle && !inDouble) {
      const prev = raw[i - 1];
      if (prev === undefined || /\s/.test(prev)) return raw.slice(0, i);
    }
  }
  return raw;
}

function tokenize(source: string): Line[] {
  const out: Line[] = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const stripped = stripComment(raw);
    if (stripped.trim() === '') return;
    const body = stripped.trimStart();
    out.push({ indent: stripped.length - body.length, text: body.trim(), no: index + 1 });
  });
  return out;
}

function splitKey(text: string, no: number): { key: string; rest: string } {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    [inSingle, inDouble] = updateQuotes(ch, inSingle, inDouble);
    if (ch === ':' && !inSingle && !inDouble) {
      const after = text[i + 1];
      if (after === undefined || after === ' ') {
        const key = coerceScalar(text.slice(0, i).trim(), no);
        return { key: String(key), rest: text.slice(i + 1).trim() };
      }
    }
  }
  throw new YamlSubsetError('expected "key: value"', no);
}

function isSequenceLine(line: Line): boolean {
  return line.text === '-' || line.text.startsWith('- ');
}

interface ValueContext {
  lines: readonly Line[];
  start: number;
  parentIndent: number;
}

function readValueOrNested(ctx: ValueContext, rest: string, no: number): BlockResult {
  if (rest.startsWith('[') || rest.startsWith('{')) {
    return { value: parseFlow(rest, no).value, next: ctx.start };
  }
  if (rest !== '') {
    return { value: coerceScalar(rest, no), next: ctx.start };
  }
  const next = ctx.lines[ctx.start];
  if (next && next.indent > ctx.parentIndent) {
    return parseBlock(ctx.lines, ctx.start, next.indent);
  }
  return { value: null, next: ctx.start };
}

interface MapContext {
  lines: readonly Line[];
  indent: number;
}

function continueMap(ctx: MapContext, out: Record<string, unknown>, start: number): number {
  let i = start;
  while (i < ctx.lines.length) {
    const line = ctx.lines[i] as Line;
    if (line.indent !== ctx.indent || isSequenceLine(line)) break;
    const { key, rest } = splitKey(line.text, line.no);
    const value = readValueOrNested({ lines: ctx.lines, start: i + 1, parentIndent: ctx.indent }, rest, line.no);
    out[key] = value.value;
    i = value.next;
  }
  return i;
}

function parseMapping(lines: readonly Line[], start: number, indent: number): BlockResult {
  const out: Record<string, unknown> = {};
  const first = lines[start] as Line;
  const { key, rest } = splitKey(first.text, first.no);
  const value = readValueOrNested({ lines, start: start + 1, parentIndent: indent }, rest, first.no);
  out[key] = value.value;
  const next = continueMap({ lines, indent }, out, value.next);
  return { value: out, next };
}

function parseSeqMappingItem(
  lines: readonly Line[],
  line: Line,
  i: number
): { item: Record<string, unknown>; next: number } {
  const rest = line.text.slice(1).trim();
  const contentIndent = line.indent + (line.text.length - rest.length);
  const item: Record<string, unknown> = {};
  const { key, rest: itemRest } = splitKey(rest, line.no);
  const value = readValueOrNested({ lines, start: i + 1, parentIndent: contentIndent }, itemRest, line.no);
  item[key] = value.value;
  const next = continueMap({ lines, indent: contentIndent }, item, value.next);
  return { item, next };
}

function parseSequence(lines: readonly Line[], start: number, indent: number): BlockResult {
  const out: unknown[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i] as Line;
    if (line.indent < indent) break;
    if (line.indent > indent || !isSequenceLine(line)) {
      throw new YamlSubsetError('unexpected indentation', line.no);
    }

    const rest = line.text === '-' ? '' : line.text.slice(1).trim();
    if (rest === '') {
      const value = readValueOrNested({ lines, start: i + 1, parentIndent: indent }, '', line.no);
      out.push(value.value);
      i = value.next === i + 1 ? i + 1 : value.next;
      continue;
    }

    if (!/^["']?[^:#}]+["']?\s*:(\s|$)/.test(rest)) {
      out.push(coerceScalar(rest, line.no));
      i += 1;
      continue;
    }

    const { item, next } = parseSeqMappingItem(lines, line, i);
    out.push(item);
    i = next;
  }

  return { value: out, next: i };
}

function parseBlock(lines: readonly Line[], start: number, indent: number): BlockResult {
  const first = lines[start] as Line;
  return isSequenceLine(first)
    ? parseSequence(lines, start, indent)
    : parseMapping(lines, start, indent);
}

/**
 * Parses the supported YAML subset used by `harness.yaml`.
 *
 * Supports block mappings, block sequences, inline flow collections, plain and
 * quoted scalars, and comments. Anchors, aliases, explicit tags and block
 * scalars are rejected explicitly rather than approximated, so an unsupported
 * construct can never be silently misread as a different value.
 *
 * @param source - Raw document text.
 * @returns The parsed document, always a mapping at the root.
 * @throws {YamlSubsetError} When input uses an unsupported construct or is malformed.
 */
export function parseYamlSubset(source: string): Record<string, unknown> {
  const lines = tokenize(source);
  if (lines.length === 0) return {};
  if (isSequenceLine(lines[0] as Line)) {
    throw new YamlSubsetError('the document root must be a mapping', (lines[0] as Line).no);
  }
  const { value, next } = parseBlock(lines, 0, (lines[0] as Line).indent);
  if (next < lines.length) {
    throw new YamlSubsetError('unexpected trailing content', (lines[next] as Line).no);
  }
  return value as Record<string, unknown>;
}

export default { parseYamlSubset, YamlSubsetError };
