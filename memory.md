# Workspace Memory, Architecture Decisions & Knowledge Hub

> **Core Purpose:** Authoritative persistent memory ledger for the workspace repository (`./`), maintaining Lightweight Architectural Decision Records (ADRs), system topologies, and living domain contracts.

---

## 1. Quick Navigation & Knowledge Repositories

- 📖 **[Living Ubiquitous Language Glossary](./docs/knowledge/ubiquitous_language.md)**: Authoritative, single-name domain vocabulary contract.
- 📜 **[Lightweight ADR Master Index](#adr-master-index)**: Summary of all architectural decisions and direct links to governing rules.

---

## 2. Consolidated Architectural Decision Records (ADRs)

### ADR Master Index

| ID | Title | Date | Status | Governing Rule / Skill |
|---|---|---|---|---|
| **ADR-001** | 100% Open-Source Tooling & Framework Mandate | 2026-09-16 | ACCEPTED | [`compliance.md`](./docs/rules/compliance.md), [`devsecops.md`](./docs/rules/devsecops.md) |
| **ADR-002** | Progressive Disclosure Architecture for Agentic Context | 2026-09-16 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md) |
| **ADR-003** | Dual-Layer Multi-Tenancy Isolation with PostgreSQL RLS | 2026-09-16 | ACCEPTED | [`multitenancy_isolation.md`](./docs/rules/multitenancy_isolation.md) |
| **ADR-004** | Systemic Atomicity & Pure Single-Responsibility Rule Decomposition | 2026-09-16 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) |
| **ADR-005** | Universal Technology, Language, and Stack Agnosticism | 2026-09-18 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`lets-build`](./.agents/skills/lets-build/SKILL.md) |
| **ADR-006** | Mandatory Full Lifecycle CRUD & Relational FK Selector Pattern | 2026-09-18 | ACCEPTED | [`database_integrity.md`](./docs/rules/database_integrity.md), [`rest_api_conventions.md`](./docs/rules/rest_api_conventions.md), [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md) |
| **ADR-007** | Decoupling Project Bootstrapping from Domain Analysis | 2026-09-18 | ACCEPTED | [`lets-build`](./.agents/skills/lets-build/SKILL.md), [`product-analyst`](./.agents/skills/product-analyst/SKILL.md) |
| **ADR-008** | Non-Negotiable 5-Phase Agile Domain Lifecycle & Outside-In TDD | 2026-09-18 | ACCEPTED | [`test_driven_development.md`](./docs/rules/test_driven_development.md), [`test_isolation.md`](./docs/rules/test_isolation.md) |
| **ADR-009** | Many-to-Many Skill Composability & Orthogonal Pipelines | 2026-09-18 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md) |
| **ADR-011** | Canonical 6 Total Audit Fields Architecture & Modern React Stack | 2026-09-19 | ACCEPTED | [`database_integrity.md`](./docs/rules/database_integrity.md), [`react.md`](./docs/rules/react.md) |
| **ADR-012** | State Machine Lifecycle Configurability & Ubiquitous Language Contract | 2026-09-19 | ACCEPTED | [`workflow_state_machines.md`](./docs/rules/workflow_state_machines.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md) |
| **ADR-013** | Design Architecture Triage, Persistent Shell & Dev Persona Isolation | 2026-09-20 | ACCEPTED | [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md), [`authentication.md`](./docs/rules/authentication.md) |
| **ADR-014** | Product Ownership, Prioritization Models, SMART Tasks & INVEST Slicing | 2026-09-21 | ACCEPTED | [`product_ownership.md`](./docs/rules/product_ownership.md), [`requirements_engineering.md`](./docs/rules/requirements_engineering.md), [`project_management.md`](./docs/rules/project_management.md) |
| **ADR-015** | Problem-First Architecture, Topology Scaffolding, Tipping Points & Nano-TDD | 2026-09-25 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`test_driven_development.md`](./docs/rules/test_driven_development.md), [`lets-build`](./.agents/skills/lets-build/SKILL.md) |
| **ADR-016** | Elimination of Static Markdown Knowledge Graph | 2026-09-25 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`continuous_learning.md`](./docs/rules/continuous_learning.md) |
| **ADR-017** | Progressive Rules Consolidation (DDD & GoF Patterns) | 2026-09-25 | ACCEPTED | [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`design_patterns.md`](./docs/rules/design_patterns.md) |
| **ADR-018** | Elimination of Upstream Changes Ledger and Sync Tooling | 2026-09-25 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`workspace_isolation.md`](./docs/rules/workspace_isolation.md) |


---

### Lightweight Decision Summaries

#### ADR-001: 100% Open-Source Tooling & Framework Mandate
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Proprietary SaaS dependencies introduce vendor lock-in, recurring operational costs, and black-box security risks.
- **Decision:** Standardize exclusively on open-source solutions across all architectural domains (PostgreSQL, Redis, Trivy, Semgrep, Gitleaks, OpenTelemetry, Vitest, Playwright, Radix UI).
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`compliance.md`](./docs/rules/compliance.md), [`devsecops.md`](./docs/rules/devsecops.md).

#### ADR-002: Progressive Disclosure Architecture for Agentic Context
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Injecting large monolithic documentation files on every AI prompt exhausts token windows and degrades model attention.
- **Decision:** Keep root `AGENTS.md` lean (≤ 120 lines), decoupling specialized engineering manuals into modular files under `docs/rules/` and skills under `.agents/skills/`.
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md).

#### ADR-003: Dual-Layer Multi-Tenancy Isolation with PostgreSQL RLS
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Application-level `where: { tenantId }` filtering is prone to human error, risking catastrophic cross-tenant data leaks.
- **Decision:** Combine application middleware context resolution with database-level PostgreSQL Row-Level Security (RLS) policies as an immutable backstop.
- **Enforced In:** [`multitenancy_isolation.md`](./docs/rules/multitenancy_isolation.md).

#### ADR-004: Systemic Atomicity & Pure Single-Responsibility Rule Decomposition
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Composite rules with conjunction names (`this_and_that.md`) mix disparate technical concerns, creating documentation bloat and ambiguity.
- **Decision:** Decompose all rules into strictly atomic, single-topic rule files with zero conjunction names, enforcing Single Responsibility Principle across skills, rules, and database operations.
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md).

#### ADR-005: Universal Technology, Language, and Stack Agnosticism
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Coupling architecture rules to a single programming language or database creates technical lock-in and prevents polyglot implementation.
- **Decision:** Adopt a Two-Tier Hexagonal / Ports-and-Adapters model across the entire system: Tier 1 mandates 100% technology-, language-, and stack-agnostic invariant domain capabilities and open standard specifications; Tier 2 encapsulates interchangeable polyglot adapters.
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`clean_code.md`](./docs/rules/clean_code.md), [`lets-build`](./.agents/skills/lets-build/SKILL.md).

#### ADR-006: Mandatory Full Lifecycle CRUD & Relational Foreign Key Selector Pattern
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Prototypes often provide partial CRUD, leaving entities un-editable or undeletable. Exposing foreign keys as raw text inputs causes severe relational errors.
- **Decision:** Every feature must implement complete lifecycle CRUD (Create, Read/Detail, Update/Transition, Delete/Archive) with 100.00% test coverage. Foreign keys must never be exposed as raw string inputs; they must be resolved via accessible relational dropdown selectors displaying contextual business metadata.
- **Enforced In:** [`database_integrity.md`](./docs/rules/database_integrity.md), [`rest_api_conventions.md`](./docs/rules/rest_api_conventions.md), [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md).

#### ADR-007: Strict Decoupling of Project Bootstrapping from Domain Analysis
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Agents running `/lets-build` frequently fabricate domain entities on sheer assumptions during technical bootstrapping, skipping requirements discovery.
- **Decision:** Project bootstrapping terminates strictly after technical skeleton creation and health probe verification (`Phase 5`). A mandatory Handover Gate halts coding and directs the agent to initiate Domain Analysis via `product-analyst` and `relentless-questioner` before domain models or schemas are authored.
- **Enforced In:** [`lets-build`](./.agents/skills/lets-build/SKILL.md), [`product-analyst`](./.agents/skills/product-analyst/SKILL.md), [`requirements_engineering.md`](./docs/rules/requirements_engineering.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md).

#### ADR-008: Non-Negotiable 5-Phase Agile Domain Lifecycle & Outside-In TDD Invariant
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Writing production code before tests or domain understanding leads to brittle code, regressions, and "toy prototypes."
- **Decision:** Enforce an immutable 5-Phase Agile Domain Lifecycle across all tasks (Requirements ➔ Domain Analysis ➔ Outer Acceptance RED ➔ Inner Unit TDD RED-GREEN-REFACTOR ➔ Outer GREEN & DoD). Writing production code without a failing test is strictly prohibited.
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`test_driven_development.md`](./docs/rules/test_driven_development.md), [`test_isolation.md`](./docs/rules/test_isolation.md).

#### ADR-009: Many-to-Many Skill Composability & Orthogonal Pipeline Architecture
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Complex engineering tasks require multiple orthogonal skills; coupling skills into monolithic bundles causes context bloat and cross-contamination.
- **Decision:** Codify Many-to-Many skill composability via three formal patterns: Sequential Pipeline Chaining, Dynamic Skill Stacking, and Multi-Agent Subagent Delegation, with standardized output contracts, pure function semantics, and zero cross-contamination.
- **Enforced In:** [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md).

#### ADR-011: The Canonical 6 Total Audit Fields Architecture & Modern React Stack
- **Date:** 2026-09-19 | **Status:** ACCEPTED
- **Context:** Inconsistent audit tracking risks SOC 2 / ISO 27001 non-compliance. Frontend `useEffect` fetch loops cause stale states and race conditions.
- **Decision:** Every mutable stateful table must implement the Canonical 6 Total Audit Fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`), with append-only ledgers omitting update/delete fields. Standardize frontend on TanStack Query, React Hook Form + Zod, and headless Radix primitives.
- **Enforced In:** [`database_integrity.md`](./docs/rules/database_integrity.md), [`react.md`](./docs/rules/react.md).

#### ADR-012: State Machine Lifecycle Configurability & Living Ubiquitous Language Contract
- **Date:** 2026-09-19 | **Status:** ACCEPTED
- **Context:** Unconstrained state configurability causes the "Inner Platform Effect." Linguistic drift between business terms and code identifiers breaks domain models.
- **Decision:** Bifurcate state into Core Invariant States (Hard FSM in compiled aggregate roots) and Operational Workflow Stages (Soft FSM in declarative JSON state transition matrices evaluated via CEL/Temporal). Maintain a living, single-name Ubiquitous Language Glossary contract.
- **Enforced In:** [`workflow_state_machines.md`](./docs/rules/workflow_state_machines.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`ubiquitous_language.md`](./docs/knowledge/ubiquitous_language.md).

#### ADR-013: Design Architecture Triage Framework, Persistent Shell & Dev Persona Isolation
- **Date:** 2026-09-20 | **Status:** ACCEPTED
- **Context:** Conflating developer demo personas with production auth creates toy-like prototypes. Untriaged UI produces layout shifts and broken navigation.
- **Decision:** Mandate the 7-Pillar Design Architecture Triage Gate before writing UI code; separate Enterprise Operator Workspace (`/`) from Consumer Portal (`/portal`); standardize on a persistent shell with 64px collapsible icon rail and bidirectional URL state sync; strictly isolate developer demo personas into a dev-only floating toolbar (`import.meta.env.DEV`).
- **Enforced In:** [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md), [`authentication.md`](./docs/rules/authentication.md), [`ui_navigation.md`](./docs/rules/ui_navigation.md).

#### ADR-014: Product Ownership, Backlog Prioritization Models, SMART Developer Tasks & INVEST Slicing
- **Date:** 2026-09-21 | **Status:** ACCEPTED
- **Context:** Teams frequently measure output (lines of code, story points) rather than outcome (customer value), leading to the "Feature Factory" anti-pattern.
- **Decision:** Ground backlog ordering in quantitative prioritization (Kano, MoSCoW, RICE) aligned with OKRs; decompose epics into vertically sliced INVEST user stories; decompose user stories into bounded SMART developer tasks (2–4 hours).
- **Enforced In:** [`product_ownership.md`](./docs/rules/product_ownership.md), [`requirements_engineering.md`](./docs/rules/requirements_engineering.md), [`project_management.md`](./docs/rules/project_management.md), [`product-analyst`](./.agents/skills/product-analyst/SKILL.md).

#### ADR-015: Problem-First Architecture, Topology Scaffolding, Evolutionary Tipping Points & Incremental Nano-Cycle TDD
- **Date:** 2026-09-25 | **Status:** ACCEPTED
- **Context:** Tool-first planning (asking for languages, databases, and microservices upfront) creates accidental complexity and forces non-backend projects (such as Chrome extensions, game engines, or CLIs) into heavy enterprise templates (as observed in `force-dark-light`). Furthermore, AI assistants naturally accelerate architectural drift by appending code without structural evolution, and fake TDD by batch-generating 15 tests and implementations at once.
- **Decision:**
  1. Enforce **Problem-First Architecture**: Strictly separate Problem Space from Solution Space (Evans, Vernon, Brooks). Derive tools and runtimes from problem constraints (latency budget, GC tolerance, memory, execution target).
  2. Implement **Topology-Aware Scaffolding**: Eliminate universal templates. Match architectural styles to system topologies (Platform Scripting for extensions, Data-Oriented Design for game engines, Command Pipeline for CLIs, Hexagonal for enterprise backends).
  3. Codify **Evolutionary Architecture & Architectural Tipping Points**: Enforce Kent Beck's "Refactor-Before-Add" protocol and 5 explicit tipping points to halt AI-generated code rot.
  4. Mandate **True Incremental TDD & Nano-Cycles**: Prohibit batch-test dumps ("Test-First Waterfall"); enforce Uncle Bob's Three Laws (especially Law #2) and Ping-Pong pair programming with verified RED failure proofs.
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`clean_code.md`](./docs/rules/clean_code.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`test_driven_development.md`](./docs/rules/test_driven_development.md), [`lets-build`](./.agents/skills/lets-build/SKILL.md), [`architecture_interview_matrix.md`](./.agents/skills/lets-build/references/architecture_interview_matrix.md).

#### ADR-016: Elimination of Static Markdown Knowledge Graph in Favor of Code-as-Truth & Living Glossary
- **Date:** 2026-09-25 | **Status:** ACCEPTED
- **Context:** Template repositories often maintain static markdown files containing Mermaid diagrams, ERDs, and component topologies (`docs/knowledge/knowledge_graph.md`). In practice, these static artifacts suffer from rapid maintenance drift, violate the Problem-First mandate by pre-fabricating multi-tenant web backend models before the user defines their project, duplicate existing domain rules and memory records, and become stale tokens consumed on every context load.
- **Decision:** Permanently delete `docs/knowledge/knowledge_graph.md`. Treat executable code, strict type definitions, and versioned database migrations as the sole source of truth for architectural topologies. Retain `docs/knowledge/ubiquitous_language.md` as the lightweight, living domain vocabulary contract.
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`clean_code.md`](./docs/rules/clean_code.md), [`continuous_learning.md`](./docs/rules/continuous_learning.md), [`memory.md`](./memory.md).

#### ADR-017: Progressive Rules Consolidation (DDD & GoF Design Patterns)
- **Date:** 2026-09-25 | **Status:** ACCEPTED
- **Context:** Multiple domain rules exhibited redundant overlaps: `domain_expertise.md` duplicated strategic capability mapping and tactical aggregate invariants already governed by `domain_driven_design.md`, while `gof_design_patterns_reference.md` artificially fragmented design patterns into a separate satellite file from `design_patterns.md`. This fragmentation caused token bloat in `AGENTS.md` and scattered domain invariants.
- **Decision:**
  1. Merge business capability tiering (Core/Supporting/Generic) and the Aggregate Root Gatekeeper invariant example into [`domain_driven_design.md`](./docs/rules/domain_driven_design.md). Delete redundant `domain_expertise.md`.
  2. Consolidate the 23 Gang of Four patterns catalog directly into [`design_patterns.md`](./docs/rules/design_patterns.md). Delete redundant `gof_design_patterns_reference.md`.
  3. Streamline rule catalog across `AGENTS.md` and `README.md` to 45 lean, single-responsibility, non-overlapping rules.
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`README.md`](./README.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`design_patterns.md`](./docs/rules/design_patterns.md).

#### ADR-018: Elimination of Upstream Changes Ledger and Upstream Sync Tooling
- **Date:** 2026-09-25 | **Status:** ACCEPTED
- **Context:** Maintaining a manual `changes.md` ledger duplicated state already captured across Git commit history and formal ADR records in `memory.md`. Furthermore, scaffolding `changes.md` into downstream derived projects contaminated them with meta-tooling baggage about the upstream template, violating Problem-First Architecture and Workspace Sovereignty. Accompanying CLI subcommands (`npx azcodr change`) and rule files (`upstream_synchronization.md`) added over 200 lines of accidental maintenance complexity.
- **Decision:**
  1. Permanently delete `changes.md` and retire `docs/rules/upstream_synchronization.md`.
  2. Remove `changes.md` from scaffolded `TEMPLATE_ITEMS` and package manifests.
  3. Purge `logChange` functions, types, and CLI subcommands, restoring `azcodr` CLI as a clean, single-purpose project bootstrapper.
  4. Standardize exclusively on Git commits for historical revision logs and `memory.md` for architectural decision records.
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`README.md`](./README.md), [`lib/scaffold.js`](./lib/scaffold.js), [`bin/azcodr.js`](./bin/azcodr.js), [`memory.md`](./memory.md).

