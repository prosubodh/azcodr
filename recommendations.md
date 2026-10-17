# Architecture, Security & Compliance Recommendations Guide

> **Helper Context:** This guide is an authoritative governance reference provided by `azcodr` (the architecture toolkit helper). As a **generic, domain-agnostic harness**, `azcodr` enforces strict systemic atomicity and zero speculative bloat. This reference organizes application security, authentication, and compliance recommendations into two legitimate harness tiers:
> 1. **Tier 1: Universal Web Security Standards** (applies across 100% of web applications and APIs).
> 2. **Tier 2: Architecture-Triggered Governance & YAGNI Gates** (generic patterns activated only when a specific topology or scale is chosen).
> 
> *Domain-specific vertical integrations (`surescript??`, `liquid web??`) are excluded from this generic harness.*

---

## Quick Navigation

- [Tier 1: Universal Web Security Standards](#tier-1-universal-web-security-standards-100-generic)
  - [1.1. HTTP Security Headers & Clickjacking Defense](#11-http-security-headers--clickjacking-defense)
  - [1.2. Session Fixation Defense & Cookie Security](#12-session-fixation-defense--cookie-security)
  - [1.3. Open Redirect Defense & Sanitization](#13-open-redirect-defense--sanitization)
  - [1.4. Password Reset & Recovery Token Lifecycles](#14-password-reset--recovery-token-lifecycles)
  - [1.5. Real-Time Observability & Error Tracking](#15-real-time-observability--error-tracking)
  - [1.6. Foundational Privacy Principles (GDPR Art 17 / CCPA)](#16-foundational-privacy-principles-gdpr-art-17--ccpa)
- [Tier 2: Architecture-Triggered Governance (YAGNI Gated)](#tier-2-architecture-triggered-governance-yagni-gated)
  - [2.1. PostgreSQL Row-Level Security (RLS)](#21-postgresql-row-level-security-rls)
  - [2.2. Granular Permission Levels (RBAC / ABAC / ReBAC)](#22-granular-permission-levels-rbac--abac--rebac)
  - [2.3. Passwordless Magic Links](#23-passwordless-magic-links)
  - [2.4. Multi-Factor Authentication: Authenticator (TOTP) vs SMS](#24-multi-factor-authentication-authenticator-totp-vs-sms)
  - [2.5. The 3 Foundational Legal Artifacts](#25-the-3-foundational-legal-artifacts)
  - [2.6. Continuous Compliance Automation & 90-Day Calendar](#26-continuous-compliance-automation--90-day-calendar)
- [Harness Purity: What Was Excluded & Why](#harness-purity-what-was-excluded--why)
- [Summary Implementation Matrix](#summary-implementation-matrix)

---

## Tier 1: Universal Web Security Standards (100% Generic)

These standards apply to **every production web application, backend API, or user-facing service** regardless of vertical domain.

### 1.1. HTTP Security Headers & Clickjacking Defense
Prevent framing, overlay attacks, and UI redressing across all web routes:

- **`X-Frame-Options: DENY`**: Send on **every HTTP response** by default to block framing in `<frame>`, `<iframe>`, `<embed>`, or `<object>`.
- **Content-Security-Policy (CSP) `frame-ancestors`**:
  - Global default: `Content-Security-Policy: frame-ancestors 'none';`
  - Route-specific relaxation: Only if a dedicated embeddable widget route exists, explicitly whitelist allowed origins: `frame-ancestors 'self' https://partner.example.com;`.
- **Standard Baseline Headers**:
  ```http
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; frame-ancestors 'none';
  ```

### 1.2. Session Fixation Defense & Cookie Security
- **Session ID Regeneration:** After every successful login, credential verification, or privilege escalation (e.g., standard member becoming organization admin), **regenerate the session ID immediately**:
  ```typescript
  req.session.regenerate((err) => {
    if (err) throw new SessionError("Failed to cycle session identifier");
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.save();
  });
  ```
- **Cookie Attributes:**
  - `HttpOnly`: Strictly blocks JavaScript `document.cookie` access (mitigating XSS session theft).
  - `Secure`: Transmitted strictly over HTTPS in production and staging.
  - `SameSite=Lax` (or `SameSite=Strict` for sensitive API portals): Mitigates Cross-Site Request Forgery (CSRF).
  - Use `__Host-` cookie prefixes (e.g., `__Host-session_id`) to lock cookies to the exact domain with `Path=/` and `Secure`.

### 1.3. Open Redirect Defense & Sanitization
Never redirect users based on raw query strings (e.g. `/login?returnTo=...`). Attackers exploit protocol-relative URLs (`//evil.com`, `/\evil.com`) and encoded variants (`%2f%2fevil.com`):

```typescript
export function sanitizeRedirectUrl(rawUrl: string, allowedHost: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '/dashboard';

  // Decode URI components repeatedly to defeat double-encoding evasion
  let decoded = rawUrl;
  try {
    while (decoded !== decodeURIComponent(decoded)) {
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    return '/dashboard'; // Malformed URI
  }

  // Reject protocol-relative URLs (e.g., //evil.com, /\evil.com, \\evil.com)
  if (decoded.startsWith('//') || decoded.startsWith('/\\') || decoded.startsWith('\\\\')) {
    auditLog.warn({ event: 'SUSPICIOUS_REDIRECT_BLOCKED', rawUrl });
    return '/dashboard';
  }

  // Parse against trusted origin
  try {
    const parsed = new URL(decoded, `https://${allowedHost}`);
    if (parsed.host !== allowedHost) {
      auditLog.warn({ event: 'EXTERNAL_REDIRECT_REJECTED', targetHost: parsed.host });
      return '/dashboard';
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '/dashboard';
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/dashboard';
  }
}
```

### 1.4. Password Reset & Recovery Token Lifecycles
Password reset flows must enforce strict cryptographic, expiry, and rate-limiting gates:

- **10-Minute TTL:** Tokens expire exactly 10 minutes after issuance.
- **Single-Use Invalidation:** Immediately consume or delete the token upon first presentation.
- **Salted Hash Storage:** Store only salted cryptographic hashes (e.g. SHA-256) in database records, never plaintext tokens.
- **Rate Limiting:** Cap requests at a maximum of **3 reset emails per hour** per user identifier or IP.
- **Redirect Validation:** Return paths must be strictly validated against the internal host allowlist.

### 1.5. Real-Time Observability & Error Tracking
- **Centralized Crash Reporting:** Standardize on Sentry or self-hosted open-source GlitchTip.
- **Trace Correlation:** Bind `x-request-id` (UUID v4), W3C `traceparent`, and `tenantId` to every error event.
- **PII Scrubbing:** Configure SDK filters (`beforeSend`) to sanitize passwords, secrets, Bearer tokens, and connection strings from stack traces.
- **RFC 9457 Problem Details:** Return clean, masked error envelopes to clients while preserving rich internal logs.

### 1.6. Foundational Privacy Principles (GDPR Art 17 / CCPA)
- **Data Erasure Pipeline (GDPR Article 17 "Right to be Forgotten"):** Automated pipeline capable of purging or pseudonymizing user PII across all active data stores and caches within 30 days of a verified request.
- **Least Privilege Access:** Zero production credential access in local environments.

---

## Tier 2: Architecture-Triggered Governance (YAGNI Gated)

These are generic patterns that apply **only when triggered by specific architectural topologies or operational scale**.

### 2.1. PostgreSQL Row-Level Security (RLS)
*Triggered when:* A project adopts a **multi-tenant pooled database architecture** on PostgreSQL.

- **Dual-Lock Table Setup:**
  ```sql
  ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
  ```
- **Declarative Policy:**
  ```sql
  CREATE POLICY tenant_isolation_policy ON accounts
    AS RESTRICTIVE
    FOR ALL
    TO application_user
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
  ```
- **Session Binding:** Connection checkout executes `SELECT set_config('app.current_tenant_id', :tenantId, true);`.

### 2.2. Granular Permission Levels (RBAC / ABAC / ReBAC)
*Triggered when:* An application moves beyond a single-user model to organization hierarchies.

- **RBAC (Coarse Roles):** System roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
- **ABAC (Attribute-Based):** Evaluated via Open Policy Agent (OPA) / Rego policies in Wasm or microservice sidecars.
- **ReBAC (Relationship-Based):** Nested organizational hierarchies and sharing evaluated via OpenFGA / Zanzibar.
- **Mandatory Server PEP:** Never evaluate permissions solely on client UI routes; every backend endpoint enforces an explicit Policy Enforcement Point guard.

### 2.3. Passwordless Magic Links
*Triggered when:* A project opts for passwordless email authentication.

- Governed by identical constraints to Password Reset: **10-minute TTL**, **single-use invalidation via hash lookup**, **3 emails/hour rate limit**, and **strict internal redirect allowlisting**.

### 2.4. Multi-Factor Authentication: Authenticator (TOTP) vs SMS
*Triggered when:* An application enforces step-up or secondary authentication.

- **Authenticator Apps (TOTP RFC 6238 / FIDO2 WebAuthn):** Standard default. Zero carrier costs, zero SIM-swapping vulnerability.
- **SMS OTP:** NIST SP 800-63B deprecates SMS as a restricted factor due to cellular interception and SS7/SIM-swap attacks. Acceptable only as a legacy fallback.

### 2.5. The 3 Foundational Legal Artifacts
*Triggered when:* A project transitions from internal development to public / commercial SaaS.

1. **Privacy Policy (Public):** Exact data inventory (what is collected, why, retention, and third-party data flows).
2. **Terms of Service (Contractual):** Acceptable use, dispute resolution, payment terms, and liability limits.
3. **Data Processing Agreement (DPA - Vendor / B2B):** Mandatory under GDPR Article 28 for every sub-processor handling user personal data (cloud hosting, payment, transactional email, analytics).

### 2.6. Continuous Compliance Automation & 90-Day Calendar
*Triggered when:* An organization pursues formal SOC 2 Type II, ISO/IEC 27001, or enterprise compliance.

- **Automated Evidence Collection:** Integrate continuous control monitoring dashboards (**Vanta**, **Drata**, **Secureframe**) or 100% open-source scanners via [`.agents/skills/compliance-audit/SKILL.md`](file:///home/prosubodh/projects/azcodr/.agents/skills/compliance-audit/SKILL.md) (`gitleaks`, `semgrep`, `trivy`, `syft`, `grype`).
- **90-Day Recurring Compliance Calendar:**
  - **Q1:** Sub-processor audit & DPA review.
  - **Q2:** Cookie consent & frontend tracking audit.
  - **Q3:** Data retention & Article 17 erasure drills.
  - **Q4:** Multi-jurisdiction regulatory scan (GDPR, CCPA, state privacy laws).

---

## Harness Purity: What Was Excluded & Why

In alignment with Rule Zero ("Assume nothing; zero speculative bloat"), vertical-specific notes have been purged from this generic governance harness:

| Purged Item | Classification | Reason for Exclusion from Generic Harness |
|---|---|---|
| `surescript??` | Vertical Niche (US HealthTech) | **Surescripts** is a proprietary US electronic prescribing network. It requires DEA EPCS certification and NIST IAL2 identity proofing. Irrelevant to 99% of software projects; belongs only in a dedicated healthcare vertical profile. |
| `liquid web??` | Vendor Niche (Managed VPS) | A generic harness standardizes on cloud-native primitives (OCI containers, AWS/GCP/Azure, or compliant PaaS like Aptible/Render). It does not endorse legacy VPS hosting vendors. |

---

## Summary Implementation Matrix

| Tier | Security Control / Milestone | Priority | Governing Rule / Skill |
|:---:|---|:---:|---|
| **Tier 1** | Session ID regeneration (`req.session.regenerate()`) & `X-Frame-Options: DENY` | **P0** | [`authentication.md`](file:///home/prosubodh/projects/azcodr/docs/rules/authentication.md) |
| **Tier 1** | Password reset & token lifecycles (10m TTL, single-use, 3/hr rate limit) | **P0** | [`authentication.md`](file:///home/prosubodh/projects/azcodr/docs/rules/authentication.md) |
| **Tier 1** | URL sanitization rejecting open redirects & protocol-relative variants (`//`) | **P1** | [`security_compliance.md`](file:///home/prosubodh/projects/azcodr/docs/rules/security_compliance.md) |
| **Tier 1** | Real-time crash monitoring with PII masking & RFC 9457 error envelopes | **P1** | [`error_handling.md`](file:///home/prosubodh/projects/azcodr/docs/rules/error_handling.md) |
| **Tier 2** | PostgreSQL Row-Level Security (RLS) for pooled multi-tenant databases | **P1** | [`multitenancy_architecture.md`](file:///home/prosubodh/projects/azcodr/docs/rules/multitenancy_architecture.md) |
| **Tier 2** | Server-side PEP permission guarding (RBAC / ABAC / ReBAC) | **P1** | [`authorization.md`](file:///home/prosubodh/projects/azcodr/docs/rules/authorization.md) |
| **Tier 2** | Data-flow grounded legal docs (Privacy Policy, ToS, sub-processor DPAs) | **P2** | [`security_compliance.md`](file:///home/prosubodh/projects/azcodr/docs/rules/security_compliance.md) |
| **Tier 2** | 90-day compliance calendar & continuous control monitoring | **P2** | [`.agents/skills/compliance-audit/SKILL.md`](file:///home/prosubodh/projects/azcodr/.agents/skills/compliance-audit/SKILL.md) |
