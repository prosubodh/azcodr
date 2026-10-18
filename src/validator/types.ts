/**
 * Shared contracts for the workspace validator.
 */

/**
 * Sink receiving validation events. `skip` is optional so a caller that only
 * cares about failures can supply four methods.
 */
export interface Reporter {
  /** A check passed. */
  pass: (msg: string) => void;
  /** A non-blocking problem was found. */
  warn: (msg: string) => void;
  /** A blocking defect was found. */
  fail: (msg: string) => void;
  /** A check was skipped because its subject is absent. */
  skip?: (msg: string) => void;
  /** Informational output and spacing. */
  log: (msg: string) => void;
  /** A new phase began. */
  heading: (msg: string) => void;
}

/** Running tallies owned by the orchestrator, not by the reporter. */
export interface ValidationCounts {
  errors: number;
  warnings: number;
}

/**
 * Everything a validation phase needs: where to look, how to report, and the
 * mutable state phases share.
 */
export interface ValidationContext {
  /** Absolute path to the workspace under validation. */
  workspaceRoot: string;
  /** Absolute path to the root agent contract. */
  agentsFile: string;
  /** Contents of the agent contract, or empty when absent. */
  agentsContent: string;
  /** Verdict emitters, already wired to the counters. */
  pass: (msg: string) => void;
  warn: (msg: string) => void;
  fail: (msg: string) => void;
  skip: (msg: string) => void;
  log: (msg: string) => void;
  heading: (msg: string) => void;
  /** Internal links discovered so far. */
  linkCount: number;
  /** Unresolvable internal links discovered so far. */
  broken: string[];
  /** Real paths already walked, guarding against symlink loops. */
  visitedRealPaths: Set<string>;
}

/**
 * Tally returned by a complete validation run.
 */
export interface ValidationResult {
  errors: number;
  warnings: number;
  validatedRules: number;
  validatedSkills: number;
  totalLinks: number;
  brokenLinks: string[];
}

/** A reporter callback that reports a failure. */
export type FailFn = (msg: string) => void;

/** A reporter callback that reports a pass. */
export type PassFn = (msg: string) => void;

/** A reporter callback that reports a skip. */
export type SkipFn = (msg: string) => void;
