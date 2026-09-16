# Test-Driven Development (London School TDD)

> **Core Mandate:** Drive all features via Outside-In TDD (London School) double loop, enforcing collaborator discovery, mock ownership, and atomic RED-GREEN-REFACTOR cycles.

---

## 1. Outside-In TDD (London School) & Double Loop

Drive all user-facing features from the outermost interaction inward:

```
[Outer Loop: Acceptance Test (RED)]
       │
       ▼
[Inner Loop: Unit Test Collaborator (RED)] ──► [Implement Minimal Code (GREEN)] ──► [Refactor (REFACTOR)]
       │                                                                                   │
       └──────────────────────── Repeat Inner Loop until Done ◄────────────────────────────┘
       │
       ▼
[Outer Loop: Acceptance Test (GREEN)] ──► [Outer Refactor]
```

1. **Outer Acceptance Test First**: Every feature begins with a failing outer acceptance test:
   - **Frontend**: Component/page tests asserting user interactions, DOM states, accessibility, and visual feedback.
   - **Backend / API**: Acceptance tests hitting `http.Server` (e.g. Supertest) verifying end-to-end routing, auth middleware, and HTTP response envelopes.
2. **Collaborator Discovery**: Outer tests discover the contracts of their immediate collaborators (`IApiClient` methods, state stores, use cases).
3. **Inner Unit Tests with Test Doubles**: Unit test collaborators in isolation using mock functions and test doubles (`controllers` ➔ `services/use cases` ➔ `adapters/repositories`).
4. **Mock Ownership Principle**: Only mock types you own (wrap 3rd-party dependencies in project-owned adapters). Never implement features backend-first in isolation.
5. **Double Loop & Explicit Refactor**: Follow the strict cycle: **RED (Fail) ➔ GREEN (Pass) ➔ REFACTOR (Clean/De-duplicate)**. Never skip the Refactor phase!
