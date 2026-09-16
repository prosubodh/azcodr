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
- When business logic evolves (e.g. orders over $1,000 require manager approval), only the backend logic changes—no frontend redeployment required.

---

## 2. Safe Mutations via Idempotency Keys

To prevent duplicate processing (double charging, duplicate resource creation) caused by network retries:

### Protocol
- Clients generating mutating requests (`POST`, `PATCH`) must supply a unique `Idempotency-Key: <uuid-v4>` header.
- **Server Lifecycle**:
  1. Check Redis for key `idemp:<tenantId>:<idempotencyKey>`.
  2. If found with status `IN_FLIGHT`: return `409 Conflict` (`IDEMPOTENT_OPERATION_IN_PROGRESS`).
  3. If found with status `COMPLETED`: return the cached status code, headers, and response payload without re-executing.
  4. If not found: Acquire Redis lock, process mutation, cache response with a 24-hour TTL, and release lock.

---

## 3. High-Scale Cursor-Based Pagination

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
- **Prisma Implementation**:
  ```typescript
  const items = await prisma.record.findMany({
    take: limit + 1,
    cursor: cursor ? { id: decodeCursor(cursor) } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: 'desc' }
  });
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? encodeCursor(data[data.length - 1].id) : null;
  ```

---

## 4. Optimistic Concurrency Control (OCC)

Prevent lost-update anomalies during concurrent edits without pessimistic database row locking:

### Protocol
- Every mutable entity contains an incrementing integer `version` or ISO `updatedAt` timestamp.
- Server returns the current version in the `ETag` response header: `ETag: W/"v4"`.
- Clients submitting updates (`PUT`, `PATCH`) must include `If-Match: W/"v4"`.
- **Conflict Handling**:
  - Update query condition: `where: { id, version: clientVersion }`.
  - If 0 rows updated: Return **`409 Conflict`** with error code `CONCURRENCY_CONFLICT` and latest entity representation.

---

## 5. Asynchronous Processing (`202 Accepted`)

For tasks taking > 1.5 seconds (video rendering, large PDF export, batch imports):
- Do NOT block the HTTP request.
- Dispatch task to open-source background worker queue (e.g. BullMQ with Redis).
- Return **`202 Accepted`** immediately with:
  - Header: `Location: /api/v1/tasks/:taskId`
  - Body: `{ "taskId": "tsk_123", "status": "QUEUED", "pollIntervalMs": 2000 }`
