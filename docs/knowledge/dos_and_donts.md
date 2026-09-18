# Consolidated Architectural DO's & DONT's

> **Core Purpose:** Authoritative directory of verified development best practices and prohibited anti-patterns, eliminating repeated mistakes and token overhead.

---

## 1. Architecture & Global Directives
- **DO:** Standardize exclusively on 100% open-source tools, packages, open standards, and vendor-neutral specifications.
- **DO:** Decouple domain core logic from transient runtimes, frameworks, and databases using Hexagonal Architecture (Ports & Adapters).
- **DO:** Confine all file modifications, dependencies, and assumptions strictly to this workspace (`./`).
- **DO:** Maintain all rule files strictly atomic (Single Responsibility Principle, zero conjunction naming).
- **DONT:** Never couple domain business logic to ORM models, web frameworks, or language-specific runtime globals.
- **DONT:** Never import, execute, or assume global user packages or tools from external sibling projects.
- **DONT:** Never let root `AGENTS.md` exceed 120 lines; offload deep domain manuals into `docs/rules/`.

---

## 2. Database & Persistence
- **DO:** Wrap every multi-entity mutation inside an explicit ACID transaction with bounded timeouts (`maxWait: 5000, timeout: 10000`).
- **DO:** Use the Transactional Outbox pattern to persist domain mutations and event records atomically before notifying brokers.
- **DO:** Always use concurrent, non-blocking index creation in migrations on live production tables.
- **DO:** Use partial unique indexes (`WHERE deleted_at IS NULL`) on tables utilizing soft deletes.
- **DONT:** Never execute raw unversioned DDL or schema-push commands in CI or production; use versioned declarative migrations (Atlas/Flyway).
- **DONT:** Never run blocking table locks or blocking full table rewrites during online production operations.
- **DONT:** Never write to the database and publish to a message queue sequentially without an outbox table (the dual-write anti-pattern).

---

## 3. Multi-Tenancy & Extensibility
- **DO:** Enforce multi-tenancy isolation via AST query interceptors, database RLS, schema namespaces, or connection routing.
- **DO:** Store custom attributes in standardized JSON/document columns validated at runtime via JSON Schema Draft 2020-12.
- **DO:** Use Common Expression Language (CEL), Strategy registries, or durable workflows (Temporal/BPMN) for diverging tenant logic.
- **DONT:** Never add sparse nullable columns (`custom_col_1`, `custom_col_2`) to core entity tables.
- **DONT:** Never scatter hardcoded `if (tenant.id === 'acme')` conditionals across service code.
- **DONT:** Never execute arbitrary tenant scripts in host runtime memory; execute via isolated WebAssembly (Wasm) micro-sandboxes.

---

## 4. Testing & Code Quality
- **DO:** Follow Outside-In TDD (London School): Outer acceptance test ➔ collaborator discovery ➔ unit tests with test doubles.
- **DO:** Maintain 100.00% line, branch, statement, and function coverage across all backend, contract, and frontend suites.
- **DO:** Roll back database transactions or use ephemeral isolates after each test to guarantee complete test isolation.
- **DO:** Keep functions small (under 20–30 lines) adhering to Single Level of Abstraction (SLAP) and Command-Query Separation (CQS).
- **DO:** Enforce sound static typing and nominal branded types across domain identifiers.
- **DONT:** Never mock types you do not own; always wrap third-party dependencies in application-owned adapters.
- **DONT:** Never use arbitrary `setTimeout()` or `sleep()` in tests; use deterministic event polling (`waitFor`).
- **DONT:** Never bypass compiler strictness or use unsafe escape hatches (`any`, raw void pointers, untyped casts).

---

## 5. Security & DevSecOps
- **DO:** Run automated secret scanning (`gitleaks`, `secretlint`) on every staged commit via pre-commit hooks.
- **DO:** Store short-lived access tokens strictly in memory; rotate refresh tokens cryptographically in HttpOnly Secure cookies or secure keyrings.
- **DO:** Fail fast at process bootstrap by validating all configuration and environment variables against strict schemas.
- **DONT:** Never store secrets, passwords, or private keys in source control.
- **DONT:** Never return detailed database stack traces or raw internal errors to client API callers in production.

