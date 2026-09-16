# Domain Expertise, Capability Mapping & Business Invariants

> **Core Mandate:** Decompose business domains into distinct capability boundaries, enforce business invariants strictly within Aggregate Roots, and protect living Ubiquitous Language.

---

## 1. Business Capability Mapping

Structure enterprise business logic into three distinct capability tiers:
1. **Core Capabilities**: Proprietary value drivers and differentiators (e.g. specialized tenant workflow engines, dynamic pricing algorithms). Allocate 80% of architectural effort here.
2. **Supporting Capabilities**: Business functions specific to the domain but not competitive differentiators (e.g. order tracking, invoice rendering).
3. **Generic Capabilities**: Standard commoditized software (e.g. authentication, audit logging, email transport). Rely exclusively on standard open-source libraries.

---

## 2. Invariant Protection within Aggregate Roots

- **Zero Anemic Domain Models**: Domain entities must encapsulate state and validation. Do not expose public setters that allow outside code to corrupt business rules.
- **Aggregate Root Gatekeeper**: All mutations that modify entity state or related child entities must pass through explicit methods on the Aggregate Root that assert invariants before committing state:
  ```typescript
  export class OrderAggregate {
    private constructor(private order: OrderState) {}

    submit(): Result<void, DomainError> {
      if (this.order.items.length === 0) {
        return err(new DomainError('Cannot submit empty order'));
      }
      if (this.order.status !== 'DRAFT') {
        return err(new DomainError('Order already submitted'));
      }
      this.order.status = 'SUBMITTED';
      return ok(undefined);
    }
  }
  ```

---

## 3. Living Ubiquitous Language Dictionary

- Maintain strict terminology discipline across models, database tables, API schemas, and frontend labels.
- When domain experts or users establish a term, document it immediately and eliminate all competing synonyms across the codebase.
