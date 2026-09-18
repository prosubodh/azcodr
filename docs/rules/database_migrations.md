# Zero-Downtime Database Migrations (Expand-Contract)

> **Core Mandate:** Enforce versioned declarative migrations, zero-downtime expand-contract schema evolutions, non-blocking concurrent index creation, and two-phase constraint validation.

---

## 1. Universal Versioned & Declarative Migrations

- **Strict Version Control**: All database modifications must occur via versioned migration engines (**Atlas**, **Flyway**, **Liquibase**, or **Goose**).
- **Prohibited Actions**: Strictly forbid unversioned schema-push commands or raw manual DDL in staging or production environments.
- **Automated CI Validation**: CI pipelines must lint migrations for breaking changes, lock timeouts, and full-table scans before merging schema PRs.

---

## 2. Safe Column Additions & Deprecations (Expand-Contract)

Never rename or drop a column in a single deployment step. Follow the 5-phase protocol:
1. **Phase 1 (Expand):** Add the new column as nullable or with a non-locking default.
2. **Phase 2 (Double-Write):** Deploy application version writing to both old and new columns; reads continue from the old column.
3. **Phase 3 (Backfill):** Run batched background jobs backfilling historical rows from the old column to the new column in bounded batches (e.g. 500–1000 rows).
4. **Phase 4 (Switch Read):** Deploy application reading and writing solely to the new column.
5. **Phase 5 (Contract):** In the subsequent release, drop the old column and legacy constraints from the database.

---

## 3. Concurrent Non-Blocking Indexing & Constraint Validation

- **Concurrent Indexes**: Always construct indexes non-blockingly (`CREATE INDEX CONCURRENTLY` in PostgreSQL, `ALGORITHM=INPLACE, LOCK=NONE` in MySQL) to avoid locking read/write traffic:
  ```sql
  CREATE INDEX CONCURRENTLY idx_orders_customer_created 
    ON orders (customer_id, created_at DESC);
  ```
- **Two-Phase Constraints**: Attach foreign keys and check constraints without scanning historical rows upfront, then validate asynchronously:
  ```sql
  -- Step 1: Attach foreign key without blocking writes
  ALTER TABLE orders ADD CONSTRAINT fk_orders_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) NOT VALID;

  -- Step 2: Validate constraint concurrently
  ALTER TABLE orders VALIDATE CONSTRAINT fk_orders_tenant;
  ```
