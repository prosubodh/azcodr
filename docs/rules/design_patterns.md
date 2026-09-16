# Modern Design Patterns & Result Pattern

> **Core Mandate:** Enforce composition over inheritance, wrap third-party boundaries in project-owned adapters, and model domain errors with explicit Result types instead of untyped exceptions.

---

## 1. Structural & Creational Patterns

- **Adapter Pattern (Crucial Boundary)**: Wrap all 3rd-party libraries, SDKs, or external services in project-owned adapter interfaces. *Rule: Only mock types you own.*
- **Factory Method**: Encapsulate complex collaborator instantiation (e.g. tenant-specific payment gateways or notification dispatchers) behind factory functions.
- **Facade Pattern**: Expose a unified, simplified interface to complex underlying multi-service subsystems.
- **Decorator / Middleware**: Compose cross-cutting concerns (logging, authentication, tenant resolution, rate-limiting) via middleware chains.

---

## 2. Behavioral Patterns & Domain Errors

- **Strategy Pattern**: Swap algorithms or execution behavior at runtime (e.g. tenant-specific discount strategies, notification transports).
- **Result / Either Pattern**: Model anticipated domain errors as explicit return values (`Result<T, E>`) rather than throwing untyped exceptions across architectural boundaries:

```typescript
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ success: true, data });
export const err = <E>(error: E): Result<never, E> => ({ success: false, error });
```

---

## 3. GoF 23 Patterns Catalog

For production TypeScript implementations of all 23 Gang of Four patterns, consult [docs/rules/gof_design_patterns_reference.md](./gof_design_patterns_reference.md).
