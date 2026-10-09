# Detector Validation on Synthetic Fixtures: Results & Findings

> **Scope (read first):** This document validates that the **evaluator detects** the three drift classes it claims to detect, using **hand-written fixtures**. No AI agent ran. It is not a live-agent drift-reduction trial; those results are planned (see §9). Do not cite it as evidence that agents drift or that Azcodr changes agent behaviour.

> **Verdict:** On the committed fixtures the detector scores the full architecture (boundary engine + fitness functions + hooks) at **0 violations**, while the control fixture carries one oversized file, one import cycle, and one layer breach. The product-claim value so far is zero: the fixtures were written to be caught.

---

## 1. What Was Actually Run

Three fixture trees were hand-authored in `run-benchmark.js` to represent the end-state of three arms. No agent executed the tickets in [`tickets.json`](./tickets/tickets.json).

- **Arm A (Control fixture):** hand-written drift — a 365-line `auth.ts`, a `billing <-> tenant` cycle, and a `domain -> infrastructure` breach.
- **Arm B (Hooks-only fixture):** hand-written modularization of the bloat trap; the cycle and breach are left in place.
- **Arm C (Treatment fixture):** hand-written clean end-state (ports, shared types, split files).

**Arm D** (below) is different: it scaffolds a **real** project with the shipped template and audits enforcement *presence* with no agent additions.

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

Each trap below is a hand-written fixture. The "outcome" lines describe the fixture's end-state and the check that flags it — not an observed agent trajectory.

### Trap 1: File Bloat (Ticket T03 - OAuth Providers)
- **Temptation:** appending GitHub, Google, and Discord OAuth handlers directly into `auth.ts`.
- **Arm A Outcome:** fixture `auth.ts` is 365 lines, violating clean code limits.
- **Arm B Outcome:** the fixture models the intended `agent_guard.js` interception (reject additions over 300 lines) by extracting provider strategies (`oauth-github.ts`, `oauth-google.ts`). The hook itself is not exercised on a live tool call here.
- **Arm C Outcome:** fixture modeled as prevented at runtime and verified by the ESLint fitness function (`max-lines: 300`).

### Trap 2: Circular Dependency (Ticket T05 - Workspace Billing)
- **Temptation:** checking workspace subscription requires tenant lookup while tenant lookup requires billing status.
- **Arm A & B Outcome:** fixtures contain `import './tenant.js'` in `billing.ts` and `import './billing.js'` in `tenant.ts`.
- **Arm C Outcome:** fixture extracts a shared contract interface (`billing-types.ts`), keeping the dependency graph acyclic. `detectDependencyCycles()` flags the A/B fixtures.

### Trap 3: Layer Boundary Breach (Ticket T07 - Payment Webhook)
- **Temptation:** payment reconciliation calls raw database or HTTP transport directly from core domain logic.
- **Arm A & B Outcome:** fixture `payment.ts` imports `../infrastructure/db.ts`.
- **Arm C Outcome:** fixture inverts the dependency using a Hexagonal Port (`PaymentRepoPort`). `detectBoundaryViolations()` flags the A/B fixtures.

---

## 4. Key Takeaways & Product Insights

1. **Size hygiene alone is not architecture:** the Arm B fixture models hooks stopping file bloat (Refactor-Before-Add) while still carrying a cycle and a layer breach. Cycle and boundary enforcement needs the graph engine.
2. **The Defense-in-Depth Moat:** the inactive fixture only validates the detector. The offered moat is **Agent-Runtime Hooks** (stopping bad edits during the session) **+ Boundary Enforcement in CI** (verifying module directionality) — this is untested on a live agent until §9 is executed.

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
| Hooks wire `agent_guard` + `boundary_guard` | wired (enabled by default) | wired (enabled by default) |
| Toolchain gates (`eslint.config.js` for typescript) | n/a (no profile yet) | present |

Agent layer (reported, never gating): toolchain *installed*, hooks *proven live*
(an actual blocked edit in a session) — these require the Phase 4/5 agent steps.
Hooks ship `enabled: true` so a harness that loads `.agents/hooks.json` blocks
immediately; a live block proof is still required. Node profiles also arrive
with the `lint` entry rewired to `eslint .`; other profiles still need it wired
by hand. A raw scaffold honestly reports the remainder absent.

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

---

## 9. Real-Agent Validation (Planned → Pilot 2026-10-09)

The detection proof above is necessary but not sufficient for the product claim.
The next evidence step is a live-agent trial, designed so a skeptic cannot
dismiss it. Runbook and result template live in
[`REAL-AGENT-RUNBOOK.md`](./REAL-AGENT-RUNBOOK.md).

**A pilot pass exists:** [`results/real-agent/pilot-2026-10-09/`](./results/real-agent/pilot-2026-10-09/pilot-result.md)
— 1 run per arm, three arms, executed in this harness by subagent sessions.
Directional result: Arm A (plain) drifted (1 cycle); Arm B (hooks, unhooked
here) scored 0 but dodge the boundary check; Arm C (scaffold) scored 0 with the
boundary detector genuinely exercised. The pilot measures prompt-level
governance only — hooks were NOT intercepted. It is a methodology calibration,
not the credible pass.

Minimum credible pass (full protocol):

- Two TypeScript web-backend repos built from the same spec: plain starter
  (control) and an azcodr scaffold where the shipped hooks are loaded (treatment).
- Same agent, same model version, same prompts, fixed temperature; two agents
  (e.g. Claude Code and Cursor) to show the result is not agent-specific.
- Ten sequential tickets (the 3 traps among them) from `tickets.json`, executed
  in order; publish raw transcripts, diffs and the `evaluate.js` scorecards.
- Report tokens per ticket, wall-clock, acceptance, and human review minutes —
  including where azcodr loses on cost and completion.
- Add a third arm: plain starter + azcodr hooks only, to isolate what the hooks
  contribute versus the full scaffold.

Nothing in this file is a substitute for that pass. When a real-agent pass is
published, move it to a new section above this one and keep this section as its
pre-registration record.
