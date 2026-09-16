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
