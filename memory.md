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

### ADR-011: The Canonical 6 Total Audit Fields Architecture & Modern React Stack
- **Date:** 2026-09-19 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
Stateful entities across databases and domain models frequently suffer from inconsistent audit accountability—omitting actor attribution (`createdBy`, `updatedBy`) or destructive deletion tracking (`deletedAt`, `deletedBy`). Furthermore, frontend state management often defaults to ad-hoc `useEffect` fetch loops and unvalidated forms without structured caching, automated mutation invalidation, or sound schema contracts.

#### 2. Decision Drivers
- Universal Total Audit Accountability: Every stateful database table, ORM entity, and domain aggregate must implement **The Canonical 6 Total Audit Fields**: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, and `deletedBy`.
- Strictly Immutable Ledger Invariant: Append-only financial ledgers and event outboxes must enforce strict immutability, prohibiting `updatedAt`, `updatedBy`, `deletedAt`, and `deletedBy`.
- Non-Destructive Soft-Delete: All delete operations must mark `deletedAt` and `deletedBy` with actor attribution, and queries for active records must strictly filter `WHERE deletedAt IS NULL`.
- Modern React Architecture: Standardize on `@tanstack/react-query` for asynchronous server state, caching, and optimistic mutations; standardize on `react-hook-form` / `tanstack-form` + `zod` for type-safe form contracts; mandate accessible headless primitives (`shadcn/ui` + `@radix-ui`) with zero native alerts.

#### 3. Decision Outcome & Consequences
- Codified Section 5 & 6 in [`docs/rules/database_integrity.md`](./docs/rules/database_integrity.md) mandating the Canonical 6 Total Audit Fields and append-only ledger invariants.
- Authored [`docs/rules/react.md`](./docs/rules/react.md) codifying TanStack Query, React Hook Form + Zod, TanStack Table, and accessible `<ConfirmDialog>` primitives.
- Upgraded `lets-build` architecture interview matrix (Dimensions 6 & 13) to interrogate audit fields and form state management during scaffolding.
- **Positive Consequences:**
  - Complete compliance with SOC 2 / ISO 27001 auditability controls.
  - Permanent prevention of accidental data loss via soft deletion.
  - Predictable, type-safe frontend state management with zero stale cache bugs.

### ADR-012: State Machine Lifecycle Configurability & Living Ubiquitous Language Contract
- **Date:** 2026-09-19 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
Two recurring systemic questions arise during enterprise architecture evolution:
1. *State Configurability Paradox:* Should all status fields and business logic be user/tenant-configurable? Unconstrained configurability leads to the "Inner Platform Effect" anti-pattern, where core domain invariants collapse.
2. *Linguistic Drift & Agreement:* How can domain-code language agreement be maintained deterministically across product requirements, code, tests, and database tables without vocabulary divergence?

#### 2. Decision Drivers
- Invariant Integrity: Core business invariants (e.g. accounting balance, executed orders) must be non-negotiable and protected inside compiled Aggregate Roots.
- Operational Customization: Multi-tenant platforms require configurable review stages, approval funnels, and sub-statuses.
- Guaranteed Linguistic Alignment: Establish a binding, living contract between business vocabulary and source code identifiers, backed by AST linter rules and branded nominal types.

#### 3. Decision Outcome & Consequences
- **The Dual-State Architecture ([`docs/rules/workflow_state_machines.md`](./docs/rules/workflow_state_machines.md)):**
  - Bifurcated state into:
    1. *Core Invariant States (Hard FSM)*: Enforced strictly inside compiled Aggregate Roots using Discriminated Unions or the GoF State Pattern.
    2. *Operational Workflow Stages (Soft FSM)*: Managed via Declarative State Transition Matrices stored in JSON/metadata, evaluated via Common Expression Language (CEL) or durable workflow engines (Temporal / BPMN 2.0).
  - Enforced a mandatory append-only State Transition Log (`transitionId`, `entityType`, `entityId`, `fromState`, `toState`, `actorId`, `event`, `timestamp`).
- **Domain-Code Language Agreement ([`docs/rules/domain_driven_design.md`](./docs/rules/domain_driven_design.md) & [`docs/knowledge/ubiquitous_language.md`](./docs/knowledge/ubiquitous_language.md)):**
  - Codified the "Single Name Rule" and zero-tolerance for synonyms.
  - Established the living glossary template and AST linter denylist patterns.
- **Upgraded Skills & References:**
  - Enhanced `product-analyst` and `lets-build` (Dimensions 19 & 20) to interrogate state taxonomy and verify glossary alignment.
- **Positive Consequences:**
  - Complete architectural clarity: aggregate invariants remain inviolate while operational workflows gain full tenant configurability.
  - Elimination of linguistic drift across domain models, APIs, and UI layers.

### ADR-013: Formal Design Architecture Triage Framework, Persistent Navigation Shell, Dual-Experience Portals, and Strict Isolation of Development Personas from Production Authentication
- **Date:** 2026-09-20 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
UI development without upfront design architecture triage creates severe user experience and security failure modes:
1. Conflating developer demo/mock personas with end-user sign-in flows, producing a toy-like prototype that confuses real users.
2. Mixing operator-dense navigation with consumer self-service workflows into a single chaotic layout.
3. Lack of a persistent application shell and collapsible sidebar, causing disruptive layout shifts and broken navigation state on page transitions.
4. Missing deep-linkable URL synchronization for active tabs, search queries, and drawers.

#### 2. Decision Drivers
- Need for a mandatory upfront design gate before writing UI code.
- Strict physical separation between developer test harnesses and production authentication.
- Strict architectural duality between enterprise operator workspaces and consumer/member portals.
- Persistent app shell with collapsible 64px icon rail mode, persistent state in `localStorage`, and bidirectional URL search parameter synchronization.

#### 3. Decision Outcome & Consequences
- **The 7-Pillar Design Architecture Triage Gate ([`docs/rules/ui_ux_architecture.md`](./docs/rules/ui_ux_architecture.md)):**
  - Mandated 7 triage pillars (Role Triage, Information Architecture, Duality, Wayfinding, URL Sync, Route Guards, Accessibility) before building UI increments.
- **Strict Decoupling of Developer Personas ([`docs/rules/authentication.md`](./docs/rules/authentication.md)):**
  - Developer demo personas are completely isolated into a dev-only floating toolbar (`import.meta.env.DEV`), completely excluded from production bundles.
  - Production sign-in enforces clean, dedicated forms with Zod schema validation and role-based post-login redirection.
- **Dual-Experience Model & Persistent Shell:**
  - Separated Enterprise Operator Workspace (`/`) from Consumer / Member Self-Service Portal (`/portal`).
  - Standardized persistent header, contextual breadcrumbs, collapsible sidebar with 64px icon rail, and URL search param state sync.
- **Positive Consequences:**
  - Eliminates toy-like demo persona leaks in production.
  - Clean separation between dense administrative workflows and consumer self-service.
  - Fully accessible, deep-linkable web applications conforming to WCAG 2.2 AA.

### ADR-014: Product Ownership, Backlog Prioritization Models, SMART Developer Tasks, and INVEST Slicing
- **Date:** 2026-09-21 | **Status:** ACCEPTED

#### 1. Context & Problem Statement
Agile teams frequently suffer from the "Feature Factory" anti-pattern: measuring output (story points burned, code volume) instead of outcome (customer value realized, satisfaction gap closed). Additional failure modes include:
1. Conflating user stories with formal requirements rather than treating them as conversational placeholders (the 3 C's) and pidgin language bridges.
2. Forcing system invariants, security controls, and architectural spikes into artificial `"As a user..."` syntax.
3. Slicing stories horizontally (e.g. database migration only or UI mock only) delivering zero usable software to customers.
4. Open-ended developer tasks lacking measurable pass/fail boundaries, leading to multi-day task drift.
5. Arbitrary backlog prioritization driven by executive gut feeling rather than quantitative value models.

#### 2. Decision Drivers
- Ground product development in empiricism (Build-Measure-Learn) and clear Product Goals.
- Connect strategic Objectives and Key Results (OKRs) to backlog ordering.
- Standardize objective prioritization frameworks (Kano Model, MoSCoW, RICE, Buy a Feature).
- Mandate Bill Wake's INVEST criteria and vertical cake slicing (UI ➔ API ➔ Domain ➔ DB).
- Standardize Bill Wake's SMART framework for decomposing user stories into bounded developer tasks (2–4 hours).

#### 3. Decision Outcome & Consequences
- **Dedicated Rule & Skill ([`docs/rules/product_ownership.md`](./docs/rules/product_ownership.md), [`.agents/skills/product-analyst/`](./.agents/skills/product-analyst/)):**
  - Codified Product Owner accountabilities, the satisfaction gap, and outcome vs. output discipline.
  - Added reference guides for Kano, MoSCoW, RICE scoring, and OKR alignment.
- **Requirements Engineering & Vertical Cake Slicing ([`docs/rules/requirements_engineering.md`](./docs/rules/requirements_engineering.md)):**
  - Clarified that user stories are tokens for conversation (Ron Jeffries' 3 C's: Card, Conversation, Confirmation).
  - Explicitly decoupled non-story requirements (system invariants, NFRs, architectural spikes) from story syntax.
  - Enforced multi-layer cake vertical slicing across all layers.
- **SMART Developer Task Breakdown ([`docs/rules/project_management.md`](./docs/rules/project_management.md)):**
  - Required decomposing INVEST stories into Specific, Measurable, Achievable, Relevant, and Time-boxed (2–4h) developer tasks.
- **Positive Consequences:**
  - Guarantees working software in every vertical increment.
  - Eliminates horizontal stubs and open-ended technical drift.
  - Objective backlog ranking minimizes stakeholder friction.




