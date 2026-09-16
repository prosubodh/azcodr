# Zero-Downtime Database Migrations (Expand-Contract)

> **Core Mandate:** Enforce versioned SQL migrations, zero-downtime expand-contract schema evolutions, non-blocking concurrent index creation, and two-phase constraint validation.

---

## 1. Versioned SQL Migrations

- **Strict Version Control**: All database modifications must occur via versioned migrations (`prisma migrate dev --name <name>` locally, `prisma migrate deploy` in CI/prod).
- **Prohibited Actions**: Strictly forbid `prisma db push` or raw DDL in production environments.

---

## 2. Safe Column Additions & Deprecations (Expand-Contract)

Never rename or drop a column in a single migration step. Follow the 5-phase protocol:
1. **Phase 1 (Expand):** Add new nullable column to database.
2. **Phase 2 (Double-Write):** Deploy application version writing to both old and new columns; reads continue from old column.
3. **Phase 3 (Backfill):** Run batched background script backfilling historical rows from old column to new column in chunks of 500.
4. **Phase 4 (Switch Read):** Deploy application reading and writing solely to the new column.
5. **Phase 5 (Contract):** In the subsequent release, drop old column and constraints from the database.

---

## 3. Concurrent Index Creation & Two-Phase Constraints

- **Concurrent Indexes**: Always use `CREATE INDEX CONCURRENTLY` in non-transactional migrations to avoid locking production tables during index construction:
  ```sql
  CREATE INDEX CONCURRENTLY idx_orders_customer_created 
    ON "Order" (customer_id, created_at DESC);
  ```
- **Two-Phase Constraints**: Attach constraints without scanning historical rows, then validate concurrently:
  ```sql
  -- Step 1: Attach foreign key or check constraint without validating existing rows (instant)
  ALTER TABLE "Order" ADD CONSTRAINT fk_orders_tenant
    FOREIGN KEY (tenant_id) REFERENCES "Tenant"(id) NOT VALID;

  -- Step 2: Validate constraint concurrently without blocking writes
  ALTER TABLE "Order" VALIDATE CONSTRAINT fk_orders_tenant;
  ```
