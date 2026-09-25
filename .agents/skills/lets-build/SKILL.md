---
name: lets-build
description: Use when initializing or bootstrapping a new project from this template workspace, or when the user invokes '/lets-build' to conduct deep research and relentless questioning across language, stack, frameworks, package managers, databases, and architectural layers, followed by scaffolding the finalized project. Do not use for routine bug fixing, editing existing code features, or auditing already bootstrapped projects.
---

# Let's Build: Interactive Architecture Research & Project Bootstrapper

> **Core Purpose:** Conduct an exhaustive, relentless architectural interview across all 18 systemic dimensions to finalize technical choices (language, runtime, frameworks, package managers, databases, tenancy, auth, workflows, observability, CI/CD) with zero assumptions, synthesize an approved ADR, and bootstrap the project following strict Hexagonal architecture.

---

## 1. When to Use This Skill

- When the user starts a fresh project by copying this workspace into a new directory.
- When the user explicitly invokes `/lets-build` or asks to initialize/scaffold a new application.
- When transforming or re-architecting an existing project to adhere to the 41 atomic domain rules.
- **Do NOT use for**:
  - Routine bug fixes or minor edits on an already bootstrapped codebase.
  - Adding a single endpoint or modifying an existing domain model.
  - Running security audits (use `compliance-audit`).
  - Refactoring existing code smells (use `clean-code-refactor`).

---

## 2. Step-by-Step Execution Workflow

Progress through five mandatory stages:

```
1. DISCOVER (Toolchain & Root) ──► 2. INTERROGATE (Relentless Interview) ──► 3. SYNTHESIZE (ADR & Blueprint) ──► 4. BOOTSTRAP (Scaffold Code) ──► 5. VERIFY (Prove Health)
```

---

### Phase 1: Discover (Toolchain & Workspace Inspection)
1. Inspect the workspace root: confirm whether this is a fresh copy or an existing codebase.
2. Check for pre-installed development runtimes and CLI tools (`go`, `rustc`/`cargo`, `python3`/`uv`, `node`/`pnpm`, `docker`, `atlas`, `semgrep`).
3. Verify that `AGENTS.md`, `memory.md`, and `docs/rules/` exist and remain intact.

---

### Phase 2: Interrogate (The Relentless Architecture Interview)
Do NOT guess or assume any technology or stack choice. Execute the relentless interrogation using [references/architecture_interview_matrix.md](./references/architecture_interview_matrix.md). Group questions logically into digestible batches:

#### Batch 1: Domain, Performance & Language
1. **Domain & Problem Statement:** What is the business problem, expected scale (RPS, active tenants), and compliance requirements (SOC 2, ISO 27001, GDPR)?
2. **Primary Programming Language & Runtime:** Go, Rust, Python, TypeScript, Java/Kotlin, C#, or Polyglot microservices?
3. **Package Manager & Toolchain:** Specific package manager (e.g. `uv` vs `poetry`, `cargo`, `pnpm`, `go modules`) and task runner?

#### Batch 2: Transports, Protocols & Persistence
4. **Transport & Network:** REST (OpenAPI 3.1), gRPC (Protobuf v3 via `buf`), GraphQL, or Event-Driven? Which web/transport framework?
5. **Database & Storage Engine:** Relational (PostgreSQL, MySQL, CockroachDB, SQLite) vs Document (MongoDB) vs Hybrid? ORM vs Query Builder vs raw SQL? Canonical 6 Total Audit Fields?
6. **Database Migration Tooling:** Declarative migrations (**Atlas**) vs versioned SQL (**Flyway**, **Liquibase**, **Goose**)?
7. **Multi-Tenancy Isolation Model:** AST query interceptor, Database RLS, Schema-per-tenant, or Database-per-tenant?
8. **Dynamic Schemas & Extensibility:** Universal **JSON Schema Draft 2020-12** in semi-structured columns, EAV, or virtual columns?

#### Batch 3: Pluggable Logic, Security & Identity
9. **Dynamic Business Logic:** Common Expression Language (CEL), GoF Strategy registries, or WebAssembly (Extism) sandboxes?
10. **Workflow Orchestration:** Temporal.io durable execution vs Camunda/Zeebe (BPMN 2.0) vs statecharts?
11. **Authentication & Identity:** OIDC, OAuth 2.1 with PKCE, Passkeys (FIDO2/WebAuthn), PASETO, or JWT with JWKS rotation?
12. **Authorization Engine:** Open Policy Agent (OPA Rego via HTTP/Wasm), OpenFGA (Zanzibar ReBAC), or Cerbos?

#### Batch 4: Presentation, Infrastructure & Quality
13. **Frontend & Presentation:** Web (React/Vue/Svelte/Web Components), Mobile (Flutter/Native), Server-Driven UI (SDUI), and W3C DTCG Design Tokens?
14. **Caching & Locks:** Redis, Valkey, Dragonfly, Memcached, or local LRU with XFetch stampede defense?
15. **Event Streaming:** Apache Kafka, NATS JetStream, RabbitMQ, SQS, with Transactional Outbox?
16. **Observability:** OpenTelemetry OTLP traces/metrics/logs over gRPC/HTTP with W3C trace context?
17. **DevSecOps & Verification:** Semgrep SAST, Gitleaks, Trivy scanning, CycloneDX SBOM, Cosign, and Outside-In TDD (London School) with 100% coverage gates?
18. **Containerization & Deployment:** Minimal OCI Distroless/Scratch, Docker Compose, Kubernetes, and OpenTofu IaC?

#### Batch 5: Lifecycles, State Machines & Ubiquitous Language
19. **State Invariant Separation:** Core Invariant States (Hard FSM in Aggregate Root) vs Tenant-Configurable Operational Workflow Stages (Soft FSM via transition matrices and CEL guards)?
20. **Ubiquitous Language Agreement:** Living glossary contract (`ubiquitous_language.md`) with AST linter denylists and branded nominal types?

---

### Phase 3: Synthesize (Architecture Blueprint & User Sign-Off)
1. Consolidate the user's answers into a formal **Consolidated Architectural Blueprint** (using Section 4 template).
2. Author an Architectural Decision Record in `memory.md` (e.g. `ADR-006: Target Technology Stack & Scaffolding Baseline`).
3. **STOP AND ASK FOR EXPLICIT CONFIRMATION**: Present the blueprint and ADR to the user. Do NOT write scaffolding code until the user approves the blueprint.

---

### Phase 4: Bootstrap (Deterministic Technical Scaffolding)
Upon user confirmation:
1. Run the deterministic workspace initialization script:
   ```bash
   bash .agents/skills/lets-build/scripts/bootstrap_workspace.sh . <language>
   ```
2. Generate base infrastructure and open specification foundations in `specs/`:
   - `specs/openapi/v1/openapi.yaml` (minimal health probe and API versioning metadata)
   - `specs/tokens/tokens.json` (W3C DTCG design tokens baseline)
3. Scaffold initial Hexagonal application technical skeleton following [references/hexagonal_bootstrap_scaffolds.md](./references/hexagonal_bootstrap_scaffolds.md):
   - Pure architecture ports and adapters layout (`src/domain/`, `src/ports/`, `src/adapters/`).
   - Minimal system health probes (`/healthz`, `/readyz`).
   - Strict isolation: **Do NOT scaffold application business features or fabricate domain entities yet.**
4. Generate build manifests (`go.mod`, `Cargo.toml`, `pyproject.toml`, or `package.json`), linter/formatter configurations, minimal multi-stage `Dockerfile`, and `docker-compose.yml`.
5. Scaffold initial test runner and boundary verification smoke test (`scripts/smoke_test.sh`).
6. **Replace Starter README with Project-Specific README**:
   Generate a clean, project-specific `README.md` using [references/project_readme_template.md](./references/project_readme_template.md), completely replacing the starter/meta-template content with the project's actual name, mission, stack highlights, quickstart commands, directory tree, and links to `docs/rules/`.

---

### Phase 5: Verify & Handover to Domain Analysis
1. Run the workspace validation script:
   ```bash
   bash .agents/skills/agentic-architect/scripts/validate_agentic_configs.sh
   ```
2. Execute toolchain dependency checks, build commands, and health probe tests:
   - Compile code and verify zero compiler or lint errors.
   - Verify direct backend and reverse proxy health probes (`/healthz`).
3. **Mandatory Handover to Domain Analysis (STOP & PIVOT):**
   - **`lets-build` IS NOW COMPLETE.** Do NOT proceed to write domain business entities, repositories, or application features.
   - Present the bootstrapped technical skeleton to the user.
   - Instruct the user to invoke `product-analyst` and `relentless-questioner` to initiate the **Domain Discovery & Requirements Engineering Phase** (Ubiquitous Language, Bounded Contexts, Aggregate Boundaries, INVEST User Stories, and Gherkin Acceptance Criteria) before any domain feature code is written.

---

## 3. Gotchas & What NOT to Do

- **MAJOR DONT: DO NOT invent, assume, or scaffold application domain entities, business logic, or feature pages during `/lets-build`.** The `lets-build` skill is strictly an infrastructure and technical stack bootstrapper. Fabricating business domain features without dedicated domain analysis and relentless questioning of the user is a fatal architectural defect.
- **DO NOT** assume the stack. Never start writing Go, Rust, Python, or TypeScript before asking the user.
- **DO NOT** scaffold all options at once. Follow the user's chosen stack strictly.
- **DO NOT** couple domain entities to ORMs, database libraries, or HTTP frameworks. The domain core must remain pure.
- **DO NOT** proceed to code generation without presenting the blueprint and receiving explicit user approval.
- **DO NOT** skip or delete the 41 atomic domain rules in `docs/rules/` during bootstrapping. The rules govern the ongoing lifecycle of the newly bootstrapped project.
- **DO NOT** create monolithic files (> 300 lines) or large functions (> 30 lines). Maintain strict Clean Code standards.

---

## 4. Structured Output Templates

### Consolidated Architectural Blueprint Template
```markdown
# Architectural Specification & Technology Blueprint

## 1. Core Profile
- **Project Domain:** <domain>
- **Primary Language & Runtime:** <language / version>
- **Package Manager & Build Tool:** <tool>

## 2. Interface & Transport
- **Protocols:** <REST / gRPC / CloudEvents>
- **Transport Framework:** <framework>
- **Contracts:** <specs/openapi / specs/protobuf>

## 3. Persistence & Isolation
- **Storage Engine:** <engine & version>
- **Migration Engine:** <Atlas / Flyway / Goose>
- **Tenancy Isolation:** <Model A / B / C / D>
- **Dynamic Schemas:** <JSON Schema Draft 2020-12>

## 4. Logic, Workflows & Identity
- **Dynamic Logic:** <Common Expression Language / Wasm Extism>
- **Workflows:** <Temporal / Camunda / Statecharts>
- **Authentication:** <OIDC / WebAuthn Passkeys / PASETO>
- **Authorization:** <OPA Rego / OpenFGA ReBAC>

## 5. Operations & Quality
- **Caching & Streams:** <Cache Engine / Broker>
- **Observability:** <OpenTelemetry OTLP>
- **DevSecOps:** <Semgrep / Trivy / Gitleaks / Syft>
- **Testing:** Outside-In TDD (100.00% coverage gate)
```
