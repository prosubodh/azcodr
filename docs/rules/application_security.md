# Application Security & OWASP Top 10 Defenses

> **Core Mandate:** Enforce proactive defenses against the OWASP Top 10 vulnerabilities, cryptographic rigor, and token-bucket rate limiting across all layers.

---

## 1. OWASP Top 10 Defenses

- **A01: Broken Access Control**: Verify permissions server-side on every request using Policy Enforcement Points (PEPs). Enforce immutable multi-tenancy data isolation (AST interceptors, database RLS, or schema namespaces).
- **A02: Cryptographic Failures**: Passwords must be hashed using **Argon2id** with memory-hard parameters. Encrypt sensitive data at rest using authenticated ciphers (**AES-256-GCM** or **ChaCha20-Poly1305**).
- **A03: Injection (SQL / NoSQL / Command)**: Strictly prohibit raw query string interpolation or dynamic execution. All database interactions must use parameterized prepared statements.
- **A07: Identification and Authentication Failures**: Enforce rate limiting on auth endpoints, FIDO2/WebAuthn passkeys, and Refresh Token Rotation (RTR) with family invalidation on replay detection.
- **A10: Server-Side Request Forgery (SSRF)**: Validate and restrict outbound network requests to an explicit allowlist of domains. Block requests targeting RFC 1918 private IP ranges, loopback addresses (`127.0.0.1`), and cloud metadata endpoints (`169.254.169.254`).

---

## 2. Distributed API Rate Limiting

- Utilize token-bucket or sliding-window rate limiters backed by a distributed in-memory cache port.
- Enforce tiered rate limits:
  - Authentication routes: Max 5 requests / minute per IP.
  - Standard API routes: Max 100 requests / minute per tenant/user.
- Return **`429 Too Many Requests`** with standard `Retry-After` and `RateLimit-*` IETF headers when limits are exceeded.
