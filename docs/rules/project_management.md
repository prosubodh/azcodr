# Project Management, Work-In-Progress Limits & Definition of Done

> **Core Mandate:** Enforce strict Work-In-Progress (WIP = 1) limits, empirical process control, conceptual integrity, anti-rubber-stamp intent alignment, behavioral parity gates, and an uncompromising Definition of Done (DoD).

---

## 1. Foundational Project Management Principles (Engineering Canon)

Grounded in seminal software engineering and delivery literature:
- **Brooks' Law & Conceptual Integrity (*The Mythical Man-Month* - Fred Brooks):** "Conceptual integrity is the most important consideration in system design." One unified mental model must govern the architecture. Guard ruthlessly against the **Second-System Effect**—the tendency to over-design, over-complicate, and introduce premature secondary infrastructure (queues, DLQs, complex rate limiters, multi-tenant switchers) before the primary tracer bullet has proven end-to-end customer value.
- **Empirical Process Control (*Modern Software Engineering* - David Farley):** Working, verified software in the hands of users is the only honest measure of progress. All requirements, estimates, and architectures are unverified hypotheses until confirmed by automated tests and working software.
- **Small Batches & Fast Feedback (*Accelerate* & *The DevOps Handbook* - Forsgren, Humble, Kim):** Decompose all epics into thin vertical slices with rapid feedback loops. Shorten the feedback cycle from days to seconds using shift-left telemetry and automated quality gates.
- **The Beyoncé Rule (*Software Engineering at Google* - Winters, Manshreck, Wright):** *"If you liked it, you should have put a test on it."* If infrastructure, a behavior, or an API contract is not covered by an automated test, it is undefined behavior subject to silent destruction.
- **Broken Windows Theory (*The Pragmatic Programmer* - Hunt & Thomas):** Never leave bad architecture, dead code, flaking tests, or unaddressed debt in the codebase. Repair broken windows immediately upon discovery.
- **Tracer Bullets Over Prototypes (*The Pragmatic Programmer*):** When exploring new architecture or capabilities, build an architectural "tracer bullet"—an end-to-end, production-grade thin thread through UI, API, Domain, and Database layers—rather than throwaway mocks or horizontal scaffolding.
- **High-Leverage Work & Validated Learning (*The Effective Engineer* - Edmond Lau):** Prioritize activities that deliver disproportionate long-term value. Validate assumptions with users early before committing to large implementation arcs.

---

## 2. Anti-Rubber-Stamp Circuit Breaker (The "Don't Be a YES-Man" Protocol)

An agentic assistant must never become a passive executor or rubber-stamp follower. Running on automated feature generation without active user grounding produces catastrophic product drift (e.g. dozens of technical milestones executed autonomously while the product diverges completely from the user's intent or operational environment).

### The Trigger Condition:
If the user provides **three (3) consecutive passive, low-information approvals** (e.g., *"ok"*, *"go"*, *"yes please"*, *"looks good"*, *"continue"*, *"go in order"*):
1. **MANDATORY EXECUTION HALT:** The agent is **STRICTLY BLOCKED** from beginning another implementation milestone, scaffold, or feature branch.
2. **Domain Intent Checkpoint:** The agent must immediately pause and present a concise checkpoint with three non-negotiable questions:
   - **Problem Thesis:** *"What specific business or user problem does this system solve right now?"*
   - **Target Persona & Workflow:** *"Who is the primary actor, and what exact step-by-step journey are they performing?"*
   - **Current Value Demonstration:** *"Here is what is currently working end-to-end. Can a human operator use this today, or are we building speculative layers?"*
3. **Execution Gate:** No further capability may be started until the user explicitly engages with the product thesis and confirms the operational focus.

---

## 3. Behavioral & Functional Parity Gate (Migration Parity Matrix)

UI rewrites, framework migrations (e.g., vanilla JS to React/Vue/Svelte), and template refactorings carry extreme blast radius. The single greatest cause of capability regression during migrations is the silent destruction of existing forms, buttons, inputs, and state flows.

### Mandatory Parity Protocol:
Before editing or replacing any frontend shell, layout, or component:
1. **Author the Parity Audit Matrix:** Audit and catalog 100% of existing user capabilities, form inputs, submission handlers, validation states, and API endpoints rendered in the existing interface.
2. **Freeze Baseline Behavior:** Verify that all existing interactions are characterized with automated acceptance or unit tests.
3. **Zero Regression Invariant:** Every capability in the parity audit matrix must have an explicit home and verified behavior in the replacement UI before the legacy UI is decommissioned.
4. **Destructive Overwrite Ban:** It is strictly forbidden to delete or replace legacy components without a passing parity check. If an unaligned overwrite occurs, the commit must be immediately reverted (`git revert`).


---

## 4. Task Lifecycle & WIP Limits

- **Task States**: Every operational task must progress through explicit states:
  ```
  BACKLOG ──► TODO ──► IN_PROGRESS ──► REVIEW ──► DONE
  ```
- **Strict WIP Limit (WIP = 1):** Maintain a Work-In-Progress (WIP) limit of **exactly 1 atomic task** at any given time. Never begin a new task while a previous task is incomplete, untested, or failing.
- **Vertical Cake Slicing:** Stories must deliver full-stack value across UI, API, Domain, and DB layers (no horizontal layers like "create migration only" or "make UI mock only").

### 4.1. The Zero-Unattended-Prompt Invariant & Raw Request Ledger
Autonomous agents frequently suffer from "directive drop"—fulfilling one part of a multi-clause user prompt while silently abandoning secondary constraints or questions. To guarantee absolute execution fidelity:
1. **Raw Request Ledger:** Every user prompt must be broken into its atomic request items and recorded in an active Pending Request Ledger upon receipt.
2. **Deterministic Lifecycle:**
   ```
   [User Prompt] ──► Logged to PENDING ──► IN_PROGRESS (WIP=1) ──► VERIFIED ──► REMOVED/CLEARED
   ```
3. **Zero Early Exits:** An agent is **STRICTLY FORBIDDEN** from declaring a task complete, transitioning to another prompt, or ending its turn while any raw user directive or sub-item remains in `PENDING` state.
4. **Verified Handling Gate:** An item may only be marked handled or removed when concrete, verified evidence (test assertion output, terminal verification, code diff, or explicit answers) proves that specific directive has been fulfilled.

### 4.2. Mandatory Confusion Resolution & Prioritization Protocol
When an agent encounters ambiguity, conflicting directives, multi-task backlogs, partial implementation states, or operational confusion, the agent **MUST prioritize all pending ledger items before executing** any code or mutating workspace files:
1. **P0 (Audit & Ledger Trail):** Parse and log raw prompts and discrete atomic directives into the active ledger (`.agents/ledger/pending.md`) immediately upon receipt.
2. **P1 (Build & Type Hygiene):** Resolve existing broken compilation, syntax errors, and typecheck gates to re-establish a reliable baseline.
3. **P2 (Architecture & Invariant Framing):** Align on domain truth, invariant rules, and architectural contracts before writing functional code.
4. **P3 (Core Functional Implementation):** Implement core functional capabilities via strict Outside-In TDD nano-cycles respecting WIP=1.
5. **P4 (User Communication & Explanations):** Provide comprehensive, verifiable answers to conceptual or architectural inquiries.
6. **P5 (Deterministic Verification & Quality Gates):** Verify with full test suite (100% coverage), zero linter errors, zero type errors, and zero validator warnings; resolve pending ledger items only upon verified proof.

### 4.3. Branch Naming & Pull Request Governance
Direct pushes to protected trunk branches (`main`, `master`, `staging`, `prod`) risk breaking shared environments and are strictly prohibited under `azcodr` governance:
1. **Generic Law of Trunk Protection:** All code modifications must originate on an isolated topic branch and arrive in protected branches strictly through reviewed, verified Pull Requests. Direct `git push` targeting protected branches is intercepted and blocked by both `agent-guard` and workstation `pre-push` hooks.
2. **Branch Naming Conventions (Unopinionated by Default):** Teams configure their desired branch naming schema declaratively in `harness.yaml`. Common industry standards supported include:
   - *Owner-Prefixed Semantic:* `<developer>/<type>/<kebab-desc>` (e.g. `subodh.paudel/feat/branch-guard`, `jane.doe/fix/cli-timeout`).
   - *Conventional Semantic:* `<type>/<kebab-desc>` (e.g. `feat/branch-guard`, `fix/cli-parser`, `chore/bump-deps`).
   - *Issue / Ticket-Bound:* `<type>/<ticket-id>-<kebab-desc>` (e.g. `feat/AZ-101-branch-guard`).
3. **Pull Request Quality Standards:**
   - *Standard Template:* Every PR must adhere to the standardized `.github/pull_request_template.md`.
   - *Atomic Sizing:* Non-generated diffs should observe the $\le 300$ lines envelope to ensure thorough peer reviewability.
   - *Mandatory Test Evidence:* Real shell commands and passing terminal outputs (`npm test`, `npm run lint`, `npm run validate`) must be quoted in the PR body.
   - *Linear Trunk Integrity:* Merges must use squash-and-merge or fast-forward rebase to maintain a clean, bisectable history.

---

## 5. Decomposing Stories into SMART Developer Tasks

Apply Bill Wake's **SMART** criteria to all developer tasks:

- **S - Specific:** Scope is unambiguously bounded so every developer and agent understands what is included and excluded.
- **M - Measurable:** Can be objectively verified: (1) code fulfills intended behavior, (2) tests pass at 100% coverage, (3) clean code and line ceilings verified.
- **A - Achievable:** Feasible within the current codebase context. If an unexpected obstacle arises, immediately halt and interrogate rather than guessing.
- **R - Relevant:** Directly contributes to delivering customer value. Technical infrastructure must be justified by the specific business capability it unlocks.
- **T - Time-Boxed:** Bounded duration (typically 1–2 hours, never exceeding 1 day). Exceeding the time-box triggers an immediate pause, task split, or architectural review.

---

## 6. Definition of Done (DoD)

A user story or task is only marked `DONE` when all of the following verifiable criteria are met:
- [ ] **Zero Unattended Directives:** 100% of raw user prompt directives, constraints, and sub-tasks are tracked in the ledger, verified with evidence, and resolved.
- [ ] **Lifecycle Provenance:** Developed strictly via the 5-Phase Agile Domain Lifecycle (Requirements ➔ Domain Analysis ➔ Outer Acceptance RED ➔ Inner Unit RED-GREEN-REFACTOR ➔ Outer GREEN). Zero production code authored without prior failing test evidence.
- [ ] **Tests Green:** 100.00% full-stack test coverage maintained across statement, branch, function, and line metrics (`npm test`).
- [ ] **Kent Beck Line Ceilings:** All modified and created files strictly obey $\le 300$ lines per file, $\le 30$ lines per function, and $\le 3$ parameters.
- [ ] **Behavioral Parity Verified:** If UI or existing functionality was modified or migrated, 100% of preexisting capabilities, interactions, and states are cataloged, preserved, and functionally verified.
- [ ] **Boundary Smoke Verified:** Cross-package boundary smoke tests passed against running services (`scripts/smoke_test.mjs`).
- [ ] **Zero Lints & Types:** 0 linter warnings and 0 type-checker errors (`npm run lint && npm run typecheck`).

- [ ] **No Unverified Assumptions:** All behavior grounded in verified test assertions, schema invariants, or command evidence.
- [ ] **ADR Logged:** An Architectural Decision Record is logged in `memory.md` for any non-trivial structural decision or trade-off.
- [ ] **Documentation Clean:** Zero broken markdown links across workspace files and relevant knowledge documents updated.
- [ ] **User Value Demonstrated:** The capability has been demonstrated or presented to the user with actionable proof.

---

## 7. Blocker Escalation & Risk Management

- If an ambiguity or invariant breach arises, immediately transition the task to `BLOCKED`, halt execution, and interrogate the root cause using the Relentless Questioning protocol.
- Never write speculative code or make optimistic assumptions to bypass an unresolved requirement.
