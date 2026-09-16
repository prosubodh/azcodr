# Database Performance & N+1 Prevention

> **Core Mandate:** Eliminate N+1 query bottlenecks via explicit relation batching, enforce strict composite indexing, size connection pools scientifically, and terminate runaway queries with statement timeouts.

---

## 1. N+1 Query Elimination

- **Never Fetch Children in Loops**:
  ```typescript
  // ❌ FORBIDDEN: N queries inside loop
  const users = await prisma.user.findMany();
  const withRoles = await Promise.all(users.map(u => prisma.userRole.findMany({ where: { userId: u.id } })));
  ```
- **Native Eager Loading**:
  ```typescript
  // ✅ CORRECT: 1-2 optimized queries
  const users = await prisma.user.findMany({
    where: { tenantId },
    include: { roles: true }
  });
  ```
- **Open-Source `dataloader`**: For decentralized service calls, batch IDs with `dataloader`.

---

## 2. Multi-Tenant Indexing Strategy

- **Tenant-Leading Composite Indexes**:
  ```prisma
  model Order {
    id        String   @id @default(uuid())
    tenantId  String
    createdAt DateTime @default(now())

    @@index([tenantId, createdAt])
    @@unique([tenantId, orderNumber])
  }
  ```
- **Covering Indexes**: Include queried columns in compound indexes to enable PostgreSQL Index-Only Scans.

---

## 3. Connection Pooling & Statement Timeouts

- **Pool Sizing Formula**:
  $$\text{max\_connections} = (\text{CPU Cores} \times 2) + \text{Effective Spindle Count}$$
- **PgBouncer**: Standardize on `pool_mode = transaction` for stateless microservice scale-out.
- **Statement Timeout**: Set `statement_timeout = '5000'` (5s) in connection configs to abort runaway queries.
