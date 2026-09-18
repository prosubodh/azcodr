# Database Transactions, ACID Atomicity & Outbox Pattern

> **Core Mandate:** Enforce full ACID transactional atomicity, appropriate isolation levels, defensive timeouts, deadlock prevention, and eliminate the dual-write problem via the Transactional Outbox pattern.

---

## 1. ANSI SQL Transaction Isolation Levels

1. **`Read Committed` (Default):** Guarantees statements see only committed data (eliminates dirty reads). Suitable for standard CRUD operations.
2. **`Repeatable Read` (Snapshot Isolation):** All operations within the transaction see the exact same database snapshot taken at transaction start. Mandatory for multi-entity financial calculations, ledger balance transfers, and inventory decrement operations.
3. **`Serializable`:** Strict serializability. Prevents phantom reads and write skew. Mandatory for complex booking and seat allocation operations. Requires application-level retry loops with jittered exponential backoff to handle serialization failures.

---

## 2. Defensive Timeouts & Deadlock Prevention

Prevent hung transactions or lock waits from starving database connection pools across any engine:

```sql
SET lock_timeout = '3s';                           -- Abort if lock cannot be acquired within 3s
SET statement_timeout = '10s';                      -- Abort queries running longer than 10s
SET idle_in_transaction_session_timeout = '30s';   -- Abort hung transactions idle for > 30s
```

### Deterministic Lock Ordering
Always acquire locks on entities in a globally consistent order across application services (e.g. sort resource IDs lexicographically before issuing `SELECT ... FOR UPDATE`) to prevent circular wait deadlocks.

---

## 3. Abstract Unit of Work & Transaction Boundaries

Application services must control transaction boundaries via an abstract **Unit of Work** port, keeping domain logic decoupled from concrete ORMs:

```
┌────────────────────────────────────────────────────────┐
│ Unit of Work Port Contract (Agnostic Specification)    │
├────────────────────────────────────────────────────────┤
│ executeTransaction(options, transactionCallback):       │
│   options:                                             │
│     isolationLevel: READ_COMMITTED | REPEATABLE_READ   │
│     timeoutMs: integer (default 10000)                 │
│     maxWaitMs: integer (default 5000)                  │
│   behavior:                                            │
│     1. Begin transaction on scoped connection          │
│     2. Execute callback with transactional context     │
│     3. On error: Rollback and propagate domain error   │
│     4. On success: Commit atomically                   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Eliminating Dual-Writes: Transactional Outbox Pattern

Never write to the database and publish to a message broker sequentially. Persist the domain mutation and the event record atomically within the same database transaction:

```sql
CREATE TABLE outbox_events (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_outbox_pending ON outbox_events(status, created_at);
```

### Asynchronous Outbox Relaying
- **Change Data Capture (CDC)**: Stream transaction logs directly to Kafka/NATS using tools like **Debezium**.
- **Polling Worker**: Run background workers executing non-blocking polling:
  ```sql
  SELECT * FROM outbox_events 
  WHERE status = 'PENDING' 
  ORDER BY created_at ASC 
  LIMIT 100 
  FOR UPDATE SKIP LOCKED;
  ```
