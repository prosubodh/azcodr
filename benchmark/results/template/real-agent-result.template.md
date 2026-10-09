# Real-Agent Run Result — `<arm>` / `<date>`

> Pre-registered protocol: `benchmark/REAL-AGENT-RUNBOOK.md`. Complete this
> template for one arm × one agent × one run.

## Metadata

| Field | Value |
|---|---|
| Arm | A / B / C |
| Agent harness | e.g. Claude Code 2.x / Cursor 2.x |
| Model + version | e.g. claude-sonnet-4-5 |
| Temperature | |
| Base commit SHA | |
| Date / time | |
| Run number | of 5 |
| Observer (human review) | |

## Tickets

| Ticket | Tokens | Wall-clock | Acceptance | Review minutes | Drift (violations after ticket) |
|---|---|---|---|---|---|
| T01 | | | 1/1 | | |
| T02 | | | | | |
| T03 (bloat trap) | | | | | |
| T04 | | | | | |
| T05 (cycle trap) | | | | | |
| T06 | | | | | |
| T07 (boundary trap) | | | | | |
| T08 | | | | | |
| T09 | | | | | |
| T10 | | | | | |

## Blocked edits (false positives) / interventions

Record every hook block that required human or agent refactoring, with the
reason and whether it was a real violation or a false positive.

| Ticket | Block | Reason | Verdict |
|---|---|---|---|
| | | | real / false-positive |

## Scorecard snapshot (final)

Attach the `node benchmark/evaluate.js <arm-dir>` output here (or the JSON
transcript path).

## Honest-notes

What would make this run unfair in azcodr's favour or against it?