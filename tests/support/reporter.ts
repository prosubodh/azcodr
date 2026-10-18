import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * A collector reporter satisfying the full interface, including `skip`.
 * Returned as a function so each call gets a fresh log array.
 */
export function collector(): {
  logs: string[];
  reporter: {
    pass: (m: string) => number;
    warn: (m: string) => number;
    fail: (m: string) => number;
    skip: (m: string) => number;
    log: (m: string) => number;
    heading: (m: string) => number;
  };
} {
  const logs: string[] = [];
  return {
    logs,
    reporter: {
      pass: (m) => logs.push(`PASS ${m}`),
      warn: (m) => logs.push(`WARN ${m}`),
      fail: (m) => logs.push(`FAIL ${m}`),
      skip: (m) => logs.push(`SKIP ${m}`),
      log: (m) => logs.push(m),
      heading: (m) => logs.push(m)
    }
  };
}

/**
 * A reporter that discards all output, for tests that only need the tally.
 */
export function silent(): {
  pass: (m: string) => void;
  warn: (m: string) => void;
  fail: (m: string) => void;
  skip: (m: string) => void;
  log: (m: string) => void;
  heading: (m: string) => void;
} {
  const noop = (): void => {};
  return { pass: noop, warn: noop, fail: noop, skip: noop, log: noop, heading: noop };
}

/**
 * Creates a temporary directory that is removed when the suite finishes.
 */
export function tempRoot(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `azcodr-${prefix}-`));
}

export function cleanup(root: string): void {
  if (root && fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
}
