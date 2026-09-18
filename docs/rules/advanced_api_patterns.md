# Advanced REST API Patterns & Capability Architecture

> **Core Mandate:** Enrich API responses with capability metadata (Allowed Actions), ensure safe mutations via idempotency keys, enforce cursor pagination, and prevent race conditions with optimistic concurrency.

---

## 1. Allowed Actions & Capability Metadata (HATEOAS-Lite)

Clients must not duplicate server-side business and authorization rules to decide whether an action (edit, delete, approve, cancel) is permitted. **The server is the authoritative source of truth.**

### Pattern: `_actions` and `_links` Envelope
Every resource response must embed an `_actions` boolean map and optional `_links` hypermedia block indicating what the requesting caller is permitted to do based on their role, tenant boundaries, and the entity's current state:

```json
{
  "id": "ord_9876",
  "status": "SHIPPED",
  "totalAmount": 149.99,
  "currency": "USD",
  "_actions": {
    "canEdit": false,
    "canCancel": false,
    "canTrack": true,
    "canRequestRefund": true
  },
  "_links": {
    "self": { "href": "/api/v1/orders/ord_9876", "method": "GET" },
    "track": { "href": "/api/v1/orders/ord_9876/tracking", "method": "GET" },
    "refund": { "href": "/api/v1/orders/ord_9876/refunds", "method": "POST" }
  }
}
```

### UI Benefits
- Frontend buttons and menus simply bind to `resource._actions.canDelete`.
- When business logic evolves (e.g. orders over $1,000 require manager approval), only the backend logic changes—zero frontend redeployment required.

---

## 2. Safe Mutations via Idempotency Keys (IETF Draft)

To prevent duplicate processing (double charging, duplicate resource creation) caused by network retries:

### Protocol
- Clients generating mutating requests (`POST`, `PATCH`) must supply a unique `Idempotency-Key: <uuid-v4>` header.
- **Server Lifecycle**:
  1. Check distributed idempotency store for key `idemp:<tenantId>:<idempotencyKey>`.
  2. If found with status `IN_FLIGHT`: return `409 Conflict` (`IDEMPOTENT_OPERATION_IN_PROGRESS`).
  3. If found with status `COMPLETED`: return the cached status code, headers, and response payload without re-executing.
  4. If not found: Acquire distributed lock, process mutation atomically, cache response with a 24-hour TTL, and release lock.

---

## 3. High-Scale Keyset / Cursor-Based Pagination

Never use offset pagination (`OFFSET 10000 LIMIT 20`) on large tables. Offsets degrade linearly (`O(N)`) and suffer from page-drift anomalies.

### Specification
- Query Parameters: `?cursor=<opaque_base64>&limit=20` (default limit 20, max 100).
- Response Envelope:
  ```json
  {
    "data": [...],
    "pagination": {
      "nextCursor": "ZXlKaWRI...==",
      "hasMore": true,
      "limit": 20
    }
  }
  ```
- **Agnostic Keyset Query Pattern**:
  ```sql
  SELECT * FROM orders
  WHERE tenant_id = :tenantId
    AND (created_at, id) < (:cursorCreatedAt, :cursorId)
  ORDER BY created_at DESC, id DESC
  LIMIT :limit + 1;
  ```
  If `results.length > limit`, slice the extra item and encode its cursor token for `nextCursor`.

---

## 4. Optimistic Concurrency Control (OCC)

Prevent lost-update anomalies during concurrent edits without pessimistic database row locking:

### Protocol
- Every mutable entity contains an incrementing integer `version` column.
- Server returns the current version in the `ETag` response header: `ETag: W/"v4"`.
- Clients submitting updates (`PUT`, `PATCH`) must include `If-Match: W/"v4"`.
- **Conflict Handling**:
  - Atomic update: `UPDATE table SET ..., version = version + 1 WHERE id = :id AND version = :expectedVersion`.
  - If 0 rows updated: Return **`409 Conflict`** with error code `CONCURRENCY_CONFLICT` and the latest entity representation.

---

## 5. Asynchronous Processing (`202 Accepted`)

For tasks taking > 1.5 seconds (video rendering, large PDF export, batch imports):
- Do NOT block synchronous client requests.
- Dispatch task to an asynchronous worker queue or workflow engine.
- Return **`202 Accepted`** immediately with:
  - Header: `Location: /api/v1/tasks/:taskId`
  - Body: `{ "taskId": "tsk_123", "status": "QUEUED", "pollIntervalMs": 2000 }`
