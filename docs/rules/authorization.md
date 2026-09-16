# Enterprise Authorization, CASL ABAC/RBAC & OPA

> **Core Mandate:** Enforce granular Role-Based and Attribute-Based Access Control (RBAC/ABAC) via CASL and Open Policy Agent (OPA) rule engines across all API boundaries.

---

## 1. Declarative Permissions with CASL

Utilize open-source `@casl/ability` to define isomorphic access control rules:

```typescript
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects = 'User' | 'Order' | 'Invoice' | 'all';
export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilityFor(user: { id: string; role: string; tenantId: string }): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user.role === 'ADMIN') {
    can('manage', 'all');
  } else {
    can('read', 'Order', { tenantId: user.tenantId });
    can('update', 'Order', { tenantId: user.tenantId, status: 'DRAFT' });
    cannot('delete', 'Order');
  }

  return build();
}
```

---

## 2. Open Policy Agent (OPA) / Rego Engine

For enterprise tenants requiring externalized, fine-grained decision policies:
- Evaluate authorization requests against declarative OPA Rego policies.
- Pass `{ user, action, resource, tenant, context }` to the local OPA sidecar or in-process engine.

---

## 3. Server-Side Route Guarding

- **Middleware Enforcement**: Never rely on client-side route guards. Every backend controller must verify permissions before executing domain actions:
  ```typescript
  if (!ability.can('update', subject('Order', order))) {
    return res.status(403).json({ error: 'Unauthorized action', code: 'FORBIDDEN' });
  }
  ```
- **System Role Protection**: System-critical roles (e.g. `OWNER`, `SUPER_ADMIN`) must be protected against modification or deletion by standard users with `403 Forbidden`.
