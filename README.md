# azcodr: Enterprise Architecture & Agentic Engineering Starter Template

> **Production-ready, battle-tested software architecture governed by problem-first topology alignment, strict systemic atomicity, evolutionary architecture tipping points, 100% open-source standards, true incremental TDD nano-cycles, and zero speculative bloat.**

---

## 🌟 Architectural Pillars

1. **Problem-First & Topology Alignment**: Architecture emerges strictly from problem constraints and execution targets (Problem-First; zero preemptive tool bias). Architectural styles match the problem topology: Hexagonal for enterprise backends, Platform Scripting for extensions, Data-Oriented Design for game engines, Command Pipeline for CLIs, and Game Loop for canvas games.
2. **Systemic Atomicity**: Every rule, skill, database transaction, and code unit adheres to the Single Responsibility Principle (SRP)—indivisible, self-contained, orthogonal, and composable with zero conjunction naming.
3. **Evolutionary Architecture & Refactor-Before-Add**: To eliminate AI-accelerated architectural drift, code graduates across 5 deterministic tipping points. Refactor structure first under existing green tests before implementing new features. Never append code into rotting files.
4. **True Incremental TDD & Nano-Cycles**: Prohibit batch-test dumps ("Test-First Waterfall"). Follow Uncle Bob's Three Laws: write one micro-assertion at a time, verify RED failure output, write minimal code to turn GREEN, and refactor under green with Ping-Pong pair programming.
5. **100% Open-Source & Open Standards**: Standardized exclusively on open-source solutions and vendor-neutral specifications (OpenTelemetry, OPA, OpenFGA, Protocol Buffers, OpenAPI 3.1, JSON Schema Draft 2020-12, CloudEvents, Semgrep, Trivy, Gitleaks, Cosign).
6. **Zero-Assumption Framework**: Ground truth is established solely through workspace configurations, code evidence, or direct user confirmation.
7. **Hardened Multi-Tenancy (When Applicable)**: 4 interchangeable isolation models (AST query interceptor filtering, schema-per-tenant, database-per-tenant, transparent storage proxy) backed by transaction-scoped session context.
8. **Dynamic Extensibility Without Code Branching**:
   - Custom tables and columns via hybrid core relational/document models and validated JSON Schema.
   - Pluggable business logic via Common Expression Language (CEL), GoF Strategy registries, and WebAssembly (Wasm) micro-sandboxes.
   - Tenant lifecycles via durable workflows (Temporal / BPMN 2.0 / statecharts).
   - Server-Driven UI (SDUI) component registries and W3C Design Tokens Community Group (DTCG) theming.
9. **Resilient Database Architecture**: Full ACID atomicity, Transactional Outbox pattern eliminating dual-writes, declarative expand-contract zero-downtime migrations, and continuous Point-In-Time Recovery (PITR).
10. **Workspace Knowledge Hub & Token Economy**: In-workspace system knowledge graphs and Lightweight Architectural Decision Records (ADRs) to eliminate repetitive token-expensive discovery loops.

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
│       ├── product-analyst/          # INVEST user stories & Gherkin criteria
│       └── relentless-questioner/    # Context-aware dynamic interrogation loop
├── docs/
│   ├── knowledge/                    # Institutional knowledge & domain contracts
│   │   ├── knowledge_graph.md        # Visual topologies & fast-lookup matrices
│   │   └── ubiquitous_language.md    # Living Ubiquitous Language glossary template
│   └── rules/                        # 47 atomic single-responsibility domain rules
├── AGENTS.md                         # Lean root agentic configuration (< 120 lines)
├── CLAUDE.md -> AGENTS.md            # Filesystem symlink for harness parity
├── agents.md -> AGENTS.md            # Filesystem symlink for harness parity
├── changes.md                        # Upstream changes ledger
├── memory.md                         # Master memory hub & Lightweight ADR ledger
└── README.md                         # Project documentation
```

---

## 📋 Progressive Disclosure Rules Catalog (`docs/rules/`)

The architecture enforces 47 atomic, single-responsibility domain rules. Read on demand to prevent prompt context bloat:

| Domain | Rule Reference File | Key Focus & Invariants |
|---|---|---|
| **TDD Double Loop** | [`test_driven_development.md`](./docs/rules/test_driven_development.md) | Uncle Bob's 3 Laws, nano-cycles, Ping-Pong pairing, outside-in double loop. |
| **Test Coverage & Isolation** | [`test_isolation.md`](./docs/rules/test_isolation.md) | 100.00% full-stack coverage, status codes, transactional DB rollback. |
| **Clean Code** | [`clean_code.md`](./docs/rules/clean_code.md) | 5 evolutionary tipping points, Refactor-Before-Add, CQS, SLAP, DRY, fitness functions. |
| **Design Patterns** | [`design_patterns.md`](./docs/rules/design_patterns.md) | Adapter, Factory, Facade, Strategy, and Result `<T, E>` pattern. |
| **GoF Design Patterns** | [`gof_design_patterns_reference.md`](./docs/rules/gof_design_patterns_reference.md) | Complete reference of all 23 GoF patterns across OOP and functional paradigms. |
| **Type Safety** | [`typescript.md`](./docs/rules/typescript.md) | Compiler strictness, branded nominal types, type safety, static sound invariants. |
| **ADRs** | [`architecture_decision_records.md`](./docs/rules/architecture_decision_records.md) | Authoring Lightweight Architectural Decision Records in `memory.md`. |
| **Authentication** | [`authentication.md`](./docs/rules/authentication.md) | In-memory access tokens, refresh token rotation (RTR), WebAuthn passkeys. |
| **Authorization** | [`authorization.md`](./docs/rules/authorization.md) | CASL, OPA Rego policy engines, OpenFGA ReBAC, server guards. |
| **Multi-Tenancy Isolation** | [`multitenancy_isolation.md`](./docs/rules/multitenancy_isolation.md) | Tenant context resolution, 4 universal data isolation models, RLS/interceptor safety. |
| **REST API Conventions** | [`rest_api_conventions.md`](./docs/rules/rest_api_conventions.md) | Standard HTTP status codes, enumeration masking, subresource endpoints. |
| **Advanced API Patterns** | [`advanced_api_patterns.md`](./docs/rules/advanced_api_patterns.md) | Allowed Actions (`_actions`), Idempotency keys, cursor pagination, OCC. |
| **API Versioning** | [`api_versioning.md`](./docs/rules/api_versioning.md) | URI versioning (`/v1/`), RFC 8594 Sunset/Deprecation headers, 90-day window. |
| **Tenant Dynamic Schemas** | [`tenant_dynamic_schemas.md`](./docs/rules/tenant_dynamic_schemas.md) | Hybrid core + JSON/document storage, JSON Schema Draft 2020-12, meta-schemas. |
| **Tenant Pluggable Logic** | [`tenant_pluggable_logic.md`](./docs/rules/tenant_pluggable_logic.md) | Common Expression Language (CEL), Wasm sandboxing, durable workflows (Temporal/BPMN). |
| **Server-Driven UI** | [`server_driven_ui.md`](./docs/rules/server_driven_ui.md) | Client-agnostic layout schemas, multi-renderer component registries, DTCG tokens. |
| **Database Transactions** | [`database_transactions.md`](./docs/rules/database_transactions.md) | ACID atomicity, isolation levels, defensive timeouts, transactional outbox. |
| **Database Migrations** | [`database_migrations.md`](./docs/rules/database_migrations.md) | Declarative/versioned migrations (Atlas/Flyway), zero-downtime expand-contract. |
| **Database Integrity** | [`database_integrity.md`](./docs/rules/database_integrity.md) | Foreign keys, domain CHECK constraints, interval EXCLUDE, soft-delete indexes. |
| **Database Operations** | [`database_operations.md`](./docs/rules/database_operations.md) | Continuous PITR, autovacuum/defrag tuning, connection pooling, role separation. |
| **Database Performance** | [`database_performance.md`](./docs/rules/database_performance.md) | Eliminating N+1 queries, DataLoader batching, composite tenant indexes. |
| **Caching** | [`caching.md`](./docs/rules/caching.md) | Cache Port semantics, Cache-Aside, jittered TTLs, XFetch stampede defense. |
| **Application Security** | [`application_security.md`](./docs/rules/application_security.md) | OWASP Top 10 defenses, cryptographic rigor, token bucket rate limiting. |
| **Regulatory Compliance** | [`compliance.md`](./docs/rules/compliance.md) | SOC 2 Type II controls, ISO/IEC 27001 ISMS, GDPR data erasure rights. |
| **DevSecOps** | [`devsecops.md`](./docs/rules/devsecops.md) | Secretlint pre-commit gating, CycloneDX SBOM generation, Trivy/Grype scanning. |
| **Error Architecture** | [`error_handling.md`](./docs/rules/error_handling.md) | Fail-fast schema validation, structured OTel/Pino tracing, RFC 7807 envelopes. |
| **Feature Flags** | [`feature_flags.md`](./docs/rules/feature_flags.md) | OpenFeature standard, Flipt/Unleash backends, targeting, kill switches. |
| **Continuous Integration** | [`continuous_integration.md`](./docs/rules/continuous_integration.md) | Shift-left automated pipelines, trunk-based development, build caching. |
| **Continuous Deployment** | [`continuous_deployment.md`](./docs/rules/continuous_deployment.md) | Zero-downtime rollouts, Cosign container signing, container minimization. |
| **Container Infrastructure** | [`container_infrastructure.md`](./docs/rules/container_infrastructure.md) | Unified gateway, minimal OCI distroless/scratch containers, non-root user security. |
| **Transactional Email** | [`transactional_email.md`](./docs/rules/transactional_email.md) | Declarative templates (MJML/JSON), safe interpolation, SMTP integration testing. |
| **Accessibility** | [`accessibility.md`](./docs/rules/accessibility.md) | WCAG 2.2 AA compliance, accessible primitives, focus trapping, ARIA live regions. |
| **UI Navigation** | [`ui_navigation.md`](./docs/rules/ui_navigation.md) | Bidirectional URL state synchronization, deep linking, search params. |
| **UI/UX Architecture** | [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md) | Design triage, persistent app shell, collapsible sidebar, dual-experience portals. |
| **React & Frontend** | [`react.md`](./docs/rules/react.md) | Modern React, shadcn/ui, TanStack Query, React Hook Form, and Zod validation. |
| **Requirements Engineering** | [`requirements_engineering.md`](./docs/rules/requirements_engineering.md) | User stories vs requirements, 3 C's, INVEST vertical cake slicing, Gherkin. |
| **Product Ownership** | [`product_ownership.md`](./docs/rules/product_ownership.md) | Product Backlog Management, OKRs, Kano/MoSCoW/RICE, Product Value, empiricism. |
| **Domain-Driven Design** | [`domain_driven_design.md`](./docs/rules/domain_driven_design.md) | Problem Space vs Solution Space, Ubiquitous Language, Bounded Contexts, Aggregates. |
| **Workflow State Machines** | [`workflow_state_machines.md`](./docs/rules/workflow_state_machines.md) | Configurable workflows, in-aggregate invariant FSMs, transition guards & audit logs. |
| **Cloud-Native 12-Factor** | [`cloud_native.md`](./docs/rules/cloud_native.md) | 12-Factor (2026 Edition), OpenTelemetry (OTel), stateless isolates. |
| **Agentic Config & Skills** | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) | Progressive disclosure architecture, skill inquiry branches, refinement loop. |
| **Project Management** | [`project_management.md`](./docs/rules/project_management.md) | Work-In-Progress limits (WIP = 1), SMART developer tasks, Definition of Done. |
| **Domain Modeling** | [`domain_expertise.md`](./docs/rules/domain_expertise.md) | Business capabilities, Aggregate Root invariants, Ubiquitous Language. |
| **Relentless Questioning** | [`relentless_questioning.md`](./docs/rules/relentless_questioning.md) | Dynamic context-aware interrogation loops, adaptive decision trees. |
| **Workspace Isolation** | [`workspace_isolation.md`](./docs/rules/workspace_isolation.md) | Strict workspace sovereignty, zero global contamination, local ground truth. |
| **Continuous Learning** | [`continuous_learning.md`](./docs/rules/continuous_learning.md) | Direct 4-step rule ingestion, root-cause analysis, dynamic invariant updates. |
| **Upstream Sync** | [`upstream_synchronization.md`](./docs/rules/upstream_synchronization.md) | Logging generic architecture improvements to changes.md; zero baseline pollution. |

---

## 🛠️ Specialized Skills Catalog (`.agents/skills/`)

- [`agentic-architect`](.agents/skills/agentic-architect/SKILL.md): Authoring, auditing, and modularizing agent configurations and skills.
- [`clean-code-refactor`](.agents/skills/clean-code-refactor/SKILL.md): Refactoring code smells with Clean Code, SOLID, and modern design patterns.
- [`compliance-audit`](.agents/skills/compliance-audit/SKILL.md): Conducting SOC 2, ISO 27001, and OWASP audits using open-source scanners.
- [`lets-build`](.agents/skills/lets-build/SKILL.md): Conducting architecture interviews to finalize stack, frameworks, package managers, and bootstrapping projects.
- [`product-analyst`](.agents/skills/product-analyst/SKILL.md): Aligning OKRs, backlog ordering (Kano/MoSCoW/RICE), INVEST stories, and Gherkin criteria.
- [`relentless-questioner`](.agents/skills/relentless-questioner/SKILL.md): Dynamic context-aware interrogation loops before planning and coding.

---

## 🚀 Starting a New Project with `/lets-build`

This repository serves as an **enterprise architectural starter template**. When beginning a new software project:

### Step 1: Initialize Workspace with npx
Pull and scaffold the complete enterprise architectural template into your project directory using `npx`:
```bash
npx azcodr my-new-project
cd my-new-project
```
*(Or run `npx azcodr` directly inside your target directory).*

### Step 2: Invoke the `/lets-build` Skill
In your AI coding assistant (Google Antigravity, Claude Code, Cursor, or OpenHands), trigger the workflow:
```
/lets-build
```
*(Or simply prompt: "Let's build a new project from this template.")*

### Step 3: The Problem-First Architectural Interview
The agent will execute a deep research loop and systematically derive your technical stack strictly from problem constraints (with zero preemptive tool bias) across 5 tiered dimensions:

1. **Problem Space & Topology Classification**: What real-world problem is being solved? What data moves and transforms? Classifies the system topology:
   - *Topology A: Web SaaS / Cloud Microservices*
   - *Topology B: Browser Extension (Manifest V3)*
   - *Topology C: Game Engine / High-Performance Simulator (Bare metal, GPU)*
   - *Topology D: Browser / Canvas Game (HTML5 Canvas / WebGL / WebGPU)*
   - *Topology E: Desktop Application / CLI Utility (Native POSIX/Windows)*
   - *Topology F: Systems / Embedded / Cryptographic Library*
2. **Physical & Operational Constraints**: Latency budget (hard real-time <16.6ms frame loop vs interactive low-latency vs batch), memory model & GC tolerance (zero-GC pause tolerance vs managed throughput GC vs single-threaded event loop), and concurrency topology.
3. **Architectural Style Derivation**: Matches style strictly to topology (Hexagonal for enterprise backends, Platform Scripting for extensions, Data-Oriented Design for game engines, Game Loop for canvas games, Command Pipeline for CLIs).
4. **Emergent Stack & Toolchain**: Derives the optimal language (C, Rust, TypeScript, Go, Java, C#, Python), package manager, and build system strictly from the verified constraints.
5. **Targeted Invariants (Strictly Topology-Scoped)**: Inquires *only* into the dimensions relevant to the selected topology (e.g. database migrations for web backends, content script isolation for extensions, CLI flags for CLIs; zero Docker, Kubernetes, or OpenAPI bloat for non-backend projects).

### Step 4: Blueprint Synthesis & Explicit Approval
The agent consolidates all your choices into a formal **Architectural Specification & Technology Blueprint** and records a formal ADR in [`memory.md`](./memory.md).  
**The agent will stop and ask for your explicit confirmation before generating any code.**

### Step 5: Deterministic Topology Scaffolding (Strict YAGNI)
Once confirmed, the agent automatically executes:
1. Topology-aware directory scaffolding via `bootstrap_workspace.sh . <topology> <language>`, generating **0 speculative folders** (e.g. extensions get no Kubernetes or OpenAPI specs; CLIs get no Dockerfiles).
2. Targeted contract and entrypoint generation matching the derived topology.
3. Build manifests, strict linter/formatter configurations, and boundary smoke test (`scripts/smoke_test.sh`).
4. **Project-Specific README Generation**: Completely replaces the starter template `README.md` with clean, project-specific documentation (mission, stack highlights, quickstart setup, build/test commands, and directory structure), preserving links to `docs/rules/`.
5. Deterministic validation via `validate_agentic_configs.sh` and initial smoke test execution.
6. **Handover Gate to Domain Analysis**: Halts technical scaffolding and instructs the user to invoke `product-analyst` and `relentless-questioner` for domain modeling.

---

## 🏛️ Workspace Memory & Knowledge Hub

- 🗺️ **[System Knowledge Graph](./docs/knowledge/knowledge_graph.md)**: Visual subsystem topologies and entity-relationship models.
- 📖 **[Living Ubiquitous Language Glossary](./docs/knowledge/ubiquitous_language.md)**: Authoritative domain vocabulary contract.
- 📜 **[Lightweight ADR Ledger](./memory.md)**: Formal Architectural Decision Records and governing rules.
- 📝 **[Upstream Changes Ledger](./changes.md)**: Record candidate improvements and generic patterns for the upstream azcodr template.
