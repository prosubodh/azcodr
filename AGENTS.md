# AGENTS.md

> **Operating Framework & Agent Directives**  
> **Rule Zero:** Assume nothing. Every action must be grounded in verified evidence from this workspace or direct instructions from the user.  
> **Open-Source Mandate:** Always utilize 100% open-source tools, frameworks, libraries, and packages across all architectural domains.  
> **Atomicity Mandate:** All rules, skills, code units, migrations, and transactions must be strictly atomic (indivisible, self-contained, and composable with full ACID safety).

---

## 1. Zero-Assumption Operating Framework

### Core Principles
1. **No External Assumptions:** You have no prior knowledge of external setups, hidden tools, libraries, or unverified conventions outside this workspace.
2. **Ground Truth Only:** A statement is only true if proven by a workspace file, verified command output, or direct user instruction.
3. **Unknown Until Verified:** If something is not explicitly written in the workspace or stated by the user, treat it as unknown.
4. **Strict Open-Source Standards:** Standardize exclusively on open-source solutions (e.g. Semgrep, Trivy, Gitleaks, OpenTelemetry, Pino, Vitest, Playwright, PostgreSQL, Redis, Radix UI).
5. **Systemic Atomicity:** Every skill, rule, database transaction, and refactoring step must be atomic (Single Responsibility, zero side-effects, full rollback on failure).
6. **Workspace Sovereignty:** Total containment within `/home/prosubodh/projects/mvp`. Zero interference or leakage from global system configs, tools, or external sibling projects.
7. **Continuous Learning:** Log all defects, DO's/DONT's, and lessons into `docs/knowledge/` and `memory.md`, dynamically updating atomic rules.

### The 5 Core Branch Questions
Before acting on any decision branch, answer:
1. **Current State:** What do workspace files currently show? (Inspect before assuming).
2. **Target Goal:** Is the goal clear, bounded, and explicit? (Stop & ask if ambiguous).
3. **Tools & Setup:** Are tools defined in workspace configs? (Never assume commands exist).
4. **Impact & Risk:** Have all references, callers, and side effects been traced?
5. **Verification:** How will we prove it works with tests or build commands?

### Conflict Resolution & Order of Authority
1. **User Request (Current Session)** ➔ 2. **Workspace Configurations** (lockfiles, linters, scripts) ➔ 3. **Existing Code Patterns** ➔ 4. **Direct Confirmation (Stop & Ask)**.

### Action Boundaries
- **ALWAYS:** Read files before editing; verify commands before running; verify results with evidence.
- **ASK FIRST:** Adding/removing external dependencies; deleting/renaming files; changing DB schemas or build scripts; modifying existing tests.
- **NEVER:** Guess paths, flags, or signatures; silently ignore errors; bypass unresolved questions.

---

## 2. Execution Lifecycle

Progress all tasks systematically through five stages:
```
1. DISCOVER (Read Only) ──► 2. INTERROGATE (Question Gaps) ──► 3. PLAN (Minimal Scope) ──► 4. EXECUTE (Surgical Edits) ──► 5. VERIFY (Produce Proof)
```

---

## 3. Progressive Disclosure: Specialized Domain Rules

To prevent context bloat and keep prompt overhead minimal, detailed engineering and architectural standards are decoupled into dedicated reference files. **Read these files on demand when working in the relevant domain:**

| Domain | Rule Reference File | When to Consult |
|---|---|---|
| **TDD Double Loop** | [docs/rules/test_driven_development.md](file:///home/prosubodh/projects/mvp/docs/rules/test_driven_development.md) | Outside-In TDD (London School), collaborator discovery, mock ownership. |
| **Test Coverage & Isolation** | [docs/rules/test_isolation.md](file:///home/prosubodh/projects/mvp/docs/rules/test_isolation.md) | 100.00% full-stack coverage, status codes, transactional DB rollback. |
| **Clean Code** | [docs/rules/clean_code.md](file:///home/prosubodh/projects/mvp/docs/rules/clean_code.md) | Naming, small functions, CQS, SLAP, DRY, DbC, zero side-effects. |
| **Design Patterns** | [docs/rules/design_patterns.md](file:///home/prosubodh/projects/mvp/docs/rules/design_patterns.md) | Adapter, Factory, Facade, Strategy, and Result `<T, E>` pattern. |
| **GoF Design Patterns** | [docs/rules/gof_design_patterns_reference.md](file:///home/prosubodh/projects/mvp/docs/rules/gof_design_patterns_reference.md) | Complete reference of all 23 GoF patterns with TypeScript implementations. |
| **TypeScript** | [docs/rules/typescript.md](file:///home/prosubodh/projects/mvp/docs/rules/typescript.md) | Compiler strictness, branded nominal types, no `any`, runtime type narrowing. |
| **ADRs** | [docs/rules/architecture_decision_records.md](file:///home/prosubodh/projects/mvp/docs/rules/architecture_decision_records.md) | Authoring Lightweight Architectural Decision Records in `memory.md`. |
| **Authentication** | [docs/rules/authentication.md](file:///home/prosubodh/projects/mvp/docs/rules/authentication.md) | In-memory access tokens, refresh token rotation (RTR), WebAuthn passkeys. |
| **Authorization** | [docs/rules/authorization.md](file:///home/prosubodh/projects/mvp/docs/rules/authorization.md) | CASL ABAC/RBAC permissions, OPA Rego policy engines, server guards. |
| **Multi-Tenancy Isolation** | [docs/rules/multitenancy_isolation.md](file:///home/prosubodh/projects/mvp/docs/rules/multitenancy_isolation.md) | Tenant context resolution, PostgreSQL RLS dual-layer isolation, lifecycle. |
| **REST API Conventions** | [docs/rules/rest_api_conventions.md](file:///home/prosubodh/projects/mvp/docs/rules/rest_api_conventions.md) | Standard HTTP status codes, enumeration masking, subresource endpoints. |
| **Advanced API Patterns** | [docs/rules/advanced_api_patterns.md](file:///home/prosubodh/projects/mvp/docs/rules/advanced_api_patterns.md) | Allowed Actions (`_actions`), Idempotency keys, cursor pagination, OCC. |
| **API Versioning** | [docs/rules/api_versioning.md](file:///home/prosubodh/projects/mvp/docs/rules/api_versioning.md) | URI versioning (`/v1/`), RFC 8594 Sunset/Deprecation headers, 90-day window. |
| **Tenant Dynamic Schemas** | [docs/rules/tenant_dynamic_schemas.md](file:///home/prosubodh/projects/mvp/docs/rules/tenant_dynamic_schemas.md) | Hybrid core + JSONB, ajv JSON Schema validation, meta-schema virtual entities. |
| **Tenant Pluggable Logic** | [docs/rules/tenant_pluggable_logic.md](file:///home/prosubodh/projects/mvp/docs/rules/tenant_pluggable_logic.md) | Strategy registries, json-rules-engine, XState workflows, QuickJS sandbox. |
| **Server-Driven UI** | [docs/rules/server_driven_ui.md](file:///home/prosubodh/projects/mvp/docs/rules/server_driven_ui.md) | Metadata-driven UI layout schemas, component registries, dynamic design tokens. |
| **Database Transactions** | [docs/rules/database_transactions.md](file:///home/prosubodh/projects/mvp/docs/rules/database_transactions.md) | ACID atomicity, isolation levels, defensive timeouts, transactional outbox. |
| **Database Migrations** | [docs/rules/database_migrations.md](file:///home/prosubodh/projects/mvp/docs/rules/database_migrations.md) | Versioned migrations, zero-downtime expand-contract, concurrent indexes. |
| **Database Integrity** | [docs/rules/database_integrity.md](file:///home/prosubodh/projects/mvp/docs/rules/database_integrity.md) | Foreign keys, domain CHECK constraints, interval EXCLUDE, soft-delete indexes. |
| **Database Operations** | [docs/rules/database_operations.md](file:///home/prosubodh/projects/mvp/docs/rules/database_operations.md) | Continuous PITR (pgBackRest/Barman), autovacuum, pg_repack, role separation. |
| **Database Performance** | [docs/rules/database_performance.md](file:///home/prosubodh/projects/mvp/docs/rules/database_performance.md) | Eliminating N+1 queries, DataLoader batching, composite tenant indexes. |
| **Caching** | [docs/rules/caching.md](file:///home/prosubodh/projects/mvp/docs/rules/caching.md) | Redis Cache-Aside, key namespacing, jittered TTLs, event-driven eviction, ETags. |
| **Application Security** | [docs/rules/application_security.md](file:///home/prosubodh/projects/mvp/docs/rules/application_security.md) | OWASP Top 10 defenses, cryptographic rigor, Redis token bucket rate limiting. |
| **Regulatory Compliance** | [docs/rules/compliance.md](file:///home/prosubodh/projects/mvp/docs/rules/compliance.md) | SOC 2 Type II controls, ISO/IEC 27001 ISMS, GDPR data erasure rights. |
| **DevSecOps** | [docs/rules/devsecops.md](file:///home/prosubodh/projects/mvp/docs/rules/devsecops.md) | Secretlint pre-commit gating, CycloneDX SBOM generation, Trivy/Grype scanning. |
| **Error Architecture** | [docs/rules/error_handling.md](file:///home/prosubodh/projects/mvp/docs/rules/error_handling.md) | Fail-fast Zod env validation, structured Pino request tracing, error envelopes. |
| **Feature Flags** | [docs/rules/feature_flags.md](file:///home/prosubodh/projects/mvp/docs/rules/feature_flags.md) | OpenFeature standard, Flipt/Unleash backends, targeting, kill switches. |
| **Continuous Integration** | [docs/rules/continuous_integration.md](file:///home/prosubodh/projects/mvp/docs/rules/continuous_integration.md) | Shift-left automated pipelines, trunk-based development, build caching. |
| **Continuous Deployment** | [docs/rules/continuous_deployment.md](file:///home/prosubodh/projects/mvp/docs/rules/continuous_deployment.md) | Zero-downtime rollouts, Cosign container signing, container minimization. |
| **Container Infrastructure** | [docs/rules/container_infrastructure.md](file:///home/prosubodh/projects/mvp/docs/rules/container_infrastructure.md) | Unified Nginx gateway, Docker healthcheck orchestration, non-root user security. |
| **Transactional Email** | [docs/rules/transactional_email.md](file:///home/prosubodh/projects/mvp/docs/rules/transactional_email.md) | Typed React Email templates, safe interpolation, Mailpit integration testing. |
| **Accessibility** | [docs/rules/accessibility.md](file:///home/prosubodh/projects/mvp/docs/rules/accessibility.md) | WCAG 2.2 AA compliance, Radix UI modals, focus trapping, ARIA live regions. |
| **UI Navigation** | [docs/rules/ui_navigation.md](file:///home/prosubodh/projects/mvp/docs/rules/ui_navigation.md) | Bidirectional URL state synchronization, deep linking, search params. |
| **Requirements Engineering** | [docs/rules/requirements_engineering.md](file:///home/prosubodh/projects/mvp/docs/rules/requirements_engineering.md) | INVEST user stories, executable Gherkin acceptance criteria, edge case matrices. |
| **Domain-Driven Design** | [docs/rules/domain_driven_design.md](file:///home/prosubodh/projects/mvp/docs/rules/domain_driven_design.md) | Ubiquitous Language, Bounded Contexts, Value Objects, Aggregates. |
| **Cloud-Native 12-Factor** | [docs/rules/cloud_native.md](file:///home/prosubodh/projects/mvp/docs/rules/cloud_native.md) | 12-Factor (2026 Edition), OpenTelemetry (OTel), stateless isolates. |
| **Agentic Config & Skills** | [docs/rules/agentic_configuration.md](file:///home/prosubodh/projects/mvp/docs/rules/agentic_configuration.md) | Progressive disclosure architecture, skill inquiry branches, refinement loop. |
| **Project Management** | [docs/rules/project_management.md](file:///home/prosubodh/projects/mvp/docs/rules/project_management.md) | Work-In-Progress limits (WIP = 1), task lifecycle states, Definition of Done. |
| **Domain Modeling** | [docs/rules/domain_expertise.md](file:///home/prosubodh/projects/mvp/docs/rules/domain_expertise.md) | Business capabilities, Aggregate Root invariants, Ubiquitous Language. |
| **Workspace Isolation** | [docs/rules/workspace_isolation.md](file:///home/prosubodh/projects/mvp/docs/rules/workspace_isolation.md) | Strict workspace sovereignty, zero global contamination, local ground truth. |
| **Continuous Learning** | [docs/rules/continuous_learning.md](file:///home/prosubodh/projects/mvp/docs/rules/continuous_learning.md) | Automated defect post-mortems, DO's/DONT's logging, dynamic rule updates. |

---

## 4. Agent Configuration & Workspace Architecture

- **Progressive Disclosure Principle:** Never load all documentation upfront. Rely on the table above to pull specialized instructions only when performing relevant tasks.
- **Nested AGENTS.md for Monorepos:** In multi-package workspaces (e.g. `apps/backend`, `apps/frontend`), place package-specific conventions in nested `AGENTS.md` files scoped strictly to those subtrees.
- **Specialized Skills Catalog:** On-demand multi-step workflows are encapsulated under `.agents/skills/`:
  - [`agentic-architect`](file:///home/prosubodh/projects/mvp/.agents/skills/agentic-architect/SKILL.md): Authoring, auditing, and modularizing agent configurations and skills.
  - [`product-analyst`](file:///home/prosubodh/projects/mvp/.agents/skills/product-analyst/SKILL.md): Translating requirements into INVEST user stories and Gherkin criteria.
  - [`compliance-audit`](file:///home/prosubodh/projects/mvp/.agents/skills/compliance-audit/SKILL.md): Conducting SOC 2, ISO 27001, and OWASP audits using open-source scanners.
  - [`clean-code-refactor`](file:///home/prosubodh/projects/mvp/.agents/skills/clean-code-refactor/SKILL.md): Refactoring code smells with Clean Code, SOLID, and design patterns.
- **Relentless Skill Architecture Inquiry:** Never author or update skills on assumptions. Interrogate all 7 inquiry branches (placement, trigger intent, domain truth, gotchas/anti-patterns, determinism, progressive bloat, verification loop) defined in [docs/rules/agentic_configuration.md](file:///home/prosubodh/projects/mvp/docs/rules/agentic_configuration.md) before writing `SKILL.md`.
- **Workspace Memory & Knowledge Hub:** Consult [`memory.md`](file:///home/prosubodh/projects/mvp/memory.md) for ADRs, and [`docs/knowledge/`](file:///home/prosubodh/projects/mvp/docs/knowledge/knowledge_graph.md) for system topologies, issue logs, and DO's/DONT's.
- **Harness Parity & Symlinks:** `AGENTS.md`, `CLAUDE.md`, and `agents.md` must remain identical via filesystem symbolic links to eliminate configuration divergence across different agent harnesses.
