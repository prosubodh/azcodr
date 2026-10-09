# Azcodr Consolidated Analysis — Claim-by-Claim Audit

Date: 2026-10-09 · Audited against the working tree at `D:\projects\azcodr`.

This file verifies every verifiable claim in the attached `Azcodr Consolidated
Analysis and Plan` document against the live repository. Statuses:

- **TRUE / FALSE / PARTIAL** — verified against files in this repo.
- **STALE** — the doc is right that it *was* true, but the repo has since fixed it.
- **FIXED in 2.6.0** — true at the time the doc was written; addressed by the
  change batch this audit accompanies.
- **UNVERIFIABLE** — needs network access (not available in this audit).

---

## 1. The three "still open, by severity" items

| # | Doc claim | Status | Evidence |
|---|---|---|---|
| 1 | `run-benchmark.js` hand-writes the drifted code; no agent ran | **TRUE** | `benchmark/run-benchmark.js:41-62` writes the 365-line `auth.ts`, the `billing<->tenant` cycle and the `domain->infra` breach; `:153` `method: 'synthetic fixtures (no live agent); single run, no variance estimate'`. |
| 1a | RESULTS.md headlines "100% drift elimination" and narrates "the agent" | **FIXED in 2.6.0** | Retitled "Detector Validation on Synthetic Fixtures"; executive verdict rewritten; §1, §3, §4 now say fixtures, not agent behaviour; new §9 pre-registers the real-agent trial. |
| 2 | Every shipped hook is `enabled: false` | **FIXED in 2.6.0** | `.agents/hooks.json` + `.example`: all four hooks now `enabled: true` (amends ADR-020; see ADR-021). |
| 2a | Unparseable payloads fail open | **TRUE (by design)** | `src/agent-guard.ts:30-38` returns `null` on unparseable JSON → falls back to `inspectPreCommand` → `src/agent-guard-command.ts:103` `blocked:false`. ADR-005 (`memory.md`) states this is deliberate; missing engine now exits 2 (fail-closed). |
| 3 | Boundaries not wired into generated projects / CI | **FIXED in 2.6.0** | Boundary engine vendored to `.agents/lib/boundaries.js` + runner `.agents/scripts/boundary_guard.js`; starter `package.json` gains a `boundaries` script; starter `.github/workflows/ci.yml` runs the guard; bootstrap smoke test executes it. |
| 4 | 2.2.0 → 2.5.1 in ~7h, ~25 commits/day | **TRUE** | `v2.2.0` 2026-10-08 14:02 UTC → `v2.5.1` 2026-10-08 20:58 UTC (6h56m); 26 commits on 2026-10-08. |
| 5 | External validation at zero | **PARTIAL / UNVERIFIABLE** | `git shortlog` shows 1 human contributor. Stars/forks need network. |
| 6 | Duplicated badge lines in README | **FIXED in 2.6.0** | Duplicate Dependencies + License rows removed. |
| 6a | Pillars 7–9 still lead the README | **FALSE** (doc wrong) | README leads with title/positioning (`:1`, `:15`); pillars 1–10 appear `:22-36`, pillars 7–9 mid-list. |
| 6b | GitHub description/topics unverified | **UNVERIFIABLE** | Network required. |

## 2. The "v2.5.1 changed" claims

| Claim | Status | Evidence |
|---|---|---|
| README + npm description say "governance toolkit, optional starter (early release)" | **PARTIAL → FIXED** | README matches; npm/JSR description lacked "optional starter" — aligned in 2.6.0 (`package.json`, `jsr.json`). |
| SECURITY.md / CONTRIBUTING.md / CODE_OF_CONDUCT.md exist | **TRUE** | All three present and in `package.json` `files[]`. |
| Personal author email removed from source/docs | **PARTIAL → FIXED** | Not in `src/`/`docs/`; remaining: `package.json` author email (dropped in 2.6.0), role addresses `+security`/`+conduct` (kept, deliberate routing), LICENSE name (`Copyright (c) 2026 Subodh Khanal`, standard). |
| Empty template ledger from `data/memory.template` | **TRUE** | `data/memory.template:20` "No decisions recorded yet"; templates copy that, never root `memory.md` (repo has ADRs up to ADR-021). |
| `docs/tipping-points.md` with numeric triggers | **TRUE** | `docs/tipping-points.md:11-12` numeric triggers; 5 tipping points named. |
| `azcodr check` / `azcodr boundaries` run on any repo | **TRUE (caveat)** | `src/cli.ts:31-46`, `src/cli-boundaries.ts`. Caveat: `check` runs the full governance validator, which reports errors on repos lacking `memory.md`/rules — it is azcodr-shaped, not any-repo-shaped. |
| Hooks: Refactor-Before-Add, RED-before-GREEN, command guards | **TRUE** | `src/agent-guard-file.ts:66`, `src/agent-guard-tdd.ts:77-83` (default off unless `enforceTestFirst`), `src/agent-guard-command.ts:16-89`. |
| Stryker mutation testing in CI | **FALSE (as stated)** | `stryker.config.json` is orphaned (referenced only by its own `$schema`; grep confirms). CI mutation gate is the **native** harness `benchmark/mutation-test.js` (`ci.yml:94-95`). Doc calls it Stryker; reality is a zero-dep native harness. |
| Fail-open guard found and fixed; per-language linters emitted | **TRUE** | `docs/generated-enforcement-analysis.md` findings + addenda; `.agents/scripts/agent_guard.js:42-49` exits 2; `bootstrap_workspace.sh:358-466` emits eslint/ruff/clippy/golangci/checkstyle/editorconfig/clang-tidy. |

## 3. New defects this audit found (not in the attachment)

1. **Generated CI was inherited and broken.** `TEMPLATE_ITEMS` copies `.github`
   including azcodr's own `ci.yml`/`publish.yml`, which call `npm ci`, `npm run
   build`, `test:mutation`, `benchmark/run-benchmark.js` — none exist in a fresh
   scaffold → generated CI failed on every push. **Fixed in 2.6.0** by writing a
   Node-only starter CI and dropping the dev workflows from the target.
2. **`stryker.config.json` is orphaned.** Either wire it (adds a dependency) or
   delete it. **Open decision; left unmodified.**
3. **`npx azcodr check` on a foreign repo is not zero-friction.** It runs the
   full governance validator and fails on absent `memory.md`; the doc's "runs on
   any repo" should be read with that caveat (already documented above).

## 4. Bottom line

Every one of the doc's top-severity items was real; all three are addressed in
the 2.6.0 batch. Two "small" items (duplicate badges, description phrasing) are
fixed. The doc's claims about pillars-7-9-leading, Stryker-in-CI, and
"email removed" were the least accurate; each is corrected above. The hard,
unfinished evidence remains the real-agent trial (§9 of `benchmark/RESULTS.md`
and `benchmark/REAL-AGENT-RUNBOOK.md`).