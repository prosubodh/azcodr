# Azcodr Consolidated Analysis — Actionable Plan

Date: 2026-10-09 · Companion to `analysis/2026-10-09-consolidated-audit.md`
(audit statuses) and ADR-021 (`memory.md`, the decision record for the v2.6.0
batch). This file is the executable backlog: **what v2.6.0 already did**, what
is queued next, the phase gates, and the migration notes adopters need.

The source-of-truth document's five-phase roadmap ("5 phases, 4 gates, ~16
weeks, Phase 1 decides whether Azcodr has a product — do not start a phase
until its gate passes") is reproduced below as a tracked backlog. Phase 0 items
the doc marked as "this week" are ticked against reality.

---

## 0. Where we are (after the v2.6.0 batch)

The doc's three top-severity items are **all addressed in this batch**:

| Doc item | v2.6.0 action | Evidence |
|---|---|---|
| Benchmark read as a live-agent trial while fixtures were synthetic | Retitled + rewritten; real-agent trial pre-registered | `benchmark/RESULTS.md`, `benchmark/REAL-AGENT-RUNBOOK.md` |
| "Your agent cannot skip" false (all hooks `enabled: false`) | All four hooks `enabled: true` | `.agents/hooks.json`, `.agents/hooks.json.example`, tests/hooks-default.test.ts |
| Boundaries not wired into generated projects/CI | Vendored engine + runner + starter CI + bootstrap smoke test | `.agents/lib/boundaries.js`, `.agents/scripts/boundary_guard.js`, `src/scaffold.ts`, tests |

Three defects **found during this audit that the doc did not list** were also
fixed: generated projects inherited azcodr's own broken CI (new starter CI is
Node-only and green out of the box), the personal author email shipped in
`package.json` (removed), and the README/npm description overstated scope
(aligned to "optional starter").

Remaining **open items are enumerated in §4** (open decisions) and §1 (backlog).

---

## 1. Backlog (ticket style)

Legend: **[DONE v2.6.0]** shipped in this batch · **[QUEUED]** next work ·
**[BLOCKED]** needs something external · **[OPEN]** decision required.

### Governance & enforcement (the differentiator)

| # | Item | Phase | Status |
|---|---|---|---|
| B-01 | Deterministic boundary + cycle gate ships **inside every scaffold** and runs in generated CI | 0 | **[DONE v2.6.0]** `.agents/scripts/boundary_guard.js` (exit 0/1, exit 2 fail-closed), vendored engine, starter `ci.yml`, starter `package.json` `boundaries` script |
| B-02 | Bootstrap smoke test executes the boundary guard deterministically | 0 | **[DONE v2.6.0]** `bootstrap_workspace.sh` generates a `scripts/smoke_test.sh` that runs `node .agents/scripts/boundary_guard.js <root>/src` |
| B-03 | All shipped hooks default to enabled (`+example` mirror) | 0 | **[DONE v2.6.0]** `enabled: true` × 4; sample hooks.json and example kept in lockstep |
| B-04 | Byte-lock the vendored engine to the built `lib/` | 0 | **[DONE v2.6.0]** `tests/boundary-guard.test.ts` asserts byte equality |
| B-05 | Lock the starter-CI behaviour with tests (dry-run, removal of dev workflows, package.json wiring) | 0 | **[DONE v2.6.0]** `tests/scaffold-ci.test.ts` |
| B-06 | Mutants for starter-CI and boundary-runner fail-closed behaviour | 0 | **[DONE v2.6.0]** added to `benchmark/mutation-test.js` targets |
| B-07 | **Real-agent validation of hook enforcement** (doc's #1 next move) | 1 | **[PILOT FILED]** `benchmark/results/real-agent/pilot-2026-10-09/`: 3 arms × 1 run by subagent sessions. A: drifted (1 cycle). B: 0 (flat layout dodges boundary check). C: 0 with boundary detector genuinely exercised. Prompt-level governance only — hooks not intercepted. Full protocol still **[BLOCKED]** on a hook-loading harness (Claude Code / Cursor). |
| B-08 | Per-language guard scripts in generated projects become deterministic, not agent-authored | 1 | **[OPEN]** doc point: step 5 linter/fixer emission is agent-authored. Bootstrap already emits deterministic eslint/ruff/clippy/golangci/checkstyle/editorconfig/clang-tidy; close the loop by testing a generated C/Rust/Go/… project end-to-end. |
| B-09 | Decouple the **checker** from the scaffolder so `azcodr check`/`boundaries` govern *existing* repos | 2 | **[QUEUED]** doc ruling: highest-leverage product move. `azcodr boundaries` exists; needs a foreign-repo tolerance pass (see B-10). |
| B-10 | `azcodr check` on a non-azcodr repo reports a scoped verdict instead of failing on missing azcodr-shaped files | 2 | **[QUEUED]** current caveat: `check` runs the full validator and errors on missing `memory.md`/rules ("runs on any repo" overstates). |

### Claims, positioning, evidence

| # | Item | Phase | Status |
|---|---|---|---|
| C-01 | Replace "production-ready, battle-tested" wording | 0 | **[DONE v2.6.0]** README + npm/JSR description aligned |
| C-02 | Remove duplicate badges; honest benchmark framing | 0 | **[DONE v2.6.0]** README badges de-duplicated; synthetic-detector framing |
| C-03 | Publish coverage report as CI artifact/badge | 0 | **[DONE]** pre-existing (`ci.yml` uploads coverage; ADR list) |
| C-04 | GitHub description + website link + 5–8 topics | 0 | **[DONE — VERIFIED]** live `gh repo view` 2026-10-09: description + 8 topics present; homepage = JSR package page (valid). Doc's "missing" claim was stale. |
| C-05 | Do not cite the 1,604 downloads as proof | 0 | **[DONE]** removed from marketing claims |
| C-06 | Document the linters a non-TypeScript project actually gets | 0 | **[DONE]** `docs/generated-enforcement-analysis.md` + addenda; determinism pass (B-08) covers the residual |
| C-07 | Neutral fallback git identity (or skip commit) | 0 | **[DONE]** pre-existing (checked in audit) |
| C-08 | Empty `memory.md` ledger in scaffolds, not azcodr's ADRs | 0 | **[DONE]** `<data/memory.template>` copies the placeholder |
| C-09 | `docs/tipping-points.md` numeric triggers | 0 | **[DONE]** |
| C-10 | Migration notes for the 2.x churn | 0 | **[DONE v2.6.0]** §5 of this file |

### Product posture

| # | Item | Phase | Status |
|---|---|---|---|
| P-01 | Resolve the starter-vs-control-plane identity split in one sentence | 3 | **[OPEN]** ADR-021 explicitly declines to resolve it; current framing: "governance toolkit, with an optional starter (early release)". Keep, or split the npm surface. |
| P-02 | Shrink the 28-rule doc surface; move product/project-management rules out of "architecture governance" | 3 | **[OPEN]** doc contention; risky to cut, decide deliberately |
| P-03 | Scorecard dimensions "enforcement in user projects" and "differentiation" tracked from 4/10 and 6/10 | 3 | **[QUEUED]** they move only with B-07/B-08 evidence |

---

## 2. The five phases and their gates

Derived from the source document ("order matters more than the dates; do not
start a phase until its gate passes"). Gate = the check that must pass before
the next phase starts. None of the gates below has passed yet except Phase 0's.

| Phase | Goal | Gate (must pass to proceed) | Depends on | Status |
|---|---|---|---|---|
| 0 | Claims, enforcement wiring, reproducibility | 2.6.0 batch merged; `npm test`, lint, validate, mutation all green; generated-CI no longer fails out of the box | — | **[DONE v2.6.0]** being verified in this session |
| 1 | **Empirical proof at the agent runtime** — the product-deciding phase | ≥1 external harness runs the 10-ticket protocol on arms A/B/C; raw transcripts + results land in `benchmark/results/` using the registered template; acceptance tests + cost metrics recorded | B-07 protocol | **[PILOT FILED 2026-10-09]** prompt-level pilot done (drift in A, clean C, hooks-not-intercepted caveat); full pass **[BLOCKED]** on external harness |
| 2 | Govern existing repos (checker decoupled from scaffolder) | `azcodr boundaries` + a foreign-repo `check` pass on a repo with no azcodr files, with a scoped verdict | B-09, B-10 | **[QUEUED]** |
| 3 | Product posture: identity split + surface shrink | One consistent positioning sentence in README/npm/JSR; rules catalog trimmed or deliberately kept | P-01, P-02 | **[OPEN]** |
| 4 | External validation | A second outside developer independently runs one benchmark arm; issues/forks/usage beyond mirrors | network + time | **[BLOCKED]** |
| 5 | Scale evidence (multi-agent, multi-topology) & hardening | 5 runs/arm/agent variance table; hook-equivalent harness evidence (pilot filed 2026-10-09; full protocol pending) | B-07 results | **[OPEN]** |

Phase 1 is deliberately first: the doc's own verdict is that "a reproducible
demo of an agent's violations being caught beats more README philosophy", and
the hook + boundary wiring now shipped in v2.6.0 is the mechanism that demo must
exercise.

---

## 3. What "enforcement" now means (v2.6.0 truth table)

| Layer | Mechanism | Enforced where | Fails how |
|---|---|---|---|
| Structure (cycles, layer breaches) | `boundary_guard.js` + vendored engine | generated CI, starter `boundaries` script, bootstrap smoke test, `azcodr boundaries` | exit 1 + report; exit 2 if the engine is missing (fail-closed) |
| Runtime (agent session) | 4 hooks (`safety-guard`, `architectural-guard`, `post-tool-lint`, `stop-verifier`) | any harness that loads `.agents/hooks.json` | hook exit → harness blocks the tool call; unparseable payloads still fail open by ADR-005, compensated by deterministic denylist |
| Repo governance | `validate-cli.js` + `test:coverage` 100% gate | azcodr's own CI | build fails |
| Generated project governance | starter `ci.yml` (boundary guard + `validate-cli.js`) | user's CI | pull-request check fails |

---

## 4. Open decisions (owner: maintainer)

1. **`stryker.config.json` orphan — RESOLVED.** Deleted in the 2.6.0 follow-up
   (2026-10-09); the mutation gate stays the zero-dep native harness
   (`benchmark/mutation-test.js`, 8/8 mutants), locked by
   `tests/mutation-gate.test.ts`. The doc's "Stryker in CI" claim remains
   corrected in the audit.
2. **Default-on hooks trade-off.** All four hooks interrupt a harnessed session,
   including inside a bare scaffold. ADR-021 accepts the cost. Revisit only if
   a real-agent trial (Phase 1) shows the lint/stop hooks are net-negative.
3. **JSR — RESOLVED (stale entry).** ADR-008's blocker was superseded by
   ADR-013/ADR-014: the native ESM port landed, `publish-jsr` is enabled in
   `publish.yml`, and `@azcodr/azcodr@2.5.1` is live on JSR (verified
   2026-10-09). Republish the 2.6.0 batch at the next release so the JSR readme
   picks up the honest benchmark framing.
4. **GitHub description/topics/website — RESOLVED (verified).** Live `gh repo
   view` (2026-10-09): description + 8 topics already set; homepage is the
   valid JSR package page. The doc's "no description or topics" finding is
   stale — it was fixed after the doc was written.
5. **Real-agent trial.** A pilot pass was executed on 2026-10-09 with subagent
   sessions as the agent — see
   `benchmark/results/real-agent/pilot-2026-10-09/pilot-result.md`. Directional
   read (1 run/arm, prompt-level only): control arm drifted (1 cycle), scaffold
   arm clean with the boundary detector genuinely exercised. **NOT
   hook-equivalent** (this harness does not intercept subagent tool calls), so
   the full protocol still needs Claude Code/Cursor. Protocol pre-registered;
   if you have access to a hook-loading harness, this is the doc's #1 next move.

---

## 5. v2.6.0 migration notes

Version 2.0.0 → 2.5.1 churned majors without notes; this file is the standing
fix. For **2.6.0**, adopters should know:

- **Scaffolded projects change behaviour (intended):**
  - `.github/workflows/ci.yml` in a new project is now the Node-only **starter
    CI** (boundary guard + `validate-cli.js`). azcodr's own `ci.yml` and
    `publish.yml` are **no longer copied** into new projects.
  - New projects ship `.agents/scripts/boundary_guard.js` +
    `.agents/lib/boundaries.js`, and `package.json` gains a `boundaries` script
    (`node .agents/scripts/boundary_guard.js`).
  - `.agents/hooks.json` now ships with all four hooks `enabled: true`. A bare
    scaffold's `post-tool-lint` (`npm run lint`) and `stop-verifier`
    (`scripts/verify_completion.sh`) hooks only exist if those scripts exist;
    `stop-verifier` now reports "nothing was verified" instead of silently
    passing (ADR-005).
  - Bootstrap now writes a boundary smoke test at `scripts/smoke_test.sh`
    (only if absent) and runs `boundary_guard.js <root>/src`.
- **No API/signature changes in the library.** `scaffold()`/`copyTemplate()`
  output gains one deterministic action line (`generate: .github/workflows/ci.yml
  (starter governance CI)`) in both live and dry-run modes; callers that
  asserted exact action arrays should re-run and re-snapshot.
- **Semantics of `copyTemplate` in a target that already has
  `.github/workflows/ci.yml`:** v2.6.0 overwrites it with the starter CI
  (`force: true`). Pre-existing projects scaffolded with `--force` will have
  their CI replaced; keep a backup or run `--dry-run` first.
- **README/npm/JSR description** is now "Architecture governance toolkit, with
  an optional starter (early release)". The personal author email is gone from
  `package.json`; the role addresses (`+security`, `+conduct`) remain for
  routing.

---

## 6. Verification state (updated by each run)

| Gate | Command | Status |
|---|---|---|
| Build | `npm run build` | ✅ green (2026-10-09) |
| Unit + integration | `npm test` | ✅ 46 suites / 548 tests (baseline 43/529 + 3 new suites, 19 new tests) |
| Coverage 100% (lines/functions/branches/statements) | `npm run test:coverage` | ✅ green — `src/starter-ci.ts` fully covered |
| Lint | `npm run lint` | ✅ green |
| Typecheck | `npm run typecheck` | ✅ green |
| Validator | `npm run validate` | ✅ green |
| Mutation gate (100% score) | `npm run test:mutation` | ✅ 8/8 mutants killed (2 new: starter-CI omission, boundary fail-closed bypass) |
| Benchmark transcript | `node benchmark/run-benchmark.js` | ✅ A failed, B failed, C passed 0/0/0, Arm D enforced both stages; transcript `benchmark/results/benchmark-2026-10-09T10-12-49-907Z.json` |
| Self-governance (evaluator on own `src/`) | `node benchmark/evaluate.js src` | ✅ 0/0/0 — `src/scaffold.ts` refactored to 282 lines (`src/starter-ci.ts` extracted) to stay under the 300-line fitness function |