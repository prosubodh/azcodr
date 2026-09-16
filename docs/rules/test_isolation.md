# Test Coverage, Isolation & Determinism

> **Core Mandate:** Enforce 100.00% full-stack test coverage thresholds, transactional database rollback per test, deterministic data factories, and zero-sleep flakiness elimination.

---

## 1. Mandatory 100.00% Full-Stack Test Coverage

- **Strict Coverage Thresholds**: Maintain line, function, branch, and statement test coverage at **100.00%** across BOTH backend and frontend at all times via `npm run coverage` (`@vitest/coverage-v8`). Strictly enforce 100% thresholds in test configuration files.
- **Exhaustive HTTP Status Codes & Error Branches**: Explicitly test all HTTP response status codes:
  - `200 OK`, `201 Created`, `204 No Content`
  - `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `405 Method Not Allowed`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`
  - `500 Internal Server Error`
- **UI Interaction States & Edge Cases**: Fully assert all UI states (loading spinners, disabled buttons, error banners, success feedback, empty states) across test suites.

---

## 2. Database Test Isolation & Zero Flakiness

- **Transactional Rollback per Integration Test**:
  - Every integration test that interacts with the database must run inside a transaction that is rolled back upon test completion (`afterEach` rollback) or use isolated, ephemeral tenant schemas. Never leave mutated rows that pollute subsequent tests.
- **Deterministic Test Data Factories**:
  - Use typed test data factories (`buildUser()`, `buildOrder()`) rather than hardcoded magic strings or fixed database IDs.
- **Zero Sleep / Flakiness Elimination**:
  - Strictly forbid arbitrary `setTimeout()` or `sleep()` calls in tests.
  - Rely exclusively on deterministic polling helpers (`waitFor(() => expect(...))`) or event-driven promises.
