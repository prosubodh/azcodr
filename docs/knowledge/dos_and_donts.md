# Master Architectural DO's & DONT's Encyclopedia

> **Core Purpose:** The authoritative, non-repeating master catalog of software engineering invariants, architectural DO's, and prohibited DONT's across 18 core domains, grounded in verified open-source literature and industry standards.

---

## Direct Navigation Index

1. [Architecture & System Decomposition](#1-architecture--system-decomposition)
2. [Domain-Driven Design (DDD) & Ubiquitous Language](#2-domain-driven-design-ddd--ubiquitous-language)
3. [State Machines, Workflows & Lifecycle Configurability](#3-state-machines-workflows--lifecycle-configurability)
4. [Clean Code & Object-Oriented/Functional Design](#4-clean-code--object-orientedfunctional-design)
5. [Type Safety & Sound Invariant Modeling](#5-type-safety--sound-invariant-modeling)
6. [Database Modeling, Relational Integrity & Total Audit](#6-database-modeling-relational-integrity--total-audit)
7. [Database Transactions, Concurrency & ACID Safety](#7-database-transactions-concurrency--acid-safety)
8. [Multi-Tenancy & Data Isolation](#8-multi-tenancy--data-isolation)
9. [API Design & Network Contracts](#9-api-design--network-contracts)
10. [Application Security, Cryptography & Identity](#10-application-security-cryptography--identity)
11. [Testing, Outside-In TDD & Test Isolation](#11-testing-outside-in-tdd--test-isolation)
12. [Frontend Architecture & Modern Web UI](#12-frontend-architecture--modern-web-ui)
13. [Reliability, Resilience & Distributed SRE](#13-reliability-resilience--distributed-sre)
14. [Observability, Distributed Tracing & Telemetry](#14-observability-distributed-tracing--telemetry)
15. [DevOps, CI/CD, Containerization & Supply Chain](#15-devops-cicd-containerization--supply-chain)
16. [Caching, Distributed State & Performance](#16-caching-distributed-state--performance)
17. [Error Architecture & Fault Recovery](#17-error-architecture--fault-recovery)
18. [Project Management & Continuous Learning](#18-project-management--continuous-learning)

---

## 1. Architecture & System Decomposition
**Authoritative Sources:** *Martin Fowler (Patterns of Enterprise Application Architecture)*; *Robert C. Martin (Clean Architecture)*; *Alistair Cockburn (Hexagonal Architecture)*; *12-Factor App (2026 Edition)*.  
**Governing Rules:** [`clean_code.md`](../rules/clean_code.md), [`cloud_native.md`](../rules/cloud_native.md), [`design_patterns.md`](../rules/design_patterns.md).

### DO
1. **DO** isolate pure business domain rules completely from frameworks, databases, network protocols, and third-party SDKs using Hexagonal Ports and Adapters.
2. **DO** enforce unidirectional dependencies pointing strictly inward toward the domain core; the domain must have zero dependencies on outer layers.
3. **DO** package applications as modular monoliths before considering microservices, separating modules by strictly defined interface boundaries.
4. **DO** treat configuration as externalized environment variables injected at runtime, strictly separating code from config per 12-Factor rules.
5. **DO** keep stateless execution isolates so any compute instance can terminate, scale, or restart with zero loss of persistent user state.
6. **DO** utilize dependency inversion to inject database repositories, notification dispatchers, and queue adapters at the composition root.
7. **DO** define explicit architectural decision boundaries via lightweight Architecture Decision Records (ADRs) before implementing paradigm shifts.
8. **DO** enforce strict Single Responsibility Principle (SRP) at the package and service boundary level.

### DONT
1. **DONT** allow database ORM models or SQL query builders to leak into core domain entities or use cases.
2. **DONT** build distributed microservices when domain boundaries and data access patterns remain unproven and rapidly evolving.
3. **DONT** hardcode environment variables, connection strings, or service URLs inside source code or container images.
4. **DONT** store user session state or uploaded files in local container filesystems; use distributed session stores and object storage.
5. **DONT** create cyclic dependencies between packages or architectural layers.
6. **DONT** share database schemas across different autonomous services or bounded contexts.
7. **DONT** let third-party SDK data types or exceptions penetrate into the domain layer without an adapter or Anti-Corruption Layer (ACL).
8. **DONT** introduce global mutable state or singleton state holders that impede concurrent execution or isolated testing.

---

## 2. Domain-Driven Design (DDD) & Ubiquitous Language
**Authoritative Sources:** *Eric Evans (Domain-Driven Design: Tackling Complexity in the Heart of Software)*; *Vaughn Vernon (Implementing Domain-Driven Design)*; *Martin Fowler (Anemic Domain Model)*.  
**Governing Rules:** [`domain_driven_design.md`](../rules/domain_driven_design.md), [`domain_expertise.md`](../rules/domain_expertise.md), [`ubiquitous_language.md`](ubiquitous_language.md).

### DO
1. **DO** establish a single, authoritative Ubiquitous Language shared verbatim between domain experts, developers, code identifiers, database columns, and user interfaces.
2. **DO** maintain a living, version-controlled Ubiquitous Language Glossary (`ubiquitous_language.md`) as a binding contract.
3. **DO** enforce invariants exclusively inside Aggregate Roots, ensuring all entity mutations pass through aggregate methods that validate business rules.
4. **DO** model concepts with no identity as immutable Value Objects that validate their own internal structural invariants upon construction.
5. **DO** define explicit Bounded Contexts with formal Context Maps and Anti-Corruption Layers (ACL) when communicating across boundaries.
6. **DO** emit Domain Events immediately after an Aggregate commits an observable state change to decouple side-effects.
7. **DO** model domain identifiers using strongly-typed branded primitives to eliminate primitive obsession.
8. **DO** align aggregate boundaries with transactional consistency boundaries; mutate exactly one aggregate root per database transaction.

### DONT
1. **DONT** create Anemic Domain Models consisting merely of getters, setters, and data bags with business logic scattered across services.
2. **DONT** allow synonyms to coexist for the same domain concept (e.g. mixing `Tenant`, `Account`, and `Workspace` interchangeably).
3. **DONT** leak technical database jargon (`dto`, `record`, `table_row`, `flag`) into domain entity method signatures.
4. **DONT** mutate child entities directly from application services without passing through the Aggregate Root.
5. **DONT** execute multi-aggregate updates in a single synchronous database transaction unless strictly demanded by non-negotiable business atomicity.
6. **DONT** allow vocabulary from one Bounded Context to bleed into another without explicit mapping and translation.
7. **DONT** expose public mutators/setters that allow external consumers to place an entity into an invalid or illegal state.
8. **DONT** use generic primitive strings or integers for domain IDs without semantic compiler branding.

---

## 3. State Machines, Workflows & Lifecycle Configurability
**Authoritative Sources:** *David Harel (Statecharts: A Visual Formalism for Complex Systems)*; *Martin Fowler (DSL / State Machine)*; *Temporal.io Architecture Guide*; *Camunda BPMN 2.0 Standard*.  
**Governing Rules:** [`workflow_state_machines.md`](../rules/workflow_state_machines.md), [`tenant_pluggable_logic.md`](../rules/tenant_pluggable_logic.md).

### DO
1. **DO** clearly bifurcate state into **Core Aggregate Invariant States** (hardcoded in domain code) and **Operational Workflow Stages** (configurable per tenant).
2. **DO** model core aggregate lifecycle transitions as strongly-typed Discriminated Unions or GoF State Pattern implementations.
3. **DO** store tenant-specific operational workflows as declarative JSON/YAML State Transition Matrices defining valid nodes, edges, roles, and guards.
4. **DO** evaluate dynamic transition guards using non-Turing complete, sandboxed expression languages like Common Expression Language (CEL).
5. **DO** orchestrate multi-aggregate, long-running, or asynchronous distributed processes using durable workflow engines (Temporal / BPMN 2.0).
6. **DO** record an immutable, append-only State Transition Log capturing `transitionId`, `entityType`, `entityId`, `fromState`, `toState`, `actorId`, `event`, and `timestamp`.
7. **DO** validate state transition graphs statically at creation time to detect unreachable states, dead-ends, or infinite loops.
8. **DO** design state transitions to be idempotent so repeated transition events do not trigger duplicate side-effects.

### DONT
1. **DONT** make legal, accounting, or financial integrity states (e.g. `SETTLED`, `CANCELLED`, `REFUNDED`) dynamically rewritable by end-user configuration.
2. **DONT** expose generic status setters (`entity.setStatus(newStatus)`) that bypass transition validation guards.
3. **DONT** evaluate tenant-configured workflow scripts using dynamic host runtime evaluation (`eval()`, dynamic reflection).
4. **DONT** permit workflow orchestrators to bypass domain aggregates and mutate database state columns directly.
5. **DONT** delete or mutate historical state transition records; state audit logs must be strictly append-only.
6. **DONT** allow circular or unescapable workflow stages in tenant-configurable transition matrices.
7. **DONT** conflate high-level business status with granular low-level UI step indices.
8. **DONT** execute external network I/O directly inside synchronous state machine transition handlers without a retryable background queue.

---

## 4. Clean Code & Object-Oriented/Functional Design
**Authoritative Sources:** *Robert C. Martin (Clean Code)*; *Andrew Hunt & David Thomas (The Pragmatic Programmer)*; *Martin Fowler (Refactoring: Improving the Design of Existing Code)*; *Joshua Bloch (Effective Java)*.  
**Governing Rules:** [`clean_code.md`](../rules/clean_code.md), [`design_patterns.md`](../rules/design_patterns.md), [`gof_design_patterns_reference.md`](../rules/gof_design_patterns_reference.md).

### DO
1. **DO** adhere to the Single Level of Abstraction Principle (SLAP): keep all statements within a function at the same conceptual level.
2. **DO** maintain Command-Query Separation (CQS): a method must either perform an action (mutation) or return data (query), never both.
3. **DO** enforce the Law of Demeter: talk only to immediate friends, avoiding chaining calls like `a.getB().getC().doAction()`.
4. **DO** replace magic strings, magic numbers, and arbitrary literals with named domain constants or strongly-typed enumerations.
5. **DO** return explicit Result types (`Result<T, E>`) for domain operations that can fail expectedly, eliminating unhandled exceptions.
6. **DO** prefer pure functions and immutable data structures whenever possible to eliminate hidden concurrency side-effects.
7. **DO** use expressive, pronounceable, and intention-revealing names that describe *why* code exists rather than *how* it works.
8. **DO** keep functions small and focused on doing exactly one task well (target under 25 lines per function).

### DONT
1. **DONT** pass boolean flags as function arguments to bifurcate behavior; split into two distinct, well-named functions.
2. **DONT** write functions with side effects that mutate parameters passed into them.
3. **DONT** leave dead, commented-out, or unreachable code in the repository; rely on Git history.
4. **DONT** repeat business logic across layers; consolidate logic following the DRY (Don't Repeat Yourself) principle.
5. **DONT** use deep nesting (more than 2 levels of indentation); employ early returns and guard clauses.
6. **DONT** write god classes or god objects that accumulate hundreds of methods and cross-cutting responsibilities.
7. **DONT** prematurely optimize code at the expense of readability and maintainability.
8. **DONT** catch generic `Exception` or swallow errors silently without logging or re-propagating.

---

## 5. Type Safety & Sound Invariant Modeling
**Authoritative Sources:** *Alexis King (Parse, Don't Validate)*; *Scott Wlaschin (Domain Modeling Made Functional)*; *TypeScript Deep Dive*.  
**Governing Rules:** [`typescript.md`](../rules/typescript.md).

### DO
1. **DO** configure compiler strictness to the absolute maximum (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`).
2. **DO** parse untrusted external inputs into strongly-typed domain value objects immediately at system boundaries (Parse, Don't Validate).
3. **DO** use Discriminated Unions to make invalid states unrepresentable in the type system.
4. **DO** employ branded nominal types for IDs, preventing accidental parameter swapping at compile time.
5. **DO** enforce exhaustive pattern matching in `switch` statements using `never` type assertions.
6. **DO** type all async function return values explicitly (`Promise<Result<T, E>>`).
7. **DO** keep types colocated or imported from a shared contract package rather than duplicated across apps.
8. **DO** use `readonly` modifiers on entity properties and collection arrays to prevent accidental mutations.

### DONT
1. **DONT** use `any`, `unknown` without narrowing, or loose untyped object dictionaries (`Record<string, any>`).
2. **DONT** use non-null assertion operators (`!`) or type assertion casts (`as Type`) to silence the compiler.
3. **DONT** create optional properties when a value is strictly required for a given state; use discriminated unions instead.
4. **DONT** duplicate type definitions between backend schemas and frontend clients; generate types from a single source of truth.
5. **DONT** rely on runtime `typeof` or `instanceof` checks where structural or discriminated union typing can prove correctness at compile time.
6. **DONT** export mutable global variables or mutable module-level objects.
7. **DONT** ignore compiler warnings or treat strict linter rules as optional guidelines.
8. **DONT** use enum numeric values that risk deserialization mismatches; prefer string literal unions.

---

## 6. Database Modeling, Relational Integrity & Total Audit
**Authoritative Sources:** *C.J. Date (Database Design and Relational Theory)*; *Martin Kleppmann (Designing Data-Intensive Applications)*; *Markus Winand (Use The Index, Luke)*.  
**Governing Rules:** [`database_integrity.md`](../rules/database_integrity.md), [`database_migrations.md`](../rules/database_migrations.md), [`database_operations.md`](../rules/database_operations.md).

### DO
1. **DO** enforce the **Canonical 6 Total Audit Fields** across all mutable relational tables: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`.
2. **DO** treat strictly immutable financial and ledger tables as append-only (`createdAt` and `createdBy` required; `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy` prohibited).
3. **DO** enforce referential integrity using database-level Foreign Key constraints rather than relying solely on application-level checks.
4. **DO** enforce domain invariants using database `CHECK` constraints (e.g. `CHECK (end_date > start_date)`, `CHECK (amount_cents >= 0)`).
5. **DO** apply partial composite indexes on soft-deletable tables (`WHERE deleted_at IS NULL`) to optimize query planner selectivity.
6. **DO** use declarative, version-controlled migration tools (Atlas / Flyway / Prisma Migrate) and apply the Expand/Contract zero-downtime migration pattern.
7. **DO** use deterministic sorting (`ORDER BY created_at DESC, id DESC`) when querying paginated data to prevent row skipping.
8. **DO** model money as integer minor units (cents) or arbitrary-precision decimals (`NUMERIC(12, 2)`), never floating-point numbers.

### DONT
1. **DONT** hard-delete business records in operational relational databases; execute soft-deletions with actor attribution (`deletedBy`).
2. **DONT** use floating-point types (`FLOAT`, `DOUBLE`) for financial amounts, currency balances, or transaction fees.
3. **DONT** execute destructive schema migrations (dropping columns, renaming columns) in a single step without backwards compatibility.
4. **DONT** use nullable foreign key columns when a parent relationship is mandatory in the domain.
5. **DONT** add database columns without adding corresponding form inputs and API payload fields across all layers.
6. **DONT** perform schema changes directly in production databases without tracked migration files.
7. **DONT** omit foreign key indexes on high-cardinality join columns; missing indexes cause sequential full-table scans.
8. **DONT** allow sparse tables with dozens of nullable columns; extract sparse attributes into typed JSON documents or relation tables.

---

## 7. Database Transactions, Concurrency & ACID Safety
**Authoritative Sources:** *Jim Gray & Andreas Reuter (Transaction Processing: Concepts and Techniques)*; *Martin Kleppmann (Designing Data-Intensive Applications)*; *PostgreSQL Documentation (Concurrency Control)*.  
**Governing Rules:** [`database_transactions.md`](../rules/database_transactions.md), [`database_performance.md`](../rules/database_performance.md).

### DO
1. **DO** maintain strict ACID atomicity: all related row mutations in a business use case must commit or roll back together within a single transaction.
2. **DO** configure defensive transaction timeouts (max 5,000ms) to prevent rogue queries from holding database connection pool locks.
3. **DO** acquire locks in a consistent, deterministic order across all application use cases to permanently prevent deadlocks.
4. **DO** implement Optimistic Concurrency Control (OCC) with a `version` integer column on high-contention resources.
5. **DO** use the Transactional Outbox Pattern to guarantee atomic dual-writes between relational database state and message broker events.
6. **DO** select the minimum necessary SQL isolation level (`READ COMMITTED` by default; `REPEATABLE READ` or `SERIALIZABLE` for financial calculations).
7. **DO** resolve N+1 queries using batching patterns (DataLoader) or eager relational joins.
8. **DO** implement exponential backoff with jitter when retrying transactions that fail due to serialization conflicts or deadlock aborts.

### DONT
1. **DONT** perform external network HTTP requests, message publishing, or heavy disk I/O inside open database transactions.
2. **DONT** perform dual-writes (saving to database then publishing to Kafka) without a Transactional Outbox table; network failures cause permanent split-brain.
3. **DONT** hold database locks across user think time or multi-step HTTP workflows.
4. **DONT** use `SERIALIZABLE` isolation globally for all read-heavy routes when lower isolation levels provide sufficient consistency.
5. **DONT** execute unbounded queries (`SELECT * FROM table`) without pagination boundaries and timeouts.
6. **DONT** ignore deadlock exceptions; catch serialization failures (`40001`) and retry them deterministically.
7. **DONT** write long-running batch data export queries on the primary operational read-write database instance; use read replicas.
8. **DONT** keep database connection pools unmonitored; alert when active connection pool utilization exceeds 80%.

---

## 8. Multi-Tenancy & Data Isolation
**Authoritative Sources:** *AWS Multi-Tenant SaaS Architecture Reference*; *Microsoft SaaS Architecture Patterns*; *OWASP Broken Object Level Authorization (BOLA)*.  
**Governing Rules:** [`multitenancy_isolation.md`](../rules/multitenancy_isolation.md), [`tenant_dynamic_schemas.md`](../rules/tenant_dynamic_schemas.md).

### DO
1. **DO** resolve tenant context at the outermost HTTP ingress layer from verified cryptographically signed claims (JWT/PASETO) or authenticated domain hosts.
2. **DO** propagate tenant context through an immutable context holder (e.g. AsyncLocalStorage or explicit execution context) to all downstream services.
3. **DO** enforce tenant boundary isolation at the database layer using PostgreSQL Row-Level Security (RLS) or mandatory query interceptors.
4. **DO** index every tenant-scoped table with a composite index leading with `tenant_id` (`(tenant_id, id)` or `(tenant_id, created_at)`).
5. **DO** mask cross-tenant resource existence; return `404 Not Found` (or generic `403 Forbidden`) when an entity belongs to a different tenant.
6. **DO** validate dynamic tenant schema extensions against JSON Schema Draft 2020-12 meta-schemas before persisting custom data.
7. **DO** isolate tenant cache keys using explicit namespace prefixes (`tenant:{tenant_id}:{cache_key}`).
8. **DO** include multi-tenant boundary violation test cases in automated CI test suites.

### DONT
1. **DONT** trust unverified client-supplied tenant identifiers in query parameters or request headers without cryptographic session verification.
2. **DONT** write ad-hoc raw SQL queries that omit `WHERE tenant_id = ?`; rely on centralized query interceptors or RLS.
3. **DONT** reveal the existence of another tenant's records through descriptive error messages ("Record exists in another organization").
4. **DONT** share in-memory cache stores or search engine indices across tenants without strict namespace scoping.
5. **DONT** execute tenant-customized scripts or formulas in the main application process; use sandboxed WebAssembly (Wasm) or CEL.
6. **DONT** allow background queue workers to process jobs without explicitly restoring the originating tenant's execution context.
7. **DONT** hardcode tenant-specific logic using `if (tenantId == 'xyz')` conditionals in core domain code; use the Strategy Pattern.
8. **DONT** expose multi-tenant admin capabilities on the same public API endpoints used by standard tenant users.

---

## 9. API Design & Network Contracts
**Authoritative Sources:** *Roy Fielding (Architectural Styles and the Design of Network-based Software Architectures)*; *RFC 7807 (Problem Details for HTTP APIs)*; *RFC 8594 (Sunset / Deprecation HTTP Headers)*; *Stripe API Architecture Guidelines*.  
**Governing Rules:** [`rest_api_conventions.md`](../rules/rest_api_conventions.md), [`advanced_api_patterns.md`](../rules/advanced_api_patterns.md), [`api_versioning.md`](../rules/api_versioning.md).

### DO
1. **DO** format error responses strictly conforming to RFC 7807 (`application/problem+json`) with standard fields: `type`, `title`, `status`, `detail`, `instance`, `code`.
2. **DO** require unique `Idempotency-Key` headers on all mutating POST/PUT/PATCH endpoints to prevent duplicate operations or entity creation.
3. **DO** use cursor-based (keyset) pagination (`?limit=50&cursor=eyJ...`) for large collections to avoid offset drift and performance degradation.
4. **DO** include HATEOAS / Allowed Actions metadata (`_actions: ["edit", "delete"]`) in resource representations based on the authenticated actor's permissions.
5. **DO** version APIs via URI paths (`/v1/resource`) and signal deprecation with RFC 8594 `Deprecation` and `Sunset` HTTP headers.
6. **DO** use exact HTTP status codes: `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`.
7. **DO** validate all request query parameters and body payloads fail-fast at the perimeter using strict schema contracts (Zod / OpenAPI).
8. **DO** maintain machine-readable OpenAPI 3.1 contracts synchronized with implementation code and verified in CI via automated linting.

### DONT
1. **DONT** return HTTP `200 OK` with an error message payload inside the JSON body.
2. **DONT** use deep, deeply nested URL hierarchies (e.g. `/tenants/1/teams/2/projects/3/tasks/4/comments/5`); flatten to `/v1/comments?taskId=4`.
3. **DONT** use offset pagination (`?page=5000&limit=50`) on high-cardinality relational database tables.
4. **DONT** make breaking changes to an active API version without introducing a new version and observing a minimum 90-day sunset window.
5. **DONT** return raw stack traces, database error messages, or internal IP addresses in API response bodies.
6. **DONT** use verbs in REST resource URIs (e.g. `/v1/createOrder` or `/v1/deleteUser`); use standard HTTP methods (`POST /v1/orders`, `DELETE /v1/users/{id}`).
7. **DONT** allow unbounded API responses; every collection endpoint must enforce a default limit (e.g. 20) and a maximum cap (e.g. 100).
8. **DONT** accept arbitrary undeclared payload fields in request bodies; strip or reject unrecognized properties.

---

## 10. Application Security, Cryptography & Identity
**Authoritative Sources:** *OWASP ASVS 4.0 (Application Security Verification Standard)*; *NIST SP 800-63B (Digital Identity Guidelines)*; *OWASP Top 10 (2025/2026)*; *Bruce Schneier (Applied Cryptography)*.  
**Governing Rules:** [`application_security.md`](../rules/application_security.md), [`authentication.md`](../rules/authentication.md), [`authorization.md`](../rules/authorization.md), [`devsecops.md`](../rules/devsecops.md).

### DO
1. **DO** store short-lived JWT access tokens strictly in memory; store refresh tokens in secure, `HttpOnly`, `SameSite=Strict` cookies.
2. **DO** implement cryptographic Refresh Token Rotation (RTR) with family invalidation upon detection of token replay.
3. **DO** hash all passwords using memory-hard, GPU-resistant algorithms: **Argon2id** (memory=64MB, iterations=3, parallelism=4) or **bcrypt** (cost >= 12).
4. **DO** compare secrets, password hashes, and cryptographic signatures using constant-time comparison functions (`crypto.timingSafeEqual`) to prevent timing attacks.
5. **DO** implement token bucket rate limiting at the ingress layer based on IP, user identity, and route sensitivity.
6. **DO** enforce strict authorization checks on both the API server and UI layers (defense-in-depth); never trust client-side route guards alone.
7. **DO** configure comprehensive HTTP security headers: Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options.
8. **DO** scan repositories pre-commit and in CI for committed credentials using automated secret scanners (Gitleaks / Secretlint).
9. **DO** isolate developer demo personas into a dedicated development-only test harness (`import.meta.env.DEV`), completely decoupled from production authentication.
10. **DO** redirect users automatically upon authentication to their role-specific portal (e.g. Operator to `/`, Consumer/Member to `/portal`).

### DONT
1. **DONT** store access tokens or sensitive user credentials in `localStorage` or `sessionStorage` where they are vulnerable to XSS attacks.
2. **DONT** use broken or weak hash algorithms (`MD5`, `SHA1`, unsalted `SHA256`) for password hashing or sensitive signature validation.
3. **DONT** commit secrets, API keys, private certificates, or database credentials into Git repositories.
4. **DONT** use standard string equality (`===` or `strcmp`) to verify cryptographic HMAC signatures or bearer tokens.
5. **DONT** trust unvalidated user input when constructing SQL queries, shell commands, or HTML templates.
6. **DONT** disclose whether an email exists or is registered during authentication, password reset, or invitation flows.
7. **DONT** implement custom cryptographic algorithms or roll your own encryption schemes; rely exclusively on established, audited open-source libraries.
8. **DONT** disable TLS/HTTPS or accept self-signed certificates in non-local environments.
9. **DONT** embed test personas or mock accounts directly into user-facing sign-in or registration dialogs.
10. **DONT** rely solely on UI button hiding for access control; protect all routes with server-checked `<ProtectedRoute>` guards.

---

## 11. Testing, Outside-In TDD & Test Isolation
**Authoritative Sources:** *Kent Beck (Test-Driven Development by Example)*; *Gerard Meszaros (xUnit Test Patterns)*; *Martin Fowler (Mocks Aren't Stubs)*; *Kent C. Dodds (Testing Trophy)*.  
**Governing Rules:** [`test_driven_development.md`](../rules/test_driven_development.md), [`test_isolation.md`](../rules/test_isolation.md).

### DO
1. **DO** practice Outside-In TDD (London School): write a failing outer acceptance test (HTTP/UI) first, followed by inner unit TDD collaborator cycles.
2. **DO** maintain a strict 100.00% code coverage threshold across statements, branches, functions, and lines on all business logic suites.
3. **DO** adhere strictly to the "Only Mock What You Own" principle; create explicit interface adapters for third-party libraries before mocking them.
4. **DO** isolate database tests using automatic transaction rollback or ephemeral test database containers (Testcontainers).
5. **DO** use test doubles according to their precise role: Dummies (value fillers), Stubs (canned queries), Spies (call recorders), Mocks (expected behavior verifiers), Fakes (working in-memory implementations).
6. **DO** structure tests clearly using the Arrange-Act-Assert (AAA) or Given-When-Then pattern with single, focused assertions.
7. **DO** use property-based testing or fuzzing to test edge cases, boundary numbers, and unexpected character sequences.
8. **DO** ensure tests are completely deterministic and runnable in parallel with zero order dependence or shared state.

### DONT
1. **DONT** write code before writing the corresponding failing test (Zero-Deviation TDD Invariant).
2. **DONT** mock concrete implementation details, private methods, or internal variables; mock only explicit interface contracts.
3. **DONT** write flaky tests that depend on system time, random seeds, external networks, or thread sleep durations (`setTimeout`).
4. **DONT** let test databases persist state between test cases without explicit teardown or rollback.
5. **DONT** test third-party library internals; test your own adapter logic that calls the library.
6. **DONT** reduce test coverage gates to bypass failing CI pipelines.
7. **DONT** write multiple non-contiguous assertions testing unrelated concerns inside a single unit test.
8. **DONT** allow assertions to silently pass without testing the negative (failing) condition first.

---

## 12. Frontend Architecture & Modern Web UI
**Authoritative Sources:** *Dan Abramov (Presentational and Container Components)*; *Tanner Linsley (TanStack Query Architecture)*; *W3C WAI-ARIA 1.2 Authoring Practices Guide*; *Web.dev (Core Web Vitals)*.  
**Governing Rules:** [`react.md`](../rules/react.md), [`accessibility.md`](../rules/accessibility.md), [`ui_navigation.md`](../rules/ui_navigation.md), [`ui_ux_architecture.md`](../rules/ui_ux_architecture.md).

### DO
1. **DO** separate server state caching (managed via TanStack Query) from transient local client UI state (managed via component state or lightweight stores like Zustand).
2. **DO** validate all forms fail-fast on submit and blur using strict schema contracts (React Hook Form + Zod resolver).
3. **DO** standardize UI components on accessible, headless primitives (Radix UI / `shadcn/ui`) with full keyboard navigation and ARIA attributes.
4. **DO** use custom modal confirmation dialogs (`<ConfirmDialog>`) for destructive actions; ensure keyboard focus trapping and Escape-key dismissal.
5. **DO** synchronize filter, pagination, tab, and modal parameters bidirectionally with URL search parameters to enable deep linking.
6. **DO** optimize Web Vitals: ensure Largest Contentful Paint (LCP) < 2.5s, Interaction to Next Paint (INP) < 200ms, and Cumulative Layout Shift (CLS) < 0.1.
7. **DO** lazy-load heavy route components and non-critical modules via dynamic imports (`React.lazy` / code splitting).
8. **DO** implement user-friendly empty states, skeleton loaders, and accessible error boundaries for all data-fetching views.
9. **DO** execute the 7-Pillar Design Architecture Triage Gate before writing any UI views or navigation components.
10. **DO** enforce a strict Dual-Experience Model separating Enterprise Operator Workspaces (`/`) from Consumer / Member Portals (`/portal`).
11. **DO** construct the UI around a Persistent Shell (Header, Collapsible Sidebar, Breadcrumbs, Notifications) with a slim 64px icon rail mode persisted in `localStorage`.

### DONT
1. **DONT** use browser-native dialogs (`window.alert()`, `window.confirm()`, `window.prompt()`) in production user interfaces.
2. **DONT** duplicate server state inside global client stores (Redux/Zustand); let TanStack Query handle server synchronization.
3. **DONT** execute mutations without invalidating the relevant cache query keys, causing stale UI data displays.
4. **DONT** omit form input labels or associate labels using incorrect `id` references, violating WCAG 2.2 AA accessibility standards.
5. **DONT** perform heavy computation directly inside render loops; memoize expensive calculations or move to web workers.
6. **DONT** store raw unformatted monetary strings in form states; handle money as structured decimal/minor unit objects.
7. **DONT** create unconstrained re-renders by creating new object or function instances inside JSX prop assignments without necessity.
8. **DONT** hide interactive elements from screen readers without providing accessible `aria-label` or visually hidden descriptions.
9. **DONT** initiate UI development on assumptions without triaging role visibility, navigation hierarchies, and user flows.
10. **DONT** force consumer/portal users to navigate dense enterprise operator layouts with disabled buttons; provide a dedicated consumer portal.

---

## 13. Reliability, Resilience & Distributed SRE
**Authoritative Sources:** *Google SRE Book (Site Reliability Engineering)*; *Michael Nygard (Release It! Design and Deploy Production-Ready Software)*; *Werner Vogels (10 Lessons from 10 Years of Amazon Web Services)*.  
**Governing Rules:** [`cloud_native.md`](../rules/cloud_native.md), [`continuous_deployment.md`](../rules/continuous_deployment.md).

### DO
1. **DO** implement the Circuit Breaker Pattern on all outbound third-party HTTP/RPC calls to fail fast when external dependencies degrade.
2. **DO** enforce defensive timeouts on every network call, database query, and distributed lock acquisition.
3. **DO** implement the Bulkhead Pattern to isolate resource pools (thread pools, connection pools) so failure in one subsystem does not crash the entire node.
4. **DO** use exponential backoff with full jitter when retrying transient network errors to avoid the Thundering Herd problem.
5. **DO** provide distinct, unauthenticated liveness (`/healthz/live`) and readiness (`/healthz/ready`) probes for container orchestration.
6. **DO** design systems for graceful degradation: serve cached or degraded responses when non-critical downstream dependencies fail.
7. **DO** implement graceful shutdown handlers that drain active requests and flush background buffers upon receiving `SIGTERM`.
8. **DO** define Service Level Objectives (SLOs) and Error Budgets for all critical user journeys.

### DONT
1. **DONT** execute unbounded retries without backoff or retry limits; runaway retries amplify upstream outages.
2. **DONT** couple service startup to the immediate availability of non-critical external services.
3. **DONT** use identical timeout thresholds across chained upstream and downstream calls; stagger timeouts to permit graceful handling.
4. **DONT** allow unhandled promise rejections or uncaught exceptions to leave the process in a corrupt, zombie state; crash fast and restart.
5. **DONT** perform heavy database or network health checks inside high-frequency liveness probes.
6. **DONT** hardcode fixed sleep intervals when polling asynchronous resources; use exponential backoff or event webhooks.
7. **DONT** assume networks are reliable, latency is zero, bandwidth is infinite, or topology never changes (Fallacies of Distributed Computing).
8. **DONT** deploy changes on Fridays or outside peak operational monitoring windows without an automated rollback plan.

---

## 14. Observability, Distributed Tracing & Telemetry
**Authoritative Sources:** *Charity Majors & Liz Fong-Jones (Observability Engineering)*; *Cindy Sridharan (Distributed Systems Observability)*; *CNCF OpenTelemetry Specification*.  
**Governing Rules:** [`cloud_native.md`](../rules/cloud_native.md), [`error_handling.md`](../rules/error_handling.md).

### DO
1. **DO** standardize on 100% vendor-neutral CNCF OpenTelemetry (OTel) for traces, metrics, and logs.
2. **DO** propagate distributed trace context across service and queue boundaries using W3C Trace Context headers (`traceparent`, `tracestate`).
3. **DO** emit structured logs in JSON format conforming to OpenTelemetry or Elastic Common Schema (ECS) with standard fields (`timestamp`, `level`, `trace_id`, `span_id`, `message`).
4. **DO** track golden signals: Latency, Traffic, Errors, and Saturation (Google SRE) or Rate, Errors, and Duration (RED method).
5. **DO** correlate all application log entries with the active distributed `traceId` and `spanId`.
6. **DO** sanitize log payloads automatically to prevent accidental leakage of PII, passwords, credit card numbers, or authorization tokens.
7. **DO** record high-cardinality metadata (tenant ID, user role, entity ID) as span attributes in distributed traces.
8. **DO** configure alert thresholds on error rates and latency percentiles (p95, p99) rather than arbitrary raw error counts.

### DONT
1. **DONT** output unstructured, human-only text logs using `console.log` or unformatted print statements in production.
2. **DONT** log sensitive personal information (PII), session tokens, passwords, or payment details.
3. **DONT** create high-cardinality metric labels (e.g. adding user IDs or timestamps as Prometheus metric labels), causing memory exhaustion.
4. **DONT** drop distributed trace context when dispatching asynchronous background jobs or queue events.
5. **DONT** set sampling rates to 100% on high-throughput production systems without dynamic head-based or tail-based sampling.
6. **DONT** use alerting rules that fire on transient single-instance blips; require sustained anomaly windows.
7. **DONT** rely on logs alone to diagnose distributed system performance bottlenecks; use distributed traces.
8. **DONT** ignore silent failures where an error is logged at DEBUG level while an HTTP 200 response is returned to the client.

---

## 15. DevOps, CI/CD, Containerization & Supply Chain
**Authoritative Sources:** *Jez Humble & Dave Farley (Continuous Delivery)*; *NIST SP 800-218 (Secure Software Development Framework)*; *CIS Docker & Linux Benchmarks*; *SLSA Framework*.  
**Governing Rules:** [`continuous_integration.md`](../rules/continuous_integration.md), [`continuous_deployment.md`](../rules/continuous_deployment.md), [`container_infrastructure.md`](../rules/container_infrastructure.md), [`devsecops.md`](../rules/devsecops.md).

### DO
1. **DO** build minimal, secure container images based on `distroless` or `scratch` base images to minimize the CVE attack surface.
2. **DO** execute containers strictly as an unprivileged non-root user (`USER nonroot:nonroot`).
3. **DO** practice Trunk-Based Development with short-lived feature branches merged at least daily to prevent merge hell.
4. **DO** scan container images and package lockfiles for vulnerabilities in CI using Trivy or Grype, blocking builds on CRITICAL CVEs.
5. **DO** generate Software Bill of Materials (SBOM) in CycloneDX 1.6 format for all production artifacts and sign containers using Cosign.
6. **DO** pin all dependencies and GitHub Actions to exact cryptographic commit SHA hashes rather than mutable version tags.
7. **DO** execute automated smoke tests against deployed environments immediately following zero-downtime rolling or blue-green deployments.
8. **DO** treat infrastructure as code (IaC) stored in version control and validated with automated linting and security scanners.

### DONT
1. **DONT** run container processes as the default `root` user (`UID 0`).
2. **DONT** install full Linux distributions, compilers, package managers, or debug shells (bash/curl) inside production container images.
3. **DONT** use long-lived feature branches that diverge from main for weeks without continuous integration.
4. **DONT** commit unpinned dependencies or dynamic semver ranges (`*`, `^`, `~`) in production lockfiles.
5. **DONT** deploy software artifacts directly from developer laptops to production environments; all deployments must originate from verified CI pipelines.
6. **DONT** bake secrets, passwords, or environment-specific config files into container layers.
7. **DONT** disable container health checks or resource limits (CPU and memory requests/limits), causing noisy neighbor starvation.
8. **DONT** bypass CI/CD pipeline gating or force-push directly to protected production branches.

---

## 16. Caching, Distributed State & Performance
**Authoritative Sources:** *Brendan Gregg (Systems Performance: Enterprise and the Cloud)*; *Ilya Grigorik (High Performance Browser Networking)*; *Redis Labs Best Practices*.  
**Governing Rules:** [`caching.md`](../rules/caching.md), [`database_performance.md`](../rules/database_performance.md).

### DO
1. **DO** apply the Cache-Aside pattern: query the cache first; on a cache miss, query the database, populate the cache with a TTL, and return.
2. **DO** add pseudo-random jitter (e.g. ±10%) to cache Time-To-Live (TTL) values to prevent simultaneous cache expiration storms.
3. **DO** implement the XFetch probabilistic early recomputation algorithm or background refresh locks to defend against cache stampedes.
4. **DO** evict or invalidate related cache keys deterministically when mutating domain records (event-driven cache invalidation).
5. **DO** scope cache keys with explicit versioning and tenant boundaries (`cache:v1:tenant_{id}:entity_{id}`).
6. **DO** configure strict memory eviction policies (e.g. `volatile-lru` or `allkeys-lru`) on caching servers like Redis or Valkey.
7. **DO** use Redis pipelines or MGET/MSET when reading or writing multiple keys to eliminate round-trip network latency.
8. **DO** monitor cache hit ratios continuously; alert when cache hit ratio drops below acceptable baselines (e.g. < 85%).

### DONT
1. **DONT** store unbounded data in cache without a definitive Time-To-Live (TTL) expiration.
2. **DONT** use cache as the authoritative primary source of persistent truth; cache must always be reconstructable from database records.
3. **DONT** query large Redis keys using the blocking `KEYS *` command in production; use non-blocking cursor iteration (`SCAN`).
4. **DONT** cache sensitive plaintext passwords, raw payment tokens, or PII without encryption.
5. **DONT** invalidate cache keys with broad wildcards that trigger heavy Redis CPU spikes during high-load traffic periods.
6. **DONT** leave cache servers open without password authentication and TLS encryption over the wire.
7. **DONT** store massive binary files or multi-megabyte payloads in in-memory caches; store pointers to object storage instead.
8. **DONT** fail the entire user request when the caching layer is temporarily unreachable; fall back gracefully to the primary database.

---

## 17. Error Architecture & Fault Recovery
**Authoritative Sources:** *Joe Armstrong (Programming Erlang: Software for a Concurrent World)*; *RFC 7807 (Problem Details for HTTP APIs)*; *Microsoft Cloud Design Patterns*.  
**Governing Rules:** [`error_handling.md`](../rules/error_handling.md), [`rest_api_conventions.md`](../rules/rest_api_conventions.md).

### DO
1. **DO** model expected operational domain failures using explicit Result objects (`Result<T, E>`) rather than throwing untyped exceptions.
2. **DO** validate all untrusted input payloads fail-fast at the perimeter and return field-level validation errors in standard RFC 7807 format.
3. **DO** provide unambiguous, machine-parseable error codes (e.g. `INSUFFICIENT_FUNDS`, `RESOURCE_ALREADY_EXISTS`, `INVALID_STATE_TRANSITION`).
4. **DO** attach contextual operational metadata (`userId`, `resourceId`, `requestId`) to logged internal errors for fast triage.
5. **DO** sanitize user-facing error messages to prevent disclosing sensitive infrastructure details, table names, or internal stack traces.
6. **DO** implement centralized global error-handling middleware that catches unhandled rejections and formats them as standard HTTP 500 responses.
7. **DO** design compensating transactions (Saga pattern) to revert partial operations when a multi-step distributed operation fails midway.
8. **DO** track error budgets and trigger automated rollbacks when post-deployment error rates breach defined thresholds.

### DONT
1. **DONT** use exceptions for standard control flow in domain business logic.
2. **DONT** swallow errors or catch exceptions with empty catch blocks (`catch (e) {}`).
3. **DONT** return HTTP 200 with an error flag or error message nested inside the JSON response payload.
4. **DONT** expose database driver stack traces, SQL syntax errors, or server file paths to API clients.
5. **DONT** disclose whether an account or resource exists when handling authentication or authorization failures (prevent user enumeration).
6. **DONT** leave database connections or open file handles dangling when an error is thrown inside a try block; ensure clean teardown in `finally`.
7. **DONT** retry non-idempotent or client validation errors (HTTP 400, 422) automatically.
8. **DONT** log errors without sufficient contextual attributes to reproduce the issue in isolation.

---

## 18. Project Management & Continuous Learning
**Authoritative Sources:** *Kent Beck (Extreme Programming Explained)*; *Mary & Tom Poppendieck (Lean Software Development)*; *Google Postmortem Culture Guide*.  
**Governing Rules:** [`project_management.md`](../rules/project_management.md), [`continuous_learning.md`](../rules/continuous_learning.md), [`architecture_decision_records.md`](../rules/architecture_decision_records.md).

### DO
1. **DO** enforce strict Work-In-Progress limits: maintain **WIP = 1**; fully complete, test, and verify the current task before starting the next.
2. **DO** decompose features into INVEST user stories with vertical end-to-end slices delivering verifiable user value.
3. **DO** write executable Gherkin Given-When-Then acceptance criteria before beginning implementation.
4. **DO** verify all changes against the strict Definition of Done (DoD) gate: 100% test coverage, passing linters, clean builds, updated docs.
5. **DO** document architectural mutations and trade-offs immediately in lightweight Architecture Decision Records (ADRs) in `memory.md`.
6. **DO** conduct blameless post-mortems for all production incidents and log root causes, DO's, and DONT's in `docs/knowledge/`.
7. **DO** track all defects with verified CLI evidence, reproducible unit tests, and regression tests to permanently prevent recurrence.
8. **DO** conduct relentless questioning before planning and coding to clarify underspecified requirements and eliminate assumptions.

### DONT
1. **DONT** multitask across multiple unfinished user stories simultaneously; respect WIP limits.
2. **DONT** write horizontal technical tasks (e.g. "Create database tables") that deliver zero observable user value.
3. **DONT** begin coding on assumptions; stop and interrogate domain invariants when requirements are ambiguous.
4. **DONT** mark tasks complete without verified CLI proof of passing tests, coverage reports, and clean builds.
5. **DONT** assign blame to individuals during incident investigations; focus on system design and automated guardrails.
6. **DONT** treat documentation, glossaries, or decision records as afterthoughts to be written weeks after shipping.
7. **DONT** ignore recurring defects; codify automated linting or testing rules to make repeat defects impossible.
8. **DONT** bypass code reviews, automated CI gates, or security scans for urgent hotfixes.
