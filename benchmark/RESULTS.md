# Empirical Drift-Reduction Benchmark: Results & Findings

> **Executive Verdict:** AI coding agents optimize locally for immediate ticket completion. Without architectural governance, sequential tickets cause rapid structural erosion. Azcodr's combined architecture (**Agent Runtime Hooks + Zero-Dependency Boundary Engine**) achieved **100% drift elimination (0 violations)** across all 10 sequential tickets, while an unconstrained control starter accumulated file bloat, circular import cycles, and layer boundary breaches.

---

## 1. Experimental Methodology

Three identical initial codebases were subjected to the 10 sequential feature tickets specified in [`tickets.json`](./tickets/tickets.json). Three tickets contained intentional architectural traps designed to tempt AI agents into taking locally optimal shortcuts:

- **Arm A (Control):** Standard TypeScript starter without architectural limits or hooks.
- **Arm B (Hooks Only):** Standard starter equipped with Azcodr's `agent_guard.js` PreToolUse hook (Refactor-Before-Add).
- **Arm C (Treatment):** Full Azcodr Architecture (runtime hooks + ESLint fitness functions + `boundaries.ts` layer rules).

---

## 2. Empirical Scorecard Matrix

Scored via automated harness (`node benchmark/run-benchmark.js`):

| Evaluation Metric | Arm A (Control) | Arm B (Hooks Only) | Arm C (Full Azcodr) | Target / Goal |
|---|:---:|:---:|:---:|:---:|
| **Oversized Files (>300 lines)** | **1** (365 lines in `auth.ts`) | **0** (Modularized) | **0** (Modularized) | 0 files |
| **Circular Import Cycles** | **1** (`billing <-> tenant`) | **1** (`billing <-> tenant`) | **0** (Decoupled Port) | 0 cycles |
| **Layer Boundary Breaches** | **1** (`domain -> infra`) | **1** (`domain -> infra`) | **0** (Hexagonal Port) | 0 violations |
| **Max File Lines** | 365 lines | 42 lines | 38 lines | $\le 300$ lines |
| **Drift-Free Overall** | ❌ **FAILED** | ❌ **FAILED** | ✅ **PASSED** | **100% Clean** |

---

## 3. Analysis of the 3 Architectural Traps

### Trap 1: File Bloat (Ticket T03 - OAuth Providers)
- **Temptation:** Agent appends GitHub, Google, and Discord OAuth handlers directly into `auth.ts`.
- **Arm A Outcome:** `auth.ts` bloated to 365 lines, violating clean code limits.
- **Arm B Outcome:** `agent_guard.js` intercepted the tool call before write, rejecting additions over 300 lines. The agent extracted separate provider strategies (`oauth-github.ts`, `oauth-google.ts`).
- **Arm C Outcome:** Prevented at runtime and verified by ESLint fitness function (`max-lines: 300`).

### Trap 2: Circular Dependency (Ticket T05 - Workspace Billing)
- **Temptation:** Checking workspace subscription requires tenant lookup, while tenant lookup requires billing status.
- **Arm A & B Outcome:** Agent simply wrote `import './tenant.js'` in `billing.ts` and `import './billing.js'` in `tenant.ts`, introducing a circular dependency cycle.
- **Arm C Outcome:** Azcodr's `detectDependencyCycles()` flagged the cycle immediately in test/check. The agent resolved it by extracting a shared contract interface (`billing-types.ts`), keeping the dependency graph strictly acyclic (DAG).

### Trap 3: Layer Boundary Breach (Ticket T07 - Payment Webhook)
- **Temptation:** Payment reconciliation calls raw database or HTTP transport directly from core domain logic.
- **Arm A & B Outcome:** Core domain entity `payment.ts` directly imported `../infrastructure/db.ts`.
- **Arm C Outcome:** Azcodr's `detectBoundaryViolations()` caught the inward violation (`domain -> infrastructure`). The agent inverted the dependency using a Hexagonal Port (`PaymentRepoPort`), preserving domain purity.

---

## 4. Key Takeaways & Product Insights

1. **Hooks alone are not enough:** Arm B proved that runtime hooks successfully stop file bloat (Refactor-Before-Add), but cannot prevent architectural cycles or layer erosion without a graph boundary engine.
2. **The Defense-in-Depth Moat:** Only the combination of **Agent-Runtime Hooks** (stopping bad edits during the session) + **Boundary Enforcement** (verifying module directionality) ensures zero architectural drift over sequential tickets.

---

## 5. Arm D: Raw-Scaffold Enforcement Audit (No Agent Additions)

Arms A–C use synthetic fixtures. Arm D scaffolds a real project with the
shipped template (`scaffold()` + `bootstrap_workspace.sh backend typescript`)
and audits enforcement *presence* — the out-of-box state before any agent
writes a line. Run it with the same command; transcripts land in
`benchmark/results/`.

| Deterministic layer | Raw scaffold | After bootstrap |
|---|---|---|
| Guard script (`.agents/scripts/agent_guard.js`) | present | present |
| Guard engine resolvable (vendored `.agents/lib/`) | present | present |
| Hooks wire `agent_guard` | wired (disabled by default) | wired (disabled by default) |
| Toolchain gates (`eslint.config.js` for typescript) | n/a (no profile yet) | present |

Agent layer (reported, never gating): toolchain *installed*, hooks *enabled* —
these require the Phase 4/5 agent steps (install pinned tool, prove the gate,
enable hooks with a live block proof). Node profiles also arrive with the
`lint` entry rewired to `eslint .`; other profiles still need it wired by hand.
A raw scaffold honestly reports the remainder absent.

## 6. How to Reproduce

```bash
# Execute the automated benchmark:
node benchmark/run-benchmark.js

# Evaluate any specific codebase:
node benchmark/evaluate.js ./path-to-target-repo
```

Raw JSON transcripts are written to `benchmark/results/benchmark-<timestamp>.json` on every run. Commit a transcript alongside any cited numbers.

---

## 7. Where Azcodr Loses (Read Before Citing)

- **Governance friction:** lint gates, hook blocks, and scaffold ceremony add per-ticket overhead vs control. This simulation does not measure it.
- **Token and time cost:** tokens per ticket, wall-clock, and human review minutes are NOT collected here. On real agent runs expect Arm C to cost more tokens than Arm A; the open question is whether the review-time saving outweighs it.
- **Completion risk:** strict guards can block a valid edit (false positive) until the agent refactors. `passed` above means "drift-free", not "all 10 tickets functionally correct".

## 8. Threats to Validity

- Synthetic fixtures, not live agent output; single deterministic run, no variance estimate (plan calls for 5 runs × 2 agents).
- One stack (TypeScript) and one rule set; polyglot gates in `docs/rules/clean_code.md` are not exercised here.
- No independent rerun yet. To harden: have one outside developer run one arm with a different model, publish the transcript, and report cost metrics from `benchmark/README.md` §4.
