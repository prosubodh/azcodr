# Upstream Changes Ledger (`changes.md`)

> **Core Purpose:** Record candidate improvements, generic architectural updates, defect post-mortems, and rule enhancements discovered in this workspace that should be incorporated into the upstream `azcodr` baseline template. No automated git merging or external repo mutation is performed.

---

## 1. Specification & Protocol

When an AI agent or engineer discovers a generic architectural improvement, bug fix, or rule refinement during project development, append an entry below using this atomic format:

```markdown
### [YYYY-MM-DD] <Title of Change>
- **Category:** Rule | Skill | Infrastructure | CLI | Knowledge Hub
- **Target File(s):** `docs/rules/...`, `.agents/skills/...`, etc.
- **Rationale:** Why this improvement is necessary or valuable across all enterprise projects.
- **Description:** Concise summary of the mutation or invariant added.
- **Domain Filter Verification:** Verified 100% generic; purged of all project-specific business entities and models.
```

---

## 2. Upstream Changes Log

### [2026-09-25] Initialized npx Scaffolder CLI and npm Package
- **Category:** CLI & Infrastructure
- **Target File(s):** `bin/azcodr.js`, `lib/scaffold.js`, `package.json`, `tests/`
- **Rationale:** Eliminate manual `cp -r` copying; enable anyone to pull and scaffold the azcodr architecture template via `npx azcodr`.
- **Description:** Implemented zero-dependency Node.js CLI executable with Outside-In TDD, harness parity symlink generation, script execution bit setting, and full test suite passing with 100% agentic config validation.
- **Domain Filter Verification:** Verified 100% generic; no project-specific business models.

### [2026-09-25] Streamlined Upstream Sync Protocol to changes.md Ledger
- **Category:** Rule & Process
- **Target File(s):** `docs/rules/upstream_synchronization.md`, `changes.md`, `AGENTS.md`
- **Rationale:** Remove fragile git repo resolution and merge scripts; replace with atomic change logging in `changes.md`.
- **Description:** Retired `merge-ai` skill and removed machine-specific hardcoded paths. All upstream improvements are now recorded atomically in `changes.md`.
- **Domain Filter Verification:** Verified 100% generic.

### [2026-09-25] Harden CLI, achieve 100% test coverage gates, add multi-OS CI workflow, and TypeScript declarations
- **Category:** CLI
- **Target File(s):** bin/azcodr.js, lib/scaffold.js, lib/index.d.ts, .github/workflows/ci.yml
- **Rationale:** Fulfill 100.00% test coverage mandate, cross-platform CI matrix, and library type safety
- **Description:** Remediate gap assessment findings: add --dry-run and --silent flags, enforce 100.00% line/branch/function coverage gates, add GitHub Actions CI matrix across Node 18/20/22/24 and Linux/macOS/Windows, add .editorconfig template item, and export ambient TypeScript typings.
- **Domain Filter Verification:** Verified 100% generic; purged of all project-specific business entities and models.

### [2026-09-25] Resolve macOS/Windows Git Case-Collision and Cross-Version CI Matrix Coverage
- **Category:** Infrastructure & CI
- **Target File(s):** .gitignore, lib/scaffold.js, scripts/test_coverage.js, validate_agentic_configs.sh
- **Rationale:** Ensure flawless cross-platform and multi-version Node execution across macOS, Windows, and Linux on Node 18, 20, 22, 24.
- **Description:** Untracked agents.md from Git to prevent cyclic symlink overwrite on case-insensitive filesystems; hardened ensureSymlink with isSameCaseInsensitiveFile check; added cross-version test coverage runner script; updated npm test runner to use native discovery.
- **Domain Filter Verification:** Verified 100% generic; purged of all project-specific business entities and models.

### [2026-09-25] Problem-First Architecture, Evolutionary Tipping Points, and Incremental Nano-Cycle TDD
- **Category:** Architecture, Rule & Skill
- **Target File(s):** `AGENTS.md`, `docs/rules/clean_code.md`, `docs/rules/domain_driven_design.md`, `docs/rules/test_driven_development.md`, `.agents/skills/lets-build/SKILL.md`, `.agents/skills/lets-build/references/architecture_interview_matrix.md`, `.agents/skills/lets-build/scripts/bootstrap_workspace.sh`, `memory.md`
- **Rationale:** Eliminate tool-first bias ("Solution-in-Search-of-a-Problem"), stop accidental complexity (as seen in `force-dark-light` where Chrome extension received Kubernetes and OpenAPI specs), prevent AI-accelerated architectural drift, and halt the "Test-First Waterfall" batch-test anti-pattern.
- **Description:** 
  1. Enforced Problem Space vs Solution Space decoupling with zero tool bias.
  2. Made scaffolding strictly topology-aware (Web SaaS, Browser Extension, Game/Engine, CLI, Library) with zero speculative bloat.
  3. Codified Evolutionary Architecture, the 5 Architectural Tipping Points, and Kent Beck's "Refactor-Before-Add" protocol.
  4. Codified Uncle Bob's Three Laws of TDD, banned batch-test dumps, and introduced the Incremental Nano-Cycle and Ping-Pong Pair Programming protocol.
- **Domain Filter Verification:** Verified 100% generic; applicable across any language, stack, and project topology.

### [2026-09-25] Permanent Removal of Static Markdown Knowledge Graph
- **Category:** Architecture & Knowledge Hub
- **Target File(s):** `docs/knowledge/knowledge_graph.md`, `AGENTS.md`, `memory.md`, `README.md`, `docs/rules/continuous_learning.md`
- **Rationale:** Static markdown Mermaid diagrams and entity models in template repositories suffer from maintenance drift, duplicate state from code/migrations, violate Problem-First by assuming a multi-tenant web backend, and waste prompt token budget.
- **Description:** Permanently eliminated `docs/knowledge/knowledge_graph.md`. Enforced code, type definitions, and versioned database migrations as the single source of truth for architectural topologies. Retained `docs/knowledge/ubiquitous_language.md` for lightweight living domain vocabulary contracts.
- **Domain Filter Verification:** Verified 100% generic; purged of all speculative and duplicate static models.

### [2026-09-25] Workspace Rules Consolidation & Redundancy Purge
- **Category:** Rule & Knowledge Hub
- **Target File(s):** `docs/rules/domain_driven_design.md`, `docs/rules/design_patterns.md`, `docs/rules/domain_expertise.md`, `docs/rules/gof_design_patterns_reference.md`, `AGENTS.md`, `README.md`, `memory.md`
- **Rationale:** Eliminate duplicate and fragmented rules to optimize agent attention window, consolidate domain invariants, and uphold strict Single Responsibility across progressive disclosure documentation.
- **Description:** 
  1. Merged business capability mapping and Aggregate Root gatekeeper invariants from `domain_expertise.md` directly into `domain_driven_design.md`. Removed redundant `domain_expertise.md`.
  2. Integrated the complete 23 Gang of Four patterns catalog from `gof_design_patterns_reference.md` directly into `design_patterns.md`. Removed redundant `gof_design_patterns_reference.md`.
  3. Reduced active progressive disclosure rules from 47 to 45 while preserving 100% domain coverage.
- **Domain Filter Verification:** Verified 100% generic; purged of all redundant files and circular links.

### [2026-09-25] Purge Speculative Domain Terms from Ubiquitous Language Template
- **Category:** Knowledge Hub
- **Target File(s):** `docs/knowledge/ubiquitous_language.md`
- **Rationale:** Starter templates must not pre-populate domain concepts (`Organization`, `Membership`, `Ledger Entry`) prior to Phase 1 Requirements & Domain Discovery. Ubiquitous Language is an emergent output of domain modeling, not a pre-baked template assumption.
- **Description:** Reset the canonical domain vocabulary matrix in `docs/knowledge/ubiquitous_language.md` to an unopinionated blank template schema while preserving linguistic invariants (Single Name Rule, Bounded Contexts, Continuous Updating).
- **Domain Filter Verification:** Verified 100% generic; purged of all hypothetical business entities and identifiers.

