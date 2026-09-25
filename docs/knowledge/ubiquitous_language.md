# Living Ubiquitous Language Glossary Template

> **Source of Truth:** Authoritative terminology dictionary binding domain concepts, business definitions, and exact code identifiers. Customize this glossary per project.

---

## Canonical Domain Vocabulary Matrix

| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Code & Database Identifiers |
|---|---|---|---|---|
| **Organization** | The top-level administrative and multi-tenant isolation container. | Multi-Tenancy & Identity | Account, Company, Workspace, TenantGroup | `Organization`, `organizationId`, `organizations` table |
| **User** | A human actor authenticated with verified credentials across the platform. | Identity & Access | Member (when unauthenticated), Account, Login | `User`, `userId`, `users` table |
| **Membership** | The formal association connecting a User to an Organization with assigned roles. | Authorization & RBAC | UserOrg, Seat, PermissionAssignment | `Membership`, `membershipId`, `memberships` table |
| **Role** | A named set of granular `<entity>:<action>` permissions within an organization. | Authorization | Group, Profile, Level | `Role`, `roleId`, `roles` table |
| **Resource** | The primary business entity managed within the domain core. | Core Domain | Item, Object, Record, Entity | `Resource`, `resourceId`, `resources` table |
| **Ledger Entry** | An immutable audit record detailing a financial or transactional state change. | Finance & Accounting | TransactionRow, MoneyLog, BillEntry | `LedgerEntry`, `ledgerEntryId`, `ledger_entries` table |

---

## Linguistic Invariants & Rules
1. **The Single Name Rule:** Every domain concept has exactly one authoritative name. Synonyms are strictly forbidden across code, schemas, and UI.
2. **Contextual Boundaries:** If a word has multiple meanings across business departments, isolate the terms within dedicated Bounded Contexts.
3. **Continuous Updating:** When domain experts establish or rename a term, update this glossary immediately, record an ADR in `memory.md`, and refactor all occurrences.
