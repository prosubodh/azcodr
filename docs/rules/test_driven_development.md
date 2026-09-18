# Test-Driven Development (London School TDD)

> **Core Mandate:** Drive all features via Outside-In TDD (London School) double loop, enforcing collaborator discovery, mock ownership, and atomic RED-GREEN-REFACTOR cycles.

---

## 1. Outside-In TDD (London School) & Double Loop

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
   - **Frontend**: Component/page tests asserting user interactions, UI states, accessibility, and visual feedback.
   - **Backend / API**: Black-box API tests or consumer contract tests (**Pact** / **Gherkin**) asserting routing, auth middleware, and contract envelopes.
2. **Collaborator Discovery**: Outer tests discover and shape the contracts of their immediate collaborators (Use Cases, Domain Services, Repositories).
3. **Inner Unit Tests with Test Doubles**: Unit test collaborators in isolation using test doubles and mocks (`Controllers/Handlers` ➔ `Use Cases` ➔ `Ports/Adapters`).
4. **Mock Ownership Principle**: **Only mock types you own**. Always wrap third-party libraries, database drivers, and external network clients in application-owned port adapters before mocking.
5. **Atomic Double Loop**: Follow the strict rhythm: **RED (Fail) ➔ GREEN (Pass) ➔ REFACTOR (Clean/De-duplicate)**. Never skip the Refactor phase.
