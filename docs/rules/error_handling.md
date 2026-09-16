# Error Handling, Request Tracing & Schema Validation

> **Core Mandate:** Enforce fail-fast environment validation with Zod, structured JSON request tracing with Pino, and standardized REST error envelopes.

---

## 1. Fail-Fast Environment Validation

Validate all environment variables at process bootstrap using open-source `zod` schemas (`src/config/env.ts`):
- Halt application startup immediately if any environment variable is missing or malformed.
- Never allow fallback defaults for production secrets.

---

## 2. Structured Request Tracing (Pino)

- Emit structured JSON logs using high-performance open-source `pino`.
- Bind a unique `x-request-id` (UUID v4) to every incoming HTTP request and forward it across all downstream database queries and service calls.

---

## 3. Standardized Error Response Envelope

Enforce a uniform error envelope across all REST controllers:

```json
{
  "error": "Human-readable description of error",
  "code": "MACHINE_READABLE_CODE",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "details": []
}
```

- **Masking in Production**: Strictly mask internal database error codes, SQL queries, and system stack traces in production environments.
