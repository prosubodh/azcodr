# Comprehensive Architecture Interview Matrix

> **Source of Truth:** Exhaustive taxonomy across 20 architectural dimensions to interrogate before bootstrapping any enterprise project.

---

## Dimension 0: Project Baseline Archetype & Domain Variant Profile
- **Architecture Profile:**
  - **Generic Clean Baseline:** 100% domain-agnostic Hexagonal chassis with standard archetypes (`Entity`, `Aggregate`, `Resource`).
  - **Domain Variant Profiles (`variants/`):** Pre-configured domain Ubiquitous Language, entity models, and specialized invariants:
    - `variants/property-management/`: Multi-tenant property, unit, lease, renter, and ledger archetypes.
    - Custom / User-Defined Variant: Author a new profile under `variants/<name>/`.

---

## Dimension 1: Architectural Paradigm & Monolith-to-Service Boundary
- **System Topology:** Modular Monolith (Modulith), Event-Driven Architecture (EDA), Service-Oriented (SOA), or Microservices?
- **Domain Decoupling:** Hexagonal Ports & Adapters, Clean Architecture, Onion Architecture, or Pragmatic Layered?
- **Language Bias:** Zero language bias; pure business domain core decoupled from infrastructure adapters.

---

## Dimension 2: Core Programming Languages & Runtimes
- **Primary Languages:**
  - Systems / High-Performance: Rust, Go, or C++23
  - Enterprise / JVM: Java 21+ (Loom virtual threads) or Kotlin
  - Web / Full-Stack: TypeScript (Node.js / Bun)
  - Data / ML / Scripting: Python 3.12+ or Elixir (BEAM concurrency)
- **Language Invariants:** Strict static sound typing; zero unhandled exceptions at domain boundaries.

---

## Dimension 3: Package Managers, Workspaces & Monorepo Tooling
- **Package Manager:**
  - Node/TS: `pnpm` (with strict isolated node_modules), `bun`, or `yarn` (Berry)
  - Rust: `cargo` (with cargo workspaces)
  - Go: Go Modules (with multi-module workspaces)
  - Python: `uv`, `poetry`, or `pixi`
- **Monorepo Build Orchestration:** Turborepo, Nx, or Bazel/Buck2 with remote caching?

---

## Dimension 4: Containerization, Base OS & Cloud-Native Runtime
- **Container Strategy:**
  - Zero-cve distroless (`gcr.io/distroless/*`) or `scratch` base images?
  - Rootless container execution (`USER nonroot:nonroot`)?
  - Multi-stage Dockerfiles with build caching?
- **Cloud-Native Invariants:** 12-Factor (2026 Edition); stateless runtime isolates; graceful `SIGTERM` draining.

---

## Dimension 5: API Protocols, Transports & Network Contracts
- **Primary Transport:**
  - RESTful HTTP/JSON (RFC 7807 problem details + OpenAPI 3.1)
  - gRPC / Protocol Buffers (v3 / Buf CLI)
  - GraphQL (Apollo / GraphQL-Yoga with code-first or schema-first SDL)
  - WebSockets / Server-Sent Events (SSE) for real-time push
- **API Versioning Strategy:** URI Path (`/v1/`), Request Header, or Media Type negotiation?

---

## Dimension 6: Database & Persistence Engine
- **Primary Storage Engine:**
  - Relational: PostgreSQL, MySQL / MariaDB, SQLite, CockroachDB, or TiDB
  - Document / NoSQL: MongoDB, DynamoDB, or Cassandra
  - Multi-Model / Hybrid: Relational core with document extension
- **Persistence Pattern:** Repository Pattern with raw SQL / query builders (e.g. `sqlx`, `pgx`, `Kysely`, `jOOQ`) vs ORM (e.g. Prisma, SQLAlchemy, GORM, Hibernate)?
- **Mandatory Universal Audit Columns:**
  - Standardize on **The Canonical 6 Total Audit Fields** (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`) across all mutable relational entities?
  - Strictly immutable append-only ledgers (`createdAt`, `createdBy` only; updates/deletions prohibited)?

---

## Dimension 7: Database Migration & Schema Evolution
- **Migration Engine:** Declarative schema management (**Atlas**), versioned SQL migrations (**Flyway**, **Liquibase**, **Goose**, or **Bytebase**)?
- **Zero-Downtime Expand-Contract:** Does the project commit to the 5-phase expand-contract deployment lifecycle?

---

## Dimension 8: Multi-Tenancy Data Isolation Model
- **Isolation Strategy:**
  1. **Model A: Universal AST Query Interceptor** (Tenant column + automatic SQL/query AST rewriting)
  2. **Model B: Database Row-Level Security (RLS)** (Session-scoped `set_config` / session variables)
  3. **Model C: Schema-per-Tenant** (Dedicated database schema namespace per tenant)
  4. **Model D: Database-per-Tenant** (Physical instance routing via connection pool manager)
  5. **Model E: Storage Proxy** (Envoy / ProxySQL / Vitess)

---

## Dimension 9: Dynamic Schemas & Extensible Entities
- **Dynamic Field Storage:** Semi-structured JSON column with **JSON Schema Draft 2020-12** validation vs Entity-Attribute-Value (EAV) vs Virtual Column projection?
- **Meta-Schema Virtual Entities:** Will tenants define completely custom entities at runtime without code deployments?

---

## Dimension 10: Pluggable Business Logic & Workflows
- **Dynamic Rules:** Google's **Common Expression Language (CEL)** vs JSON Logic vs Strategy Registries?
- **Workflow Orchestration:** **Temporal.io** durable execution vs **Camunda 8 / Zeebe (BPMN 2.0)** vs state machine libraries?
- **Sandboxed Scripting:** **WebAssembly (Extism / Wasmtime)** micro-sandboxes vs isolated interpreters?

---

## Dimension 11: Authentication & Identity
- **Protocols:** OpenID Connect (OIDC), OAuth 2.1 with PKCE, SAML 2.0 federation, or local credentials?
- **Passkeys / Passwordless:** W3C / FIDO2 WebAuthn passkey support?
- **Token Format:** PASETO (Platform-Agnostic Security Tokens) vs RFC 7519 JWT with JWKS asymmetric key rotation?
- **Token Rotation:** Cryptographic Refresh Token Rotation (RTR) with family invalidation on replay detection?

---

## Dimension 12: Authorization & Policy-as-Code
- **Policy Engine:**
  - **Open Policy Agent (OPA)** (Rego language via REST/gRPC or embedded `.wasm` module)
  - **OpenFGA** (Google Zanzibar Relationship-Based Access Control - ReBAC)
  - **Cerbos** (Stateless policy-as-code)
  - Application-level RBAC / ABAC guard wrappers

---

## Dimension 13: Presentation, Client & Server-Driven UI (SDUI)
- **Frontend Framework & Architecture:**
  - Web: React, Vue, Svelte, Solid, Angular, or Web Components?
  - Mobile: Flutter, React Native, iOS SwiftUI, or Android Jetpack Compose?
  - Hypermedia / SSR: HTMX / HTML-over-the-wire?
  - Server-Driven UI (SDUI): Declarative JSON layout schemas rendered by client registries?
- **UI Component Primitives & Styling:**
  - Standardize on `shadcn/ui` with `@radix-ui` headless primitives + Tailwind CSS?
  - Accessible dialogs, focus trapping, and zero native alerts per `accessibility.md`?
- **Server-State Caching & Data Synchronization:**
  - **TanStack Query (`@tanstack/react-query`)** with query keys, stale-while-revalidate, and automatic mutation invalidation vs SWR vs raw fetch?
- **Form State Management & Validation:**
  - **React Hook Form (`react-hook-form` + `@hookform/resolvers/zod`)** or **TanStack Form (`@tanstack/react-form`)** with **Zod** schema contracts?
- **Data Grids & Table Virtualization:**
  - **TanStack Table (`@tanstack/react-table`)** for headless sorting, filtering, and pagination?
- **Client Stores & Global State:**
  - **Zustand** vs Jotai vs Redux Toolkit for shared client-only state?
- **Design Tokens:** W3C Design Tokens Community Group (DTCG) `tokens.json` processed via Style Dictionary?

---

## Dimension 14: Caching, Distributed Locks & Session State
- **Caching Engine:** Redis, Valkey, Dragonfly, KeyDB, Memcached, or local in-memory LRU?
- **Cache Pattern:** Cache-Aside with jittered TTLs, XFetch probabilistic stampede defense, and event-driven invalidation?
- **Distributed Locks:** Redis Redlock / atomic SETNX with bounded TTLs?

---

## Dimension 15: Distributed Messaging & Event Streaming
- **Message Broker:** Apache Kafka / Redpanda, NATS JetStream, RabbitMQ, AWS SQS, or Redis Streams?
- **Event Specification:** CNCF CloudEvents v1.0.2 format?
- **Transactional Outbox:** Polling relay (`FOR UPDATE SKIP LOCKED`) or Change Data Capture (CDC via Debezium)?

---

## Dimension 16: Observability, Telemetry & Logging
- **Standard:** 100% CNCF OpenTelemetry (OTel) with OTLP export over gRPC/HTTP?
- **Tracing:** W3C Trace Context (`traceparent`, `tracestate`)?
- **Logging Format:** Structured JSON conforming to Elastic Common Schema (ECS) or OpenTelemetry Resource Schema?

---

## Dimension 17: DevSecOps, Supply Chain & Security
- **SAST:** Polyglot Semgrep rules for security and code quality?
- **Secret Detection:** Pre-commit Gitleaks or Secretlint hooks?
- **Vulnerability Scanning:** Trivy container and lockfile scanning in CI?
- **SBOM & Provenance:** Syft CycloneDX 1.6 SBOM generation and Cosign artifact signing?

---

## Dimension 18: Testing & Verification Strategy
- **TDD Methodology:** Outside-In TDD (London School) double loop?
- **BDD Acceptance:** Executable Cucumber / Gherkin `.feature` criteria?
- **Contract Testing:** Consumer-Driven Contract testing via Pact?
- **Property-Based Testing:** Schemathesis OpenAPI / GraphQL automated fuzzing?
- **Coverage Gate:** Mandatory 100.00% coverage thresholds across all suites?

---

## Dimension 19: State Machines, Workflows & Lifecycle Configurability
- **State Taxonomy & Invariant Separation:**
  - **Core Invariant States (Hard FSM):** Enforced strictly inside compiled Domain Aggregate Roots? (Financial/legal integrity states like `SETTLED`, `CANCELLED` cannot be user-rewritten).
  - **Operational Workflow Stages (Soft FSM):** Tenant-configurable review funnels, approval tiers, or sub-statuses managed via Declarative State Transition Matrices?
- **Transition Guards & Rule Evaluation:**
  - Standardize on Common Expression Language (CEL) or embedded Wasm sandboxing for tenant-defined guards?
- **Workflow Orchestration:**
  - Durable workflow engine (Temporal.io, Camunda 8 / Zeebe BPMN 2.0) for multi-step distributed sagas?
- **Transition Audit Trail:**
  - Mandatory append-only state transition log (`transitionId`, `entityType`, `entityId`, `fromState`, `toState`, `event`, `actorId`, `createdAt`)?

---

## Dimension 20: Ubiquitous Language & Domain-Code Agreement
- **Living Glossary:** Authoritative `docs/knowledge/ubiquitous_language.md` mapping domain terms, business definitions, and exact code identifiers?
- **Linguistic Drift Defenses:**
  - Mechanical AST / Linter rules (ESLint `id-denylist`) prohibiting banned synonyms?
  - Branded nominal types (`type UserId = string & { readonly __brand: unique symbol }`) preventing primitive obsession and cross-domain identifier confusion?
- **Anti-Corruption Layer (ACL):** Adapters at system perimeters converting external vendor terminology into the canonical Ubiquitous Language?
