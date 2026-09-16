# MVP: Enterprise Multi-Tenant Architecture & Agentic Engineering

> **Production-ready, battle-tested multi-tenant enterprise architecture governed by strict systemic atomicity, 100% open-source standards, progressive disclosure agentic directives, and zero-downtime database patterns.**

---

## 🌟 Architectural Pillars

1. **Systemic Atomicity**: Every rule, skill, database transaction, and code unit adheres to the Single Responsibility Principle (SRP)—indivisible, self-contained, orthogonal, and composable with zero conjunction naming.
2. **100% Open-Source Mandate**: Standardized exclusively on open-source packages, libraries, and engines (PostgreSQL, Redis, Radix UI, Vitest, Playwright, Pino, OpenTelemetry, Semgrep, Trivy, Gitleaks, Cosign).
3. **Zero-Assumption Framework**: Ground truth is established solely through workspace configurations, code evidence, or direct user confirmation.
4. **Hardened Multi-Tenancy**: Dual-layer tenant isolation combining application-level context resolution with database-level PostgreSQL Row-Level Security (RLS) as an immutable backstop.
5. **Dynamic Extensibility Without Code Branching**:
   - Custom tables and columns via hybrid core relational columns and validated PostgreSQL JSONB (`ajv`).
   - Pluggable business logic via GoF Strategy registries and declarative JSON rule engines (`json-rules-engine`).
   - Differing tenant lifecycles via declarative statecharts (`XState`).
   - Server-Driven UI (SDUI) component registries and dynamic CSS Custom Property design tokens.
6. **Resilient Database Architecture**: Full ACID atomicity, Transactional Outbox pattern eliminating dual-writes, 5-phase expand-contract zero-downtime migrations, and continuous Point-In-Time Recovery (PITR).
7. **Workspace Knowledge Hub & Token Economy**: In-workspace system knowledge graphs, defect post-mortems, and Lightweight Architectural Decision Records (ADRs) to eliminate repetitive token-expensive discovery loops.

---

## 🗂️ Workspace Architecture

```
.
├── .agents/
│   └── skills/                       # Specialized on-demand agentic workflows
│       ├── agentic-architect/        # Authoring & auditing agent configurations
│       ├── clean-code-refactor/      # Refactoring code smells with GoF & Clean Code
│       ├── compliance-audit/         # SOC 2, ISO 27001 & OWASP open-source audits
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
| **GoF Catalog** | [`gof_design_patterns_reference.md`](./docs/rules/gof_design_patterns_reference.md) | Production TypeScript implementations of all 23 Gang of Four patterns. |
| **TypeScript** | [`typescript.md`](./docs/rules/typescript.md) | Strict compiler flags, nominal branded types, and no `any`. |
| **ADRs** | [`architecture_decision_records.md`](./docs/rules/architecture_decision_records.md) | Lightweight Architectural Decision Records format in `memory.md`. |
| **Authentication** | [`authentication.md`](./docs/rules/authentication.md) | In-memory access tokens, refresh token rotation (RTR), and WebAuthn. |
| **Authorization** | [`authorization.md`](./docs/rules/authorization.md) | CASL ABAC/RBAC permissions, OPA Rego policy engines, and route guards. |
| **Multi-Tenancy** | [`multitenancy_isolation.md`](./docs/rules/multitenancy_isolation.md) | Context resolution, PostgreSQL RLS dual-layer isolation, and lifecycle. |
| **REST APIs** | [`rest_api_conventions.md`](./docs/rules/rest_api_conventions.md) | Standard HTTP status codes, enumeration masking, and subresources. |
| **Advanced APIs** | [`advanced_api_patterns.md`](./docs/rules/advanced_api_patterns.md) | Allowed Actions (`_actions`), Idempotency keys, and cursor pagination. |
| **API Versioning** | [`api_versioning.md`](./docs/rules/api_versioning.md) | URI versioning (`/v1/`), RFC 8594 Sunset headers, and 90-day window. |
| **Dynamic Schemas** | [`tenant_dynamic_schemas.md`](./docs/rules/tenant_dynamic_schemas.md) | Hybrid core + JSONB, `ajv` JSON Schema validation, and meta-schemas. |
| **Pluggable Logic** | [`tenant_pluggable_logic.md`](./docs/rules/tenant_pluggable_logic.md) | Strategy registries, `json-rules-engine`, XState, and QuickJS sandboxing. |
| **Server-Driven UI** | [`server_driven_ui.md`](./docs/rules/server_driven_ui.md) | Dynamic UI schemas, component registries, and CSS custom property theming. |
| **Transactions** | [`database_transactions.md`](./docs/rules/database_transactions.md) | ACID atomicity, isolation levels, timeouts, and Transactional Outbox. |
| **Migrations** | [`database_migrations.md`](./docs/rules/database_migrations.md) | Versioned migrations, 5-phase expand-contract, and concurrent indexes. |
| **Data Integrity** | [`database_integrity.md`](./docs/rules/database_integrity.md) | Foreign keys, domain CHECK constraints, and partial unique indexes. |
| **DB Operations** | [`database_operations.md`](./docs/rules/database_operations.md) | Continuous PITR (pgBackRest), autovacuum tuning, and `pg_repack`. |
| **DB Performance** | [`database_performance.md`](./docs/rules/database_performance.md) | Eliminating N+1 queries, DataLoader batching, and composite indexes. |
| **Caching** | [`caching.md`](./docs/rules/caching.md) | Redis Cache-Aside, key namespacing, jittered TTLs, and HTTP ETags. |
| **App Security** | [`application_security.md`](./docs/rules/application_security.md) | OWASP Top 10 defenses, Argon2id, AES-256-GCM, and Redis rate limiting. |
| **Compliance** | [`compliance.md`](./docs/rules/compliance.md) | SOC 2 Type II controls, ISO/IEC 27001 ISMS, and GDPR data erasure. |
| **DevSecOps** | [`devsecops.md`](./docs/rules/devsecops.md) | Secretlint pre-commit gating, CycloneDX SBOMs, and Trivy CVE scans. |
| **Error Handling** | [`error_handling.md`](./docs/rules/error_handling.md) | Fail-fast Zod env validation, Pino request tracing, and error envelopes. |
| **Feature Flags** | [`feature_flags.md`](./docs/rules/feature_flags.md) | OpenFeature standard, Flipt/Unleash backends, and kill switches. |
| **CI** | [`continuous_integration.md`](./docs/rules/continuous_integration.md) | Shift-left automated pipelines, trunk-based development, and caching. |
| **CD** | [`continuous_deployment.md`](./docs/rules/continuous_deployment.md) | Zero-downtime rollouts, Cosign container signing, and distroless bases. |
| **Infrastructure** | [`container_infrastructure.md`](./docs/rules/container_infrastructure.md) | Unified Nginx gateway, Docker healthchecks, and non-root users. |
| **Email** | [`transactional_email.md`](./docs/rules/transactional_email.md) | Typed React Email templates, safe interpolation, and Mailpit tests. |
| **Accessibility** | [`accessibility.md`](./docs/rules/accessibility.md) | WCAG 2.2 AA compliance, Radix UI modals, and ARIA live regions. |
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

---

## 🏛️ Workspace Memory & Knowledge Hub

- 🗺️ **[System Knowledge Graph](./docs/knowledge/knowledge_graph.md)**: Visual subsystem topologies and entity-relationship models.
- 📋 **[Consolidated DO's & DONT's](./docs/knowledge/dos_and_donts.md)**: High-impact engineering invariants and anti-patterns to avoid.
- 🐛 **[Coding Issue Log](./docs/knowledge/issue_log.md)**: Defect post-mortems and preventative rules.
- 💡 **[Institutional Lessons Learned](./docs/knowledge/lessons_learned.md)**: Strategic engineering insights.
- 📜 **[Lightweight ADR Ledger](./memory.md)**: Formal Architectural Decision Records.
