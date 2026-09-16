# Regulatory Compliance: SOC 2, ISO 27001 & GDPR

> **Core Mandate:** Enforce SOC 2 Type II Trust Services Criteria, ISO/IEC 27001 ISMS technical controls, and GDPR data subject privacy rights using open-source architectures.

---

## 1. SOC 2 Type II Trust Services Criteria

- **Access Controls (CC6.1)**: Enforce least-privilege RBAC/ABAC on all API endpoints. System-defined roles must be protected from unauthorized mutation.
- **Tamper-Evident Audit Trails (CC7.2)**:
  - All state mutations must create write-only, immutable audit log records:
    `{ timestamp, actorId, tenantId, action, entityType, entityId, ipAddress, userAgent, changes: { before, after } }`.
  - Audit logs must be retained for at least 365 days in append-only storage.

---

## 2. ISO/IEC 27001 ISMS Technical Controls

- **Annex A Cryptographic Controls (A.10.1)**: Enforce TLS 1.3 for data in transit and AES-256-GCM for sensitive data at rest. Passwords must be hashed using Argon2id or bcrypt.

---

## 3. GDPR Data Subject Rights

- **Right to Erasure (Article 17)**: Deleting a tenant or user must cascade delete or pseudonymize all associated personal identifiable information (PII) across active databases and backups.
