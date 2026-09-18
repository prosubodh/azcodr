# Backlog & Project Differentiation Log: RPMS (Rental Process Management System)

> **Core Purpose:** Persistent audit log of all architectural mutations, scaffolding actions, package additions, configuration divergence, and domain artifacts introduced in `/home/prosubodh/projects/sthanori` relative to the pristine starter workspace (`/home/prosubodh/projects/mvp`).

---

## 1. Project Overview & Scope
- **Target Project Directory:** `/home/prosubodh/projects/sthanori`
- **Initial Baseline Workspace:** `/home/prosubodh/projects/mvp`
- **Domain:** Rental Process Management System (RPMS) — B2C property management, rental unit leasing, applicant screening, and ACID payment ledgers.
- **Architecture Baseline:** Full-stack TypeScript monorepo (`pnpm`) adhering to Hexagonal Architecture (Ports & Adapters).
- **Frontend Standard:** React with multi-page routing (`react-router-dom`), `shadcn/ui` component library (Radix UI primitives + Tailwind CSS), and strictly zero custom markups unless necessary.

---

## 2. Chronological Mutation Ledger (Divergences from Baseline MVP)

### [2026-09-18] ADR-006 Authored
- **File Modified:** `memory.md` in `sthanori`
- **Change:** Added `ADR-006: Target Technology Stack & Scaffolding Baseline for RPMS (Rental Process Management System)`
- **Scope:** Defines the complete technical stack: TypeScript/Node.js, Express REST API, Prisma ORM (SQLite dev/test, PostgreSQL prod), Model A multi-tenancy query interceptor, BullMQ + Redis, React with multi-page routing and `shadcn/ui`, and Outside-In TDD with Vitest/Supertest and Playwright.

### [2026-09-18] Contract & Specification Generation (`specs/`)
- **`specs/tokens/tokens.json`:** Expanded W3C DTCG design token specification with semantic colors (primary `#0284c7`, secondary, background, foreground, border, destructive) and corner radii (`sm`, `md`, `lg`).
- **`specs/schemas/rental_unit_amenities.json`:** JSON Schema Draft 2020-12 validating extensible unit amenity configurations (furnished, air conditioning, in-unit laundry, parking spaces, pet policy, square footage, utilities).
- **`specs/schemas/rental_application_form.json`:** JSON Schema Draft 2020-12 validating applicant screening submissions (applicant details, employment info, emergency contact, background check consent).
- **`specs/openapi/openapi.yaml`:** OpenAPI 3.1 REST API specification covering `/healthz`, `/readyz`, `/api/v1/properties`, `/api/v1/properties/{id}/units`, `/api/v1/leases`, `/api/v1/payments`, and `/api/v1/applications`.

### [2026-09-18] Workspace Root & Monorepo Configuration
- **`pnpm-workspace.yaml`:** Configured monorepo workspace packages (`apps/*`, `packages/*`).
- **`package.json`:** Added root scripts (`pnpm build`, `pnpm dev`, `pnpm test`, `pnpm test:e2e`, `pnpm db:generate`, `pnpm db:push`).
- **`tsconfig.base.json`:** Standardized strict TypeScript compiler options across all packages.

### [2026-09-18] Shared Library Package (`packages/shared/`)
- **`packages/shared/package.json` & `tsconfig.json`:** Library package definitions.
- **`packages/shared/src/types/index.ts`:** Canonical domain enums (`UserRole`, `UnitStatus`, `LeaseStatus`, `PaymentType`, `PaymentStatus`, `ApplicationStatus`) and Data Transfer Objects (`PropertyDTO`, `UnitDTO`, `LeaseDTO`, `PaymentLedgerDTO`, `RentalApplicationDTO`).
- **`packages/shared/src/tokens/index.ts`:** Exported JavaScript constant bindings and types for W3C Design Tokens.

### [2026-09-18] Backend Hexagonal Service (`apps/backend/`)
- **Prisma Schema (`apps/backend/prisma/schema.prisma`):** Relational schema supporting SQLite for local dev/test and PostgreSQL for production: `Organization`, `User`, `Property`, `Unit`, `Lease`, `PaymentLedgerEntry`, `RentalApplication`.
- **Domain Core (`apps/backend/src/domain/`):**
  - Value Objects: `Money` (integer cents, currency checks, arithmetic invariants), `DateRange` (precedence checks, duration).
  - Pure Entities (zero external/framework imports): `Property`, `Unit`, `Lease`, `PaymentLedgerEntry`, `RentalApplication`.
- **Ports (`apps/backend/src/ports/`):**
  - Primary Ports: `PropertyUseCase`, `LeaseUseCase`, `PaymentUseCase`, `ApplicationUseCase`.
  - Secondary Ports: `PropertyRepositoryPort`, `LeaseRepositoryPort`, `PaymentRepositoryPort`, `ApplicationRepositoryPort`, `JobQueuePort`.
- **Adapters (`apps/backend/src/adapters/`):**
  - Primary HTTP: Express app factory (`server.ts`), Model A tenant middleware (`tenant_context.ts`), RFC 7807 error handler, and Swagger UI integration.
  - Secondary Persistence: `PrismaPropertyRepository`, `PrismaLeaseRepository`, `PrismaPaymentRepository`, `PrismaApplicationRepository`, and pure `InMemory*` repositories for fast testing.
  - Secondary Queue: `InProcessJobQueueAdapter` (BullMQ-ready async queue).
- **Backend Tests (`apps/backend/tests/`):**
  - Unit: `money_value_object.test.ts`, `lease_domain.test.ts`.
  - Integration: `health_api.test.ts`, `property_api.test.ts` (Supertest).
  - Configuration: `vitest.config.ts`.

### [2026-09-18] Web Presentation Layer (`apps/web/`)
- **Tooling & Setup:** Vite + React 19 + TypeScript + Tailwind CSS (`tailwind.config.js`, `postcss.config.js`).
- **`shadcn/ui` Standard:**
  - `components.json`: Standardized shadcn CLI configuration.
  - `src/lib/utils.ts`: Canonical `cn()` utility combining `clsx` and `tailwind-merge`.
  - UI Primitives (`src/components/ui/`): `Button`, `Card`, `Badge`, `Input`, `Table`. Strictly no custom markups used.
- **Routing & Pages (`src/pages/`):**
  - Layout: `AppLayout.tsx` with top brand header and horizontal navigation bar.
  - Pages: `DashboardPage.tsx`, `PropertiesPage.tsx`, `LeasesPage.tsx`, `PaymentsPage.tsx`, `ApplicationsPage.tsx`.
  - Router: `App.tsx` multi-page declarative routing with React Router.
- **E2E Automation Testing:** Playwright configuration (`playwright.config.ts`) and end-to-end browser navigation suite (`e2e/navigation.spec.ts`).

### [2026-09-18] Infrastructure & Documentation
- **`deploy/compose/docker-compose.yml`:** Multi-container configuration for PostgreSQL 16 (`5432`) and Redis 7 (`6379`).
- **`deploy/docker/Dockerfile`:** Multi-stage minimal OCI Dockerfile.
- **`README.md`:** Completely replaced template content with comprehensive RPMS project documentation, architecture overview, quickstart instructions, and directory tree.

### [2026-09-18] LAN Network Configuration (Static IP: 192.168.1.150)
- **Problem Resolved:** Vite dev server and Express backend defaulted to `localhost` (127.0.0.1) loopback, preventing client devices on the local subnet (`192.168.1.0/24`) from accessing web or API endpoints.
- **Changes Implemented:**
  - **`apps/web/vite.config.ts`:** Added `host: '0.0.0.0'` and forwarded `/docs` (Swagger UI) alongside `/api` through the Vite reverse proxy.
  - **`apps/web/package.json`:** Added `--host` to `dev` and `preview` scripts.
  - **`apps/web/src/components/layout/AppLayout.tsx`:** Updated Swagger UI link from hardcoded `http://localhost:4000/docs` to relative `/docs`, enabling seamless navigation on any remote device.
  - **`apps/backend/src/adapters/primary/http/server.ts`:** Configured `cors({ origin: true, credentials: true })` to dynamically reflect origin across localhost and LAN IPs.
  - **`apps/backend/src/index.ts`:** Bound Express `app.listen` explicitly to `0.0.0.0` with console logs showing both Local (`localhost`) and Network (`192.168.1.150`) URLs.

### [2026-09-18] Full-Stack Dynamic Integration & UI Connectivity
- **Problem Identified:** Frontend React pages rendered hardcoded mock arrays and buttons did not trigger mutations or persist state.
- **Changes Implemented:**
  - **`apps/web/src/api/client.ts`:** Built strongly-typed client fetching from `/api/v1/properties`, `/units`, `/leases`, `/payments`, `/applications`, and `/healthz`.
  - **`apps/web/src/components/ui/dialog.tsx`:** Added shadcn Dialog primitives (`@radix-ui/react-dialog`) with zero custom markup.
  - **`apps/web/src/pages/DashboardPage.tsx`:** Dynamically aggregates active properties, leases, total rent collected, and pending applications.
  - **`apps/web/src/pages/PropertiesPage.tsx`:** Added live table fetch and modal dialog to create new properties.
  - **`apps/web/src/pages/LeasesPage.tsx`:** Added live lease contract table and modal dialog to draft leases.
  - **`apps/web/src/pages/PaymentsPage.tsx`:** Added live ACID transaction table and modal dialog to post payments.
  - **`apps/web/src/pages/ApplicationsPage.tsx`:** Added live queue and modal dialog to submit rental applications.
  - **`packages/shared/package.json`:** Upgraded to native ESM module with explicit export conditions (`types`, `import`).

### [2026-09-18] Strict 100.00% Coverage Gate Remediation (`docs/rules/test_isolation.md`)
- **Problem Identified:** Initial coverage was 36.26% with a relaxed 90% threshold in `vitest.config.ts`, directly violating the workspace mandate for 100.00% line, branch, function, and statement coverage.
- **Remediation Implemented:**
  - Added `@vitest/coverage-v8@3.2.7` matching the Vitest runtime version.
  - Enforced strict `thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }` in `vitest.config.ts`.
  - Authored exhaustive test suites in `apps/backend/tests/`:
    - `unit/value_objects.test.ts`: 13 tests covering all Money and DateRange operations and edge cases.
    - `unit/entities.test.ts`: 11 tests covering all domain entity invariants and status transitions.
    - `unit/usecases.test.ts`: 4 tests covering all primary use cases, in-memory repository doubles, and job queue adapter.
    - `integration/api.test.ts`: 11 tests covering all Express routes, RFC 7807 problem details, and error forwarding.
  - Verified 100.00% coverage achieved across statements (100%), branches (100%), functions (100%), and lines (100%) across 55 tests.

---

### [2026-09-18] Health Probe & Reverse Proxy Tolerance (`/healthz`, `/healtz/`, LAN connectivity)
- **Problem Identified:**
  - In the React Web Dashboard, backend operational status reported `Offline / Connecting`.
  - `apps/web/vite.config.ts` proxied `/api` and `/docs`, but omitted `/healthz` and `/readyz`, causing Vite's SPA fallback to serve `index.html` (text/html), causing `res.json()` in `client.ts` to crash.
  - Express server registered `/healthz` without trailing slash tolerance (`/healthz/`), typo tolerance (`/healtz/`), or `/api/v1/healthz` alias.
- **Changes Implemented:**
  - **`apps/backend/src/adapters/primary/http/server.ts`:** Registered handler aliases for `/healthz`, `/healthz/`, `/healtz`, `/healtz/`, `/api/v1/healthz`, `/api/v1/healthz/`, `/api/v1/healtz`, `/api/v1/healtz/`, and `/readyz` variations.
  - **`apps/backend/tests/integration/health_api.test.ts`:** Added exhaustive integration test cases verifying all route and slash variants, maintaining 100.00% statement, branch, function, and line coverage across 57 tests.
  - **`apps/web/vite.config.ts`:** Added `/healthz`, `/healtz`, and `/readyz` to Vite proxy using `http://127.0.0.1:4000` targets.
  - **`apps/web/src/api/client.ts`:** Updated `getHealth()` to defensively probe `${API_BASE}/healthz` with automatic fallback to `/healthz`.
  - **Verification:** Verified live `200 OK` JSON responses over `http://localhost:4000/healthz`, `http://localhost:5173/healthz/`, `http://localhost:5173/healtz/`, and `http://192.168.1.150:5173/api/v1/healthz`.

### [2026-09-18] Process Post-Mortem: In-Memory Supertest Illusion & Cross-Package Verification
- **The Defect Identified (Process Blunder Analysis):**
  - All 57 tests passed with 100.00% statement, branch, function, and line coverage, yet the actual live application reported `Offline / Connecting` and failed on `/healthz/`.
  - **Why Tests Were Insufficient:**
    1. Vitest evaluated Express routes using `supertest(app)` strictly inside Node.js process memory. It never tested real network socket binding (`app.listen()`) or the Vite dev server reverse proxy (`vite.config.ts`).
    2. `apps/web` lacked a `test` script in `package.json`. When `pnpm test` ran recursively across the monorepo, pnpm silently skipped `apps/web`, giving the illusion of a fully-tested monorepo while the frontend client and proxy were completely untested.
    3. London School Double-Loop TDD Outer Loop was skipped: there was no outer acceptance/smoke test asserting the end-to-end user request path from the browser/Vite dev server through the reverse proxy to the backend.
  - **Why Code Was Insufficient:**
    1. `vite.config.ts` was missing proxy mappings for `/healthz`, `/healtz`, and `/readyz`, causing Vite to serve SPA `index.html` (text/html).
    2. `server.ts` lacked trailing slash (`/healthz/`) and typo (`/healtz/`) route tolerances.
    3. `client.ts` was brittle, lacking defensive JSON validation and API path fallback.
  - **Remediation & Institutional Fixes:**
    1. Authored `scripts/smoke_test.sh` (7 automated assertions verifying direct backend, Vite proxy, trailing slash, typos, Content-Type headers, API proxying, and LAN IP binding).
    2. Logged defect post-mortem in `docs/knowledge/issue_log.md` (`ISSUE-004`), `dos_and_donts.md`, and `lessons_learned.md`.
    3. Updated `docs/rules/test_driven_development.md` to mandate Cross-Package Boundary Verification in Outer Loops.

### [2026-09-18] Complete CRUD Operations & Foreign Key Relational Selectors
- **User Directives:**
  1. "You can't call a feature complete unless all its CRUD functionalities are working."
  2. "Using identifier as text field for fk field is never a good practice."
- **Defects Remediated:**
  1. Entities previously had partial read/create without full edit/update/delete capabilities across their lifecycle.
  2. Foreign key inputs (`unitId`, `tenantUserId`, `leaseId`) were raw text fields where users had to manually type entity IDs, causing 400/500 relational failures and poor UX.
- **Architectural & Code Changes Across Monorepo:**
  - **Contracts (`packages/shared/src/types/index.ts`):**
    - Added DTOs and inputs: `UserDTO`, `CreateTenantInput`, `UpdatePropertyInput`, `UpdateUnitInput`, `UpdateLeaseInput`, `UpdatePaymentInput`, `UpdateApplicationInput`.
    - Enriched `UnitDTO` and `LeaseDTO` with relational display metadata (`propertyName`, `unitNumber`, `tenantName`, `tenantEmail`).
  - **Domain Core (`apps/backend/src/domain/entities/`):**
    - Added mutation methods: `Property.update()`, `Unit.update()`, `Lease.cancel()`, `PaymentLedgerEntry.refund()`, `RentalApplication.review()`.
  - **Hexagonal Ports & Repositories (`apps/backend/src/`):**
    - Expanded `PropertyRepositoryPort`, `LeaseRepositoryPort`, `PaymentRepositoryPort`, `ApplicationRepositoryPort` with update, delete, and tenant-scoped global list methods.
    - Implemented methods in both `InMemory*` and `Prisma*` repositories.
    - Enforced foreign key existence validation in `LeaseUseCase` (`unitId`), `PaymentUseCase` (`leaseId`), and `ApplicationUseCase` (`unitId`), returning RFC 7807 problem details if referenced entities do not exist.
  - **REST API Endpoints (`apps/backend/src/adapters/primary/http/server.ts`):**
    - Properties: `GET /api/v1/properties/:id`, `PUT /api/v1/properties/:id`, `DELETE /api/v1/properties/:id`.
    - Units: `GET /api/v1/units` (global multi-property catalog), `GET /api/v1/units/:id`, `PUT /api/v1/units/:id`, `DELETE /api/v1/units/:id`.
    - Tenants: `GET /api/v1/tenants`, `POST /api/v1/tenants`.
    - Leases: `GET /api/v1/leases/:id`, `PATCH /api/v1/leases/:id`, `DELETE /api/v1/leases/:id`.
    - Payments: `GET /api/v1/payments/:id`, `PATCH /api/v1/payments/:id`.
    - Applications: `GET /api/v1/applications/:id`, `PATCH /api/v1/applications/:id`, `DELETE /api/v1/applications/:id`.
  - **Testing & 100.00% Coverage Gate:**
    - Expanded backend test suites in `entities.test.ts`, `usecases.test.ts`, and `api.test.ts` to 64 tests.
    - Verified 100.00% lines, 100.00% branches, 100.00% functions, 100.00% statements.
  - **Frontend UI & shadcn/ui Components (`apps/web/`):**
    - Added `components/ui/select.tsx` wrapping `@radix-ui/react-select` with canonical styling and zero custom markup.
    - Expanded `api/client.ts` with all CRUD methods and 204 No-Content handling.
    - `PropertiesPage.tsx`: Full CRUD for Properties (Create, Read, Edit, Delete); complete Unit management modal (Add unit, Edit unit rent/status, Delete unit).
    - `LeasesPage.tsx`: Replaced raw text inputs with relational `<Select>` for Units (with property name & rent display) and Tenants (with name & email display); added quick "+ Add Tenant" dialog; added Activate, Terminate, and Delete lease actions.
    - `PaymentsPage.tsx`: Replaced raw text input with relational `<Select>` for Leases with auto-fill rent amounts; added Complete and Refund status action buttons.
    - `ApplicationsPage.tsx`: Replaced raw text input with relational `<Select>` for Target Units; added Review, Approve, Reject, and Delete application action buttons.
  - **Status & Verification:**
    - Verified live proxy and REST endpoints with curl and `./scripts/smoke_test.sh`.
    - Verified full monorepo build with `pnpm build` (0 errors).

### [2026-09-18] Process Post-Mortem: Decoupling Bootstrapping from Domain Analysis & API SemVer Specification
- **User Directives:**
  1. "api versioning needs semver. what triggers version update?? need research. also swagger docs needs version selector??"
  2. "one thing i just realized, the whole domain analysis,detailed discussions and features were never proporly discussed. the les build step should have only bootstrapped the project. then domain. lets fix process, this is a major DONT"
- **Defects Remediated & Process Overhaul:**
  1. **Premature Domain Modeling Anti-Pattern:** The `/lets-build` skill previously conflated technical skeleton bootstrapping with application domain modeling. The agent fabricated business entities (`Property`, `Unit`, `Lease`, etc.) without conducting proper domain analysis or relentless stakeholder interviews.
  2. **Process Remedy:**
     - Updated `.agents/skills/lets-build/SKILL.md`: Bounded `/lets-build` strictly to technical foundation (toolchains, skeletons, build scripts, linter, health probe). Mandated that Phase 5 stops and hands over to `product-analyst`, `relentless-questioner`, and `docs/rules/domain_driven_design.md` before any business domain entities or features are designed.
     - Added Major DONT to `docs/knowledge/dos_and_donts.md`: "Never invent, assume, or scaffold application domain entities, business logic, or feature pages during project bootstrapping (`/lets-build`)."
     - Logged `ISSUE-005` in `docs/knowledge/issue_log.md`.
     - Logged Section 5 in `docs/knowledge/lessons_learned.md`.
     - Logged `ADR-008` in `memory.md`.
  3. **API Versioning, SemVer & Swagger Multi-Version Selector:**
     - Overhauled `docs/rules/api_versioning.md` with an exhaustive SemVer Trigger Matrix:
       - **MAJOR:** Incompatible breaking changes (removing/renaming routes, modifying field types, adding required request fields, altering status codes, changing auth). Triggers new URI path `/api/v2/` and RFC 8594 Sunset/Deprecation headers on `v1`.
       - **MINOR:** Backward-compatible additions (new endpoints, optional query/body fields, response field additions under tolerant reader). Retains `/api/v1/` URI.
       - **PATCH:** Internal bug fixes, performance optimizations, security patches, documentation fixes.
     - **Interactive Swagger Version Selector:**
       - Organized specifications into `specs/openapi/v1/openapi.yaml` (v1.0.0 Stable) and `specs/openapi/v2/openapi.yaml` (v2.0.0-draft Preview).
       - Updated `apps/backend/src/adapters/primary/http/server.ts` to serve `/docs/spec/v1` and `/docs/spec/v2` and configure Swagger UI `urls` array.
       - Verified that Swagger UI renders a top bar version dropdown selector allowing users to switch between v1.0.0 and v2.0.0-draft specs.
     - **Verification:**
       - 100.00% test coverage maintained across backend test suite (64 tests passing).
       - Outer loop smoke tests verified (`scripts/smoke_test.sh`).

### [2026-09-18] Agile Process Codification: The Non-Negotiable 5-Phase Domain-Driven TDD Lifecycle
- **User Directives:**
  - "research: we need an agile process properly defined, like tdd rules be strictly followed, requirement leads domain analysis->writing a test(UI to lower level tests and implement using red green refactor). NEVER deviate from this??"
- **Research & Process Architecture:**
  - Codified the immutable 5-Phase pipeline:
    1. **Phase 1: Requirements Engineering:** INVEST vertical slicing, Gherkin Given-When-Then scenarios, Negative Scope (non-goals), and status code edge case matrices (`docs/rules/requirements_engineering.md`).
    2. **Phase 2: Tactical Domain Analysis:** Ubiquitous Language definitions, Bounded Contexts, and Aggregate Roots encapsulating business invariants (`docs/rules/domain_driven_design.md`, `docs/rules/domain_expertise.md`).
    3. **Phase 3: Outer-Loop Acceptance Test (RED):** Failing outer test driving UI component interaction (Playwright / testing library) or black-box HTTP API contract before any lower code is touched.
    4. **Phase 4: Inner-Loop TDD & Collaborator Discovery (RED-GREEN-REFACTOR):** Discovered collaborators unit-tested with test doubles, minimal code written to turn green, refactoring strictly under green.
    5. **Phase 5: Outer Acceptance Resolution & Definition of Done:** Outer test turns GREEN, cross-package boundary smoke tests pass (`scripts/smoke_test.sh`), 100.00% full-stack test coverage gate verified.
  - **The Zero-Deviation Mandate:**
    - Writing production code without an existing failing test is strictly prohibited.
    - Writing tests without prior domain analysis (Ubiquitous Language & invariants) is strictly prohibited.
    - Committing code without full-stack boundary verification is strictly prohibited.
  - **Artifacts Codified Across Workspace:**
    - Updated `AGENTS.md` Section 2 to define the 5-Phase Agile Domain Lifecycle.
    - Updated `docs/rules/test_driven_development.md` with complete pipeline specifications and zero-deviation laws.
    - Updated `docs/rules/project_management.md` Definition of Done with Lifecycle Provenance gate.
    - Authored `ADR-009: Non-Negotiable 5-Phase Agile Domain Lifecycle & Outside-In TDD Invariant` in `memory.md`.
    - Added zero-deviation rules to `docs/knowledge/dos_and_donts.md`.

---

## 3. Current Status & Next Steps
- [x] Canonical Specifications scaffolded (`specs/`).
- [x] Backend Hexagonal Ports & Adapters scaffolded (`apps/backend/`).
- [x] Shared library contracts & token bindings scaffolded (`packages/shared/`).
- [x] Frontend React application with shadcn/ui and routing scaffolded (`apps/web/`).
- [x] Frontend pages dynamically connected to live backend API endpoints (`apps/web/src/api/`).
- [x] Deployment manifests scaffolded (`deploy/`).
- [x] Full monorepo build passes cleanly (`pnpm build`).
- [x] 100.00% test coverage threshold enforced and verified (`pnpm test` - 64 passing tests).
- [x] Automated full-stack smoke & boundary test created and passing (`scripts/smoke_test.sh`).
- [x] LAN remote device connectivity configured (`192.168.1.150`).
- [x] Health probe reverse proxy and trailing slash tolerance resolved (`/healthz`, `/healtz/`).
- [x] Complete CRUD operations across all entities implemented (Properties, Units, Tenants, Leases, Payments, Applications).
- [x] Raw text identifier FK fields completely eliminated and replaced with relational shadcn `<Select>` dropdowns.
- [x] Domain-level foreign key validation enforced with RFC 7807 error responses.
- [x] API versioning SemVer trigger matrix researched and codified in `docs/rules/api_versioning.md`.
- [x] Multi-version OpenAPI specifications and interactive Swagger UI version dropdown selector implemented.
- [x] Process defect post-mortem logged (`ISSUE-005`, `ADR-008`); `lets-build` strictly decoupled from domain analysis.
- [x] Agile Domain-Driven TDD Lifecycle codified (`ADR-009`, `AGENTS.md`, `docs/rules/test_driven_development.md`, `project_management.md`).
- [x] Agentic rule validation clean.
