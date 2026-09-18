# Workspace Memory, Architecture Decisions & Knowledge Hub

> **Core Purpose:** Authoritative persistent memory ledger for the workspace repository (`./`), maintaining Lightweight Architectural Decision Records (ADRs), system topologies, issue logs, and institutional lessons.

---

## 1. Quick Navigation & Knowledge Repositories

- 🗺️ **[System Knowledge Graph](./docs/knowledge/knowledge_graph.md)**: Architectural subsystems, Mermaid topologies, entity relationships, and fast-lookup matrices.
- 📋 **[Consolidated DO's & DONT's](./docs/knowledge/dos_and_donts.md)**: High-impact rules, anti-patterns to avoid, and coding invariants.
- 🐛 **[Coding Issue Log](./docs/knowledge/issue_log.md)**: Defect post-mortems, root causes, and synthesized preventing rules.
- 💡 **[Institutional Lessons Learned](./docs/knowledge/lessons_learned.md)**: Strategic engineering takeaways and optimization insights.

---

## 2. Architectural Decision Records (ADRs)

### ADR-001: 100% Open-Source Tooling & Framework Mandate
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Proprietary SaaS dependencies introduce vendor lock-in, recurring operational costs, and black-box security risks.
- **Decision:** Standardize exclusively on open-source solutions across all domains (PostgreSQL, Redis, Trivy, Semgrep, Gitleaks, OpenTelemetry, Vitest, Playwright, Radix UI).
- **Consequences:** Maximizes infrastructure control, auditable security compliance, and zero license encumbrances.

### ADR-002: Progressive Disclosure Architecture for Agentic Context
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Injecting large monolithic documentation files on every AI prompt exhausts token windows and degrades attention and reasoning.
- **Decision:** Keep root `AGENTS.md` lean (≤ 120 lines), decoupling specialized engineering manuals into modular files under `docs/rules/`.
- **Consequences:** Eliminates prompt token bloat while ensuring deep domain guidance is loaded strictly on demand.

### ADR-003: Dual-Layer Multi-Tenancy Isolation with PostgreSQL RLS
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Application-level `where: { tenantId }` filtering is prone to human error, risking catastrophic cross-tenant data leaks.
- **Decision:** Combine application middleware context resolution with database-level PostgreSQL Row-Level Security (RLS) policies as an immutable backstop.
- **Consequences:** Physical isolation at the database layer; prevents cross-tenant data access even if application code forgets a filter.

### ADR-004: Systemic Atomicity & Pure Single-Responsibility Rule Decomposition
- **Date:** 2026-09-16 | **Status:** ACCEPTED
- **Context:** Composite rules with conjunction names (`this_and_that.md`) mix disparate technical concerns, creating documentation bloat and ambiguity.
- **Decision:** Decompose all rules into strictly atomic, single-topic rule files with zero conjunction names, enforcing Single Responsibility Principle across skills, rules, and database operations.
- **Consequences:** 37 highly modular, composable, and maintainable domain rules with zero cross-leakage.

### ADR-005: Universal Technology, Language, and Stack Agnosticism
- **Date:** 2026-09-18 | **Status:** ACCEPTED
- **Context:** Tightly coupling architecture rules and specifications to a single programming language (TypeScript), runtime (Node.js), ORM (Prisma), or database engine (PostgreSQL) creates technical lock-in and prevents polyglot implementation.
- **Decision:** Adopt a Two-Tier Hexagonal / Ports-and-Adapters model across the entire system. Tier 1 mandates 100% technology-, language-, and stack-agnostic invariant domain capabilities and open standard specifications (Protocol Buffers v3, OpenAPI 3.1, JSON Schema Draft 2020-12, AsyncAPI, CloudEvents, W3C DTCG Design Tokens, CEL, Wasm/WASI, OPA/OpenFGA) with zero language bias or primary reference designation. Tier 2 encapsulates interchangeable polyglot adapters (Go, Rust, Python, Java, TypeScript, etc.).
- **Consequences:** Eliminates language and framework lock-in, enables polyglot microservice implementation, future-proofs the enterprise architecture, and enforces pure boundary decoupling.

### ADR-006: Mandatory Full Lifecycle CRUD and Relational Foreign Key Selector Pattern
- **Date:** 2026-09-18 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
Prototypes often provide only partial read and create actions, leaving entities unable to be edited, status-transitioned, or archived/deleted. Furthermore, foreign key associations (such as `parentEntityId`, `resourceId`) are frequently exposed as raw text inputs where users must manually know and type string/UUID identifiers. This creates significant relational failure rates (400 Bad Request, foreign key violations) and breaks standard user experience.

#### 2. Decision Drivers
- Every feature must support its complete lifecycle CRUD (Create, Read/Detail, Update/Transition, Delete/Archive) before being considered feature-complete.
- Foreign keys must never be exposed as raw text fields in the UI. Relational references must be resolved and selected via structured UI primitives (e.g. `<Select>`) displaying human-readable contextual metadata (e.g. names, titles, codes, labels, and status).
- Domain and use case layers must strictly validate foreign key existence before persisting child entities, returning RFC 7807 problem details if referenced records do not exist.

#### 3. Decision Outcome & Consequences
- **Chosen Pattern:** 
  1. Primary and secondary ports support comprehensive CRUD operations (`update`, `delete`, catalog queries).
  2. Use cases enforce foreign key invariants with parent record existence checks prior to child entity mutation.
  3. Presentation layer replaces all raw identifier text inputs with accessible relational dropdown selectors backed by dynamic API queries.
  4. Test suites maintain 100.00% test coverage gate across all CRUD methods, branches, and error paths.
- **Positive Consequences:**
  - Complete elimination of relational integrity errors caused by typos or non-existent IDs.
  - Richer user experience displaying contextual business metadata during association.
  - Strict compliance with workspace definitions of done and 100.00% coverage gates.

### ADR-007: Strict Decoupling of Project Bootstrapping from Domain Analysis and Feature Engineering
- **Date:** 2026-09-18 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
During initial project execution with `/lets-build`, technical infrastructure bootstrapping (stack selection, monorepo setup, package manifests, build toolchains) is frequently conflated with application domain modeling. Agents tend to fabricate business entities without engaging the user in thorough domain discovery, Ubiquitous Language alignment, Bounded Context mapping, or INVEST user story decomposition. This violates Rule Zero ("Assume nothing") and skips the foundational requirements engineering lifecycle.

#### 2. Decision Drivers
- Project bootstrapping must be strictly scoped to technical plumbing (workspace configuration, package manifests, ports/adapters skeletons, build commands, Docker/Compose, and a minimal `/healthz` probe).
- Domain modeling and feature engineering must never be assumed or generated by an agent during bootstrapping.
- Domain features must emerge exclusively through structured stakeholder interviews using `product-analyst`, `relentless-questioner`, `docs/rules/domain_driven_design.md`, and `docs/rules/requirements_engineering.md`.

#### 3. Decision Outcome & Consequences
- **Chosen Pattern:** 
  1. `/lets-build` strictly terminates after technical skeleton creation and health probe verification (`Phase 5`).
  2. A mandatory Handover Gate halts further coding and directs the agent to initiate Domain Analysis.
  3. Domain models, database schemas, and API resources are authored iteratively only after user stories and Gherkin criteria are approved.
- **Positive Consequences:**
  - Prevents premature code generation and hallucinated domain structures.
  - Aligns software design with real stakeholder requirements rather than AI guesses.
  - Ensures proper Outside-In Double-Loop TDD execution.

### ADR-008: Non-Negotiable 5-Phase Agile Domain Lifecycle & Outside-In TDD Invariant
- **Date:** 2026-09-18 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
Engineering practices frequently suffer from shortcutting: writing production code before writing tests, writing tests before understanding domain models, and designing domain models without engaging stakeholders. This leads to brittle software, high defect rates, mismatched requirements, and the "toy prototype blunder" where foreign key relationships, validation rules, and proxy transports are improperly implemented.

#### 2. Decision Drivers
- Need for a mathematically rigorous, repeatable, and non-negotiable software engineering process.
- Guarantee that all production code is justified by an existing, failing automated test (Red-Green-Refactor).
- Guarantee that tests assert real business invariants derived from rigorous domain analysis rather than arbitrary syntax.
- Guarantee that requirements are decomposed into vertically sliced, testable INVEST user stories and Gherkin scenarios.

#### 3. Decision Outcome & Consequences
- **Chosen Pattern:** Enforce an immutable 5-Phase Agile Domain Lifecycle across all tasks:
  1. **Phase 1: Requirements Engineering** (INVEST user stories + executable Gherkin Given/When/Then scenarios + Negative Scope).
  2. **Phase 2: Tactical Domain Analysis** (Ubiquitous Language definitions + Bounded Contexts + Aggregate Roots with invariants + State Machines).
  3. **Phase 3: Outer-Loop Acceptance Test (RED)** (Failing UI component interaction test via Playwright/React Testing Library, or black-box HTTP route contract test).
  4. **Phase 4: Inner-Loop TDD & Collaborator Discovery (RED-GREEN-REFACTOR)** (Collaborators discovered by outer loop unit-tested in isolation, minimal code written to pass, strict refactoring under green).
  5. **Phase 5: Outer Acceptance Resolution & Definition of Done** (Outer test turns GREEN, cross-package boundary smoke tests pass, 100.00% coverage verified).
- **Zero-Deviation Mandate:**
  - Writing production code without a failing test is strictly prohibited.
  - Generating domain entities without stakeholder requirements analysis is strictly prohibited.
  - Committing code without 100.00% full-stack test coverage and boundary verification is strictly prohibited.
- **Positive Consequences:**
  - Eliminates regression bugs and defect escapes to production.
  - Ensures clean, maintainable architecture with small functions (< 30 lines) adhering to SLAP, CQS, and DRY.
  - Guarantees complete alignment between user intent, domain models, tests, and deployed code.

### ADR-009: Many-to-Many Skill Composability & Orthogonal Pipeline Architecture
- **Date:** 2026-09-18 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
In agentic software engineering, a naive assumption is that a single skill corresponds 1:1 to a single task or development phase. In reality, software development exhibits an explicit Many-to-Many ($M:N$) relationship between coding tasks and agentic capabilities:
1. A single coding task simultaneously requires multiple specialized skills: domain requirement decomposition, invariant modeling, security compliance auditing, and clean code refactoring.
2. A single skill (e.g. `clean-code-refactor` or `relentless-questioner`) is orthogonal to any specific domain and must be reused across widely diverse scenarios (database transactions, HTTP middleware, UI components, and background queues).
If skills are designed as monolithic, coupled bundles, agent contexts suffer prompt bloat, cognitive dilution, and cross-contamination.

#### 2. Decision Drivers
- Need for high reusability and atomic modularity across agent skills without prompt token bloat.
- Need for predictable, deterministic execution when multiple skills are required for a single complex engineering task.
- Need for clean input/output contracts so skills can be piped or composed sequentially, contextually, or across subagents without side effects.
- Strict adherence to Rule Zero ("Assume nothing"), Systemic Atomicity, and the Single Responsibility Principle.

#### 3. Decision Outcome & Consequences
- **Chosen Pattern:** Codify and enforce the Many-to-Many Skill Composability Architecture across three formal composition patterns:
  1. **Pattern 1: Sequential Pipeline Chaining (Workflow Composition):** Upstream skills produce structured, standardized artifacts (FAS, INVEST stories, Gherkin blocks, OpenAPI contracts) serving as the direct input contract for downstream skills.
  2. **Pattern 2: Dynamic Skill Stacking (Contextual Composition):** An agent dynamically loads multiple orthogonal skills into its working memory based on task needs, adhering to Progressive Disclosure without polluting base prompts.
  3. **Pattern 3: Multi-Agent Subagent Delegation (Division of Labor):** A coordinator agent spawns specialized subagents equipped with specific atomic skills, synthesizing findings into a single coordinated action.
- **Architectural Invariants for Valid Skill Composition:**
  - **Standardized Output Contracts:** Every skill emits standardized, machine- and human-readable artifacts.
  - **Zero Cross-Contamination:** A skill must never write or mutate code outside its declared functional boundary.
  - **Pure Function Semantics:** Analytical, audit, and questioning skills must remain read-only and side-effect free.
- **Positive Consequences:**
  - Skills remain strictly atomic, modular, and reusable across unlimited domains and stacks.
  - Eliminates prompt bloat by loading only the exact skills needed for the current lifecycle step.
  - Supports complex end-to-end workflows through deterministic artifact piping.


