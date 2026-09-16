# API Versioning & Deprecation Lifecycle

> **Core Mandate:** Enforce URI path versioning (`/api/v1/`), RFC 8594 Sunset and Deprecation headers for retiring APIs, and a mandatory 90-day migration window.

---

## 1. URI Path Versioning

- All public REST endpoints must include major version prefixes in the URL path:
  `/api/v1/customers`, `/api/v2/customers`.
- Never introduce breaking schema changes within the same major version.

---

## 2. RFC 8594 Sunset & Deprecation Headers

When an API version or endpoint is scheduled for retirement, inject standardized HTTP headers on every response:

```http
Deprecation: @1773619200
Sunset: Wed, 16 Sep 2026 23:59:59 GMT
Link: <https://docs.app.com/migration/v2>; rel="sunset"
```

---

## 3. Mandatory 90-Day Migration Window

- Retain deprecated API versions for a minimum of 90 days following formal deprecation notification.
- Monitor access logs for deprecated route calls before executing complete endpoint decommissioning.
