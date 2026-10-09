# Real-Agent Validation Runbook (Pre-registered)

This runbook is the pre-registration record for the live-agent, drift-reduction
trial that the packaged benchmark does **not** perform. `benchmark/RESULTS.md`
is detector validation on synthetic fixtures; this document is the plan for
the evidence that would actually support the product claim.

> **Status:** FULL PROTOCOL NOT YET RUN. A pilot pass was executed on
> 2026-10-09 by subagent sessions in the OpenCode harness — see
> `results/real-agent/pilot-2026-10-09/pilot-result.md`. That pilot measured
> prompt-level governance only (no hook interception), so every number below
> is still a placeholder until a full pass is executed on a hook-loading
> harness (Claude Code / Cursor) and published under
> `benchmark/results/real-agent/`.

---

## 1. Design at a Glance

| Axis | Choice |
|---|---|
| Arms | A: plain TS starter (control) · B: plain starter + azcodr hooks · C: azcodr scaffold |
| Stacks | TypeScript web backend (only stack with full tooling today) |
| Agents | 2 harnesses, e.g. Claude Code and Cursor; same model version, fixed temperature |
| Tickets | 10 sequential tickets from `benchmark/tickets/tickets.json` (3 traps: T03 file bloat, T05 cycle, T07 boundary breach) |
| Runs | 5 per arm per agent; variance visible |
| Evidence | raw transcripts, diffs, `evaluate.js` scorecard after every ticket, agent session logs for tokens |

## 2. Setup Steps

1. `npx azcodr my-arm-c` and `npx azcodr my-arm-a-control`; run `/lets-build`
   (backend, TypeScript) for the treatment arm. For Arm A, use a plain starter
   with no rules/hooks.
2. In Arm C, confirm the shipped hooks are active in the harness
   (`.agents/hooks.json` ships `enabled: true`; a harness that does not load
   that file must be wired so edit-time blocking is real, then prove it with
   one deliberate blocked edit before the run).
3. Commit the identical base state for all arms; note the head commit SHA in
   the result JSON.
4. Execute tickets sequentially. After each ticket run:
   - `node benchmark/evaluate.js <arm-dir>` and capture the scorecard.
   - Save agent session logs (token counts per message).
5. Store every artifact under `benchmark/results/real-agent/<arm>/<run>/`.

## 3. Metrics to Report

| Metric | Tool / source | Reported in |
|---|---|---|
| Import-boundary violations | `node benchmark/evaluate.js` | scorecard |
| Dependency cycles | `node benchmark/evaluate.js` | scorecard |
| Files > 300 lines / complexity | evaluate.js (hygiene) | scorecard |
| Test-quality proxy (assertions/test) | evaluate.js | scorecard |
| Tokens + wall-clock per ticket | agent session logs | results template |
| Human review minutes per ticket | timed blind review | results template |
| Tickets completed correctly | `tickets.json` acceptance list | results template |

## 4. Credibility Rules

- Publish the raw transcripts, diffs and scripts; anyone must be able to rerun it.
- Report where azcodr loses: higher tokens, blocked edits, fewer completed
  tickets. A survival-runner that wins on accepting 10/10 tickets tells a
  different story from one that blocks edits and needs intervention.
- Have one outside developer run one arm with a different model.
- Include Arm B (hooks only) so the contribution of hooks vs scaffold is
  separable — the reviewers' single most-requested control.

## 5. Result Template

Copy `results/template/real-agent-result.template.md` into
`benchmark/results/real-agent/<date>-<arm>/`, fill it out, and add one row per
run per agent. A single honest run beats another polished synthetic number.