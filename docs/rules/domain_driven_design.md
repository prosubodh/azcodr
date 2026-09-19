# Domain-Driven Design (DDD) & Ubiquitous Language

> **Core Mandate:** Establish unambiguous Ubiquitous Language definitions, isolate Bounded Contexts, guarantee Domain-Code Language Agreement across all architectural layers, and separate Value Objects, Entities, and Aggregates.

---

## 1. Domain-Code Language Agreement

The fundamental premise of Domain-Driven Design (Eric Evans) is that **the code is the model, and the model is the code**. Any divergence between the mental model of domain experts and the source code is called **Linguistic Drift**.

### Principles of Linguistic Alignment
1. **Zero Synonyms (The Single Name Rule)**: Every domain concept has exactly one authoritative term. Synonyms (e.g. `Client` vs `User`, `Account` vs `Organization`, `Contract` vs `Agreement`) are strictly forbidden across code, tests, and user interfaces.
2. **Eliminate Technical Jargon from Domain Core**: Domain models must not leak technical implementation terms (e.g. `UserRecord`, `TenantRow`, `DataDTO`, `IsActiveFlag`). The domain language must be pure business vocabulary.
3. **Contextual Isolation**: When a single English word has multiple meanings across business units, split the terms or isolate them within dedicated Bounded Contexts:
   - *Example*: In multi-tenant infrastructure, a system isolation boundary is an **Organization** / **Tenant Workspace**. In application operations, a participant is a **Member**, **User**, or **Customer**. Using "Tenant" for both creates semantic ambiguity and catastrophic bugs.

---

## 2. Living Ubiquitous Language Glossary

Every project must maintain an authoritative, version-controlled **Living Ubiquitous Language Glossary** at [`docs/knowledge/ubiquitous_language.md`](../knowledge/ubiquitous_language.md).

### Structure of a Glossary Entry
Each entry must define:
- **Canonical Term**: The agreed domain name.
- **Definition**: The business meaning agreed with stakeholders.
- **Bounded Context**: The domain subsystem where this definition holds authority.
- **Forbidden Synonyms**: Banned terms that must never appear in code, schemas, or UI.
- **Code Representations**: Exact class, type, interface, and database table names.

---

## 3. Automated Enforcement & Linters

To prevent linguistic drift over time, teams must employ mechanical enforcement:

### 1. Static Analysis / Linter Rules
Configure custom linter rules (e.g. ESLint `id-denylist` or custom AST rules) to forbid banned synonyms in identifiers:
```json
{
  "rules": {
    "id-denylist": ["error", "client_user", "account_org", "raw_data_dto"]
  }
}
```

### 2. Branded Nominal Types
Prevent "Primitive Obsession" where generic strings or IDs are conflated across domain boundaries:
```typescript
export type UserId = string & { readonly __brand: unique symbol };
export type OrganizationId = string & { readonly __brand: unique symbol };
export type OrderId = string & { readonly __brand: unique symbol };

// The compiler prevents accidentally passing an OrganizationId where a UserId is required:
function assignUserToOrder(orderId: OrderId, userId: UserId): void { ... }
```

### 3. Living Executable Specifications (Gherkin BDD)
Acceptance criteria must be written strictly in Ubiquitous Language, serving as executable contracts that verify domain terminology in automated test runners.

---

## 4. Tactical Patterns & Invariants

1. **Entities**: Objects defined by identity that persists across state changes (e.g. `User`, `Order`, `Invoice`).
2. **Value Objects**: Immutable objects defined strictly by their attributes with no identity (e.g. `Money`, `DateRange`, `EmailAddress`).
3. **Aggregates & Aggregate Roots**: Clusters of domain objects treated as a single transactional consistency boundary. All mutations must pass through explicit methods on the Aggregate Root.
4. **Anti-Corruption Layer (ACL)**: When integrating with third-party APIs or legacy systems that use different terminology, translate external payloads into the internal Ubiquitous Language at the boundary adapter before they enter the domain core.

---

## 5. Invariants (DO's & DONT's)

### DO
- **DO** use identical terminology in domain conversations, PRDs, code, database schemas, and user interfaces.
- **DO** maintain an authoritative `ubiquitous_language.md` and treat it as a binding architectural contract.
- **DO** use branded nominal types for IDs to catch cross-entity domain mixups at compile time.
- **DO** translate foreign data structures at the perimeter using an Anti-Corruption Layer (ACL).

### DONT
- **DONT** use technical jargon (`dto`, `entity_row`, `table_item`) in domain business logic.
- **DONT** allow competing synonyms for the same concept within the same Bounded Context.
- **DONT** overload words with dual meanings across technical architecture and business domain.
- **DONT** rename domain terms in code without updating the living glossary and recording an ADR.
