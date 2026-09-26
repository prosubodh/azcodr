# Test-Driven Development (London School TDD) & Test Isolation Standards

> **Core Mandate:** Drive all features through the non-negotiable 5-Phase Agile Domain Lifecycle (Outside-In Double-Loop TDD, Uncle Bob's 3 Laws), enforcing transactional database rollback per test, zero-sleep determinism, and non-negotiable 100.00% statement, branch, and function coverage gates.

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

### The Immutable Three Laws of TDD (Uncle Bob & Kent Beck):
1. **First Law:** You are not allowed to write any production code unless it is to make a single failing unit or acceptance test pass.
2. **Second Law (Strict Incremental Boundary):** You are not allowed to write any more of a unit test than is sufficient to fail; and compilation failures are failures.
3. **Third Law (Minimal Production Code):** You are not allowed to write any more production code than is sufficient to pass the one currently failing test.

---

## 4. The Batch-Test Anti-Pattern & The Incremental Nano-Cycle

### The "Test-First Waterfall" Anti-Pattern (BANNED)
A rampant anti-pattern in AI coding is dumping 10–20 test cases in a single test file, and then writing a 300-line implementation file in one shot so all tests pass simultaneously. **This is strictly prohibited.**
- **Why It Fails:** Writing all tests upfront is Waterfall in disguise. It forces the AI to hallucinate and lock in speculative method signatures and class structures before any code runs. If test #3 reveals a design flaw, tests #4–20 are broken legacy code before running.
- **Falsifiability Failure:** When 20 tests fail at once, you never prove that each individual assertion would catch its specific regression. Many batch tests are tautologies that pass by coincidence.

### The Mandatory Incremental Nano-Cycle
Every collaborator discovered in Phase 4 must progress through micro-cycles of one behavior at a time:
1. **RED (Micro-Assertion):** Write **ONE** test asserting a single micro-behavior (e.g. `expect(cart.total()).toBe(0)`).
2. **VERIFY RED:** Run the test suite (`npm test`). **Inspect and verify the specific failure message** (e.g. "method not defined" or "expected 0, got undefined"). Never skip running the test while RED.
3. **GREEN (Minimal Implementation):** Write the **absolute minimum production code** required to pass the single failing assertion (even hardcoding `return 0` if appropriate).
4. **VERIFY GREEN:** Run the test suite. Confirm the test turns green with zero side effects.
5. **REFACTOR (Under Green):** Clean up names, eliminate duplication (DRY), enforce SLAP and Clean Code standards while tests remain 100% green.
6. **REPEAT:** Move to the next micro-behavior (e.g. `cart with 1 item returns item price`).

---

## 5. Ping-Pong Pair Programming Protocol with AI

When pairing with the human developer, operate in true **Ping-Pong TDD**:
```
  ┌─────────────────────────────────────────────────────────────┐
  │                 PING-PONG PAIR PROGRAMMING                  │
  │                                                             │
  │  Turn 1 [Partner A]: Writes ONE micro-test assertion (RED)  │
  │  Turn 2 [System]:    Runs test & displays verified failure  │
  │  Turn 3 [Partner B]: Writes MINIMAL code to pass (GREEN)    │
  │  Turn 4 [System]:    Runs test & displays verified pass     │
  │  Turn 5 [Both]:      Refactors under green (REFACTOR)       │
  │  Turn 6:             Roles swap; repeat for next behavior   │
  └─────────────────────────────────────────────────────────────┘
```
- **Collaborative Steering**: The human developer can write the test while the AI writes the minimal pass, or the AI can present each micro-test and await confirmation before implementing.
- **Continuous Alignment**: Design and data structures emerge organically through mutual feedback rather than monolithic code dumps.

---

## 6. Test Isolation & Determinism

- **Transactional Rollback per Integration Test**:
  - Every integration test that interacts with persistence must execute within a scoped transaction that is rolled back upon test completion (`afterEach` rollback) or use ephemeral, disposable database isolates. Never leave mutated rows that pollute subsequent tests.
- **Deterministic Test Data Factories**:
  - Utilize strongly-typed test data factories (`buildUser()`, `buildOrder()`) with randomized unique identifiers rather than hardcoded magic strings or fixed database IDs.
- **Zero Sleep / Flakiness Elimination**:
  - Strictly forbid arbitrary `sleep()` or timeout pauses in tests.
  - Rely exclusively on deterministic condition polling (`waitFor(condition)`) or reactive event promises to eliminate test flakiness.

---

## 7. Mandatory 100.00% Test Coverage Thresholds

- **Strict Coverage Thresholds**: Maintain line, function, branch, and statement test coverage at **100.00%** across all backend domain logic, adapters, contracts, and frontend suites. Strictly enforce 100% threshold failure gates in CI pipelines (`scripts/test_coverage.js`).
- **Exhaustive Status Codes & Error Branches**: Explicitly test all HTTP/gRPC response codes:
  - Success: `200 OK`, `201 Created`, `204 No Content`
  - Client Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`
  - Server Failures: `500 Internal Server Error`, `503 Service Unavailable`
- **UI Interaction States & Edge Cases**: Fully assert all presentation states (loading spinners, disabled controls, error banners, success feedback, empty states) across suites.


