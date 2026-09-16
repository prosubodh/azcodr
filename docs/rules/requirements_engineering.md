# Requirements Engineering, INVEST Stories & Gherkin Criteria

> **Core Mandate:** Decompose business requirements into vertically sliced INVEST user stories, executable Gherkin acceptance criteria, and exhaustive edge case matrices.

---

## 1. INVEST User Story Framework

Ensure every story is:
- **I**ndependent: Sliced vertically through all system layers (UI ➔ API ➔ DB) without blocking peer stories.
- **N**egotiable: Focus on *what* and *why*, leaving technical implementation open.
- **V**aluable: Delivers observable value to users or stakeholders.
- **E**stimable: Well-bounded with clear acceptance boundaries.
- **S**mall: Completable within 1–2 development days.
- **T**estable: Grounded in verifiable pass/fail criteria.

---

## 2. Executable Gherkin Acceptance Criteria

Draft concrete, actionable scenarios directly convertible into automated acceptance tests:

```gherkin
Scenario: Successful Order Placement
  Given an authenticated customer with a valid payment method
  When the customer submits an order for item "SKU-123" with quantity 2
  Then the response status is 201 Created
  And the inventory for "SKU-123" is decremented by 2
  And an order confirmation email is queued
```

---

## 3. Negative Scope & Edge Case Matrices

- **Out-of-Scope (Non-Goals)**: Explicitly document what will NOT be built in this increment to prevent scope creep.
- **Edge Case Matrix**: Map all error states to HTTP status codes (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`).
