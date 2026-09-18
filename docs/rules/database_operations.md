# Database Operations, PITR & Least-Privilege Roles

> **Core Mandate:** Enforce continuous Point-In-Time Recovery (PITR), causal read-after-write routing, non-blocking table maintenance, connection pooling, and least-privilege role separation.

---

## 1. High Availability, Backups & Disaster Recovery (DR)

- **Continuous Point-In-Time Recovery (PITR)**: Utilize continuous write-ahead logging (WAL) archiving and periodic base backups (**WAL-G**, **pgBackRest**, or engine-native tooling) to guarantee restoration to any specific second.
- **Causal Read-After-Write Consistency**: Read replicas experience asynchronous replication lag. Immediately following a state-mutating command (`POST`, `PUT`, `DELETE`), pin client sessions to the primary database instance for a bounded window (e.g. 2 seconds) before resuming read-replica routing.

---

## 2. Table Maintenance & Bloat Defragmentation

- **Online Maintenance**: Table and index space must be reclaimed using non-blocking online utilities (**`pg_repack`**, `gh-ost`, or `pt-online-schema-change`), strictly prohibiting locking full table rewrites during online hours.
- **Background Autovacuum / Optimization**: Configure proactive background vacuuming and compaction thresholds to prevent transaction ID wraparound and table bloat on high-throughput tables.

---

## 3. Least-Privilege Role Partitioning & Audit Trails

Enforce strict separation of database credentials across execution environments:
- **`migration_deployer`**: DDL privileges (`CREATE`, `ALTER`, `DROP`) restricted to CI/CD automated migration pipelines.
- **`app_runtime`**: DML privileges only (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) with zero DDL or schema alteration rights.
- **`analytics_readonly`**: Read-only access to sanitized views and replica nodes.
- **Tamper-Proof Audit Logging**: Export schema changes, privilege grants, and sensitive queries to immutable external log sinks.
