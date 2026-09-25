# API Versioning, SemVer Lifecycle & Swagger Multi-Version Architecture

> **Core Mandate:** Enforce URI path major versioning (`/api/v1/`), SemVer 2.0.0 contract specifications, RFC 8594 Sunset/Deprecation headers, a 90-day retirement window, and multi-version Swagger UI exploration.

---

## 1. Semantic Versioning (SemVer 2.0.0) in Web APIs

Semantic Versioning maps to Web APIs according to contract stability and backward compatibility:

$$\text{Version Format: } \mathbf{MAJOR.MINOR.PATCH}$$

| SemVer Component | Scope & Impact | Exposure Channel | Example |
|---|---|---|---|
| **MAJOR** | Breaking, backwards-incompatible contract modifications. Requires client code/URL changes. | URI Path (`/api/v1/`, `/api/v2/`) & OpenAPI `info.version` | `2.0.0` |
| **MINOR** | Backwards-compatible additive functionality, new endpoints, or optional attributes. | OpenAPI `info.version`, `API-Version` response header | `1.1.0` |
| **PATCH** | Backwards-compatible bug fixes, performance optimizations, and documentation fixes. | OpenAPI `info.version`, release tags, telemetry metadata | `1.0.1` |

> [!IMPORTANT]
> **Why URI Path Exposes MAJOR Only:**
> Exposing minor or patch versions in the URL path (e.g. `/api/v1.2.3/`) is a severe anti-pattern. Minor additions and bug fixes must not break client routing. Clients bind to the stable major version (`/api/v1/`) while consuming backward-compatible updates transparently.

---

## 2. SemVer Trigger Matrix: What Triggers a Version Update?

### A. MAJOR Bump (`1.x.x` ➔ `2.0.0`) — Breaking Changes
A MAJOR version bump and a new URI prefix (`/api/v2/`) are triggered whenever existing clients would fail without code modifications:

1. **Endpoint Alterations:**
   - Deleting an existing endpoint or HTTP method.
   - Renaming an existing URL path or subresource route.
2. **Request Contract Breaking Changes:**
   - Removing an existing request parameter (header, query, or body field).
   - Renaming a request field.
   - Changing the data type or format of a request field (e.g., string integer to number, date format change).
   - Adding a new **mandatory / required** field to an existing request payload without a default value.
   - Tightening input validation constraints (e.g., reducing max string length, narrowing allowed enum values).
3. **Response Contract Breaking Changes:**
   - Removing an existing field from a response payload.
   - Changing the data type or structure of a response field (e.g., object converted to array, integer cents converted to float string).
   - Changing the semantic business meaning of a field.
4. **Behavioral & Protocol Breaking Changes:**
   - Altering the standard HTTP status code for successful execution (e.g., changing `200 OK` to `204 No Content` or `201 Created`).
   - Changing the error envelope schema away from RFC 7807 problem details.
   - Changing authentication or authorization requirements (e.g. requiring a new OAuth scope or mTLS).

### B. MINOR Bump (`1.0.x` ➔ `1.1.0`) — Additive, Backward-Compatible
A MINOR version bump preserves the `/api/v1/` URI path and updates the contract specification:

1. Adding completely new endpoints or resources (e.g., adding `POST /api/v1/documents/:id/signatures`).
2. Adding new optional query parameters, headers, or request body fields.
3. Adding new fields to response payloads (clients must follow Postel's Law / Tolerant Reader pattern).
4. Adding new enum values to input requests if the service handles them gracefully without breaking old clients.
5. Relaxing validation constraints (e.g., increasing maximum allowed file upload size or string length).
6. Introducing deprecation notices on endpoints (via RFC 8594 headers) while maintaining functionality.

### C. PATCH Bump (`1.0.0` ➔ `1.0.1`) — Bug Fixes & Non-Contractual Changes
A PATCH version bump preserves contract schemas and updates release metadata:

1. Internal bug fixes in domain logic that do not alter the contractual request/response schema or status codes.
2. Performance enhancements, caching optimization, and database indexing.
3. Security patches in dependencies and runtime frameworks.
4. Clarifications, typo corrections, and formatting updates in OpenAPI descriptions.

---

## 3. RFC 8594 Sunset & Deprecation Lifecycle

When an older major version or endpoint is scheduled for retirement, inject standardized RFC 8594 headers:

```http
Deprecation: @1773619200
Sunset: Wed, 16 Sep 2026 23:59:59 GMT
Link: <https://api.domain.com/docs/migration/v2>; rel="sunset"
```

- **Mandatory 90-Day Migration Window:** Retain deprecated API versions for a minimum of 90 days following formal deprecation notification before decommissioning.
- **Access Telemetry:** Track consumer traffic on deprecated routes via OpenTelemetry attributes (`api.deprecated=true`, `http.route`) to coordinate client migration.

---

## 4. Swagger UI Multi-Version Selector Architecture

Swagger UI must provide an interactive version dropdown selector enabling consumers and developers to inspect both active and upcoming API specifications.

### Multi-Spec Configuration in Express / Swagger UI:
```ts
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      urls: [
        { url: '/specs/v1/openapi.yaml', name: 'v1.0.0 (Current Stable)' },
        { url: '/specs/v2/openapi.yaml', name: 'v2.0.0-draft (Next Major Preview)' }
      ],
      'urls.primaryName': 'v1.0.0 (Current Stable)'
    }
  })
);
```

### Filesystem Specification Hierarchy:
```
specs/
├── openapi/
│   ├── v1/
│   │   └── openapi.yaml
│   └── v2/
│       └── openapi.yaml
```

---

## 5. Invariants, DO's & DONT's

### DO's:
- **DO:** Prefix all public REST endpoints with major version identifiers (`/api/v1/`, `/api/v2/`).
- **DO:** Bump MAJOR and cut a new `/api/v2/` prefix whenever request or response breaking changes occur.
- **DO:** Inject RFC 8594 `Sunset` and `Deprecation` headers on all retired endpoints and provide a 90-day grace period.
- **DO:** Organize specs into versioned folders (`specs/openapi/v1/`, `v2/`) with an interactive Swagger selector.

### DONT's:
- **DONT:** Never expose minor or patch numbers in the URL path (e.g. `/api/v1.2/`).
- **DONT:** Never introduce breaking schema or status code changes within an existing major version.
- **DONT:** Never delete an active endpoint without a formal deprecation lifecycle.

