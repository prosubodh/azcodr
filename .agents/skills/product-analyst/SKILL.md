---
name: product-analyst
description: Use when analyzing product requirements, decomposing features into INVEST user stories, authoring Gherkin Given-When-Then acceptance criteria, or mapping domain models and failure edge cases. Do not use for writing application code, debugging implementation bugs, or running tests.
---

# Product Analyst & Requirements Architect Skill

> **Core Purpose:** Bridge business intent and engineering execution by decomposing ambiguous requirements into atomic, testable, INVEST-compliant user stories with Gherkin acceptance criteria and edge case matrices.

---

## 1. When to Use This Skill
- Decomposing a broad business request, feature idea, or PRD into actionable slices.
- Drafting user stories for backlog planning or sprint execution.
- Formulating Gherkin acceptance tests before kicking off the Outside-In TDD cycle.
- Mapping out non-happy path failure scenarios (validation, auth, concurrency, rate limits).
- Establishing Ubiquitous Language definitions for new domain models.

---

## 2. Step-by-Step Analysis Workflow

```
1. Scope & Intent ──► 2. Ubiquitous Language ──► 3. INVEST Stories ──► 4. Gherkin Scenarios ──► 5. Edge Cases
```

### Step 1: Clarify Scope & Non-Goals
- Identify the primary user persona and the ultimate business outcome.
- Explicitly define the **Out-of-Scope boundaries** (what will NOT be built in this increment) to prevent scope creep.

### Step 2: Establish Domain Ubiquitous Language
- Align on exact domain terms (e.g. `Tenant`, `Organization`, `Member`, `Seat`, `Workspace`).
- Disallow ambiguous synonyms. Define domain entity relationships using open-source Mermaid diagrams (`erDiagram` or `flowchart TD`).

### Step 3: Author User Stories (INVEST Framework)
Ensure every story is:
- **I**ndependent: Sliced vertically through all layers (UI ➔ API ➔ DB) without blocking peer stories.
- **N**egotiable: Focus on *what* and *why*, leaving technical details open.
- **V**aluable: Delivers observable value to the user or business.
- **E**stimable: Well-bounded and understood.
- **S**mall: Completable within 1–2 days.
- **T**estable: Grounded in verifiable pass/fail assertions.

### Step 4: Write Gherkin Acceptance Criteria
Draft executable scenarios directly convertible into automated acceptance tests:
```gherkin
Scenario: [Successful Action]
  Given [Precondition / Authenticated Context]
  When [User triggers action with payload]
  Then [Expected response and observable state change]
```

### Step 5: Construct the Edge Case & Failure Matrix
Map out all HTTP status code scenarios: `400` (validation), `401` (unauthenticated), `403` (unauthorized/tenant boundary), `404` (not found), `409` (conflict/duplicate), `429` (rate limit), and `500` (upstream failure).

---

## 3. Gotchas & What NOT to Do

- **DO NOT** write horizontal, technical user stories (e.g. *"Create database table for users"*). Always slice vertically with user value.
- **DO NOT** omit the Out-of-Scope section. Lack of negative boundaries causes runaway complexity.
- **DO NOT** use passive voice in Gherkin scenarios. Use concrete actions (`When the user clicks "Submit" with email "test@example.com"`).
- **DO NOT** mix domain terms (e.g. using `Account`, `Company`, and `Tenant` interchangeably). Pick one and enforce it.
- **DO NOT** skip failure paths. Happy-path-only requirements lead to production outages.

---

## 4. Structured Output Template

```markdown
# Feature Specification: [Feature Name]

## 1. Domain Context & Ubiquitous Language
- **[Term 1]**: [Definition]
- **[Term 2]**: [Definition]

## 2. In-Scope vs. Out-of-Scope
- **In-Scope**: ...
- **Out-of-Scope (Non-Goals)**: ...

## 3. User Stories & Gherkin Acceptance Scenarios

### US-01: [User Story Title]
**As a** [role]  
**I want to** [action]  
**So that** [value]

```gherkin
Scenario: [Happy path]
  Given ...
  When ...
  Then ...

Scenario: [Failure path]
  Given ...
  When ...
  Then ...
```

## 4. Edge Case & Error Response Matrix
| Condition | HTTP Status | Error Code | Expected Behavior |
|---|---|---|---|
| Invalid payload | 400 | `VALIDATION_ERROR` | Return field errors |
| Cross-tenant attempt | 403 / 404 | `FORBIDDEN` | Mask existence or block |
```

---

## 5. Subdirectories & Progressive Resources
- [references/invest_checklist.md](./references/invest_checklist.md): Quick reference checklist for validating user story readiness.
- [references/gherkin_patterns.md](./references/gherkin_patterns.md): Reusable Gherkin scenario patterns for REST APIs and UI interactions.
