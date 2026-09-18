# Pluggable Multi-Tenant Business Logic & Workflows

> **Core Mandate:** Eliminate `if-tenant` conditional branching via Strategy registries, Common Expression Language (CEL), durable workflow orchestration, and secure WebAssembly (Wasm) micro-sandboxes.

---

## 1. Strategy Pattern & Dynamic Strategy Registry

Encapsulate diverging tenant algorithms into discrete strategies conforming to a unified domain port:

```
┌────────────────────────────────────────────────────────┐
│ Discount Strategy Port Contract                        │
├────────────────────────────────────────────────────────┤
│ calculateDiscount(order): Decimal                      │
└────────────────────────────────────────────────────────┘
```

The application maintains an in-memory Strategy Registry resolving the active strategy based on `tenant.subscriptionTier` or custom tenant config:

```
StrategyRegistry.register("standard", StandardDiscountStrategy)
StrategyRegistry.register("enterprise_vip", HighVolumeTierStrategy)

strategy = StrategyRegistry.resolve(tenant.discountStrategyKey)
discount = strategy.calculateDiscount(order)
```

---

## 2. Declarative Rule Evaluation: Common Expression Language (CEL)

Allow tenants or administrators to configure dynamic conditional logic stored as declarative text or JSON without redeploying binaries. Standardize on **Common Expression Language (CEL)**:

```cel
// Example Tenant Rule Expression:
order.total >= 500 && order.shipping_country == "US" && tenant.tier == "ENTERPRISE"
```

- **Memory-Safe & Non-Turing Complete**: Prevents infinite loops, recursion crashes, and side-effects.
- **Polyglot Portability**: Native compilers and runtimes available across Go (`cel-go`), Rust (`cel-rust`), Python (`cel-python`), Java (`cel-java`), and TypeScript (`cel-js`).

---

## 3. Durable Workflows & Orchestration (Temporal / BPMN 2.0)

For tenants with diverging multi-step approval, fulfillment, or refund lifecycles:
- **Durable Execution Engines**: Standardize on **Temporal.io** or **Camunda 8 / Zeebe (BPMN 2.0)**.
- **Resilience Guarantees**: Workflows automatically persist state across node crashes, manage timeouts, execute automatic retries, and trigger compensation transactions (Saga pattern) across polyglot workers.
- **Tenant Workflow Selection**: The domain routes entity state transitions to tenant-specific workflow IDs configured in database metadata.

---

## 4. Secure Script Sandboxing: WebAssembly (Wasm / Extism)

Never execute untrusted tenant strings via host runtime evaluation (`eval()`, dynamic reflection, or unshielded isolates).
- **Universal Sandboxing with Extism / Wasmtime**: Tenants compile custom logic (in Rust, Go, Python, or TypeScript) to portable `.wasm` bytecode.
- **Strict Execution Quotas**: Max 50ms CPU execution budget, max 16MB linear memory boundary.
- **Complete Host Isolation**: Sandboxed instances possess zero access to host filesystem, network sockets, environment variables, or database connections unless explicitly passed via memory interfaces.
