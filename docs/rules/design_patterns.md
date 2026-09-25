# Modern Design Patterns & Result Pattern

> **Core Mandate:** Enforce composition over inheritance, wrap third-party boundaries in project-owned adapters, and model domain errors with explicit Result types instead of untyped exceptions.

---

## 1. Structural & Creational Patterns

- **Adapter Pattern (Hexagonal Boundary)**: Wrap all external libraries, database drivers, cloud SDKs, and third-party APIs in project-owned adapter interfaces. *Rule: Only mock types you own.*
- **Factory Method**: Encapsulate complex collaborator instantiation (e.g. tenant-specific payment gateways or notification dispatchers) behind factory functions.
- **Facade Pattern**: Expose a unified, simplified interface to complex underlying multi-service subsystems.
- **Decorator / Middleware**: Compose cross-cutting concerns (observability, authentication, tenant context resolution, rate limiting) via middleware pipelines.
- **Dependency Injection & Composition Hygiene**: Application factories (`createApp(deps)`) must accept an explicit composite container (`AppDependencies`). Never provide silent default fallback instances inside factories that instantiate disconnected repositories or services when partial dependencies are passed (the Split-Brain Anti-Pattern). Assemble the full dependency graph explicitly at the composition root.

---

## 2. Behavioral Patterns & Explicit Result Types

- **Strategy Pattern**: Swap algorithms or execution behavior at runtime without code changes (e.g. tenant-specific pricing algorithms, shipping calculation strategies).
- **Result / Either Pattern**: Model anticipated domain errors as explicit return values (`Result<T, E>`) rather than throwing untyped exceptions across architectural boundaries:

```
┌────────────────────────────────────────────────────────┐
│ Universal Result Pattern Semantics                     │
├────────────────────────────────────────────────────────┤
│ Result<T, E> = Ok(T) | Err(E)                          │
│                                                        │
│ Rust:       Result<T, DomainError>                     │
│ Go:         (T, error)                                 │
│ TypeScript: type Result<T, E> = Ok<T> | Err<E>         │
│ Python:     Union[Success[T], Failure[E]]              │
└────────────────────────────────────────────────────────┘
```

Domain services must return explicit Result types, compelling callers to handle failure branches deterministically.

---

## 3. GoF 23 Patterns Catalog

For reference implementations of all 23 Gang of Four patterns across OOP and functional paradigms, consult [docs/rules/gof_design_patterns_reference.md](./gof_design_patterns_reference.md).
