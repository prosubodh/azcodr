# Rental Process Management System (RPMS)

> **Enterprise B2C Property Inventory, Lease Lifecycle Management & ACID Payment Processing Platform**

---

## 🌟 Architecture & Stack

- **Architecture:** Hexagonal (Ports & Adapters) with pure invariant domain core decoupled from Express.js HTTP transports and Prisma persistence adapters.
- **Language & Runtime:** TypeScript / Node.js (`v24.21.0`).
- **Package Manager & Monorepo:** `pnpm` (`v12.4.1`) workspaces (`apps/backend`, `apps/web`, `packages/shared`).
- **Primary Transport:** REST (OpenAPI 3.1) with interactive Swagger UI at `/docs`.
- **Frontend & Presentation:** React with multi-page routing (`react-router-dom`), `shadcn/ui` components (Radix UI primitives + Tailwind CSS), and W3C Design Tokens (`specs/tokens/tokens.json`).
- **Persistence Engine:** SQLite (local dev/test) and PostgreSQL 16 (production) via Prisma ORM secondary adapter with Prisma Migrate.
- **Multi-Tenancy Isolation:** Model A (Application-Level Query Interception in repository/Prisma layer).
- **Extensible Schemas:** Universal JSON Schema Draft 2020-12 (`specs/schemas/`).
- **Workflows & Background Jobs:** BullMQ with Redis for lease renewal alerts, rent notifications, and payment receipts.
- **Testing & Quality:** Outside-In TDD (Vitest + Supertest) with 100% coverage gates and Playwright for UI automation.
- **Security & DevSecOps:** Semgrep SAST, Gitleaks, Trivy vulnerability scanning, CycloneDX SBOM.

---

## 🗂️ Project Structure

```
.
├── apps/
│   ├── backend/                      # Express.js REST API with Hexagonal Ports & Adapters
│   │   ├── prisma/                   # Prisma schema & SQLite/PostgreSQL migrations
│   │   ├── src/
│   │   │   ├── domain/               # Pure Invariant Entities & Value Objects (Money, Lease, Property)
│   │   │   ├── ports/                # Primary Use Cases & Secondary Repository/Queue Ports
│   │   │   └── adapters/             # Express HTTP controllers & Prisma persistence adapters
│   │   └── tests/                    # Vitest unit & Supertest integration test suites
│   └── web/                          # React web application with shadcn/ui and routing
│       ├── src/
│       │   ├── components/ui/        # Canonical shadcn/ui components (Button, Card, Table, Badge, Input)
│       │   ├── components/layout/    # AppLayout with multi-page navigation bar
│       │   └── pages/                # Dashboard, Properties, Leases, Payments, Applications
│       └── e2e/                      # Playwright browser automation tests
├── packages/
│   └── shared/                       # Shared TypeScript types, domain enums, and design token bindings
├── specs/                            # Canonical contract specifications
│   ├── openapi/                      # OpenAPI 3.1 REST specifications (openapi.yaml)
│   ├── schemas/                      # Universal JSON Schema Draft 2020-12 (amenities, applications)
│   └── tokens/                       # W3C DTCG Design Tokens (tokens.json)
├── deploy/                           # Deployment & Infrastructure
│   ├── compose/                      # Docker Compose manifests (PostgreSQL 16, Redis 7)
│   └── docker/                       # Multi-stage minimal OCI Dockerfile
├── docs/rules/                       # 41 atomic single-responsibility architectural rules
├── memory.md                         # Master memory hub & Lightweight ADR ledger (ADR-001 - ADR-006)
└── AGENTS.md                         # Lean agentic directives (< 120 lines)
```

---

## ⚡ Quickstart & Development

### 1. Prerequisites
- Node.js `v24.x` or higher
- `pnpm` `v12.x` or higher
- Docker & Docker Compose (optional for local SQLite, required for Postgres/Redis)

### 2. Environment Setup
```bash
cp apps/backend/.env.example apps/backend/.env
```

### 3. Install Dependencies & Build
```bash
pnpm install
pnpm db:generate
pnpm build
```

### 4. Run Development Servers
Run both backend and web frontend in parallel:
```bash
pnpm dev
```
- **Web Application:**
  - Local: [http://localhost:5173](http://localhost:5173)
  - Network / LAN: `http://192.168.1.150:5173`
- **Express REST API:**
  - Local: [http://localhost:4000](http://localhost:4000)
  - Network / LAN: `http://192.168.1.150:4000`
- **Interactive Swagger UI:**
  - Via Web Proxy: `http://192.168.1.150:5173/docs`
  - Direct Backend: `http://192.168.1.150:4000/docs`

### 5. Run Tests & Verification
Run unit, integration, and E2E verification suites:
```bash
# Backend Vitest tests
pnpm test

# Playwright E2E UI automation tests
pnpm test:e2e
```

### 6. Optional: Start Postgres & Redis Infrastructure
```bash
docker compose -f deploy/compose/docker-compose.yml up -d
```

---

## 🏛️ Architecture Governance & Decisions

This project is governed by the **41 Atomic Domain Rules** located in [`docs/rules/`](./docs/rules/) and Architectural Decision Records in [`memory.md`](./memory.md):
- **ADR Ledger:** See [`memory.md`](./memory.md) for ADR-001 through ADR-006.
  - [`ADR-006`](./memory.md): Target Technology Stack & Scaffolding Baseline for RPMS (TypeScript, Hexagonal, Express, Prisma, React, shadcn/ui).
- **Architectural Rules:** See [`docs/rules/`](./docs/rules/) for TDD, Clean Code, Multi-Tenancy, Database Integrity, and DevSecOps directives.
# sthanori
