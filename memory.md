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
| **ADR-001** | 100% Open-Source Tooling & Framework Mandate | 2026-09-16 | ACCEPTED | [`security_compliance.md`](./docs/rules/security_compliance.md), [`devops_ci_cd.md`](./docs/rules/devops_ci_cd.md) |
| **ADR-002** | Progressive Disclosure Architecture for Agentic Context | 2026-09-16 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md) |
| **ADR-003** | Dual-Layer Multi-Tenancy Isolation with PostgreSQL RLS | 2026-09-16 | ACCEPTED | [`multitenancy_architecture.md`](./docs/rules/multitenancy_architecture.md) |
| **ADR-004** | Systemic Atomicity & Pure Single-Responsibility Rule Decomposition | 2026-09-16 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) |
| **ADR-005** | Universal Technology, Language, and Stack Agnosticism | 2026-09-18 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`lets-build`](./.agents/skills/lets-build/SKILL.md) |
| **ADR-006** | Mandatory Full Lifecycle CRUD & Relational FK Selector Pattern | 2026-09-18 | ACCEPTED | [`database_design.md`](./docs/rules/database_design.md), [`api_architecture.md`](./docs/rules/api_architecture.md), [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md) |
| **ADR-007** | Decoupling Project Bootstrapping from Domain Analysis | 2026-09-18 | ACCEPTED | [`lets-build`](./.agents/skills/lets-build/SKILL.md), [`product-analyst`](./.agents/skills/product-analyst/SKILL.md) |
| **ADR-008** | Non-Negotiable 5-Phase Agile Domain Lifecycle & Outside-In TDD | 2026-09-18 | ACCEPTED | [`test_driven_development.md`](./docs/rules/test_driven_development.md) |
| **ADR-009** | Many-to-Many Skill Composability & Orthogonal Pipelines | 2026-09-18 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md) |
| **ADR-011** | Canonical 6 Total Audit Fields Architecture & Modern React Stack | 2026-09-19 | ACCEPTED | [`database_design.md`](./docs/rules/database_design.md), [`frontend_architecture.md`](./docs/rules/frontend_architecture.md) |
| **ADR-012** | State Machine Lifecycle Configurability & Ubiquitous Language Contract | 2026-09-19 | ACCEPTED | [`workflow_state_machines.md`](./docs/rules/workflow_state_machines.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md) |
| **ADR-013** | Design Architecture Triage, Persistent Shell & Dev Persona Isolation | 2026-09-20 | ACCEPTED | [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md), [`authentication.md`](./docs/rules/authentication.md) |
| **ADR-014** | Product Ownership, Prioritization Models, SMART Tasks & INVEST Slicing | 2026-09-21 | ACCEPTED | [`product_ownership.md`](./docs/rules/product_ownership.md), [`requirements_engineering.md`](./docs/rules/requirements_engineering.md), [`project_management.md`](./docs/rules/project_management.md) |
| **ADR-015** | Problem-First Architecture, Topology Scaffolding, Tipping Points & Nano-TDD | 2026-09-25 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`test_driven_development.md`](./docs/rules/test_driven_development.md), [`lets-build`](./.agents/skills/lets-build/SKILL.md) |
| **ADR-016** | Elimination of Static Markdown Knowledge Graph | 2026-09-25 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) |
| **ADR-017** | Progressive Rules Consolidation (DDD & GoF Patterns) | 2026-09-25 | ACCEPTED | [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`design_patterns.md`](./docs/rules/design_patterns.md) |
| **ADR-018** | Elimination of Upstream Changes Ledger and Sync Tooling | 2026-09-25 | ACCEPTED | [`clean_code.md`](./docs/rules/clean_code.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) |
| **ADR-019** | Evolutionary CQRS Spectrum & Strict YAGNI Tipping Points | 2026-09-26 | ACCEPTED | [`cqrs.md`](./docs/rules/cqrs.md), [`database_design.md`](./docs/rules/database_design.md) |
| **ADR-020** | Universal YAGNI Gate Triad Architecture | 2026-09-26 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`.agents/skills/agentic-architect/SKILL.md`](./.agents/skills/agentic-architect/SKILL.md) |
| **ADR-021** | Language-Agnostic Core Rules Generalization & Toolchain Zero-Rule Policy | 2026-09-26 | ACCEPTED | [`type_safety.md`](./docs/rules/type_safety.md), [`frontend_architecture.md`](./docs/rules/frontend_architecture.md) |
| **ADR-022** | Vendor-Agnostic Frontend Architecture & Library-as-a-Skill Anti-Pattern Defense | 2026-09-26 | ACCEPTED | [`frontend_architecture.md`](./docs/rules/frontend_architecture.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) |
| **ADR-023** | Architectural Cohesion Consolidation (Synthesis of 28 Cohesive Domain Rules) | 2026-09-26 | ACCEPTED | All 28 rules in [`docs/rules/`](./docs/rules/) |
| **ADR-024** | Outside-In Interaction Discovery vs. Inside-Out Invariants & Headless UI Testing | 2026-09-26 | ACCEPTED | [`frontend_architecture.md`](./docs/rules/frontend_architecture.md), [`test_driven_development.md`](./docs/rules/test_driven_development.md) |
| **ADR-025** | Automated Markdown Link Integrity, Scaffolding Boundary Decoupling & Prepublish Quality Gates | 2026-09-26 | ACCEPTED | [`.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh`](./.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md) |
| **ADR-026** | Multi-Harness Parity, Agentic Skill Taxonomy & Deterministic Governance Hardening | 2026-09-26 | ACCEPTED | [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md) |


---

### Lightweight Decision Summaries

#### ADR-001: 100% Open-Source Tooling & Framework Mandate
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Proprietary SaaS dependencies introduce vendor lock-in, recurring operational costs, and black-box security risks.
- **Decision:** Standardize exclusively on open-source solutions across all architectural domains (PostgreSQL, Redis, Trivy, Semgrep, Gitleaks, OpenTelemetry, Vitest, Playwright, Radix UI).
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`security_compliance.md`](./docs/rules/security_compliance.md), [`devops_ci_cd.md`](./docs/rules/devops_ci_cd.md).

#### ADR-002: Progressive Disclosure Architecture for Agentic Context
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Injecting large monolithic documentation files on every AI prompt exhausts token windows and degrades model attention.
- **Decision:** Keep root `AGENTS.md` lean (≤ 120 lines), decoupling specialized engineering manuals into modular files under `docs/rules/` and skills under `.agents/skills/`.
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md).

#### ADR-003: Dual-Layer Multi-Tenancy Isolation with PostgreSQL RLS
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Application-level `where: { tenantId }` filtering is prone to human error, risking catastrophic cross-tenant data leaks.
- **Decision:** Combine application middleware context resolution with database-level PostgreSQL Row-Level Security (RLS) policies as an immutable backstop.
- **Enforced In:** [`multitenancy_architecture.md`](./docs/rules/multitenancy_architecture.md).

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
- **Enforced In:** [`database_design.md`](./docs/rules/database_design.md), [`api_architecture.md`](./docs/rules/api_architecture.md), [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md).

#### ADR-007: Strict Decoupling of Project Bootstrapping from Domain Analysis
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Agents running `/lets-build` frequently fabricate domain entities on sheer assumptions during technical bootstrapping, skipping requirements discovery.
- **Decision:** Project bootstrapping terminates strictly after technical skeleton creation and health probe verification (`Phase 5`). A mandatory Handover Gate halts coding and directs the agent to initiate Domain Analysis via `product-analyst` and `relentless-questioner` before domain models or schemas are authored.
- **Enforced In:** [`lets-build`](./.agents/skills/lets-build/SKILL.md), [`product-analyst`](./.agents/skills/product-analyst/SKILL.md), [`requirements_engineering.md`](./docs/rules/requirements_engineering.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md).

#### ADR-008: Non-Negotiable 5-Phase Agile Domain Lifecycle & Outside-In TDD Invariant
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Writing production code before tests or domain understanding leads to brittle code, regressions, and "toy prototypes."
- **Decision:** Enforce an immutable 5-Phase Agile Domain Lifecycle across all tasks (Requirements ➔ Domain Analysis ➔ Outer Acceptance RED ➔ Inner Unit TDD RED-GREEN-REFACTOR ➔ Outer GREEN & DoD). Writing production code without a failing test is strictly prohibited.
- **Enforced In:** Root [`AGENTS.md`](./AGENTS.md), [`test_driven_development.md`](./docs/rules/test_driven_development.md).

#### ADR-009: Many-to-Many Skill Composability & Orthogonal Pipeline Architecture
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Complex engineering tasks require multiple orthogonal skills; coupling skills into monolithic bundles causes context bloat and cross-contamination.
- **Decision:** Codify Many-to-Many skill composability via three formal patterns: Sequential Pipeline Chaining, Dynamic Skill Stacking, and Multi-Agent Subagent Delegation, with standardized output contracts, pure function semantics, and zero cross-contamination.
- **Enforced In:** [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`agentic-architect`](./.agents/skills/agentic-architect/SKILL.md).

#### ADR-011: The Canonical 6 Total Audit Fields Architecture & Modern React Stack
- **Date:** 2026-09-19 | **Status:** ACCEPTED
- **Context:** Inconsistent audit tracking risks SOC 2 / ISO 27001 non-compliance. Frontend `useEffect` fetch loops cause stale states and race conditions.
- **Decision:** Every mutable stateful table must implement the Canonical 6 Total Audit Fields (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`), with append-only ledgers omitting update/delete fields. Standardize frontend on TanStack Query, React Hook Form + Zod, and headless Radix primitives.
- **Enforced In:** [`database_design.md`](./docs/rules/database_design.md), [`frontend_architecture.md`](./docs/rules/frontend_architecture.md).

#### ADR-012: State Machine Lifecycle Configurability & Living Ubiquitous Language Contract
- **Date:** 2026-09-19 | **Status:** ACCEPTED
- **Context:** Unconstrained state configurability causes the "Inner Platform Effect." Linguistic drift between business terms and code identifiers breaks domain models.
- **Decision:** Bifurcate state into Core Invariant States (Hard FSM in compiled aggregate roots) and Operational Workflow Stages (Soft FSM in declarative JSON state transition matrices evaluated via CEL/Temporal). Maintain a living, single-name Ubiquitous Language Glossary contract.
- **Enforced In:** [`workflow_state_machines.md`](./docs/rules/workflow_state_machines.md), [`domain_driven_design.md`](./docs/rules/domain_driven_design.md), [`ubiquitous_language.md`](./docs/knowledge/ubiquitous_language.md).

#### ADR-013: Design Architecture Triage Framework, Persistent Shell & Dev Persona Isolation
- **Date:** 2026-09-20 | **Status:** ACCEPTED
- **Context:** Conflating developer demo personas with production auth creates toy-like prototypes. Untriaged UI produces layout shifts and broken navigation.
- **Decision:** Mandate the 7-Pillar Design Architecture Triage Gate before writing UI code; separate Enterprise Operator Workspace (`/`) from Consumer Portal (`/portal`); standardize on a persistent shell with 64px collapsible icon rail and bidirectional URL state sync; strictly isolate developer demo personas into a dev-only floating toolbar (`import.meta.env.DEV`).
- **Enforced In:** [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md), [`authentication.md`](./docs/rules/authentication.md), [`frontend_architecture.md`](./docs/rules/frontend_architecture.md).

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
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`clean_code.md`](./docs/rules/clean_code.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`memory.md`](./memory.md).

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
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`README.md`](./README.md), `lib/scaffold.js`, `bin/azcodr.js`, [`memory.md`](./memory.md).

#### ADR-019: CQRS (Command Query Responsibility Segregation) & YAGNI Defense
- **Date:** 2026-09-25 | **Status:** ACCEPTED
- **Context:** Command Query Responsibility Segregation (CQRS) is frequently adopted prematurely across whole applications, violating the YAGNI (You Aren't Gonna Need It) principle and introducing immense accidental complexity: eventual consistency lag, dual schema maintenance, projection drift, loss of ACID transactions, and distributed outbox pipelines. However, segregating read projections from write aggregates is essential for high-contention or high read/write asymmetry bounded contexts.
- **Decision:**
  1. Mandate the **YAGNI Defense**: Default to a Single Model / Single Database architecture for all applications and generic subdomains. CQRS is strictly forbidden as a global, top-level system architecture.
  2. Define an **Evolutionary 4-Tier CQRS Spectrum**:
     - *Level 0 (Method CQS)*: Commands mutate state; queries return values. Zero overhead; mandatory everywhere.
     - *Level 1 (Segregated Handlers)*: Single database/schema. Command Handlers load Aggregates to enforce business invariants; Query Handlers bypass domain entities and query direct SQL projections into flat DTOs.
     - *Level 2 (Segregated Read Models / Materialized Views)*: Single database. Synchronously updated read tables or materialized views for multi-table join optimization.
     - *Level 3 (Polyglot Multi-Store CQRS)*: Dual databases (PostgreSQL write + Elasticsearch/Redis read) synchronized strictly via the Transactional Outbox Pattern and CDC. Permitted only when explicit empirical tipping points (Read:Write > 50:1, search engine requirement, or read starvation) are proven.
  3. Prohibit common anti-patterns: Conflating CQRS with Event Sourcing, dual-write projections without an outbox, and exposing users to eventual consistency lag on their own mutations (enforce Read-Your-Own-Writes consistency via optimistic UI or version headers).
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`README.md`](./README.md), [`docs/rules/cqrs.md`](./docs/rules/cqrs.md), [`docs/rules/clean_code.md`](./docs/rules/clean_code.md), [`docs/rules/database_design.md`](./docs/rules/database_design.md), [`memory.md`](./memory.md).

#### ADR-020: Universal YAGNI Gate Architecture, Tipping Points & Foundational Library Leverage
- **Date:** 2026-09-25 | **Status:** ACCEPTED
- **Context:** LLM coding agents suffer from a known statistical failure mode—"Instruction Creep" and "Eager Pattern Application"—where introducing an advanced architectural rule (e.g. distributed caching, state machines, feature flag servers, server-driven UI) prompts the agent to reflexively implement complex infrastructure across all tasks, even for 50-line CLIs or low-traffic prototypes. Conversely, developers sometimes misinterpret YAGNI as forbidding battle-tested libraries (shadcn/ui, Tailwind CSS, Zod, Lombok), leading to Not-Invented-Here (NIH) syndrome and massive hand-rolled accidental complexity.
- **Decision:**
  1. Codify the **YAGNI Gate Triad** across all architectural pattern rules and skills:
     - *Part 1: The Simple Baseline (Day 1)*: Zero-overhead default (single DB before CQRS; relational indexes before Redis; simple enums before State Machines; standard React before Server-Driven UI; env vars before Flipt).
     - *Part 2: The Anti-Triggers*: Explicit negative scenarios where the pattern is forbidden as premature over-engineering.
     - *Part 3: The Empirical Tipping Point*: Measurable threshold (latency SLA, state count, asymmetry ratio, external scripts) required to graduate.
  2. Clarify **Foundational Leverage vs. Speculative Over-Engineering**: Adopting standard open-source primitives (`shadcn/ui`, `Tailwind CSS`, `Zod`, `TanStack Query`, `Lombok`) to solve concrete present requirements with minimal code is YAGNI-compliant foundational leverage. YAGNI strictly attacks speculative custom code and premature multi-tier distributed architectures.
  3. Retrofit explicit YAGNI Gates across high-risk rules: [`caching.md`](./docs/rules/caching.md), [`workflow_state_machines.md`](./docs/rules/workflow_state_machines.md), [`feature_flags.md`](./docs/rules/feature_flags.md), [`server_driven_ui.md`](./docs/rules/server_driven_ui.md), [`multitenancy_architecture.md`](./docs/rules/multitenancy_architecture.md).
#### ADR-021: Language-Agnostic Core Rules Generalization (`type_safety.md` & `frontend_architecture.md`) and Deferred Project-Specific Specialization via `/lets-build`
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:** Naming rules after specific technologies (`typescript.md`, `react.md`) in a foundational template workspace creates false tool/platform bias, violating Problem-First Architecture and confusing developers initializing Python, Java, Go, Rust, or C# systems. Furthermore, procedural package management rules (e.g. creating rules for `venv` vs `uv` vs `poetry`, or `maven` vs `gradle`) is a severe YAGNI violation and prompt anti-pattern, because LLMs already possess parametric toolchain knowledge and should derive execution commands from native workspace manifests (`pom.xml`, `pyproject.toml`).
- **Decision:**
  1. Generalize technology-specific rule filenames into polyglot architectural disciplines:
     - Rename `typescript.md` ➔ [`type_safety.md`](./docs/rules/type_safety.md): Codifies sound type systems, branded nominal typing, and fail-fast boundary validation across TypeScript, Python (`mypy`/`pydantic`), Java (records), C# (nullable), Rust (newtype), and Go.
     - Rename `react.md` ➔ [`frontend_architecture.md`](./docs/rules/frontend_architecture.md): Codifies headless accessible primitives, server-state cache synchronization and deduplication, declarative schema form validation, 5-tier state separation hierarchy, and design tokens across modern web clients.
  2. Maintain a strict **Zero Toolchain Rule Policy**: Package managers (`uv`, `maven`, `gradle`, `composer`, `cargo`) shall never have dedicated rule files. Instead, `/lets-build` inquires into preferred toolchains during the interview, scaffolds native manifests, and stamps a concise 4-line execution contract into `AGENTS.md` (`## 2. Runtime & Core Scripts`).
  3. Defer project-specific pruning to `/lets-build`: Projects without a frontend (e.g. headless Python backends or Rust CLIs) prune frontend rules during bootstrapping to ensure minimal token footprint.
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`README.md`](./README.md), [`docs/rules/type_safety.md`](./docs/rules/type_safety.md), [`docs/rules/frontend_architecture.md`](./docs/rules/frontend_architecture.md), [`.agents/skills/lets-build/SKILL.md`](./.agents/skills/lets-build/SKILL.md), [`memory.md`](./memory.md).

#### ADR-022: Vendor-Agnostic Frontend Architecture & The "Library-as-a-Skill" Anti-Pattern Defense
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:** Hardcoding a specific library (e.g. `TanStack Query`) as a mandatory requirement in `frontend_architecture.md` violates Problem-First Topology Alignment when building applications with Vue, SvelteKit, Angular, Solid, or React Server Components. Furthermore, a recurring temptation during domain analysis is to dynamically generate dedicated agent "skills" for every chosen library (e.g. `skills/react`, `skills/tanstack`, `skills/shadcn`, `skills/zustand`, `skills/testing-library`).
- **Decision:**
  1. **Vendor-Agnostic Architectural Invariants**: Decouple `frontend_architecture.md` from specific libraries. Codify universal architectural patterns (Headless Accessible Primitives, Server-State Cache Synchronization & Invalidation, Declarative Schema Form Validation, 5-Tier State Separation, and Token Symmetry) illustrated across frameworks (React, Vue, Svelte, Angular).
  2. **Defend Against the "Library-as-a-Skill" Anti-Pattern**: Do NOT generate skills for standard commodity open-source libraries:
     - *Prompt Bloat & Re-explanation Tax:* Skill descriptions are injected into every prompt. Adding 15 library skills floods the context window with parametric knowledge the LLM already knows.
     - *Trigger Collision & Agent Paralysis:* A single UI prompt (e.g. "Create a profile form with data fetch") collides across multiple library skills (`react`, `tanstack`, `shadcn`, `testing-library`), causing wasteful subagent hops.
     - *Passive Libraries vs. Active Workflows:* A skill is an active multi-step procedure (e.g. `/lets-build`, `product-analyst`, `compliance-audit`). A library is passive code whose usage is derived from code manifests (`package.json`, `components.json`), local component directories (`components/ui`), and CLI tools (`npx shadcn@latest add`).
  3. **The 4-Layer Resolution Standard for Project Stack Knowledge**:
     - *Layer 1 (Ground Truth Manifests):* `package.json`, `tsconfig.json`, `components.json`.
     - *Layer 2 (Stack Contract in `AGENTS.md`):* 3–5 line declaration in project entrypoint stamped by `/lets-build`.
     - *Layer 3 (Universal Domain Rules):* `frontend_architecture.md`, `test_driven_development.md`, `api_architecture.md`.
     - *Layer 4 (Tool & CLI Execution):* Direct execution of package CLIs (`npx shadcn@latest add`) or MCP servers.
- **Enforced In:** [`frontend_architecture.md`](./docs/rules/frontend_architecture.md), [`agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`memory.md`](./memory.md).

#### ADR-023: Architectural Cohesion Consolidation (Synthesis of 28 Cohesive Domain Rules)
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:** The workspace rules had suffered from micro-rule fragmentation (45 separate files, with 15 files under 35 lines), creating high cognitive discovery overhead, duplicated directives, and split concerns across closely related domains (e.g. 5 UI files, 5 database files, 4 DevOps files, 3 multi-tenancy files, 3 API files).
- **Decision:**
  Consolidate fragmented micro-rules into 28 cohesive, single-responsibility domain rules:
  1. **Frontend & UI**: Merge `accessibility.md` and `ui_navigation.md` into [`frontend_architecture.md`](./docs/rules/frontend_architecture.md). Retain [`ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md) for system design/layout and [`server_driven_ui.md`](./docs/rules/server_driven_ui.md) for backend schemas.
  2. **API Architecture**: Merge `rest_api_conventions.md`, `advanced_api_patterns.md`, and `api_versioning.md` into [`api_architecture.md`](./docs/rules/api_architecture.md) (covering HTTP status codes, sync vs async 202 processing, `_actions`, idempotency keys, cursor pagination, OCC, and RFC 8594 lifecycle deprecation).
  3. **Multi-Tenancy**: Merge `multitenancy_isolation.md`, `tenant_dynamic_schemas.md`, and `tenant_pluggable_logic.md` into [`multitenancy_architecture.md`](./docs/rules/multitenancy_architecture.md) (unifying context resolution, 4 isolation models, RLS, dynamic schemas, and pluggable logic with YAGNI gates).
  4. **Database Architecture**: Consolidate into 2 atomic rules: [`database_design.md`](./docs/rules/database_design.md) (relational integrity, FKs, CHECKs, Canonical 6 Audit Fields, ACID transactions, Outbox pattern) and [`database_operations.md`](./docs/rules/database_operations.md) (zero-downtime expand-contract migrations, N+1 elimination, DataLoader, indexing, connection pooling, PITR).
  5. **DevOps & CI/CD**: Merge `continuous_integration.md`, `continuous_deployment.md`, `container_infrastructure.md`, and `devsecops.md` into [`devops_ci_cd.md`](./docs/rules/devops_ci_cd.md).
  6. **Security & Compliance**: Merge `application_security.md` and `compliance.md` into [`security_compliance.md`](./docs/rules/security_compliance.md).
  7. **Testing**: Merge `test_isolation.md` into [`test_driven_development.md`](./docs/rules/test_driven_development.md).
  8. **Agent Governance**: Merge `workspace_isolation.md`, `continuous_learning.md`, and `architecture_decision_records.md` into [`agentic_configuration.md`](./docs/rules/agentic_configuration.md).
- **Consequences:** Eliminates 22 fragmented micro-files, reduces `AGENTS.md` table from 45 to 28 rows, and aligns every rule with True Single Responsibility.
#### ADR-024: Outside-In Interaction Discovery vs. Inside-Out Domain Invariants, Headless UI Testing Architecture for AI Agents, and Universal Mermaid Diagram Standards
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:**
  1. The classic software dichotomy: "Does UI (CLI, GUI, API) dictate logic or vice versa?" Misunderstanding this relationship causes teams to either tightly couple business rules to UI frameworks (fat UI components) or build ivory-tower domain models detached from real customer journeys.
  2. Autonomous AI agents operate in headless execution environments with zero visual eyesight. Standard engineering workflows frequently neglect UI testing or rely on fragile manual browser inspection that AI agents cannot execute or verify.
  3. Workspace rules previously contained ad-hoc ASCII art diagrams that render inconsistently across markdown viewports, violate the user formatting directive, and cannot be dynamically rendered by modern Git platforms.
- **Decision:**
  1. **Outside-In Interaction Discovery vs. Inside-Out Domain Invariants Law**:
     - *Phase 1 & 2 (Outside-In Discovery)*: UI, CLI, and client interaction models guide *what capabilities are needed* early. The customer journey discovers input command payloads, output presentation DTOs, and state requirements.
     - *Phase 3 & 4 (Inside-Out Execution & Invariants)*: Domain entities enforce *how business rules operate*. Core business invariants are 100% agnostic to presentation frameworks, decoupled via Driving Ports (Use Cases).
     - *Headless / Zero-UI Topologies*: In systems without a graphical interface (microservices, daemons, developer CLIs), the external API schema (OpenAPI, gRPC) or CLI command pipeline IS the UI. The identical Outside-In discovery law applies.
  2. **The 4-Tier Headless UI Testing Pyramid for Autonomous AI Agents**:
     - *Tier 1 (Accessible Component Tests)*: `@testing-library` + `user-event`. Query elements strictly by accessible ARIA roles (`getByRole`), ensuring semantic accessibility and banning brittle CSS selectors.
     - *Tier 2 (Network Interception & Universal UI States)*: `MSW` (Mock Service Worker). Test all 4 universal UI states (Loading, Success, Error, Empty) deterministically in memory without live backends.
     - *Tier 3 (Zero-Eyesight Automated Accessibility)*: `axe-core` (`vitest-axe` / `@axe-core/playwright`). Execute programmatic WCAG 2.2 AA assertions providing empirical pass/fail proof without visual eyesight.
     - *Tier 4 (Headless E2E Smoke Tests)*: Headless Playwright CLI runs. Validate critical user journeys with traces, screenshots, and video recordings captured automatically upon test failure.
  3. **Universal Mermaid Diagram Standard**:
     - Standardize exclusively on GitHub-Flavored Markdown Mermaid diagrams (`flowchart`, `sequenceDiagram`, `classDiagram`) across all workspace rules, replacing all legacy ASCII box drawings.
- **Enforced In:** [`docs/rules/frontend_architecture.md`](./docs/rules/frontend_architecture.md), [`docs/rules/test_driven_development.md`](./docs/rules/test_driven_development.md), [`docs/rules/api_architecture.md`](./docs/rules/api_architecture.md), all 28 domain rules in [`docs/rules/`](./docs/rules/), [`memory.md`](./memory.md).

#### ADR-025: Automated Markdown Link Integrity, Scaffolding Boundary Decoupling & Prepublish Quality Gates
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:**
  1. As rules are refactored or consolidated, internal relative links across markdown documentation (`memory.md`, `README.md`, skills, rules) risk breaking silently without automated CI detection.
  2. Scaffolding templates that reference repository-internal files (`lib/`, `bin/`) fail when evaluated in downstream isolated workspaces, violating Workspace Sovereignty.
  3. Prepublish hooks omitted linting, risking publishing untested syntax.
- **Decision:**
  1. **Automated Cross-Reference & Link Integrity Enforcement**: Embed a deterministic link validator into `validate_agentic_configs.sh` that scans all markdown files across the workspace and asserts that 100% of internal links resolve to valid files on disk.
  2. **Scaffolding Boundary Decoupling**: Sanitize all documentation and memory records to format internal packaging files (`lib/`, `bin/`) in code font rather than relative markdown links, ensuring scaffolded projects pass validation with zero broken links.
  3. **Prepublish Quality Gate**: Expand `prepublishOnly` in `package.json` to enforce `npm run lint && npm run test:coverage && npm run validate` prior to distribution.
- **Enforced In:** [`.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh`](./.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh), [`docs/rules/agentic_configuration.md`](./docs/rules/agentic_configuration.md), `package.json`, [`memory.md`](./memory.md).

#### ADR-026: Multi-Harness Parity, Agentic Skill Taxonomy & Deterministic Governance Hardening
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:**
  1. The repository's harness parity previously only symlinked `CLAUDE.md` and `agents.md`, omitting Google Antigravity & Gemini CLI (`GEMINI.md`), Cursor (`.cursorrules`), and Windsurf (`.windsurfrules`), leading to configuration discovery divergence across different AI coding environments.
  2. Root `AGENTS.md` omitted required top-level Workspace Identity, Mission, and Runtime Environment contracts mandated by `agentic_configuration.md`.
  3. Skill subdirectories used non-standard terminology (`assets/` instead of `resources/` / `examples/`), and skills (`lets-build`, `relentless-questioner`) lacked explicit `## 5. Subdirectories & Progressive Resources` catalogs, leaving reference files orphaned.
  4. The deterministic configuration validator omitted checks for closing frontmatter delimiters, negative boundary trigger phrasing in skill descriptions, and additional harness symlinks.
- **Decision:**
  1. **Omni-Harness Parity**: Expand harness parity to establish and assert symlinks across all 5 major AI coding harnesses: `CLAUDE.md`, `agents.md`, `GEMINI.md`, `.cursorrules`, and `.windsurfrules` pointing to root `AGENTS.md`. Update `lib/scaffold.js` to automatically stamp all 5 symlinks during scaffolding.
  2. **Standardized Skill Folder Taxonomy**: Align skill subdirectory architecture strictly with standard Agent Skills and Antigravity specifications: `scripts/` (executable tools), `references/` (documentation), `resources/` (schemas/templates), and `examples/` (reference patterns), permanently retiring `assets/`.
  3. **Progressive Resource Discoverability**: Ensure 100% of skills in `.agents/skills/` catalog all sub-resources and scripts under a standardized `## 5. Subdirectories & Progressive Resources` section with active links.
  4. **Rigorous Configuration Validator Gates**: Enhance `validate_agentic_configs.sh` to validate all 5 harness symlinks, assert YAML frontmatter closure, verify negative boundary phrasing in skill descriptions, and handle `file://` URIs without false positives.
  5. **Polyglot Skill Neutrality**: Purge hardcoded language-specific assumptions from `clean-code-refactor` and `compliance-audit`, generalizing to universal code health and type safety contracts.
- **Enforced In:** [`AGENTS.md`](./AGENTS.md), [`docs/rules/agentic_configuration.md`](./docs/rules/agentic_configuration.md), [`.agents/skills/agentic-architect/SKILL.md`](./.agents/skills/agentic-architect/SKILL.md), [`.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh`](./.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh), `lib/scaffold.js`, `bin/azcodr.js`, [`memory.md`](./memory.md).

#### ADR-027: Enterprise Agentic Hardening — Lifecycle Hooks, MCP Blueprints, Topology Tracking & Verification Smokes
- **Date:** 2026-09-26 | **Status:** ACCEPTED
- **Context:**
  1. The 5-iteration relentless agentic audit identified missing out-of-the-box working schemas for Antigravity Lifecycle Hooks (`hooks.json`) and vendor-neutral Model Context Protocol servers (`mcp_config.json`), leaving users to manually divine JSON schemas for safety guards and MCP tools.
  2. Scaffolding scripts (`bootstrap_workspace.sh`) created empty directory topologies without `.gitkeep`, causing Git to ignore empty leaf folders upon commit and silently dropping scaffolded architecture trees.
  3. Projects scaffolded via `lets-build` lacked a deterministic starter for the required Phase 5 Boundary Verification Smoke Test (`scripts/smoke_test.sh`).
  4. Configuration validation symlink checks strictly matched `"AGENTS.md"`, failing if a symlink used `./AGENTS.md` or absolute paths.
- **Decision:**
  1. **Lifecycle Hooks & MCP Schema Blueprints**: Provide `.agents/hooks.json.example` (configuring `PreToolUse`, `PostToolUse`, `Stop` with `"enabled": false`) and `.agents/mcp_config.json.example` (Stdio and SSE server blueprints) out-of-the-box in the template root for zero-guesswork integration.
  2. **Topology Git Preservation**: Update `bootstrap_workspace.sh` with a `create_leaf` helper that automatically places `.gitkeep` inside empty scaffolded leaf directories across all topologies (extension, game engine, CLI, backend).
  3. **Deterministic Boundary Smoke Test Generation**: Update `bootstrap_workspace.sh` to generate an executable starter `scripts/smoke_test.sh` upon workspace bootstrapping, satisfying Phase 5 verification gates out-of-the-box.
  4. **Path-Tolerant Symlink & Fallback Validation**: Enhance `validate_agentic_configs.sh` with `is_valid_agents_target` and `is_valid_text_pointer` helpers accepting relative (`./AGENTS.md`) and absolute paths, while adding non-breaking validation for `.github/copilot-instructions.md`.
- **Enforced In:** [`.agents/hooks.json.example`](./.agents/hooks.json.example), [`.agents/mcp_config.json.example`](./.agents/mcp_config.json.example), [`.agents/skills/lets-build/scripts/bootstrap_workspace.sh`](./.agents/skills/lets-build/scripts/bootstrap_workspace.sh), [`.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh`](./.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh), [`memory.md`](./memory.md).


