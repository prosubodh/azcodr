# Institutional Lessons Learned & Engineering Insights

> **Core Purpose:** Capture high-level strategic takeaways, trade-off analyses, and architecture lessons to continuously elevate team velocity and agentic precision.

---

## 1. Agentic Architecture & Token Optimization
- **Progressive Disclosure is Non-Negotiable:** Injecting 500 lines of documentation on every prompt degrades LLM reasoning. A lean root file (under 120 lines) acting as an indexed directory to modular rules preserves token budget and drastically improves model precision.
- **Conjunctions Betray Anti-Patterns:** Rules named `x_and_y.md` almost always signal that two distinct concepts have been artificially bundled. Decomposing into pure single-responsibility files prevents documentation rot and makes rules truly composable.
- **Relentless Questioning Prevents Hallucination:** Asking the 7 Core Inquiry Branches before authoring skills prevents speculative features, unused scripts, and ungrounded assumptions.

---

## 2. Multi-Tenancy & Data Isolation
- **Defense in Depth Over Developer Memory:** Never assume every developer or agent will remember to write `where: { tenantId }`. Hard database constraints (PostgreSQL RLS) must enforce isolation as a physical barrier.
- **Metadata Over Code Sprawl:** Enterprise tenants always require custom attributes, diverging workflows, and custom branding. Solving this through code branches (`if (tenant === 'acme')`) leads to exponential debt. Solving this through declarative schemas, JSON rule engines, and Server-Driven UI (SDUI) keeps the codebase tenant-agnostic.

---

## 3. Database Atomicity & Concurrency
- **The Dual-Write Problem is Everywhere:** As soon as an application updates a database and publishes to a broker or sends an email sequentially, it risks data divergence. The Transactional Outbox pattern is the gold standard for reliable event-driven state propagation.
- **DDL Locks Starve Production:** DDL queries queue up and block all subsequent reads and writes. Setting defensive `lock_timeout` and using non-blocking operations (`CREATE INDEX CONCURRENTLY`, two-phase constraint validation) is essential for zero-downtime operations.

---

## 4. Full-Stack Boundary & Monorepo Test Integrity
- **The In-Memory Supertest Illusion:** In-memory integration testing (`supertest(app)`) operates entirely within Node.js process memory. It validates route mapping and status codes, but completely masks network binding failures, reverse proxy omissions (Vite dev server / NGINX), and frontend client JSON serialization mismatches.
- **Coverage Percentages Do Not Equal System Integrity:** 100.00% statement and branch coverage in an isolated backend package gives zero guarantees about whether the frontend client or reverse proxy works. Monorepo test suites must mandate outer-loop smoke verification (`scripts/smoke_test.sh`) before declaring a full-stack system functional.

---

## 5. Process Integrity: Decoupling Bootstrapping from Domain Discovery
- **The Bootstrapping Scope Trap:** AI agents naturally gravitate toward rapidly generating complete functional applications. When invoked with `/lets-build`, an eager agent tends to generate entire domain entities, database tables, and mock UIs on sheer assumptions. This skips the most crucial phase of software engineering: deep, relentless stakeholder domain analysis.
- **Strict Phase Gating:** Project bootstrapping (`lets-build`) must be strictly confined to technical plumbing (toolchain, package manifests, build scripts, linter, Docker/Compose, and a minimal `/healthz` probe). Once the technical foundation is verified, the agent must stop and hand off to Domain Analysis (`product-analyst`, `relentless-questioner`). Real domain models must emerge exclusively from stakeholder interviews and Ubiquitous Language discovery.

