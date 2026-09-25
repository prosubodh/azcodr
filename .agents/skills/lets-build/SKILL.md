---
name: lets-build
description: Use when initializing or bootstrapping a new project from this template workspace, or when the user invokes '/lets-build' to conduct deep research and relentless questioning across language, stack, frameworks, package managers, databases, and architectural layers, followed by scaffolding the finalized project. Do not use for routine bug fixing, editing existing code features, or auditing already bootstrapped projects.
---

# Let's Build: Problem-First Architecture Research & Project Bootstrapper

> **Core Purpose:** Conduct an exhaustive, problem-first architectural interview across domain essence, physical constraints, and system topology to derive technical choices (language, runtime, frameworks, build tools, architectural style) with zero assumptions, synthesize an approved ADR, and bootstrap a lean, strictly YAGNI project foundation.

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
1. DISCOVER (Toolchain & Root) ──► 2. INTERROGATE (Problem-First Interview) ──► 3. SYNTHESIZE (ADR & Blueprint) ──► 4. BOOTSTRAP (Topology Scaffolding) ──► 5. VERIFY (Prove Health)
```

---

### Phase 1: Discover (Toolchain & Workspace Inspection)
1. Inspect the workspace root: confirm whether this is a fresh copy or an existing codebase.
2. Check for pre-installed development runtimes and CLI tools (`go`, `rustc`/`cargo`, `python3`/`uv`, `node`/`pnpm`, `docker`, `semgrep`).
3. Verify that `AGENTS.md`, `memory.md`, and `docs/rules/` exist and remain intact.

---

### Phase 2: Interrogate (The Problem-First Architecture Interview)
Do NOT guess or assume any technology or stack choice. Execute the relentless interrogation using [references/architecture_interview_matrix.md](./references/architecture_interview_matrix.md). Group questions logically into digestible batches:

#### Batch 1: Problem Space & System Topology
1. **Domain & Problem Statement:** What real-world problem or capability does this system solve? What data moves, and what transformations occur?
2. **System Topology Classification:** Which topology best matches the execution target?
   - Topology A: Web SaaS / Cloud Microservices
   - Topology B: Browser Extension (Manifest V3)
   - Topology C: Game Engine / High-Performance Simulator (Bare metal, GPU)
   - Topology D: Browser / Canvas Game (HTML5 Canvas / WebGL / WebGPU)
   - Topology E: Desktop Application / CLI Utility (Native POSIX/Windows)
   - Topology F: Embedded / Systems Library

#### Batch 2: Operational & Physical Constraints (The Machine Reality)
3. **Latency & Time Budget:** Hard real-time (<16.6ms / <7ms frame loop), interactive low-latency (<10ms keystroke), soft service API (<200ms p99), or batch?
4. **Memory Management & GC Tolerance:** Zero-GC pause tolerance (demands C/C++/Rust/Zig), managed throughput GC (Go, Java 21+, C# .NET 9), or single-threaded event loop (JS/TS)?
5. **Concurrency & Execution Model:** Single-threaded event loop, multi-threaded worker pools with work stealing, SIMD compute shaders, or distributed actors?
6. **Persistence & Connectivity:** Zero persistence (in-memory only), local flat/binary files, embedded SQLite, client-side browser storage, or enterprise RDBMS (Postgres)? Zero network, WebSockets, UDP, or HTTP/REST/gRPC?

#### Batch 3: Architectural Style & Emergent Toolchain
7. **Architectural Style Derivation:**
   - Web SaaS ➔ Modular Monolith / Hexagonal (Ports & Adapters)
   - Browser Extension ➔ Platform Scripting (`background`, `content`, `popup`, `storage`)
   - Game Engine ➔ Data-Oriented Design (DOD / ECS / Cache-friendly contiguous memory)
   - Canvas Game ➔ Game Loop (`Input ➔ Update ➔ Render`)
   - Desktop CLI ➔ Command Pipeline (`Arg Parser ➔ Handler ➔ Stream I/O`)
8. **Primary Programming Language & Runtime:** Derived strictly from the constraints above (C, Rust, TypeScript, Go, Java, C#, Python).
9. **Package Manager & Toolchain:** Specific package manager (`cargo`, `pnpm`, `uv`, `go modules`) and build task runner.

#### Batch 4: Targeted Invariants (Topology-Scoped, 100% YAGNI)
Inquire *only* into the dimensions relevant to the selected topology:
- *If Web SaaS / Backend:* API protocol (REST/gRPC), DB migration engine (Atlas/Flyway), tenancy isolation model, authentication, and OCI distroless containers.
- *If Browser Extension:* MV3 content script isolation (IIFE bundle), `chrome.storage.sync` flow, permissions. (Zero Docker/K8s/OpenAPI!).
- *If Game Engine:* Graphics backend (Vulkan/DirectX/wgpu), memory allocators (arena/frame), ECS archetype model. (Zero Docker/SQL!).
- *If CLI:* Arg parsing library, POSIX exit codes, streaming I/O, `--json` formatting. (Zero Docker/SQL!).

---

### Phase 3: Synthesize (Architecture Blueprint & User Sign-Off)
1. Consolidate the user's answers into a formal **Consolidated Architectural Blueprint** (using Section 4 template).
2. Author an Architectural Decision Record in `memory.md` (e.g. `ADR-006: Target Technology Stack & Scaffolding Baseline`).
3. **STOP AND ASK FOR EXPLICIT CONFIRMATION**: Present the blueprint and ADR to the user. Do NOT write scaffolding code until the user approves the blueprint.

---

### Phase 4: Bootstrap (Deterministic Topology Scaffolding)
Upon user confirmation:
1. Run the topology-aware workspace initialization script:
   ```bash
   bash .agents/skills/lets-build/scripts/bootstrap_workspace.sh . <topology> <language>
   ```
2. Generate base infrastructure strictly for the selected topology (zero speculative bloat):
   - *Backend:* `specs/openapi/v1/openapi.yaml`, `specs/tokens/tokens.json`, `deploy/docker`, `deploy/compose`.
   - *Extension:* `manifest.json`, `src/background/index.ts`, `src/content/index.ts`, `src/popup/index.html`.
   - *Game / Engine:* `src/core/`, `src/ecs/`, asset manifest, frame loop entrypoint.
   - *CLI:* `src/cmd/`, `src/core/`, CLI entrypoint with exit code handling.
3. Generate build manifests (`Cargo.toml`, `package.json`, `go.mod`, `pyproject.toml`), linter configurations, and boundary smoke test (`scripts/smoke_test.sh`).
4. **Replace Starter README with Project-Specific README**:
   Generate a clean, project-specific `README.md` completely replacing meta-template content with the project's actual name, mission, stack highlights, quickstart commands, and directory tree.

---

### Phase 5: Verify & Handover to Domain Analysis
1. Run the workspace validation script:
   ```bash
   bash .agents/skills/agentic-architect/scripts/validate_agentic_configs.sh
   ```
2. Execute toolchain dependency checks, build commands, and health/smoke tests:
   - Compile code and verify zero compiler or lint errors.
   - Verify boundary verification smoke test (`scripts/smoke_test.sh`).
3. **Mandatory Handover to Domain Analysis (STOP & PIVOT):**
   - **`lets-build` IS NOW COMPLETE.** Do NOT proceed to write domain business entities, repositories, or application features.
   - Present the bootstrapped technical skeleton to the user.
   - Instruct the user to invoke `product-analyst` and `relentless-questioner` to initiate the **Domain Discovery & Requirements Engineering Phase** (Ubiquitous Language, Bounded Contexts, Aggregate Boundaries, INVEST User Stories, and Gherkin Acceptance Criteria) before any domain feature code is written.

---

## 3. Gotchas & What NOT to Do

- **MAJOR DONT: DO NOT invent, assume, or scaffold application domain entities, business logic, or feature pages during `/lets-build`.** The `lets-build` skill is strictly an infrastructure and technical stack bootstrapper. Fabricating business domain features without dedicated domain analysis and relentless questioning of the user is a fatal architectural defect.
- **DO NOT** assume the stack. Never start writing Go, Rust, Python, or TypeScript before asking the user.
- **DO NOT** scaffold universal web boilerplate (Docker, Kubernetes, OpenAPI, Postgres migrations) for non-backend projects (Browser Extensions, CLIs, Game Engines, Desktop apps).
- **DO NOT** force Hexagonal Architecture onto platforms where the application IS the platform integration (e.g. Browser Extensions). Match architecture to topology.
- **DO NOT** proceed to code generation without presenting the blueprint and receiving explicit user approval.
- **DO NOT** skip or delete the atomic domain rules in `docs/rules/` during bootstrapping. The rules govern the ongoing lifecycle of the newly bootstrapped project.
- **DO NOT** create monolithic files (> 250 lines) or large functions (> 30 lines). Maintain strict Clean Code standards.

---

## 4. Structured Output Templates

### Consolidated Architectural Blueprint Template
```markdown
# Architectural Specification & Technology Blueprint

## 1. Problem Space & Topology
- **Project Domain:** <domain>
- **System Topology:** <Web SaaS / Browser Extension / Game Engine / Canvas Game / CLI / Library>
- **Architectural Style:** <Hexagonal / Platform Scripting / Data-Oriented Design / Game Loop / Command Pipeline>

## 2. Core Profile & Constraints
- **Primary Language & Runtime:** <language / version>
- **Package Manager & Build Tool:** <tool>
- **Latency / Performance Target:** <Hard real-time / Interactive / Service / Batch>
- **Memory & Concurrency Model:** <Zero GC / Managed GC / Single-threaded event loop>

## 3. Interfaces & Storage
- **Protocols / Transports:** <REST / gRPC / WebSockets / CLI stdin-stdout / None>
- **Storage / Persistence:** <PostgreSQL / SQLite / chrome.storage / Flat file / In-memory>
- **Specifications:** <OpenAPI 3.1 / Manifest V3 / Protobuf / None>

## 4. Quality & Verification
- **Testing Strategy:** Outside-In TDD with Nano-Cycles (Uncle Bob's 3 Laws)
- **Code Health Gates:** 100.00% test coverage gate, zero lint errors
- **DevSecOps:** <Semgrep / Trivy / Gitleaks / None>
```
