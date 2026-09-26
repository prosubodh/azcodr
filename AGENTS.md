# AGENTS.md

> **Operating Framework & Agent Directives**  
> **Rule Zero:** Assume nothing. Every action must be grounded in verified evidence from this workspace or direct instructions from the user.  
> **Open-Source Mandate:** Always utilize 100% open-source tools, frameworks, libraries, and packages across all architectural domains.  
> **Atomicity Mandate:** All rules, skills, code units, migrations, and transactions must be strictly atomic (indivisible, self-contained, and composable with full ACID safety).  
> **Architecture Mandate:** Architecture emerges strictly from problem constraints and execution targets (Problem-First; zero tool/platform bias). Match architectural style to problem topology (Hexagonal for enterprise backends, Platform Scripting for extensions, Data-Oriented Design for game engines, Command Pipeline for CLIs, Game Loop for canvas games). Never force premature abstractions or universal templates.

---

## 1. Zero-Assumption Operating Framework
### Core Principles
1. **No External Assumptions:** You have no prior knowledge of external setups, hidden tools, libraries, or unverified conventions outside this workspace.
2. **Ground Truth Only:** A statement is only true if proven by a workspace file, verified command output, or direct user instruction.
3. **Unknown Until Verified:** If something is not explicitly written in the workspace or stated by the user, treat it as unknown.
4. **Strict Open Standards:** Standardize on open-source solutions and open specs (Semgrep, Trivy, Gitleaks, OpenTelemetry, OPA, OCI, Wasm, CloudEvents).
5. **Problem-First & Topology Alignment:** Problem domain and operational constraints (latency budget, GC tolerance, memory, execution environment) strictly dictate the architectural style and toolchain. Never select tools before defining the problem space.
6. **Evolutionary Architecture & Refactor-Before-Add:** As complexity grows, code must graduate across explicit architectural tipping points. Refactor structure first under existing green tests before implementing new features. Never append code into rotting files.
7. **True Incremental TDD & Nano-Cycles:** Never dump test suites in batches ("Test-First Waterfall"). Follow Uncle Bob's Three Laws: write one micro-assertion at a time, verify RED failure output, write minimal code to turn GREEN, and refactor under green.
8. **Systemic Atomicity:** Every skill, rule, database transaction, and refactoring step must be atomic (Single Responsibility, zero side-effects, full rollback).
9. **Workspace Sovereignty:** Total containment within the local workspace root (`./`). Zero interference from global configs, tools, or sibling projects.
10. **Continuous Learning:** Ingest all verified defects, lessons, and architectural invariants directly into domain rules and `memory.md`.

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

Progress all tasks systematically through the unified **Agent Cognitive & Agile Domain Lifecycle**, seamlessly interlocking the 5 agent operational disciplines with the 5-phase domain engineering pipeline:
```
1. DISCOVER / REQUIREMENTS   ──► Read-only inspection; Problem Space & operational constraints; INVEST stories & Gherkin.
2. INTERROGATE / DOMAIN     ──► Relentless questioning; Ubiquitous Language, Aggregate invariants & state machines.
3. PLAN / OUTER TDD         ──► Minimal blast radius; failing Outer Acceptance Test (UI/API RED).
4. EXECUTE / INNER TDD      ──► Incremental nano-cycles (Uncle Bob's 3 Laws: 1 micro-assertion RED ➔ MINIMAL pass GREEN ➔ REFACTOR).
5. VERIFY / DoD & PROOF     ──► Outer test turns GREEN; boundary smoke tests & 100.00% test coverage.
```
---

## 3. Progressive Disclosure: Specialized Domain Rules

To prevent context bloat and keep prompt overhead minimal, detailed engineering and architectural standards are decoupled into dedicated reference files. **Read these files on demand when working in the relevant domain:**

| Domain | Rule Reference File | When to Consult |
|---|---|---|
| **TDD Double Loop** | [docs/rules/test_driven_development.md](./docs/rules/test_driven_development.md) | Outside-In TDD (London School), collaborator discovery, mock ownership. |
| **Test Coverage & Isolation** | [docs/rules/test_isolation.md](./docs/rules/test_isolation.md) | 100.00% full-stack coverage, status codes, transactional DB rollback. |
| **Clean Code** | [docs/rules/clean_code.md](./docs/rules/clean_code.md) | Naming, small functions, CQS, SLAP, DRY, DbC, zero side-effects. |
| **Design Patterns** | [docs/rules/design_patterns.md](./docs/rules/design_patterns.md) | Adapter, Factory, Strategy, Result `<T, E>`, and complete 23 GoF catalog. |
| **Type Safety** | [docs/rules/type_safety.md](./docs/rules/type_safety.md) | Compiler strictness, branded nominal types, type safety, static sound invariants. |
| **ADRs** | [docs/rules/architecture_decision_records.md](./docs/rules/architecture_decision_records.md) | Authoring Lightweight Architectural Decision Records in `memory.md`. |
| **Authentication** | [docs/rules/authentication.md](./docs/rules/authentication.md) | In-memory access tokens, refresh token rotation (RTR), WebAuthn passkeys. |
| **Authorization** | [docs/rules/authorization.md](./docs/rules/authorization.md) | CASL, OPA Rego policy engines, OpenFGA ReBAC, server guards. |
| **Multi-Tenancy Isolation** | [docs/rules/multitenancy_isolation.md](./docs/rules/multitenancy_isolation.md) | Tenant context resolution, 4 universal data isolation models, RLS/interceptor safety. |
| **REST API Conventions** | [docs/rules/rest_api_conventions.md](./docs/rules/rest_api_conventions.md) | Standard HTTP status codes, enumeration masking, subresource endpoints. |
| **Advanced API Patterns** | [docs/rules/advanced_api_patterns.md](./docs/rules/advanced_api_patterns.md) | Allowed Actions (`_actions`), Idempotency keys, cursor pagination, OCC. |
| **API Versioning** | [docs/rules/api_versioning.md](./docs/rules/api_versioning.md) | URI versioning (`/v1/`), RFC 8594 Sunset/Deprecation headers, 90-day window. |
| **Tenant Dynamic Schemas** | [docs/rules/tenant_dynamic_schemas.md](./docs/rules/tenant_dynamic_schemas.md) | Hybrid core + JSON/document storage, JSON Schema Draft 2020-12, meta-schemas. |
| **Tenant Pluggable Logic** | [docs/rules/tenant_pluggable_logic.md](./docs/rules/tenant_pluggable_logic.md) | Common Expression Language (CEL), Wasm sandboxing, durable workflows (Temporal/BPMN). |
| **Server-Driven UI** | [docs/rules/server_driven_ui.md](./docs/rules/server_driven_ui.md) | Client-agnostic layout schemas, multi-renderer component registries, DTCG tokens. |
| **Database Transactions** | [docs/rules/database_transactions.md](./docs/rules/database_transactions.md) | ACID atomicity, isolation levels, defensive timeouts, transactional outbox. |
| **Database Migrations** | [docs/rules/database_migrations.md](./docs/rules/database_migrations.md) | Declarative/versioned migrations (Atlas/Flyway), zero-downtime expand-contract. |
| **Database Integrity** | [docs/rules/database_integrity.md](./docs/rules/database_integrity.md) | Foreign keys, domain CHECK constraints, interval EXCLUDE, soft-delete indexes. |
| **Database Operations** | [docs/rules/database_operations.md](./docs/rules/database_operations.md) | Continuous PITR, autovacuum/defrag tuning, connection pooling, role separation. |
| **Database Performance** | [docs/rules/database_performance.md](./docs/rules/database_performance.md) | Eliminating N+1 queries, DataLoader batching, composite tenant indexes. |
| **Caching** | [docs/rules/caching.md](./docs/rules/caching.md) | Cache Port semantics, Cache-Aside, jittered TTLs, XFetch stampede defense. |
| **Application Security** | [docs/rules/application_security.md](./docs/rules/application_security.md) | OWASP Top 10 defenses, cryptographic rigor, token bucket rate limiting. |
| **Regulatory Compliance** | [docs/rules/compliance.md](./docs/rules/compliance.md) | SOC 2 Type II controls, ISO/IEC 27001 ISMS, GDPR data erasure rights. |
| **DevSecOps** | [docs/rules/devsecops.md](./docs/rules/devsecops.md) | Secretlint pre-commit gating, CycloneDX SBOM generation, Trivy/Grype scanning. |
| **Error Architecture** | [docs/rules/error_handling.md](./docs/rules/error_handling.md) | Fail-fast schema validation, structured OTel/Pino tracing, RFC 7807 envelopes. |
| **Feature Flags** | [docs/rules/feature_flags.md](./docs/rules/feature_flags.md) | OpenFeature standard, Flipt/Unleash backends, targeting, kill switches. |
| **Continuous Integration** | [docs/rules/continuous_integration.md](./docs/rules/continuous_integration.md) | Shift-left automated pipelines, trunk-based development, build caching. |
| **Continuous Deployment** | [docs/rules/continuous_deployment.md](./docs/rules/continuous_deployment.md) | Zero-downtime rollouts, Cosign container signing, container minimization. |
| **Container Infrastructure** | [docs/rules/container_infrastructure.md](./docs/rules/container_infrastructure.md) | Unified gateway, minimal OCI distroless/scratch containers, non-root user security. |
| **Transactional Email** | [docs/rules/transactional_email.md](./docs/rules/transactional_email.md) | Declarative templates (MJML/JSON), safe interpolation, SMTP integration testing. |
| **Accessibility** | [docs/rules/accessibility.md](./docs/rules/accessibility.md) | WCAG 2.2 AA compliance, accessible primitives, focus trapping, ARIA live regions. |
| **UI Navigation** | [docs/rules/ui_navigation.md](./docs/rules/ui_navigation.md) | Bidirectional URL state synchronization, deep linking, search params. |
| **UI/UX Architecture** | [docs/rules/ui_ux_architecture.md](./docs/rules/ui_ux_architecture.md) | Design triage, persistent app shell, collapsible sidebar, dual-experience portals. |
| **Frontend Architecture** | [docs/rules/frontend_architecture.md](./docs/rules/frontend_architecture.md) | Headless accessible primitives, server-state cache sync, schema form validation, state hierarchy. |
| **Requirements Engineering** | [docs/rules/requirements_engineering.md](./docs/rules/requirements_engineering.md) | User stories vs requirements, 3 C's, INVEST vertical cake slicing, Gherkin. |
| **Product Ownership** | [docs/rules/product_ownership.md](./docs/rules/product_ownership.md) | Product Backlog Management, OKRs, Kano/MoSCoW/RICE, Product Value, empiricism. |
| **Domain-Driven Design** | [docs/rules/domain_driven_design.md](./docs/rules/domain_driven_design.md) | Ubiquitous Language, Bounded Contexts, Aggregates, Capability Mapping. |
| **CQRS & Projections** | [docs/rules/cqrs.md](./docs/rules/cqrs.md) | Evolutionary CQRS spectrum, YAGNI defense, read projections, outbox CDC. |
| **Workflow State Machines** | [docs/rules/workflow_state_machines.md](./docs/rules/workflow_state_machines.md) | Configurable workflows, in-aggregate invariant FSMs, transition guards & audit logs. |
| **Cloud-Native 12-Factor** | [docs/rules/cloud_native.md](./docs/rules/cloud_native.md) | 12-Factor (2026 Edition), OpenTelemetry (OTel), stateless isolates. |
| **Agentic Config & Skills** | [docs/rules/agentic_configuration.md](./docs/rules/agentic_configuration.md) | Progressive disclosure architecture, skill inquiry branches, refinement loop. |
| **Project Management** | [docs/rules/project_management.md](./docs/rules/project_management.md) | Work-In-Progress limits (WIP = 1), SMART developer tasks, Definition of Done. |
| **Relentless Questioning** | [docs/rules/relentless_questioning.md](./docs/rules/relentless_questioning.md) | Dynamic context-aware interrogation loops, adaptive decision trees. |
| **Workspace Isolation** | [docs/rules/workspace_isolation.md](./docs/rules/workspace_isolation.md) | Strict workspace sovereignty, zero global contamination, local ground truth. |
| **Continuous Learning** | [docs/rules/continuous_learning.md](./docs/rules/continuous_learning.md) | Direct rule ingestion, root-cause analysis, dynamic invariant updates. |
---

## 4. Agent Configuration & Workspace Architecture
- **Progressive Disclosure Principle:** Never load all documentation upfront. Rely on the table above to pull specialized instructions only when performing relevant tasks.
- **Nested AGENTS.md for Monorepos:** In multi-package workspaces (e.g. `apps/backend`, `apps/frontend`), place package-specific conventions in nested `AGENTS.md` files scoped strictly to those subtrees.
- **Specialized Skills Catalog:** On-demand multi-step workflows are encapsulated under `.agents/skills/`:
  - [`agentic-architect`](.agents/skills/agentic-architect/SKILL.md): Authoring, auditing, and modularizing agent configurations and skills.
  - [`product-analyst`](.agents/skills/product-analyst/SKILL.md): Aligning OKRs, backlog ordering (Kano/MoSCoW/RICE), INVEST stories, and Gherkin criteria.
  - [`compliance-audit`](.agents/skills/compliance-audit/SKILL.md): Conducting SOC 2, ISO 27001, and OWASP audits using open-source scanners.
  - [`clean-code-refactor`](.agents/skills/clean-code-refactor/SKILL.md): Refactoring code smells with Clean Code, SOLID, and design patterns.
  - [`lets-build`](.agents/skills/lets-build/SKILL.md): Conducting architecture interviews to finalize stack, frameworks, package managers, and bootstrapping projects.
  - [`relentless-questioner`](.agents/skills/relentless-questioner/SKILL.md): Dynamic context-aware interrogation loops before planning and coding.
- **Relentless Skill Architecture Inquiry:** Never author or update skills on assumptions. Interrogate all 7 inquiry branches (placement, trigger intent, domain truth, gotchas/anti-patterns, determinism, progressive bloat, verification loop) defined in [docs/rules/agentic_configuration.md](./docs/rules/agentic_configuration.md) before writing `SKILL.md`.
- **Workspace Memory & Knowledge Hub:** Consult [`memory.md`](./memory.md) for ADRs, and [`docs/knowledge/ubiquitous_language.md`](./docs/knowledge/ubiquitous_language.md) for domain glossaries.
- **Harness Parity & Symlinks:** `AGENTS.md`, `CLAUDE.md`, and `agents.md` must remain identical via filesystem symbolic links to eliminate configuration divergence across different agent harnesses.
