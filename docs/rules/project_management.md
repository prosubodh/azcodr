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
- [ ] **Tests Green**: 100.00% full-stack test coverage maintained (`npm run coverage`).
- [ ] **Zero Lints & Types**: 0 ESLint warnings and 0 TypeScript compilation errors (`npm run lint && npm run typecheck`).
- [ ] **No Unverified Assumptions**: All behavior backed by tests or verified command evidence.
- [ ] **ADR Logged**: An Architectural Decision Record is logged in `memory.md` if architectural trade-offs were made.
- [ ] **Documentation Clean**: Zero broken markdown links across workspace files.

---

## 3. Blocker Escalation & Risk Management

- If a blocker or ambiguity arises, immediately transition the task to `BLOCKED`, halt execution, and interrogate the root cause.
- Never guess or write speculative code to bypass an unresolved requirement.
