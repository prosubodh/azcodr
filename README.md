# MVP: Enterprise Multi-Tenant Architecture & Agentic Engineering

> **Production-ready, battle-tested multi-tenant enterprise architecture governed by strict systemic atomicity, 100% open-source standards, universal technology and language agnosticism, progressive disclosure agentic directives, and zero-downtime database patterns.**

---

## 🌟 Architectural Pillars

1. **Systemic Atomicity**: Every rule, skill, database transaction, and code unit adheres to the Single Responsibility Principle (SRP)—indivisible, self-contained, orthogonal, and composable with zero conjunction naming.
2. **Universal Technology & Stack Agnosticism**: Core business capabilities adhere strictly to Hexagonal (Ports & Adapters) architecture with zero runtime, language, or vendor lock-in. Runtimes, databases, and transports connect via interchangeable polyglot adapters with zero primary language bias.
3. **100% Open-Source & Open Standards**: Standardized exclusively on open-source solutions and vendor-neutral specifications (OpenTelemetry, OPA, OpenFGA, Protocol Buffers, OpenAPI 3.1, JSON Schema Draft 2020-12, CloudEvents, Semgrep, Trivy, Gitleaks, Cosign).
4. **Zero-Assumption Framework**: Ground truth is established solely through workspace configurations, code evidence, or direct user confirmation.
5. **Hardened Multi-Tenancy**: 4 interchangeable isolation models (AST query interceptor filtering, schema-per-tenant, database-per-tenant, transparent storage proxy) backed by transaction-scoped session context.
6. **Dynamic Extensibility Without Code Branching**:
   - Custom tables and columns via hybrid core relational/document models and validated JSON Schema.
   - Pluggable business logic via Common Expression Language (CEL), GoF Strategy registries, and WebAssembly (Wasm) micro-sandboxes.
   - Tenant lifecycles via durable workflows (Temporal / BPMN 2.0 / statecharts).
   - Server-Driven UI (SDUI) component registries and W3C Design Tokens Community Group (DTCG) theming.
7. **Resilient Database Architecture**: Full ACID atomicity, Transactional Outbox pattern eliminating dual-writes, declarative expand-contract zero-downtime migrations, and continuous Point-In-Time Recovery (PITR).
8. **Workspace Knowledge Hub & Token Economy**: In-workspace system knowledge graphs, defect post-mortems, and Lightweight Architectural Decision Records (ADRs) to eliminate repetitive token-expensive discovery loops.

---

## 🗂️ Workspace Architecture

```
.
├── .agents/
│   └── skills/                       # Specialized on-demand agentic workflows
│       ├── agentic-architect/        # Authoring & auditing agent configurations
│       ├── clean-code-refactor/      # Refactoring code smells with GoF & Clean Code
│       ├── compliance-audit/         # SOC 2, ISO 27001 & OWASP open-source audits
│       ├── lets-build/               # Architecture interview & project bootstrapper
│       └── product-analyst/          # INVEST user stories & Gherkin criteria
├── docs/
│   ├── knowledge/                    # Institutional knowledge & token economy
│   │   ├── dos_and_donts.md          # Consolidated DO's and DONT's directory
│   │   ├── issue_log.md              # Defect post-mortems & preventing rules
│   │   ├── knowledge_graph.md        # Visual topologies & fast-lookup matrices
│   │   └── lessons_learned.md        # Strategic architectural takeaways
│   └── rules/                        # 41 atomic single-responsibility domain rules
├── AGENTS.md                         # Lean root agentic configuration (< 120 lines)
├── CLAUDE.md -> AGENTS.md            # Filesystem symlink for harness parity
├── agents.md -> AGENTS.md            # Filesystem symlink for harness parity
├── memory.md                         # Master memory hub & Lightweight ADR ledger
└── README.md                         # Project documentation
```

---

## ⚡ Agentic Harness Parity & Deterministic Validation

To prevent configuration divergence across different AI agents, IDE harnesses, and CLI tools, [`AGENTS.md`](./AGENTS.md), [`CLAUDE.md`](./CLAUDE.md), and [`agents.md`](./agents.md) remain identical via filesystem symbolic links.

### Deterministic Architecture Validation
Run the built-in validation script to enforce front matter standards, line ceilings (root $\le$ 120 lines), link health, and atomic rule compliance:

```bash
bash .agents/skills/agentic-architect/scripts/validate_agentic_configs.sh
```

---

## 📚 Atomic Domain Rules Catalog (`docs/rules/`)

| Domain | Rule Reference | Core Mandate |
|---|---|---|
| **Testing** | [`test_driven_development.md`](./docs/rules/test_driven_development.md) | Outside-In TDD (London School) double loop and mock ownership. |
| **Test Isolation** | [`test_isolation.md`](./docs/rules/test_isolation.md) | 100.00% full-stack coverage and transactional database rollback. |
| **Clean Code** | [`clean_code.md`](./docs/rules/clean_code.md) | Small functions (< 30 lines), CQS, SLAP, DRY, and DbC. |
| **Design Patterns** | [`design_patterns.md`](./docs/rules/design_patterns.md) | Adapter, Factory, Facade, Strategy, and Result `<T, E>` pattern. |
| **GoF Catalog** | [`gof_design_patterns_reference.md`](./docs/rules/gof_design_patterns_reference.md) | Production implementations of all 23 Gang of Four patterns across OOP/FP. |
| **Type Safety** | [`typescript.md`](./docs/rules/typescript.md) | Strict compiler flags, nominal branded types, static type safety invariants. |
| **ADRs** | [`architecture_decision_records.md`](./docs/rules/architecture_decision_records.md) | Lightweight Architectural Decision Records format in `memory.md`. |
| **Authentication** | [`authentication.md`](./docs/rules/authentication.md) | In-memory access tokens, refresh token rotation (RTR), and WebAuthn. |
| **Authorization** | [`authorization.md`](./docs/rules/authorization.md) | OPA Rego policy engines, OpenFGA ReBAC, route guards, and ABAC/RBAC. |
| **Multi-Tenancy** | [`multitenancy_isolation.md`](./docs/rules/multitenancy_isolation.md) | Tenant context resolution, 4 universal data isolation models, RLS/interceptor safety. |
| **REST APIs** | [`rest_api_conventions.md`](./docs/rules/rest_api_conventions.md) | Standard HTTP status codes, enumeration masking, and subresources. |
| **Advanced APIs** | [`advanced_api_patterns.md`](./docs/rules/advanced_api_patterns.md) | Allowed Actions (`_actions`), Idempotency keys, and cursor pagination. |
| **API Versioning** | [`api_versioning.md`](./docs/rules/api_versioning.md) | URI versioning (`/v1/`), RFC 8594 Sunset headers, and 90-day window. |
| **Dynamic Schemas** | [`tenant_dynamic_schemas.md`](./docs/rules/tenant_dynamic_schemas.md) | Hybrid core + JSON/document storage, JSON Schema Draft 2020-12, and meta-schemas. |
| **Pluggable Logic** | [`tenant_pluggable_logic.md`](./docs/rules/tenant_pluggable_logic.md) | Common Expression Language (CEL), Wasm sandboxing, durable workflows (Temporal/BPMN). |
| **Server-Driven UI** | [`server_driven_ui.md`](./docs/rules/server_driven_ui.md) | Dynamic UI schemas, multi-renderer component registries, and DTCG design tokens. |
| **Transactions** | [`database_transactions.md`](./docs/rules/database_transactions.md) | ACID atomicity, isolation levels, timeouts, and Transactional Outbox. |
| **Migrations** | [`database_migrations.md`](./docs/rules/database_migrations.md) | Declarative/versioned migrations (Atlas/Flyway), 5-phase expand-contract. |
| **Data Integrity** | [`database_integrity.md`](./docs/rules/database_integrity.md) | Foreign keys, domain CHECK constraints, and partial unique indexes. |
| **DB Operations** | [`database_operations.md`](./docs/rules/database_operations.md) | Continuous PITR, autovacuum/defrag tuning, connection pooling, role separation. |
| **DB Performance** | [`database_performance.md`](./docs/rules/database_performance.md) | Eliminating N+1 queries, DataLoader batching, and composite indexes. |
| **Caching** | [`caching.md`](./docs/rules/caching.md) | Cache Port semantics, Cache-Aside, jittered TTLs, and XFetch stampede defense. |
| **App Security** | [`application_security.md`](./docs/rules/application_security.md) | OWASP Top 10 defenses, cryptographic rigor, token bucket rate limiting. |
| **Compliance** | [`compliance.md`](./docs/rules/compliance.md) | SOC 2 Type II controls, ISO/IEC 27001 ISMS, and GDPR data erasure. |
| **DevSecOps** | [`devsecops.md`](./docs/rules/devsecops.md) | Secretlint pre-commit gating, CycloneDX SBOMs, and Trivy CVE scans. |
| **Error Handling** | [`error_handling.md`](./docs/rules/error_handling.md) | Fail-fast schema validation, structured OTel/Pino tracing, and RFC 7807 envelopes. |
| **Feature Flags** | [`feature_flags.md`](./docs/rules/feature_flags.md) | OpenFeature standard, Flipt/Unleash backends, and kill switches. |
| **CI** | [`continuous_integration.md`](./docs/rules/continuous_integration.md) | Shift-left automated pipelines, trunk-based development, and caching. |
| **CD** | [`continuous_deployment.md`](./docs/rules/continuous_deployment.md) | Zero-downtime rollouts, Cosign container signing, and distroless bases. |
| **Infrastructure** | [`container_infrastructure.md`](./docs/rules/container_infrastructure.md) | Unified gateway, minimal OCI distroless/scratch containers, and non-root users. |
| **Email** | [`transactional_email.md`](./docs/rules/transactional_email.md) | Declarative templates (MJML/JSON), safe interpolation, and Mailpit tests. |
| **Accessibility** | [`accessibility.md`](./docs/rules/accessibility.md) | WCAG 2.2 AA compliance, accessible primitives, focus trapping, and ARIA live regions. |
| **Navigation** | [`ui_navigation.md`](./docs/rules/ui_navigation.md) | Bidirectional URL search param synchronization and deep linking. |
| **Requirements** | [`requirements_engineering.md`](./docs/rules/requirements_engineering.md) | INVEST user stories, executable Gherkin criteria, and edge matrices. |
| **DDD** | [`domain_driven_design.md`](./docs/rules/domain_driven_design.md) | Ubiquitous Language, Bounded Contexts, Value Objects, and Aggregates. |
| **Cloud-Native** | [`cloud_native.md`](./docs/rules/cloud_native.md) | 12-Factor (2026 Edition), OpenTelemetry (OTel), and graceful shutdown. |
| **Agentic Config** | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) | Progressive disclosure, 7 skill inquiry branches, and refinement loops. |
| **Project Mgmt** | [`project_management.md`](./docs/rules/project_management.md) | Work-In-Progress limits (WIP = 1), task states, and Definition of Done. |
| **Domain Models** | [`domain_expertise.md`](./docs/rules/domain_expertise.md) | Business capabilities, Aggregate Root invariants, and living vocabulary. |
| **Isolation** | [`workspace_isolation.md`](./docs/rules/workspace_isolation.md) | Strict workspace sovereignty and zero global context interference. |
| **Learning** | [`continuous_learning.md`](./docs/rules/continuous_learning.md) | Automated defect post-mortems, DO's/DONT's, and dynamic rule ingestion. |

---

## 🛠️ Specialized Skills Catalog (`.agents/skills/`)

- [`agentic-architect`](.agents/skills/agentic-architect/SKILL.md): Authoring, auditing, and modularizing agent configurations and skills.
- [`product-analyst`](.agents/skills/product-analyst/SKILL.md): Translating requirements into INVEST user stories and Gherkin acceptance criteria.
- [`compliance-audit`](.agents/skills/compliance-audit/SKILL.md): Conducting SOC 2, ISO 27001, and OWASP audits using open-source scanners.
- [`clean-code-refactor`](.agents/skills/clean-code-refactor/SKILL.md): Refactoring code smells with Clean Code, SOLID, and modern design patterns.
- [`lets-build`](.agents/skills/lets-build/SKILL.md): Conducting architecture interviews to finalize stack, frameworks, package managers, and bootstrapping projects.

---

## 🚀 Starting a New Project with `/lets-build`

This repository serves as an **enterprise architectural starter template**. When beginning a new software project:

### Step 1: Copy Workspace to New Project Folder
Copy all files and directories from this template into your target project directory:
```bash
cp -r /path/to/mvp /path/to/my-new-project
cd /path/to/my-new-project
```

### Step 2: Invoke the `/lets-build` Skill
In your AI coding assistant (Google Antigravity, Claude Code, Cursor, or OpenHands), trigger the workflow:
```
/lets-build
```
*(Or simply prompt: "Let's build a new project from this template.")*

### Step 3: The Relentless Architectural Interview
The agent will execute a deep research loop and systematically interrogate you across all **18 systemic dimensions** (with zero assumptions) to lock in your desired technical stack:

1. **Domain, Scale & Performance**: Problem domain, p95/p99 latency budgets, peak throughput (RPS), and regulatory standards (SOC 2, ISO 27001, GDPR).
2. **Language & Runtime**: Go, Rust, Python, TypeScript, Java/Kotlin, C# (.NET), Elixir, or Polyglot.
3. **Package Manager & Toolchain**: `go modules`, `cargo`, `uv`/`poetry`, `pnpm`, `gradle`, or `dotnet CLI`.
4. **Transport & Network**: REST (OpenAPI 3.1), gRPC (Protobuf v3 via `buf`), GraphQL, or Event-Driven.
5. **Transport Framework**: Gin, Axum, FastAPI, Fastify, Spring Boot, or ASP.NET Core.
6. **Database Engine**: PostgreSQL, MySQL, SQLite, CockroachDB, MongoDB, or Hybrid.
7. **Database Migrations**: Declarative schema migrations (**Atlas**) vs versioned SQL (**Flyway**, **Goose**).
8. **Multi-Tenancy Isolation**: AST query interceptor, Database RLS, Schema-per-tenant, or DB-per-tenant.
9. **Dynamic Schemas**: Universal **JSON Schema Draft 2020-12** in semi-structured columns vs EAV.
10. **Pluggable Logic & Workflows**: Common Expression Language (CEL), WebAssembly (Extism) sandboxing, and Temporal.io / BPMN 2.0.
11. **Authentication & Identity**: OIDC, OAuth 2.1, Passkeys (FIDO2/WebAuthn), PASETO, or JWT JWKS.
12. **Authorization Engine**: Open Policy Agent (OPA Rego via HTTP/Wasm), OpenFGA (Zanzibar ReBAC), or Cerbos.
13. **Frontend / Client**: Web (React, Vue, Svelte), Mobile (Flutter, Native), Server-Driven UI (SDUI), and W3C DTCG Design Tokens.
14. **Caching & Locks**: Redis, Valkey, Dragonfly, Memcached, or local LRU with XFetch stampede defense.
15. **Event Streaming**: Apache Kafka, NATS JetStream, RabbitMQ, SQS with Transactional Outbox.
16. **Observability**: OpenTelemetry OTLP traces/metrics/logs over gRPC/HTTP with W3C trace context.
17. **DevSecOps & Verification**: Semgrep SAST, Gitleaks, Trivy scanning, CycloneDX SBOM, Cosign, and Outside-In TDD (100% coverage gates).
18. **Deployment Target**: Minimal OCI Distroless/Scratch, Docker Compose, Kubernetes, and OpenTofu IaC.

### Step 4: Blueprint Synthesis & Explicit Approval
The agent consolidates all your choices into a formal **Architectural Specification & Technology Blueprint** and records a formal ADR in [`memory.md`](./memory.md).  
**The agent will stop and ask for your explicit confirmation before generating any code.**

### Step 5: Deterministic Project Bootstrapping
Once confirmed, the agent automatically executes:
1. Directory scaffolding following **Hexagonal Architecture** (`src/domain/`, `src/ports/`, `src/adapters/`, `specs/`, `tests/`, `deploy/`).
2. Canonical contract generation (`specs/openapi/`, `specs/protobuf/`, `specs/schemas/`, `specs/tokens/`).
3. Build manifests, strict linter/formatter configurations, multi-stage Dockerfiles, and Compose environments.
4. Domain entities, primary/secondary port interfaces, and initial adapter stubs.
5. **Project-Specific README Generation**: Completely replaces the starter template `README.md` with clean, project-specific documentation (mission, stack highlights, quickstart setup, build/test commands, and directory structure), preserving links to `docs/rules/`.
6. Deterministic validation via `validate_agentic_configs.sh` and initial compiler/test suite execution.

---

## 🏛️ Workspace Memory & Knowledge Hub

- 🗺️ **[System Knowledge Graph](./docs/knowledge/knowledge_graph.md)**: Visual subsystem topologies and entity-relationship models.
- 📋 **[Consolidated DO's & DONT's](./docs/knowledge/dos_and_donts.md)**: High-impact engineering invariants and anti-patterns to avoid.
- 🐛 **[Coding Issue Log](./docs/knowledge/issue_log.md)**: Defect post-mortems and preventative rules.
- 💡 **[Institutional Lessons Learned](./docs/knowledge/lessons_learned.md)**: Strategic engineering insights.
- 📜 **[Lightweight ADR Ledger](./memory.md)**: Formal Architectural Decision Records.
