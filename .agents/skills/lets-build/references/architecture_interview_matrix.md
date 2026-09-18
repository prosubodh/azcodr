# Architectural Interview Matrix: 18 Systemic Dimensions

> **Core Purpose:** The exhaustive, relentless question bank executed during `/lets-build` to eliminate all assumptions and finalize technical choices across all architectural domains.

---

## Dimension 1: Domain & Performance Requirements
- **Business Domain:** What is the core business problem being solved (e.g. Fintech, Healthcare, E-Commerce, Logistics, SaaS)?
- **Scale & Throughput:** What are the expected peak requests-per-second (RPS) and concurrent active tenants/users?
- **Latency Budget:** What are the target p95 and p99 response latency limits (e.g. < 20ms, < 100ms)?
- **Regulatory Frameworks:** Must the system comply with SOC 2 Type II, ISO/IEC 27001, HIPAA, PCI-DSS, or GDPR?

---

## Dimension 2: Primary Programming Language & Runtime
- **Language Selection:** Which language will power the backend core services?
  - Options: Go, Rust, Python, TypeScript / Node.js, Java / Kotlin, C# (.NET), Elixir, Zig, or Polyglot microservices?
- **Rationale & Trade-offs:** Memory safety, garbage collection overhead, concurrency model, developer velocity, or ecosystem libraries?

---

## Dimension 3: Package Manager, Build Tools & Toolchain
- **Package Manager:**
  - Go: `go modules` (`go.mod`)
  - Rust: `cargo`
  - Python: `uv`, `poetry`, or `pip` / `pdm`
  - TypeScript: `pnpm`, `npm`, or `yarn`
  - Java: `gradle` or `maven`
  - C#: `dotnet CLI` / NuGet
- **Task Runner / Monorepo Tooling:** Makefiles, Taskfile, Earthly, Bazel, or language-native build scripts?
- **Linters & Formatters:** Language-native strict linters (e.g. `golangci-lint`, `clippy`, `ruff`, `eslint`/`biome`, `spotless`)?

---

## Dimension 4: API, Network & Transport Protocols
- **Primary Transport:**
  - REST / JSON (OpenAPI 3.1)
  - gRPC / Protocol Buffers (proto3) via `buf`
  - GraphQL (Schema-First SDL)
  - Event-Driven / WebSockets / Server-Sent Events (SSE)
- **Ingress Gateway / Reverse Proxy:** Envoy Proxy, Traefik, Nginx, or Cloud-Native API Gateway?

---

## Dimension 5: Web & Transport Framework
- **Framework Choice:**
  - Go: `gin`, `chi`, `echo`, or `fiber`
  - Rust: `axum` or `actix-web`
  - Python: `fastapi` or `litestar`
  - TypeScript: `fastify` or `express`
  - Java/Kotlin: Spring Boot 3, Quarkus, or Micronaut
  - C#: ASP.NET Core Minimal APIs

---

## Dimension 6: Database & Persistence Engine
- **Primary Storage Engine:**
  - Relational: PostgreSQL, MySQL / MariaDB, SQLite, CockroachDB, or TiDB
  - Document / NoSQL: MongoDB, DynamoDB, or Cassandra
  - Multi-Model / Hybrid: Relational core with document extension
- **Persistence Pattern:** Repository Pattern with raw SQL / query builders (e.g. `sqlx`, `pgx`, `Kysely`, `jOOQ`) vs ORM (e.g. SQLAlchemy, GORM, Hibernate)?

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
- **Frontend Architecture:**
  - Web: React, Vue, Svelte, Solid, Angular, or Web Components?
  - Mobile: Flutter, React Native, iOS SwiftUI, or Android Jetpack Compose?
  - Hypermedia / SSR: HTMX / HTML-over-the-wire?
  - Server-Driven UI (SDUI): Declarative JSON layout schemas rendered by client registries?
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
