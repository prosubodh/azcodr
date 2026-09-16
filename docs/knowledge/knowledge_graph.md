# System Knowledge Graph & Architectural Topology

> **Core Purpose:** High-density, token-efficient knowledge representation of the workspace architecture, data topologies, and subsystem boundaries, eliminating repetitive discovery prompts.

---

## 1. Architectural Subsystems Knowledge Graph

```mermaid
flowchart TD
  subgraph Client["Client Tier"]
    UI["Web Frontend (Radix UI / Tailwind)"]
    SDUI["Server-Driven UI Engine"]
    State["URL State Sync (useSearchParams)"]
  end

  subgraph Gateway["Network & Edge Tier"]
    Nginx["Nginx Reverse Proxy Gateway (Port 80)"]
    RateLimit["Redis Token Bucket Rate Limiter"]
    WAF["Security Headers & CORS Guard"]
  end

  subgraph App["Application Tier (Node 24 / TypeScript)"]
    Auth["Auth Subsystem (JWT / RTR / WebAuthn)"]
    CASL["Authorization Engine (CASL / OPA)"]
    Tenant["Multi-Tenant Context Resolver"]
    Domain["Domain Services & Aggregates"]
    XState["Workflow Engine (XState Statecharts)"]
    Rules["Rule Engine (json-rules-engine)"]
    Outbox["Transactional Outbox Publisher"]
  end

  subgraph Storage["Persistence Tier"]
    Postgres["PostgreSQL 16 (RLS + Partitioning + JSONB)"]
    Redis["Redis 7 (Cache-Aside + Rate Limiting)"]
    Mailpit["Mailpit (Local SMTP 1025 / UI 8025)"]
  end

  UI --> Nginx
  SDUI --> Nginx
  Nginx --> RateLimit
  RateLimit --> Tenant
  Tenant --> Auth
  Auth --> CASL
  CASL --> Domain
  Domain --> XState
  Domain --> Rules
  Domain --> Postgres
  Domain --> Redis
  Domain --> Outbox
  Outbox --> Postgres
  Domain --> Mailpit
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
    jsonb theme_tokens
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
    jsonb json_schema
    int version
  }

  OUTBOX_EVENT {
    uuid id PK
    uuid tenant_id FK
    string aggregate_type
    string aggregate_id
    string event_type
    jsonb payload
    string status
    timestamptz created_at
  }
```

---

## 3. Subsystem Fast Lookup Index

| Capability | Primary Technology | Configuration Location | Governing Rule |
|---|---|---|---|
| **Runtime** | Node.js 24 / npm 11 | `package.json`, `.nvmrc` | [`typescript.md`](../rules/typescript.md) |
| **ORM / Database** | Prisma / PostgreSQL 16 | `prisma/schema.prisma` | [`database_transactions.md`](../rules/database_transactions.md) |
| **Tenant Isolation** | PostgreSQL Row-Level Security | Prisma Extension | [`multitenancy_isolation.md`](../rules/multitenancy_isolation.md) |
| **Dynamic Schemas** | JSONB + ajv validation | Dynamic Schema tables | [`tenant_dynamic_schemas.md`](../rules/tenant_dynamic_schemas.md) |
| **Authentication** | Access Token + Cookie RTR | In-memory + HttpOnly | [`authentication.md`](../rules/authentication.md) |
| **Authorization** | CASL / OPA Rego | Server Route Guards | [`authorization.md`](../rules/authorization.md) |
| **Caching** | Redis Cache-Aside | Redis Client wrapper | [`caching.md`](../rules/caching.md) |
| **Feature Flags** | OpenFeature + Flipt | Provider configuration | [`feature_flags.md`](../rules/feature_flags.md) |
| **Testing** | Vitest / Playwright / Supertest | `vitest.config.ts` | [`test_driven_development.md`](../rules/test_driven_development.md) |
| **UI Primitives** | Radix UI + Tailwind | Component Registry | [`accessibility.md`](../rules/accessibility.md) |
| **Email** | React Email + Mailpit | `@mvp/emails` | [`transactional_email.md`](../rules/transactional_email.md) |
