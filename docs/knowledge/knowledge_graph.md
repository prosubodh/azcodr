# System Knowledge Graph & Architectural Topology

> **Core Purpose:** High-density, token-efficient knowledge representation of the workspace architecture, data topologies, and subsystem boundaries, eliminating repetitive discovery prompts.

---

## 1. Universal Hexagonal Architectural Subsystems

```mermaid
flowchart TD
  subgraph Ingress["Client & Primary Ingress Adapters"]
    UI["Multi-Platform Client (Web / Mobile / Desktop SDUI)"]
    Gateway["Ingress Gateway / Envoy (REST / gRPC / SSE)"]
    BrokerIn["Message Consumer (Kafka / NATS / RabbitMQ)"]
  end

  subgraph Core["Pure Invariant Domain Core (Hexagonal Ports)"]
    direction TB
    TenantContext["Multi-Tenant Context Resolver Port"]
    AuthPort["Authentication & Identity Port"]
    AuthzPort["Authorization & Policy Port"]
    DomainServices["Domain Services & Aggregate Roots"]
    RulePort["Dynamic Rule Engine Port (CEL / Wasm)"]
    WorkflowPort["Workflow Orchestration Port (Temporal / BPMN)"]
    OutboxPort["Transactional Outbox Port"]
    CachePort["Cache & Distributed Lock Port"]
    RepoPort["Universal Repository Port"]
  end

  subgraph Egress["Secondary / Egress Polyglot Adapters"]
    Storage["Relational & NoSQL Storage (Postgres / MySQL / Cockroach / Mongo)"]
    CacheStore["In-Memory Store (Redis / Valkey / Dragonfly / Memcached)"]
    BrokerOut["Event Streaming (Kafka / NATS / RabbitMQ / CloudEvents)"]
    AuthEngines["Policy-as-Code (OPA Rego / OpenFGA ReBAC / Cerbos)"]
    SMTP["Transactional Email Gateway (SMTP / Providers)"]
  end

  UI --> Gateway
  Gateway --> TenantContext
  BrokerIn --> DomainServices
  TenantContext --> AuthPort
  AuthPort --> AuthzPort
  AuthzPort --> DomainServices
  DomainServices --> RulePort
  DomainServices --> WorkflowPort
  DomainServices --> OutboxPort
  DomainServices --> CachePort
  DomainServices --> RepoPort

  RepoPort --> Storage
  OutboxPort --> Storage
  OutboxPort --> BrokerOut
  CachePort --> CacheStore
  AuthzPort --> AuthEngines
  DomainServices --> SMTP
```

---

## 2. Multi-Tenant Data Isolation & Schema Graph

```mermaid
erDiagram
  TENANT ||--o{ USER : "owns"
  TENANT ||--o{ ROLE : "defines"
  TENANT ||--o{ TENANT_SCHEMA : "configures"
  TENANT ||--o{ TENANT_ENTITY : "defines"
  TENANT_ENTITY ||--o{ TENANT_RECORD : "stores"
  TENANT ||--o{ OUTBOX_EVENT : "emits"
  TENANT ||--o{ AUDIT_LOG : "records"

  TENANT {
    uuid id PK
    string slug UK
    string name
    string subscription_tier
    string status
    json theme_tokens
    timestamptz created_at
  }

  USER {
    uuid id PK
    uuid tenant_id FK
    string email UK
    string password_hash
    boolean mfa_enabled
    timestamptz created_at
  }

  TENANT_SCHEMA {
    uuid id PK
    uuid tenant_id FK
    string entity_name
    json json_schema
    int version
  }

  OUTBOX_EVENT {
    uuid id PK
    uuid tenant_id FK
    string aggregate_type
    string aggregate_id
    string event_type
    json payload
    string status
    timestamptz created_at
  }
```

---

## 3. Subsystem Fast Lookup Index

| Capability | Invariant Contract / Open Standard | Swappable Polyglot Adapters | Governing Rule |
|---|---|---|---|
| **Runtime & Language** | Hexagonal Core (Zero Deps) | Polyglot (Go, Rust, Python, Java, TypeScript) | [`clean_code.md`](../rules/clean_code.md) |
| **Type Safety** | Sound static types & branded primitives | Rust, TypeScript, Go, Python (type hints) | [`typescript.md`](../rules/typescript.md) |
| **Persistence / DAL** | Abstract Repository & Unit of Work | Atlas / Flyway migrations; SQL & NoSQL drivers | [`database_transactions.md`](../rules/database_transactions.md) |
| **Tenant Isolation** | 4 Models (AST Interceptor, Schema, DB, Proxy) | SQL AST parser, RLS, multi-pool router, Envoy | [`multitenancy_isolation.md`](../rules/multitenancy_isolation.md) |
| **Dynamic Schemas** | JSON Schema Draft 2020-12 | Polyglot validators (`valico`, `gojsonschema`, `ajv`) | [`tenant_dynamic_schemas.md`](../rules/tenant_dynamic_schemas.md) |
| **Authentication** | OIDC, OAuth 2.1, Passkeys (WebAuthn) | PASETO, JWT with JWKS, SPIFFE/SPIRE mTLS | [`authentication.md`](../rules/authentication.md) |
| **Authorization** | Policy-as-Code & ReBAC | OPA (Rego/Wasm), OpenFGA (Zanzibar), Cerbos | [`authorization.md`](../rules/authorization.md) |
| **Pluggable Logic** | Common Expression Language (CEL) / Wasm | `cel-go`, `cel-rust`, Extism (Wasm plugins) | [`tenant_pluggable_logic.md`](../rules/tenant_pluggable_logic.md) |
| **Workflows** | Durable Orchestration & Statecharts | Temporal.io SDKs, Camunda/Zeebe (BPMN 2.0) | [`tenant_pluggable_logic.md`](../rules/tenant_pluggable_logic.md) |
| **Caching** | Abstract Cache Port with XFetch | Redis, Valkey, Dragonfly, Memcached, Local LRU | [`caching.md`](../rules/caching.md) |
| **Feature Flags** | OpenFeature Standard | Flipt, Unleash, LaunchDarkly, GoFeatureFlag | [`feature_flags.md`](../rules/feature_flags.md) |
| **Testing** | Outside-In TDD, BDD & Consumer Contracts | Cucumber/Gherkin, Pact, Schemathesis | [`test_driven_development.md`](../rules/test_driven_development.md) |
| **Presentation / SDUI** | Declarative JSON SDUI + DTCG Tokens | Web (React/Vue/Svelte), Mobile (Flutter/Native) | [`server_driven_ui.md`](../rules/server_driven_ui.md) |
| **Transactional Email** | Declarative Email Specs / MJML | SMTP Gateway, Mailpit (Local), SES/Sendgrid | [`transactional_email.md`](../rules/transactional_email.md) |
| **Event Streaming** | CNCF CloudEvents v1.0.2 | Kafka, NATS JetStream, RabbitMQ, SQS | [`database_transactions.md`](../rules/database_transactions.md) |
| **Observability** | OpenTelemetry OTLP standard | OTel Collector, Jaeger, Prometheus, OpenSearch | [`cloud_native.md`](../rules/cloud_native.md) |

