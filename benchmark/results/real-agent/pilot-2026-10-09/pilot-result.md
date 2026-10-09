# Real-Agent Pilot Result — 2026-10-09

> **Pilot, not the full protocol.** This is a first empirical pass executed in
> the OpenCode harness with subagent sessions as the agent. It measures
> **prompt-level governance** (does shipping `docs/rules/` + `AGENTS.md` push a
> fresh agent toward less drift?) — NOT live hook enforcement, which requires
> a harness that loads `.agents/hooks.json` and intercepts edits (Claude Code /
> Cursor, see `benchmark/REAL-AGENT-RUNBOOK.md`).
>
> Pre-registered runbook: `benchmark/REAL-AGENT-RUNBOOK.md`. The full protocol
> (5 runs/arm/agent, token + wall-clock capture, human review minutes, real
> harness with hook interception) is still **NOT YET RUN**.

## 1. Design at a Glance

| Axis | Choice |
|---|---|
| Arms | A: plain TS starter (control) · B: plain starter + azcodr guard/hook files · C: azcodr scaffold (treatment) |
| Stack | TypeScript web backend (`node:test`, `tsc`, Node built-ins only — zero third-party runtime packages) |
| Agent | OpenCode subagent session (general agent), 1 session per arm |
| Runs | 1 per arm (pilot) — protocol calls for 5 |
| Tickets | 10 sequential from `benchmark/tickets/tickets.json` (3 traps: T03 file bloat, T05 cycle, T07 boundary breach) |
| Evidence | arm source trees (see §4), scorecard JSON per arm, this summary |

## 2. Summary of Measurements

Final scorecard after all 10 tickets (full transcripts below):

| Arm | Max lines | Files > 300 | Cycles | Boundary viol. | Tests / assertions | evaluate.js verdict |
|---|---|---|---|---|---|---|
| A: plain starter (control) | 241 | 0 | **1** | 0¹ | 10 / 141 | 🚨 **DRIFT DETECTED** |
| B: starter + guard files | 190 | 0 | 0 | 0¹ | 10 / 170 | 🎉 0 violations |
| C: azcodr scaffold (treatment) | 184 | 0 | 0 | 0 | 10 / 114 | 🎉 0 violations |

¹ Boundary detector is a path-segment heuristic (files under `domain/` / `core/`
must not import from `transport/`/`adapters/`/`infra/`). Arms A and B used flat
`src/*.ts` layouts, so they **structurally dodge** the boundary check; their own
agent reports confirm store-coupling everywhere (see §3). Only Arm C's
hexagonal layout actually exercises the boundary detector.

## 3. Per-Arm Findings (from agent session reports)

### Arm A — plain starter (control)
- T01–T10 implemented; 44/44 tests green; `tsc` clean.
- **1 real dependency cycle:** `audit.ts ↔ tenant.ts` (T05's billing/tenant
  trap was *not* hit, but a sibling cycle slipped in — exactly the drift class
  the benchmark exists to catch).
- **T07 trap realized:** `payments.ts` reads/writes the raw store directly from
  the core payment entity; every feature module (`auth`, `tenant`, `billing`,
  `rbac`, `audit`, `outbox`, `payments`) reaches into `./db.ts` with no
  repository/port boundary.
- Largest file `auth.ts` = 241 lines (single hub for register + login + JWT +
  all 3 OAuth providers); under the 300-line rule, at risk.

### Arm B — plain starter + guard files (hooks present but NOT intercepted)
- 44/44 tests green; `tsc` clean; `.agents/**` untouched.
- **0 cycles.** OAuth separated into its own `oauth.ts` (188 lines); `auth.ts` =
  93. The natural-module split avoided T03 bloat and T05's cycle trap.
- **Coupling is still pervasive:** every feature module imports the concrete
  `db.ts` singleton directly; `audit.ts` performs a raw cross-aggregate read
  (`findOne("workspaceMembers", …)`) bypassing the workspace boundary; no
  ports/adapters/repository layer exists.
- **Verdict caveat:** a *detector* measures 0 violations because flat files
  under `src/` don't match any boundary rule's `fromLayer`. A human reviewer
  (or a layered-arm detector, as in Arm C) would flag the coupling.

### Arm C — azcodr scaffold (treatment)
- All 10 tickets complete; **41/41 tests green**; `tsc --noEmit` clean;
  `npm run validate` → SUCCESS; **`npm run boundaries` → Green through every
  ticket (47 modules, 0 cycles, 0 violations)**.
- Built and kept a **hexagonal, boundary-guarded architecture**: `domain`
  (entities + *ports only*), `application` (use cases), `adapters` (memory
  store, unit-of-work, scrypt, JWT HS256 w/ 900s TTL, Stripe HMAC constant-time,
  3 OAuth strategies), `transport` (node:http server, RFC-9457 errors, authGuard
  PEP). Largest file `adapters/memoryStore.ts` = 162 lines.
- **All three traps resisted, with the agent's own admission of how:** T03 →
  provider strategies + registry kept `transport/auth.ts` at 44 lines; T05 →
  shared contract `domain/plans.ts` (no billing↔tenant cross-import); T07 →
  payment domain reacts only through ports (subscription repo + outbox inside
  the UoW, HMAC at the edge behind a port).
- **Honest disclosure from the agent:** the *boundary/architecture* discipline
  never slipped, but the *TDD discipline tapered* — first micro-assertion of
  each ticket went RED→GREEN, later assertions were mostly verify-after, and a
  mid-ticket T06 refactor briefly wedged the suite. One anecdote; protocol run
  #2 must hold the nano-cycles accountable per-ticket. `git` was not used
  (deviation §5).

## 4. Evidence Index

| Artifact | Path |
|---|---|
| Arm A scorecard (JSON) | `scorecard-arm-a.json` (this directory) |
| Arm B scorecard (JSON) | `scorecard-arm-b.json` (this directory) |
| Arm C scorecard (JSON) | `scorecard-arm-c.json` (this directory) |
| Arm A source tree | `benchmark/results/real-agent/pilot-2026-10-09/arms/arm-a/` |
| Arm B source tree | `benchmark/results/real-agent/pilot-2026-10-09/arms/arm-b/` |
| Arm C source tree | `benchmark/results/real-agent/pilot-2026-10-09/arms/arm-c/` |
| Tickets | `benchmark/tickets/tickets.json` |
| Setup script | `benchmark/setup-pilot-arms.mjs` |

## 5. Deviations from the Pre-Registered Protocol

1. **No live hook interception.** Subagent tool calls in this harness are not
   intercepted by `.agents/hooks.json`. Arm B's hook/guard files existed but
   never blocked an edit; Arm C's hooks likewise never ran. This measures the
   *documentation + structure* effect only. The enforcement question (do the
   hooks actually block drift?) remains untested and is the top open item.
2. **1 run/arm, not 5**; single agent type; no token/wall-clock accounting
   (session logs were not retained per-ticket); no human review minutes.
3. **Base states differ slightly** (arm A/B use a trimmed starter; arm C is the
   full scaffold `package.json`), all created by `setup-pilot-arms.mjs`.

## 6. Honest Notes / Threats to Validity

- **Favouring azcodr:** the treatment arm's agent was explicitly told to read
  and follow `AGENTS.md` + `docs/rules/` — a "prompt pack advantage" that
  mirrors real harness use but is not the same as enforced editing behaviour.
- **Against azcodr:** the boundary detector misses flat-layout drift (a
  measurement gap, not a product claim); without live hooks, Arm C's score
  cannot be attributed to enforcement. Ticket acceptance was only verified
  qualitatively by the session reports, not re-run by an independent observer.
- **Interpretation guardrail:** one run per arm is anecdote, not evidence. The
  numbers here are for methodology calibration and a first directional read.