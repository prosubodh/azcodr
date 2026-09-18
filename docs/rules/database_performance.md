# Database Performance & N+1 Prevention

> **Core Mandate:** Eliminate N+1 query bottlenecks via explicit relation batching, enforce strict composite indexing, size connection pools scientifically, and terminate runaway queries with statement timeouts.

---

## 1. N+1 Query Elimination

- **Prohibit Iterative Queries in Loops**: Never query child collections inside iteration loops.
  ```
  ❌ FORBIDDEN:
  parents = query("SELECT id FROM parent_table")
  for p in parents:
      children = query("SELECT * FROM child_table WHERE parent_id = :id", p.id)
  ```
- **Batching & Eager Fetching**: Always fetch related entities via single `JOIN` statements or batched `IN` clauses (`WHERE parent_id IN (...)`).
  ```
  ✅ CORRECT:
  parents = query("SELECT id FROM parent_table")
  children = query("SELECT * FROM child_table WHERE parent_id IN (:ids)", parents.map(id))
  ```
- **Universal DataLoader Pattern**: For decentralized domain resolvers or GraphQL pipelines, employ language-native DataLoader ports to batch and deduplicate entity lookups within an execution cycle.

---

## 2. Multi-Tenant Indexing Strategy

- **Tenant-Leading Composite Indexes**:
  Every multi-tenant query pattern must be backed by a composite index where `tenant_id` is the primary leading column:
  ```sql
  CREATE INDEX idx_orders_tenant_created ON orders (tenant_id, created_at DESC);
  CREATE UNIQUE INDEX uq_orders_tenant_number ON orders (tenant_id, order_number);
  ```
- **Covering Indexes**:
  Include frequently projected columns in index definitions (`INCLUDE (status, total_amount)` in engines that support index-only scans) to avoid secondary table lookups.

---

## 3. Connection Pooling & Statement Timeouts

- **Scientific Pool Sizing Formula**:
  $$\text{max\_connections} = (\text{CPU Cores} \times 2) + \text{Effective Disk / Spindle Count}$$
- **Transaction-Scoped Pooling**: Use lightweight connection poolers (e.g. PgBouncer, ProxySQL, or HikariCP) in transaction pooling mode to support thousands of concurrent client connections without memory exhaustion.
- **Defensive Statement Timeout**: Enforce strict statement timeouts (e.g. 5 seconds) at the connection pool or gateway layer to terminate unindexed runaway queries before they degrade the cluster.
