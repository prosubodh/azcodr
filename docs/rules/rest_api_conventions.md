# REST API Design & Response Conventions

> **Core Mandate:** Enforce standardized RESTful conventions, proper HTTP status codes, enumeration masking, and consistent subresource routing.

---

## 1. HTTP Status Code Conventions

- **`200 OK`**: Successful GET, PUT, or PATCH requests returning modified state.
- **`201 Created`**: Successful resource creation via POST (must include `Location` header or created entity).
- **`204 No Content`**: Successful DELETE operations or operations returning no body.
- **`400 Bad Request`**: Malformed payload or validation schema failure.
- **`401 Unauthorized`**: Missing, expired, or invalid authentication credentials.
- **`403 Forbidden`**: Authenticated caller lacks permissions, tenant is suspended, or action targets protected system roles.
- **`404 Not Found`**: Resource does not exist or belongs to another tenant (enumeration masking).
- **`409 Conflict`**: Unique constraint collision or concurrent optimistic lock conflict.
- **`422 Unprocessable Entity`**: Semantic domain violation.
- **`429 Too Many Requests`**: Rate limit exceeded.
- **`500 Internal Server Error`**: Unexpected server error.

---

## 2. Cross-Tenant Enumeration Masking

- If an authenticated user attempts to access a resource ID belonging to a different tenant, the API must return **`404 Not Found`** (rather than `403 Forbidden`) to prevent leaking the existence of other tenants' records.

---

## 3. Subresource Endpoints & Pluralization

- Always use pluralized nouns for resources (e.g. `/api/v1/users`, `/api/v1/orders`).
- Use nested subresources for closely owned relations:
  - `/api/v1/roles/:id/permissions`
  - `/api/v1/tenants/:id/members`

---

## 4. Full Lifecycle Resource CRUD & Route Tolerances

- **Full Lifecycle Support:** All primary resource endpoints must provide comprehensive CRUD capabilities before completion:
  - `GET /api/v1/<resources>`: List with pagination and tenant filtering.
  - `GET /api/v1/<resources>/:id`: Detailed record by ID.
  - `POST /api/v1/<resources>`: Create new entity returning `201 Created`.
  - `PUT /api/v1/<resources>/:id` or `PATCH`: Update attributes or mutate state machine status.
  - `DELETE /api/v1/<resources>/:id`: Remove or archive returning `204 No Content`.
- **Defensive Route Tolerances for Infrastructure Probes:** Operational probes (`/healthz`, `/readyz`) must defensively support trailing slashes (`/healthz/`) and common typos (`/healtz/`) to prevent reverse proxy routing mismatches between frontend dev servers (e.g. Vite) and ingress gateways.
