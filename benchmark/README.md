# Azcodr Empirical Drift-Reduction Benchmark

> **Benchmark Mission:** Provide a reproducible, empirical benchmark demonstrating AI-assisted architecture governance and drift prevention across sequential agent tickets.

---

## 1. Executive Overview & Experimental Design

AI coding agents optimize locally for token minimization and immediate ticket passing. Over sequential tickets, this produces **AI-Accelerated Architectural Drift**:
- Single files silently bloat past 300+ lines.
- Modules form circular import cycles (`A -> B -> A`).
- Clean architectural layers erode as domain logic directly imports infrastructure clients and HTTP controllers.
- Test suites devolve into assertion-free tests written solely to satisfy line gates.

This benchmark rigorously evaluates how governance tooling stops drift across three controlled experimental arms.

---

## 2. The Three Experimental Arms

| Arm | Name | Configuration & Tooling |
|---|---|---|
| **Arm A (Control)** | **Plain Starter** | Standard TypeScript web-backend starter (tsconfig, basic npm test/build, no architectural limits). |
| **Arm B (Hooks Only)** | **Plain Starter + Azcodr Hooks** | Plain starter equipped only with Azcodr's Pre/Post tool runtime hooks (`agent_guard.js`) enforcing Refactor-Before-Add and command safety. |
| **Arm C (Treatment)** | **Full Azcodr Architecture** | Scaffolding per topology with complete Clean Code fitness functions (`eslint.config.js`), boundary enforcement (`boundaries.ts`), and agent runtime guards. |

---

## 3. The 10 Sequential Tickets & The 3 Traps

Ten feature tickets are executed sequentially from the same base repository state. Three intentional "architectural traps" tempt the agent into taking shortcuts:

| Ticket # | Feature Area | Intentional Trap / Temptation | What Drift Looks Like |
|---|---|---|---|
| **T01** | User Registration | None (Baseline) | Clean module creation. |
| **T02** | JWT Authentication | None (Baseline) | Token generation and auth middleware. |
| **T03** | OAuth Multi-Provider | **Trap 1: File Bloat** | Appending GitHub/Google/Discord OAuth handlers directly into `auth.ts`, bloating it past 350 lines. |
| **T04** | Organization Workspace | None (Baseline) | Workspace tenancy scoping. |
| **T05** | Billing Status Verification | **Trap 2: Circular Dependency** | Checking workspace billing tier requires tenant lookup while tenant lookup requires billing status, tempting `billing.ts <-> tenant.ts` cycle. |
| **T06** | Transactional Outbox | None (Baseline) | Event persistence and dispatch. |
| **T07** | Payment Webhook Handler | **Trap 3: Boundary Breach** | Domain payment entity directly invokes HTTP transport controller or raw database driver, violating layer boundary. |
| **T08** | Cursor Pagination | None (Baseline) | Efficient audit log queries. |
| **T09** | Role-Based Access Control | None (Baseline) | Policy checks and guards. |
| **T10** | Graceful Shutdown | None (Baseline) | Connection draining and signal handlers. |

---

## 4. Evaluation Metrics & Automated Scoring

The automated evaluation harness (`node benchmark/evaluate.js <dir>`) measures 4 objective dimensions directly; the remaining 3 must be recorded manually on real agent runs:

| Metric | Tool / Engine | Target / Unit | Measured by harness? |
|---|---|---|---|
| **Import-Boundary Violations** | Azcodr `inspectBoundaries()` | 0 violations | ✅ yes |
| **Dependency Cycles** | Azcodr `detectDependencyCycles()` | 0 cycles | ✅ yes |
| **Files Over 300 Lines** | Azcodr `inspectFileWrite()` | 0 files | ✅ yes |
| **Test Quality Proxy** | Assertion count per test file | ≥ 1 assertion/test, 0 assertion-free files | ✅ yes |
| **Token Cost** | Agent Session Logs | Total tokens per ticket | ❌ manual |
| **Wall-Clock + Review Minutes** | Timed blind review | Minutes per ticket | ❌ manual |
| **Acceptance Passing Rate** | `benchmark/tickets/tickets.json` acceptance list | 10/10 tickets passing | ❌ manual (harness checks structure, not behavior) |

---

## 5. Running the Evaluation Harness

```bash
# Evaluate any repository or benchmark run directory:
node benchmark/evaluate.js ./path-to-target-repo
```

To run the full benchmark against an agent harness, execute each ticket in order from `benchmark/tickets/tickets.json` and run the evaluator after every ticket completion.

---

## 8. Arm D: Raw-Scaffold Enforcement Audit

`node benchmark/run-benchmark.js` also assesses a real scaffolded project with
no agent additions (`runArmD()` in `run-benchmark.js`, checklist in
`evaluate.js` `auditScaffoldEnforcement()`): stage 1 scores the raw
`scaffold()` output, stage 2 re-scores after `bootstrap_workspace.sh backend
typescript`. Deterministic checks (guard script, resolvable engine, wired
hooks, gate configs for the recorded language) must all hold; agent-layer
state (tool installed, lint wired, hooks enabled) is reported but never gating.
See `benchmark/RESULTS.md` §5 for the current scorecard.
