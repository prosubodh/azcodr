# Multi-Tenancy Context Resolution & PostgreSQL RLS Isolation

> **Core Mandate:** Enforce multi-tenancy isolation through application middleware combined with database-level PostgreSQL Row-Level Security (RLS) as an immutable backstop.

---

## 1. Multi-Tenant Context Resolution

Resolve tenant identity dynamically in an Express/Fastify middleware pipeline in strict priority order:
1. **Host Subdomain**: `subdomain.app.com` (extracted via hostname regex).
2. **Explicit Headers**: `X-Tenant-ID: <uuid>` or `X-Tenant-Slug: <slug>`.
3. **Path Prefix**: `/t/:tenantSlug/...`.
4. **JWT Claim Fallback**: Authenticated token `tid` (tenant ID) claim.

*Validation:* If the resolved tenant does not exist or is in `SUSPENDED` status, immediately return **`403 Forbidden`** (`TENANT_SUSPENDED` or `TENANT_INVALID`).

---

## 2. PostgreSQL Row-Level Security (RLS) Safety Net

Never rely solely on application developers remembering to append `where: { tenantId }`.

### Protocol: Transaction-Scoped Configuration
Before executing any query in a request, set a local PostgreSQL transaction configuration variable:
```sql
SELECT set_config('app.tenant_id', 'tenant-uuid-123', true);
```
> [!IMPORTANT]
> **Connection Pool Safety:** Always set the third parameter `is_local = true`. This scopes the variable strictly to the current database transaction. When the connection is returned to the pool, the setting is automatically cleared, preventing cross-tenant leaks.

### PostgreSQL RLS Policy Definition
```sql
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;

CREATE POLICY order_tenant_isolation_policy ON "Order"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### Prisma Client Extension for Automated RLS
```typescript
import { PrismaClient } from '@prisma/client';

export const createTenantPrismaClient = (prisma: PrismaClient, tenantId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${tenantId}', true)`),
            query(args)
          ]);
          return result;
        }
      }
    }
  });
};
```

---

## 3. Tenant Lifecycle Management

- **Atomic Provisioning**: Tenant creation must run inside an atomic transaction (provision tenant, seed default RBAC roles `ADMIN`, `MEMBER`, assign subscription tier).
- **GDPR Cascading Deletion**: Deleting a tenant triggers an asynchronous job that cascade purges or pseudonymizes all tenant records, ensuring zero orphaned data.
