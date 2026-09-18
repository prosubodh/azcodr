# Test Coverage, Isolation & Determinism

> **Core Mandate:** Enforce 100.00% test coverage thresholds, transactional database rollback per test, deterministic data factories, and zero-sleep flakiness elimination across all test suites.

---

## 1. Mandatory 100.00% Test Coverage Thresholds

- **Strict Coverage Thresholds**: Maintain line, function, branch, and statement test coverage at **100.00%** across all backend domain logic, adapters, contracts, and frontend suites. Strictly enforce 100% threshold failure gates in CI pipelines.
- **Exhaustive Status Codes & Error Branches**: Explicitly test all HTTP/gRPC response codes:
  - Success: `200 OK`, `201 Created`, `204 No Content`
  - Client Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`
  - Server Failures: `500 Internal Server Error`, `503 Service Unavailable`
- **UI Interaction States & Edge Cases**: Fully assert all presentation states (loading spinners, disabled controls, error banners, success feedback, empty states) across suites.

---

## 2. Database Test Isolation & Zero Flakiness

- **Transactional Rollback per Integration Test**:
  - Every integration test that interacts with persistence must execute within a scoped transaction that is rolled back upon test completion (`afterEach` rollback) or use ephemeral, disposable database isolates. Never leave mutated rows that pollute subsequent tests.
- **Deterministic Test Data Factories**:
  - Utilize strongly-typed test data factories (`buildUser()`, `buildOrder()`) with randomized unique identifiers rather than hardcoded magic strings or fixed database IDs.
- **Zero Sleep / Flakiness Elimination**:
  - Strictly forbid arbitrary `sleep()` or timeout pauses in tests.
  - Rely exclusively on deterministic condition polling (`waitFor(condition)`) or reactive event promises to eliminate test flakiness.
