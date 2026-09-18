# Test-Driven Development (London School TDD) & Agile Domain Lifecycle

> **Core Mandate:** Drive all features through the non-negotiable 5-Phase Agile Domain Lifecycle: Requirements ➔ Domain Analysis ➔ Outer Acceptance Test (RED) ➔ Inner Unit Test (RED-GREEN-REFACTOR) ➔ Outer Verification (GREEN). Never deviate from this sequence.

---

## 1. The Immutable 5-Phase Agile Domain Lifecycle

Every functional increment, feature, or architectural modification must traverse this unbroken sequence. Writing code out of order (e.g. coding before tests, or testing before domain analysis) is strictly prohibited.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE NON-NEGOTIABLE AGILE DOMAIN LIFECYCLE                       │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [Phase 1: Requirements Engineering]
     │  - Decompose user prompt into INVEST user stories.
     │  - Author executable Gherkin Given-When-Then criteria.
     │  - Define Out-of-Scope non-goals and edge case status code matrix.
     ▼
  [Phase 2: Tactical Domain Analysis]
     │  - Discover and enforce Ubiquitous Language terms.
     │  - Map Bounded Contexts, Aggregate Roots, and Value Objects.
     │  - Codify explicit business invariants that state mutations must protect.
     ▼
  [Phase 3: Outer-Loop Acceptance Test (RED)]
     │  - Write failing end-to-end acceptance or contract test:
     │      * Frontend: Component/UI user interaction assertion (Playwright / testing library).
     │      * Backend: Black-box HTTP API contract test (Supertest/OpenAPI).
     │  - Verify the test FAILS for the expected reason (RED proof).
     ▼
  [Phase 4: Inner-Loop TDD & Collaborator Discovery (RED-GREEN-REFACTOR)]
     │  - Outer test discovers required collaborators (Use Cases, Ports, Domain Entities).
     │  - For each collaborator:
     │      1. RED: Write failing unit test asserting domain invariants.
     │      2. GREEN: Write minimal production code to pass.
     │      3. REFACTOR: Eliminate duplication, enforce SLAP, CQS, Clean Code.
     ▼
  [Phase 5: Outer Acceptance Resolution & Definition of Done]
        - Run outer acceptance test: verifies GREEN without altering the test assertion.
        - Run cross-package boundary smoke tests (reverse proxy, sockets, LAN interfaces).
        - Verify 100.00% test coverage gate across all packages.
        - Pass Definition of Done (DoD) checklist.
```

---

## 2. Outside-In TDD (London School) Double Loop

Drive all user-facing features from the outermost interface inward:

```
[Outer Loop: Acceptance / Contract Test (RED)]
       │
       ▼
[Inner Loop: Unit Test Collaborator (RED)] ──► [Implement Minimal Code (GREEN)] ──► [Refactor (REFACTOR)]
       │                                                                                   │
       └──────────────────────── Repeat Inner Loop until Done ◄────────────────────────────┘
       │
       ▼
[Outer Loop: Acceptance / Contract Test (GREEN)] ──► [Outer Refactor]
```

1. **Outer Acceptance / Contract Test First**: Every feature begins with a failing outer acceptance test:
   - **Frontend (UI)**: Component or page tests asserting user interactions, form submissions, accessibility, and visual states.
   - **Backend (API)**: Black-box REST route tests asserting HTTP verbs, request schemas, RFC 7807 problem details, and status codes.
2. **Collaborator Discovery**: Outer tests do not implement business logic directly; they discover and shape the contracts of their immediate collaborators (Use Cases, Domain Services, Repositories).
3. **Inner Unit Tests with Test Doubles**: Unit test collaborators in isolation using test doubles and mocks (`Controllers/Handlers` ➔ `Use Cases` ➔ `Ports/Adapters`).
4. **Mock Ownership Principle**: **Only mock types you own**. Always wrap third-party libraries, database drivers, and external network clients in application-owned port adapters before mocking.
5. **Atomic Double Loop**: Follow the strict rhythm: **RED (Fail) ➔ GREEN (Pass) ➔ REFACTOR (Clean/De-duplicate)**. Never skip the Refactor phase.
6. **Cross-Package Boundary Verification**: In monorepos with frontend dev servers or API gateways (Vite, NGINX), outer-loop verification must explicitly test reverse-proxy forwarding and real network serialization (`scripts/smoke_test.sh`), ensuring client-side SPA fallbacks do not mask unmapped backend routes.

---

## 3. The Zero-Deviation Invariant (Why We NEVER Deviate)

Deviating from this lifecycle introduces catastrophic defects and architectural rot:

| Deviation Shortcut | Immediate Consequence | Systemic Impact |
|---|---|---|
| **Skipping Domain Analysis** | Hallucinated entities, missing business invariants, wrong data models. | "The Toy Prototype Blunder": Foreign key string inputs, unvalidated states, costly migrations. |
| **Writing Code Before Tests** | Untested edge cases, unfalsifiable code, confirmation bias in test design. | Hidden bugs in production, regressions during refactoring, brittle codebases. |
| **Skipping Outer Acceptance Tests** | In-memory unit tests pass, but user interactions and network routing fail. | "The In-Memory Supertest Illusion": App says "Offline/Connecting" while 100% unit tests pass. |
| **Skipping the Refactor Phase** | Technical debt accumulates immediately behind green tests. | Code rot, duplicated logic, bloated monolithic functions (> 30 lines), violated DRY/SLAP. |

### The Immutable Laws of TDD Execution:
1. **No Production Code Without a Failing Test:** You are not allowed to write any production code unless it is to make a failing unit or acceptance test pass.
2. **No Test Without Prior Domain Understanding:** You are not allowed to write a test without knowing the Ubiquitous Language, Aggregate Root, and business invariants it asserts.
3. **Minimal Code Only:** Write only the minimal amount of code necessary to turn the failing test green. Do not anticipate speculative future requirements.
4. **Refactor Under Green Only:** Never alter production code structure while tests are red. Refactor only when all existing assertions are green.

### DO's:
- **DO:** Strictly adhere to the 5-Phase Agile Domain Lifecycle: Requirements ➔ Domain Analysis ➔ Outer Acceptance Test (RED) ➔ Inner Unit Test (RED-GREEN-REFACTOR) ➔ Outer Verification (GREEN).
- **DO:** Follow Outside-In TDD (London School): Outer acceptance test ➔ collaborator discovery ➔ unit tests with test doubles.
- **DO:** Maintain 100.00% line, branch, statement, and function coverage across all backend, contract, and frontend suites.
- **DO:** Verify cross-package integration boundaries (Vite dev server reverse proxy, real network sockets, HTTP client JSON parsing) with automated full-stack smoke tests (`scripts/smoke_test.sh`).
- **DO:** Keep functions small (under 20–30 lines) adhering to Single Level of Abstraction (SLAP) and Command-Query Separation (CQS).

### DONT's:
- **DONT:** Never write a single line of production code without an existing failing test driving it.
- **DONT:** Never write a test without prior domain analysis (Ubiquitous Language and invariant definition). Tests must assert domain invariants, not arbitrary syntax.
- **DONT:** Never mock types you do not own; always wrap third-party dependencies in application-owned adapters.
- **DONT:** Never equate in-memory test double passes (e.g. Supertest against in-memory Express instances) with real network transport, reverse proxying, or end-to-end user connectivity.
- **DONT:** Never skip the Refactor phase under green; technical debt must not accumulate behind green tests.
- **DONT:** Never use arbitrary `setTimeout()` or `sleep()` in tests; use deterministic event polling (`waitFor`).

