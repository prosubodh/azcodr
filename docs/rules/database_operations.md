# Database Operations, PITR & Least-Privilege Roles

> **Core Mandate:** Enforce continuous Point-In-Time Recovery (PITR), causal read-after-write routing, autovacuum tuning, online repacking with pg_repack, and least-privilege role separation.

---

## 1. High Availability, Backups & Disaster Recovery (DR)

- **Continuous Point-In-Time Recovery (PITR)**: Standardize on open-source **pgBackRest** or **Barman** for daily physical base backups and continuous WAL archiving to restore state to any specific second.
- **Causal Read-After-Write Consistency**: Read replicas experience asynchronous lag (5ms–500ms). Immediately following a mutation (`POST`, `PUT`, `DELETE`), pin client sessions to the primary database for 2 seconds before resuming replica reads.

---

## 2. Table Bloat & Autovacuum Maintenance

- **Autovacuum Tuning**:
  ```sql
  ALTER TABLE "Order" SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_vacuum_cost_limit = 2000
  );
  ```
- **Online Table Repacking**: Standardize on open-source **`pg_repack`** to reclaim table and index space online without locks (strictly prohibiting blocking `VACUUM FULL`).

---

## 3. Least-Privilege Role Partitioning & Audit Trails

- **Role Partitioning**:
  - `deployer_role`: DDL privileges (`CREATE`, `ALTER`, `DROP`) restricted to CI/CD migrations.
  - `app_runtime_role`: DML privileges only (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) with zero DDL rights.
  - `analytics_readonly_role`: Read-only access to sanitized views.
- **Tamper-Proof Audit via `pgaudit`**: Utilize open-source **`pgaudit`** to log schema changes, role modifications, and privileged queries to immutable logs.
