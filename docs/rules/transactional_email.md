# Transactional Email Subsystem

> **Core Mandate:** Enforce declarative email templates, safe variable interpolation, and deterministic local test delivery through Mailpit SMTP routing.

---

## 1. Declarative & Typed Email Templates

- **Declarative Template Definition**: Author transactional email templates using language-agnostic markup formats (such as **MJML - Mailjet Markup Language**) or typed component schemas to ensure cross-client rendering consistency across Outlook, Gmail, and Apple Mail.
- **Safe Variable Interpolation**: Strictly prohibit unescaped raw HTML string concatenation. Always use context-aware template engines that automatically escape HTML special characters to prevent Cross-Site Scripting (XSS) and injection vulnerabilities.

---

## 2. Local Mail Transport & Integration Verification

- **Local SMTP via Mailpit**:
  - Route local and CI SMTP traffic to **Mailpit** (SMTP port 1025 / Web UI port 8025).
  - Never route emails to public mail transfer agents (MTAs) or external API gateways during automated test runs or local development.
- **Deterministic API Assertion Protocol**:
  - Assert email delivery in integration tests by querying Mailpit's REST API (`GET /api/v1/messages`) to inspect recipient headers, delivery status, HTML body content, and verification links without timing dependencies.
