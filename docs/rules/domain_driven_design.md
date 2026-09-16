# Domain-Driven Design (DDD) & Ubiquitous Language

> **Core Mandate:** Establish unambiguous Ubiquitous Language definitions, isolate Bounded Contexts, and separate Value Objects, Entities, and Aggregates.

---

## 1. Ubiquitous Language & Vocabulary Discipline

- **Single Meaning per Term**: Every domain concept must have one authoritative name across code, tests, documentation, and user interfaces.
- **Disallow Ambiguous Synonyms**: Never mix synonyms (e.g. using `Account`, `Company`, and `Tenant` interchangeably). Select one term and enforce it across all layers.
- **Visual Context Mapping**: Map domain entity relationships using open-source Mermaid diagrams (`erDiagram` or `flowchart TD`).

---

## 2. Bounded Contexts & Tactical Patterns

- **Bounded Contexts**: Explicitly define the boundaries of each domain subsystem (e.g. Identity & Access, Billing, Order Management, Notifications).
- **Tactical Patterns**:
  - **Entities**: Objects defined by identity that persists across state changes (e.g. `User`, `Order`).
  - **Value Objects**: Immutable objects defined strictly by their attributes with no identity (e.g. `Money`, `Address`, `EmailAddress`).
  - **Aggregates & Aggregate Roots**: Clusters of domain objects treated as a single unit for data changes (e.g. `Order` root with `OrderItem` children). All external mutations must pass through the Aggregate Root.
