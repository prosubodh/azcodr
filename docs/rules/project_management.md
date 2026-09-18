# Project Management, Work-In-Progress Limits & Definition of Done

> **Core Mandate:** Enforce strict Work-In-Progress (WIP) limits, vertical task slicing, explicit task lifecycle states, and an uncompromising Definition of Done (DoD).

---

## 1. Task Lifecycle & WIP Limits

- **Task States**: Every operational task must progress through explicit states:
  ```
  BACKLOG ──► TODO ──► IN_PROGRESS ──► REVIEW ──► DONE
  ```
- **Strict WIP Limit**: Maintain a Work-In-Progress (WIP) limit of **exactly 1 atomic task** at any given time. Never begin a new task while a previous task is incomplete or failing tests.
- **Vertical Task Slicing**: Tasks must deliver full-stack value across UI, API, and DB layers (no horizontal layers like "create migration only").

---

## 2. Definition of Done (DoD)

A task is only marked `DONE` when all of the following verifiable criteria are met:
- [ ] **Lifecycle Provenance**: Code developed strictly via the 5-Phase Agile Domain Lifecycle (Requirements ➔ Domain Analysis ➔ Outer Acceptance RED ➔ Inner Unit RED-GREEN-REFACTOR ➔ Outer GREEN). Zero production code written before tests.
- [ ] **Tests Green**: 100.00% full-stack test coverage maintained (`npm run coverage` or `pnpm test`).
- [ ] **Boundary Verified**: Cross-package boundary smoke tests passed (`scripts/smoke_test.sh`).
- [ ] **Zero Lints & Types**: 0 ESLint warnings and 0 TypeScript compilation errors (`npm run lint && npm run typecheck`).
- [ ] **No Unverified Assumptions**: All behavior backed by tests or verified command evidence.
- [ ] **ADR Logged**: An Architectural Decision Record is logged in `memory.md` if architectural trade-offs were made.
- [ ] **Documentation Clean**: Zero broken markdown links across workspace files.

---

## 3. Blocker Escalation & Risk Management

- If a blocker or ambiguity arises, immediately transition the task to `BLOCKED`, halt execution, and interrogate the root cause.
- Never guess or write speculative code to bypass an unresolved requirement.

---

## 4. Invariants, DO's & DONT's

### DO's:
- **DO:** Maintain strict WIP = 1 limit. Never work on multiple active tasks concurrently.
- **DO:** Deliver features in vertical slices (UI ➔ API ➔ DB) rather than isolated horizontal stubs.
- **DO:** Halt and transition to `BLOCKED` whenever assumptions are required.
- **DO:** Satisfy all 7 criteria of the Definition of Done before declaring any increment complete.

### DONT's:
- **DONT:** Never mark a task `DONE` with skipped, failing, or unwritten tests.
- **DONT:** Never bypass the 5-Phase Agile Domain Lifecycle provenance gate.
- **DONT:** Never leave unresolved blockers or silent errors in working branches.

