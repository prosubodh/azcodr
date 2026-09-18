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

## 3. Current Status & Next Steps
- [x] Canonical Specifications scaffolded (`specs/`).
- [x] Backend Hexagonal Ports & Adapters scaffolded (`apps/backend/`).
- [x] Shared library contracts & token bindings scaffolded (`packages/shared/`).
- [x] Frontend React application with shadcn/ui and routing scaffolded (`apps/web/`).
- [x] Frontend pages dynamically connected to live backend API endpoints (`apps/web/src/api/`).
- [x] Deployment manifests scaffolded (`deploy/`).
- [x] Full monorepo build passes cleanly (`pnpm build`).
- [x] 100.00% test coverage threshold enforced and verified (`pnpm test` - 55 passing tests).
- [x] LAN remote device connectivity configured (`192.168.1.150`).
- [x] Agentic rule validation (`validate_agentic_configs.sh` - 100% clean).
