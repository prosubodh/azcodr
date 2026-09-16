# Coding Issue Log & Defect Post-Mortems

> **Core Purpose:** Persistent ledger of encountered bugs, implementation bottlenecks, and edge case regressions, documenting root causes and linking preventing rules to ensure permanent resolution.

---

## 1. Issue Post-Mortem Register

| ID | Date | Subsystem | Symptom | Root Cause | Anti-Pattern | Resolution | Preventing Rule |
|---|---|---|---|---|---|---|---|
| **ISSUE-001** | 2026-09-16 | Multi-Tenancy | Potential cross-tenant data leak on forgotten `where: { tenantId }` query clauses | Relying solely on developer discipline in application code | Application-only data isolation | Implemented PostgreSQL Row-Level Security (RLS) with transaction-scoped `set_config('app.tenant_id', id, true)` as an immutable database backstop | [`multitenancy_isolation.md`](../rules/multitenancy_isolation.md) |
| **ISSUE-002** | 2026-09-16 | Database Migrations | Schema lock contention and table blocking during index creation | Standard `CREATE INDEX` taking `SHARE` locks on active tables | Blocking DDL in production | Mandated `CREATE INDEX CONCURRENTLY` in non-transactional migrations with defensive `lock_timeout = '3s'` | [`database_migrations.md`](../rules/database_migrations.md) |
| **ISSUE-003** | 2026-09-16 | Architecture | Monolithic rules with `this_and_that.md` names mixing distinct domains | Combining multiple technical concerns into single files | Composite rule bundling | Decomposed all rules into 37 strictly atomic, single-topic rule files with zero conjunction names | [`agentic_configuration.md`](../rules/agentic_configuration.md) |

---

## 2. Issue Logging Protocol

Whenever a bug, test failure, build error, or architectural friction occurs:
1. **Log Entry:** Add a new record above with ID, date, symptom, and root cause.
2. **Rule Synthesis:** Determine the concrete preventing rule (DO / DONT).
3. **Automated Rule Update:** Update or create the corresponding atomic rule in `docs/rules/`.
4. **Knowledge Update:** Add the high-priority lesson to [`dos_and_donts.md`](./dos_and_donts.md).
