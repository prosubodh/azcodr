# Static Type Safety & Sound Type Systems

> **Core Mandate:** Enforce maximum compiler strictness, branded nominal typing for domain identifiers, strict prohibition of untyped escape hatches, and automated pre-commit quality guardrails across polyglot implementations.

---

## 1. Maximum Compiler Strictness & Soundness

Regardless of the execution language chosen for an adapter or service, enforce maximum compiler rigor to eliminate runtime null pointer exceptions, unhandled type cases, and memory errors at compile time:

- **TypeScript**: Enable all strict compiler flags (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`).
- **Rust**: Enable `#![deny(clippy::all)]` and `#![deny(missing_docs)]` with zero `unsafe` blocks.
- **Go**: Enable comprehensive static analysis (`golangci-lint` with `errcheck`, `govet`, `staticcheck`).
- **Python**: Enforce strict type checking (`mypy --strict` or `pyright`).

---

## 2. Branded Nominal Typing & Primitive Obsession Elimination

Prevent accidental mixing of raw primitive identifiers (e.g. passing an arbitrary `string` representing a `TenantId` where a `UserId` is expected) by enforcing nominal types:

```
┌────────────────────────────────────────────────────────┐
│ Nominal Domain Identifier Pattern (Polyglot)           │
├────────────────────────────────────────────────────────┤
│ Rust:       struct TenantId(String);                   │
│             struct UserId(String);                     │
│ Go:         type TenantId string                       │
│             type UserId string                         │
│ TypeScript: type TenantId = Brand<string, 'TenantId'>; │
│             type UserId = Brand<string, 'UserId'>;     │
│ Python:     TenantId = NewType('TenantId', str)        │
│             UserId = NewType('UserId', str)            │
└────────────────────────────────────────────────────────┘
```

Domain functions must accept and return branded types rather than raw primitive strings or integers.

---

## 3. Strict Prohibition of Untyped Escape Hatches

- **Zero Tolerance for Unsound Types**: Strictly prohibit `any` in TypeScript, raw `interface{}` / `any` without type assertion checks in Go, raw `Any` in Python, or unchecked casts in Java/Rust.
- **Runtime Validation at Boundaries**: External payloads (network requests, message queues, disk files) must be parsed and narrowed into strongly-typed domain structures before passing to application services.
- **Commit Guardrails**: Enforce Conventional Commits via commit linters. Never bypass pre-commit hooks running static type checking, formatting, and linters.

---

## 4. Module Path Aliases & Relative Traversal Elimination

- **Path Alias Mandate (`@/*`)**: All TypeScript packages in the workspace must configure and standardize on `@/*` mapped to `./src/*` across `tsconfig.json` (`"baseUrl": "."`, `"paths": { "@/*": ["./src/*"] }`), bundlers (Vite `resolve.alias`), and test runners (Vitest `resolve.alias`).
- **Strict Prohibition of Deep Relative Traversal**: Never use deep relative traversals (`../../../..`, `../../..`, `../..`) across layers or contexts. Deep relative paths create fragile coupling, impair refactoring, and obscure domain layer boundaries.
- **Node.js ESM Production Resolution**: In backend environments executing compiled JavaScript under Node.js ESM (`node dist/index.js`), use `tsc-alias` post-compilation (`tsc && tsc-alias`) to resolve path aliases in `dist/` to valid relative paths without introducing runtime loader overhead.
- **Scope of Sibling Imports**: Local relative imports (`./file.js`) are permitted only for immediate siblings within the identical directory. Any import traversing up a directory hierarchy or crossing architectural boundaries (domain, ports, adapters, components, context) MUST resolve via `@/*`.

