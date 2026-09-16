# Consolidated Architectural DO's & DONT's

> **Core Purpose:** Authoritative directory of verified development best practices and prohibited anti-patterns, eliminating repeated mistakes and token overhead.

---

## 1. Architecture & Global Directives
- **DO:** Standardize exclusively on 100% open-source tools, packages, and frameworks.
- **DO:** Confine all file modifications, dependencies, and assumptions strictly to this workspace (`./`).
- **DO:** Maintain all rule files strictly atomic (Single Responsibility Principle, zero conjunction naming).
- **DONT:** Never import, execute, or assume global user packages or tools from external sibling projects.
- **DONT:** Never let root `AGENTS.md` exceed 120 lines; offload deep domain manuals into `docs/rules/`.

---

## 2. Database & Persistence
- **DO:** Wrap every multi-entity mutation inside an explicit ACID transaction with bounded timeouts (`maxWait: 5000, timeout: 10000`).
- **DO:** Use the Transactional Outbox pattern to persist domain mutations and event records atomically before notifying brokers.
- **DO:** Always use `CREATE INDEX CONCURRENTLY` in non-transactional migrations on live tables.
- **DO:** Use partial unique indexes (`WHERE deleted_at IS NULL`) on tables utilizing soft deletes.
- **DONT:** Never execute `prisma db push` or raw DDL in CI or production environments.
- **DONT:** Never run `VACUUM FULL` on production databases; use online `pg_repack`.
- **DONT:** Never write to the database and publish to a message queue sequentially without an outbox table (the dual-write anti-pattern).

---

## 3. Multi-Tenancy & Extensibility
- **DO:** Use PostgreSQL Row-Level Security (RLS) with transaction-scoped configs (`set_config('app.tenant_id', id, true)`).
- **DO:** Store custom attributes in `custom_attributes JSONB` validated at runtime via `ajv` and tenant JSON Schemas.
- **DO:** Use Strategy registries, JSON rule engines, or XState statecharts to handle diverging tenant business logic.
- **DONT:** Never add sparse nullable columns (`custom_col_1`, `custom_col_2`) to core tables.
- **DONT:** Never scatter `if (tenant.id === 'acme')` conditionals across service code.
- **DONT:** Never execute arbitrary tenant JavaScript via `eval()` or `new Function()`; use isolated WebAssembly runtimes.

---

## 4. Testing & Code Quality
- **DO:** Follow Outside-In TDD (London School): Outer acceptance test ➔ collaborator discovery ➔ unit tests with test doubles.
- **DO:** Maintain 100.00% line, branch, statement, and function coverage across all backend and frontend suites.
- **DO:** Roll back database transactions after each integration test to guarantee test isolation.
- **DO:** Keep functions small (under 20–30 lines) adhering to Single Level of Abstraction (SLAP) and Command-Query Separation (CQS).
- **DONT:** Never mock types you do not own; always wrap third-party dependencies in application-owned adapters.
- **DONT:** Never use arbitrary `setTimeout()` or `sleep()` in tests; use deterministic event polling (`waitFor`).
- **DONT:** Never use the `any` type in TypeScript; use `unknown` with runtime Zod narrowing.

---

## 5. Security & DevSecOps
- **DO:** Run automated secret scanning (`secretlint`) on every staged commit via pre-commit hooks.
- **DO:** Store short-lived access tokens strictly in memory; rotate refresh tokens cryptographically in HttpOnly Secure cookies.
- **DO:** Fail fast at process bootstrap by validating all environment variables with Zod schemas.
- **DONT:** Never store secrets, passwords, or private keys in source control.
- **DONT:** Never return detailed database stack traces or SQL errors to client API callers in production.
