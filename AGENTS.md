# AGENTS.md

> **azcodr: Strict Architecture Governance & Agentic Engineering Harness**  
> **Workspace Mission:** Problem-first, topology-aligned production architectures governed by strict systemic atomicity, 100% open-source standards, true incremental TDD nano-cycles, and zero speculative bloat.  
> **Runtime & Tools:** Node.js (`>=22.8.0`), npm (`>=10.0.0`) | `npm test` (test runner), `npm run test:coverage` (coverage gate), `npm run lint`, `npm run validate`.  
> **Rule Zero:** Assume nothing. Every action must be grounded in verified evidence from this workspace or direct instructions from the user.  
> **Strict Harness Policy:** Rules apply unconditionally to ALL codebases (greenfield AND existing legacy codebases alike). Legacy debt or missing tests is NEVER an exemption.

---

## 1. Strict Non-Negotiable Invariants (Mandatory in All Cases)
1. **Incremental TDD Nano-Cycles (Uncle Bob's 3 Laws):** STRICTLY FORBIDDEN to write or edit production code (`src/`, `lib/`, `app/`) without FIRST authoring a failing micro-test (RED) and observing test runner failure output. Batch testing ("Test-First Waterfall") is strictly BANNED. One micro-assertion at a time: RED ➔ verify failure ➔ MINIMAL pass GREEN ➔ verify pass ➔ REFACTOR under green.
2. **File & Function Line Ceilings (Kent Beck's Refactor-Before-Add):** Maximum 300 lines per file (250 target), 30 lines per function, 3 parameters max. If an existing file in an existing codebase is already > 300 lines, adding or maintaining lines is STRICTLY BLOCKED; you MUST refactor into modular submodules under passing tests before adding new capabilities.
3. **Clean Code & Systemic Atomicity:** Intention-revealing naming, Command-Query Separation (CQS), Single Level of Abstraction (SLAP), DRY, explicit types, Result `<T, E>` / typed errors, zero unexpected mutations or side effects.
4. **Pillars of System Inquiry (Zero Speculative "Archetypes"):** Never categorize systems or features into arbitrary "Archetypes". Ground all interviews and architectural choices strictly in 4 concrete pillars: **Stack** (runtime, frameworks, DBs), **Language** (types, toolchains), **Patterns** (Hexagonal, Platform Scripting, Command Pipeline, Outbox, CQRS), and **Methodologies** (TDD, Clean Code, Refactor-Before-Add, 100% coverage gates). On existing codebases, inspect and discover the existing Stack, Language, Patterns, and Methodologies first.
5. **Existing Codebase Governance:** Legacy technical debt is never an excuse to bypass rules. Every touch must leave the codebase cleaner (Boy Scout Rule). Characterize untested legacy code with tests before modifying.
6. **Rule Reading Gate:** Before modifying or implementing code in any domain, you MUST inspect the corresponding reference rule in `docs/rules/`.

---

## 2. Execution Lifecycle & Decision Boundaries

Progress all tasks systematically through the unified **Agent Cognitive & Agile Domain Lifecycle**:
```
1. DISCOVER / REQUIREMENTS   ──► Read-only inspection of Stack, Language, Patterns; INVEST stories & Gherkin.
2. INTERROGATE / DOMAIN     ──► Relentless questioning on Domain Concerns & Invariants (State, Auth, Async, UI).
3. PLAN / OUTER TDD         ──► Minimal blast radius; failing Outer Acceptance Test (UI/API RED).
4. EXECUTE / INNER TDD      ──► Incremental nano-cycles (Uncle Bob's 3 Laws: micro-assertion RED ➔ MINIMAL GREEN ➔ REFACTOR).
5. VERIFY / DoD & PROOF     ──► Outer test turns GREEN; boundary smoke tests & 100% coverage on all metrics + mutation gate.
```
- **Branch Questions:** (1) Current State? (2) Target Goal? (3) Tools & Setup? (4) Impact & Risk? (5) Verification?
- **Authority Order:** 1. User Request (Current Session) ➔ 2. Workspace Configs ➔ 3. Existing Code Patterns ➔ 4. Direct Confirmation (Stop & Ask).
- **Action Boundaries:** ALWAYS read files before editing; verify commands before running; verify results with evidence. NEVER guess paths/flags/signatures or ignore errors.
---

## 3. Progressive Disclosure: Specialized Domain Rules

To prevent context bloat and keep prompt overhead minimal, detailed engineering and architectural standards are decoupled into dedicated reference files. **Read these files on demand when working in the relevant domain:**

| Domain | Rule Reference File | When to Consult |
|---|---|---|
| **TDD & Isolation** | [docs/rules/test_driven_development.md](./docs/rules/test_driven_development.md) | Outside-In TDD, Uncle Bob's 3 Laws, 100% coverage on all metrics + mutation gate, test isolation & DB rollback. |
| **Clean Code** | [docs/rules/clean_code.md](./docs/rules/clean_code.md) | Naming, small functions, CQS, SLAP, DRY, DbC, zero side-effects. |
| **Design Patterns** | [docs/rules/design_patterns.md](./docs/rules/design_patterns.md) | Adapter, Factory, Strategy, Result `<T, E>`, and GoF pattern catalog. |
| **Type Safety** | [docs/rules/type_safety.md](./docs/rules/type_safety.md) | Compiler strictness, branded nominal types, type discriminators across polyglot languages. |
| **Authentication** | [docs/rules/authentication.md](./docs/rules/authentication.md) | In-memory access tokens, refresh token rotation (RTR), WebAuthn passkeys. |
| **Authorization** | [docs/rules/authorization.md](./docs/rules/authorization.md) | CASL, OPA Rego policy engines, OpenFGA ReBAC, server guards. |
| **Multi-Tenancy** | [docs/rules/multitenancy_architecture.md](./docs/rules/multitenancy_architecture.md) | Tenant context, 4 isolation models, RLS, dynamic schemas, pluggable logic & YAGNI gates. |
| **API Architecture** | [docs/rules/api_architecture.md](./docs/rules/api_architecture.md) | HTTP status codes, sync vs async (202), `_actions`, idempotency keys, cursor pagination, OCC, versioning. |
| **Server-Driven UI** | [docs/rules/server_driven_ui.md](./docs/rules/server_driven_ui.md) | Backend-driven layout schemas, multi-renderer component registries, DTCG tokens & YAGNI gate. |
| **Database Design** | [docs/rules/database_design.md](./docs/rules/database_design.md) | Relational integrity, FKs, CHECK constraints, Canonical 6 audit fields, ACID transactions, Outbox CDC. |
| **Database Operations** | [docs/rules/database_operations.md](./docs/rules/database_operations.md) | Zero-downtime expand-contract migrations, N+1 elimination, DataLoader, indexing, pooling, PITR. |
| **Caching** | [docs/rules/caching.md](./docs/rules/caching.md) | Cache Port semantics, Cache-Aside, jittered TTLs, XFetch stampede defense & YAGNI gate. |
| **Security & Compliance** | [docs/rules/security_compliance.md](./docs/rules/security_compliance.md) | OWASP Top 10 defenses, rate limiting, crypto, SOC 2 Type II, ISO 27001, GDPR data erasure. |
| **DevOps & CI/CD** | [docs/rules/devops_ci_cd.md](./docs/rules/devops_ci_cd.md) | Shift-left trunk-based CI, OCI distroless containers, Secretlint/Trivy DevSecOps, zero-downtime CD. |
| **Cloud-Native 12-Factor** | [docs/rules/cloud_native.md](./docs/rules/cloud_native.md) | 12-Factor (2026 Edition), OpenTelemetry (OTel), stateless isolates. |
| **Error Architecture** | [docs/rules/error_handling.md](./docs/rules/error_handling.md) | Fail-fast schema validation, structured OTel/Pino tracing, RFC 9457 envelopes. |
| **Feature Flags** | [docs/rules/feature_flags.md](./docs/rules/feature_flags.md) | OpenFeature standard, Flipt/Unleash backends, targeting, kill switches & YAGNI gate. |
| **Transactional Email** | [docs/rules/transactional_email.md](./docs/rules/transactional_email.md) | Declarative templates (MJML/JSON), safe interpolation, SMTP integration testing. |
| **UI/UX Architecture** | [docs/rules/ui_ux_architecture.md](./docs/rules/ui_ux_architecture.md) | Design triage gate, persistent app shell, collapsible sidebar, dual-experience portals, dev persona. |
| **Frontend Architecture** | [docs/rules/frontend_architecture.md](./docs/rules/frontend_architecture.md) | Accessible headless primitives, WCAG 2.2 AA, server cache sync, form validation, 5-tier state, URL navigation. |
| **Requirements Engineering** | [docs/rules/requirements_engineering.md](./docs/rules/requirements_engineering.md) | User stories vs requirements, 3 C's, INVEST vertical cake slicing, Gherkin. |
| **Product Ownership** | [docs/rules/product_ownership.md](./docs/rules/product_ownership.md) | Product Backlog Management, OKRs, Kano/MoSCoW/RICE, Product Value, empiricism. |
| **Project Management** | [docs/rules/project_management.md](./docs/rules/project_management.md) | Work-In-Progress limits (WIP = 1), SMART developer tasks, Definition of Done. |
| **Domain-Driven Design** | [docs/rules/domain_driven_design.md](./docs/rules/domain_driven_design.md) | Ubiquitous Language, Bounded Contexts, Aggregates, Capability Mapping. |
| **CQRS & Projections** | [docs/rules/cqrs.md](./docs/rules/cqrs.md) | Evolutionary CQRS spectrum, YAGNI defense, read projections, outbox CDC. |
| **Workflow State Machines** | [docs/rules/workflow_state_machines.md](./docs/rules/workflow_state_machines.md) | Configurable workflows, in-aggregate invariant FSMs, transition guards & audit logs & YAGNI gate. |
| **Agentic Governance** | [docs/rules/agentic_configuration.md](./docs/rules/agentic_configuration.md) | Progressive disclosure, ADR ledger, workspace sovereignty, continuous learning, YAGNI gate triad. |
| **Relentless Questioning** | [docs/rules/relentless_questioning.md](./docs/rules/relentless_questioning.md) | Dynamic context-aware interrogation loops, adaptive decision trees. |
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
- **Harness Parity & Symlinks:** `AGENTS.md`, `CLAUDE.md`, `agents.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, and `.github/copilot-instructions.md` must remain identical via filesystem symbolic links to eliminate configuration divergence across different agent harnesses.
