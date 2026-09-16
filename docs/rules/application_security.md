# Application Security & OWASP Top 10 Defenses

> **Core Mandate:** Enforce proactive defenses against the OWASP Top 10 vulnerabilities, cryptographic rigor, and Redis-backed rate limiting.

---

## 1. OWASP Top 10 Defenses

- **A01: Broken Access Control**: Verify permissions server-side on every request. Enforce PostgreSQL Row-Level Security (RLS) for tenant isolation.
- **A02: Cryptographic Failures**: Passwords hashed with Argon2id. Encrypt sensitive columns at rest using AES-256-GCM.
- **A03: Injection**: Prohibit raw SQL string concatenation. All queries must use Prisma parameterized queries or tagged templates.
- **A07: Identification and Authentication Failures**: Enforce rate limiting on auth endpoints and Refresh Token Rotation (RTR) with replay detection.
- **A10: Server-Side Request Forgery (SSRF)**: Validate and restrict outbound HTTP requests to an explicit whitelist of trusted destinations.

---

## 2. API Rate Limiting

- Use open-source `rate-limiter-flexible` with a Redis backend.
- Enforce tiered rate limits:
  - Auth routes: 5 requests / minute per IP.
  - Public API routes: 100 requests / minute per user/tenant.
- Return **`429 Too Many Requests`** with `Retry-After` header when limits are exceeded.
