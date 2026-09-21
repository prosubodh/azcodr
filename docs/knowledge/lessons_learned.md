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

---

## 6. UX Integrity: Decoupling Developer Personas from Production Auth & Design Triage
- **The "Toy Prototype" Anti-Pattern:** A major failure mode in rapid prototyping is embedding test personas ("Admin Alice", "Operator Bob", "Member Charlie") directly inside end-user sign-in forms or modals. This destroys product credibility, confuses real users, and masks broken authentication and onboarding flows.
- **Strict Separation of Concerns:** Developer testing personas must be 100% decoupled from production authentication. They belong exclusively in a dedicated development toolbar (`import.meta.env.DEV`), completely invisible in production builds. Production authentication must be a clean, dedicated, professional experience with validation, session persistence, and role-based post-login redirection.
- **The Untriaged Design Architecture Trap:** Building user interfaces without upfront Design Architecture Triage (roles, information architecture, navigation shell, URL state synchronization, and page flows) inevitably produces fractured, toy-like prototypes. Every UI increment must pass the 7-Pillar Design Architecture Triage Gate before writing a line of view code.

---

## 7. Server State Synchronization vs. Mock React Context
- **The Local Mock Store Debt:** Maintaining temporary in-memory React contexts (`MockResourceContext.tsx`) or mock data arrays alongside a real backend REST API creates phantom state, breaks multi-tab consistency, and causes state divergence.
- **Server-Authoritative State via TanStack Query:** Migrating to server-authoritative state via TanStack Query (`useQuery`, `useMutation`, and cache invalidation) with declarative RBAC guards (`<Can permission="...">`) grounds the entire web application in persistent backend data, eliminating client-side mocks and guaranteeing multi-tenant consistency.

---

## 8. Zero-Dependency SMTP Sockets & Deterministic Email Testing
- **Third-Party Mailer Bloat vs. Native Sockets:** Standard local development and containerized mail catchers (e.g. Mailpit) accept RFC 5321 commands over TCP sockets. Relying on heavy external mailer packages introduces unneeded transitive dependencies and supply chain risks. Implementing a clean socket-based SMTP adapter with standard library sockets provides zero-dependency, fully audited delivery with multipart/alternative MIME formatting and graceful offline fallback.
- **Strict HTML Escaping & Injection Neutralization:** Transactional notifications interpolate user inputs (names, action titles, payment references). Centralizing sanitization through a strict escaping utility neutralizing `&`, `<`, `>`, `"`, and `'` guarantees zero HTML injection or XSS risks.
- **Double-Loop Decoupling with Background Job Queue:** Decoupling notification delivery from HTTP request-response cycles via an asynchronous job queue ensures API responsiveness. Testing event dispatchers against in-memory notification sinks allows 100.00% branch and statement coverage without network flakes.

---

## 9. Digital Contract Execution, Schema Evolution & Signature Auditing
- **Non-Destructive Schema Evolution with Declarative JSON:** Expanding database models to support variable contractual covenants, conditions, and digital signature records without table bloat is achieved cleanly through semi-structured JSON fields (`termsJson`, `signatureJson`). Running declarative synchronization preserves database integrity and avoids premature migration schema lock-in during rapid domain evolution.
- **Cryptographic Execution Audit Trails:** Digital signatures require more than a boolean `isSigned` flag. A legally defensible electronic execution record must record: (1) Typed signer legal name, (2) ISO 8601 UTC timestamp, (3) Authenticated user actor ID, (4) Client IP address, (5) Client User-Agent string, and (6) A deterministic cryptographic checksum or execution reference hash.
- **Outside-In Event Notification Synchronization:** Executing an agreement is a domain transition that must trigger notification side effects. Emitting domain events on an asynchronous queue allows event notification dispatchers to compose transactional confirmation messages with executed terms and receipt summaries without blocking the HTTP response.

---

## 10. Design Token Completeness & Application-Wide Theme Architecture
- **The Partial Dark Mode Token Pitfall:** Automated component CLI generators inject component-scoped CSS variables into `.dark` (e.g. `--sidebar-*`), but do not populate omitted foundational design tokens (`--background`, `--foreground`, `--card`, `--border`, `--popover`). If root `.dark` is missing foundational tokens, applying the `dark` class leaves background colors white and text illegible. Always maintain symmetric, complete design tokens across `:root` and `.dark`.
- **System Preference Detection & Reactive Synchronization:** A robust `ThemeProvider` must listen to `window.matchMedia('(prefers-color-scheme: dark)')` with dynamic event listeners so OS appearance toggles seamlessly propagate in real-time. Synchronizing `document.documentElement.style.colorScheme = resolvedTheme` ensures native browser elements (scrollbars, datetime pickers) match the selected theme.

---

## 11. Dependency Injection Hygiene vs. Split-Brain In-Memory Traps
- **The Split-Brain Instantiation Anti-Pattern:** When application factories (`createApp(deps)`) provide default fallback instances for domain repositories, passing some repositories while omitting others creates two disconnected sets of state. For instance, if `index.ts` creates a `userRepo` and seeds admin credentials, but `createApp` defaults to a newly constructed `userRepo`, API requests hit the empty fallback instance.
- **Strict Inversion of Control:** Factories must accept a fully instantiated `AppDependencies` composite or explicit container. Server entrypoints must assemble the complete dependency graph and inject all collaborators explicitly.

---

## 12. Domain Invariant Synchronization & Resource Concurrency
- **Aggregate Isolation Requires Domain Coordination:** An agreement or reservation is a separate aggregate from a constrained inventory resource. However, activating an agreement without validating resource availability permits double-allocation race conditions. Hexagonal use cases must coordinate aggregate transitions atomically: validating resource availability before agreement signing, transitioning the resource status to `ALLOCATED` upon execution, and restoring `AVAILABLE` upon termination.
- **Fail-Closed Multi-Tenancy:** Never trust client-supplied tenant headers (`x-tenant-id`) without cryptographically verifying the authenticated actor's tenant organization memberships. Mismatched tenant headers must immediately fail closed with HTTP 403 `FORBIDDEN_TENANT_ACCESS`.

---

## 13. Client-Side Resilience & Multi-Tab Reactive Synchronization
- **Error Boundaries Prevent Catastrophic Shell Crashes:** Heavy visual components (such as charts with dynamic SVG/canvas rendering) or dynamic sub-routes can throw runtime exceptions on unexpected data. Wrapping page outlets and complex widgets in accessible `<ErrorBoundary>` components preserves the shell and navigation while offering modular retry.
- **Cross-Tab Synchronization via Storage Events:** Modern multi-tab workflows mean users open links, resource lists, or self-service portals in separate tabs. Listening to the browser's native `storage` event ensures that login, logout, and active tenant switches are immediately synchronized across all open tabs without desynchronization.

---

## 14. Decoupling Developer Diagnostics from Production Shell & Centralizing UI Copy
- **The Telemetry Bleed Anti-Pattern:** Placing internal architectural metrics ("ACID ledger", "Hexagonal ports", "API Connected" pulsing pills, "Role: OPERATOR" badges) into user-facing wayfinding breadcrumbs, headers, or footers creates confusion for end users (consumers and enterprise operators alike). These technical indicators belong strictly within development tools conditionally mounted under `import.meta.env.DEV`, ensuring production builds are clean and focused on user tasks.
- **Centralized Single Source of Truth for Copy:** Distributing strings across JSX templates causes text divergence, typos, and high refactoring overhead. Consolidating all copy, error messages, empty states, breadcrumbs, and action text into a single configuration module (`UI_STRINGS` in `app-constants.ts`) simplifies internationalization readiness, branding updates, and unit test verification.

---

## 15. Monorepo-Wide Module Path Aliasing (`@/*`) & Deep Relative Traversal Elimination
- **Fragility of Deep Relative Imports:** Using deep relative traversals (`../../../..`, `../../..`, `../..`) across modular hexagonal architectures creates fragile couplings. Minor file restructuring breaks dozens of imports, and deep relative paths obscure which architectural boundary (domain core, primary ports, secondary adapters) is being invoked.
- **Unified Path Aliasing Standard:** Standardizing on `@/*` mapped to `./src/*` across TypeScript compiler configs (`tsconfig.json`), test runners (Vitest), and bundlers (Vite) enforces consistent, unambiguous imports across the entire monorepo.
- **Node.js ESM Build Resolution via `tsc-alias`:** TypeScript's `tsc` compiler does not rewrite path aliases in emitted JavaScript by default. In Node.js ESM environments, running `tsc-alias` post-compilation (`tsc && tsc-alias`) transforms `@/*` aliases into valid relative paths directly in `dist/`, enabling 100% native Node.js ESM execution with zero runtime loader overhead.

---

## 16. Canonical Domain Error Hierarchy & Zero-`any` Type Safety
- **The Monkey-Patching Anti-Pattern:** Adding status codes to arbitrary error objects at catch sites (e.g. `(err as any).statusCode = 404`) bypasses TypeScript strict mode, prevents compile-time exhaustiveness checking, and risks dropping contextual problem details.
- **Structured Domain Error Model:** Modeling operational domain errors via an explicit `DomainError` base class with canonical subclasses (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExpiredError`) allows clean `instanceof` type narrowing in HTTP error middleware, guaranteeing RFC 7807 compliance without type assertion escape hatches.



