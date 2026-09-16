# Database Transactions, ACID Atomicity & Outbox Pattern

> **Core Mandate:** Enforce full ACID transactional atomicity, appropriate isolation levels, defensive timeouts, deadlock prevention, and eliminate the dual-write problem via the Transactional Outbox pattern.

---

## 1. PostgreSQL Transaction Isolation Levels

1. **`Read Committed` (Default):** Guarantees statements see only committed data (eliminates dirty reads).
2. **`Repeatable Read` (Snapshot Isolation):** All statements within the transaction see the exact same database snapshot taken at transaction start. Mandatory for multi-table financial calculations, invoice aggregation, and inventory decrement operations.
3. **`Serializable`:** Strict serializability. Prevents phantom reads and write skew. Mandatory for complex booking/reservation allocation. Requires application-level retry loops with exponential backoff to handle serialization failures (`SQLSTATE 40001: serialization_failure`).

---

## 2. Defensive Timeouts & Deadlock Prevention

Prevent hung transactions or lock waits from starving connection pools:
```sql
SET lock_timeout = '3s';                           -- Abort if lock cannot be acquired within 3s
SET statement_timeout = '10s';                      -- Abort queries running longer than 10s
SET idle_in_transaction_session_timeout = '30s';   -- Abort hung transactions idle for > 30s
```

### Deterministic Lock Ordering
Always acquire locks on entities in a globally consistent order across application services (e.g. sort resource IDs lexicographically) to prevent deadlocks.

---

## 3. Prisma Interactive Transactions

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

export async function transferFunds(
  prisma: PrismaClient,
  sourceId: string,
  destId: string,
  amount: number
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const source = await tx.account.update({
        where: { id: sourceId },
        data: { balance: { decrement: amount } }
      });
      if (source.balance < 0) throw new Error('Insufficient funds');

      await tx.account.update({
        where: { id: destId },
        data: { balance: { increment: amount } }
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
    }
  );
}
```

---

## 4. Eliminating Dual-Writes: Transactional Outbox Pattern

Never write to the database and publish to a message broker sequentially. Persist the domain mutation and the event record atomically within the same database transaction:

```sql
CREATE TABLE "OutboxEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending ON "OutboxEvent"(status, created_at) WHERE status = 'PENDING';
```

- **Asynchronous Relaying**: Relay outbox events via Logical CDC (Debezium + `pgoutput`) or worker polling using `FOR UPDATE SKIP LOCKED`.
