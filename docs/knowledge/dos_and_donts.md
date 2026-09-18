# Consolidated Architectural DO's & DONT's Directory

> **Core Purpose:** Authoritative index linking to verified development best practices, invariants, and prohibited anti-patterns colocated within their respective atomic rules and skills.

---

## Direct Rule Index of DO's & DONT's

To eliminate duplicate maintenance and token bloat, all normative directives are colocated directly within their governing atomic domain rule files:

| Domain Area | Governing Atomic Rule | Colocated Directives & Invariants |
|---|---|---|
| **System Lifecycle** | [`test_driven_development.md`](../rules/test_driven_development.md#3-invariants-dos--donts) | 5-Phase Agile Lifecycle, Zero-Deviation Invariant, boundary tests, test double rules. |
| **Database Integrity** | [`database_integrity.md`](../rules/database_integrity.md#5-invariants-dos--donts) | Relational FK existence checks, `<Select>` dropdowns (no raw strings), soft delete indexes, full CRUD. |
| **REST API Conventions** | [`rest_api_conventions.md`](../rules/rest_api_conventions.md#5-invariants-dos--donts) | Status codes, RFC 7807 envelopes, enumeration masking, probe tolerances (`/healthz/`). |
| **API Versioning** | [`api_versioning.md`](../rules/api_versioning.md#5-invariants-dos--donts) | SemVer 2.0.0 trigger matrix, URI major prefix, RFC 8594 Sunset/Deprecation headers. |
| **Database Transactions** | [`database_transactions.md`](../rules/database_transactions.md) | ACID atomicity, defensive timeouts, Transactional Outbox, no dual-writes. |
| **Database Migrations** | [`database_migrations.md`](../rules/database_migrations.md) | Declarative Atlas/Flyway migrations, non-blocking concurrent index creation. |
| **Multi-Tenancy** | [`multitenancy_isolation.md`](../rules/multitenancy_isolation.md) | Query interceptors, PostgreSQL RLS, no hardcoded tenant conditionals. |
| **Dynamic Schemas** | [`tenant_dynamic_schemas.md`](../rules/tenant_dynamic_schemas.md) | JSON Schema Draft 2020-12 runtime validation, no sparse nullable columns. |
| **Pluggable Logic** | [`tenant_pluggable_logic.md`](../rules/tenant_pluggable_logic.md) | CEL expression validation, Wasm sandboxing, Temporal durable workflows. |
| **Project Bootstrapping** | [`.agents/skills/lets-build/SKILL.md`](../../.agents/skills/lets-build/SKILL.md#3-gotchas--what-not-to-do) | Scaffolding decoupling, mandatory Phase 5 Handover Gate, no premature domain modeling. |
| **Project Management** | [`project_management.md`](../rules/project_management.md#4-invariants-dos--donts) | WIP = 1 limit, Definition of Done provenance gate, blocker escalation. |
| **Security & DevSecOps** | [`devsecops.md`](../rules/devsecops.md) | Secret scanning (gitleaks/secretlint), in-memory tokens, fail-fast schema validation. |



