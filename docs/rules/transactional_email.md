# Transactional Email Subsystem

> **Core Mandate:** Enforce typed React Email templates, safe token interpolation, and deterministic local test delivery through Mailpit SMTP routing.

---

## 1. Typed React Email Templates

- **Shared Templates**: Maintain typed React Email templates (`@mvp/emails`) shared between backend rendering engines and frontend preview development servers.
- **Safe Token Interpolation**: Use typed template props and token interpolation (`{{token}}`, `{{resetUrl}}`) over raw, unescaped HTML string concatenation to prevent Cross-Site Scripting (XSS).

---

## 2. Local Mail Transport & Integration Verification

- **Local SMTP via Mailpit**:
  - Route local SMTP delivery to Mailpit (SMTP port 1025 / Web UI port 8025).
  - Never send actual emails to public mail transfer agents during automated tests or local development.
- **Test Assertion Protocol**:
  - Assert email delivery in integration tests by querying Mailpit's REST API (`GET http://localhost:8025/api/v1/messages`) to verify sent email content, subject, headers, and delivery recipients deterministically.
