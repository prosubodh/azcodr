# Pluggable Multi-Tenant Business Logic & Workflows

> **Core Mandate:** Eliminate `if-tenant` conditional branching via Strategy registries, declarative JSON rule engines, configurable statecharts, and secure WebAssembly script sandboxing.

---

## 1. Strategy Pattern & Dynamic Registry

Encapsulate diverging algorithms into discrete strategies conforming to a unified domain interface:

```typescript
export interface DiscountStrategy {
  calculateDiscount(order: { total: number }): number;
}

export class StandardDiscountStrategy implements DiscountStrategy {
  calculateDiscount(order: { total: number }): number {
    return order.total >= 500 ? order.total * 0.05 : 0;
  }
}

export class StrategyRegistry {
  private static strategies = new Map<string, DiscountStrategy>();

  static register(key: string, strategy: DiscountStrategy): void {
    this.strategies.set(key, strategy);
  }

  static resolve(key: string): DiscountStrategy {
    return this.strategies.get(key) ?? new StandardDiscountStrategy();
  }
}
```

---

## 2. Declarative Rule Engines (`json-rules-engine`)

Allow tenants or administrators to configure dynamic conditional logic stored as JSON facts and conditions without deploying code:

```typescript
import { Engine } from 'json-rules-engine';

export async function evaluateTenantApproval(
  tenantRuleDefinition: object,
  facts: { orderTotal: number; vendorTier: string }
): Promise<boolean> {
  const engine = new Engine();
  engine.addRule(tenantRuleDefinition);

  const results = await engine.run(facts);
  return results.events.length > 0;
}
```

---

## 3. Declarative Statecharts (XState)

For tenants with diverging approval or order lifecycles, configure workflows declaratively using XState:

```typescript
import { setup } from 'xstate';

export function buildTenantWorkflowMachine(config: { initial: string; states: any }) {
  return setup({
    guards: {
      isAuthorized: () => true
    }
  }).createMachine({
    id: 'tenantWorkflow',
    initial: config.initial,
    states: config.states
  });
}
```

---

## 4. Secure Script Sandboxing (QuickJS / `isolated-vm`)

Never execute untrusted tenant strings in Node.js via `eval()` or `new Function()`.
- **Execution Quotas:** Max 50ms CPU timeout, max 16MB memory limit.
- **Isolate Environment:** Zero access to `process`, `fs`, `fetch`, or database connections.
