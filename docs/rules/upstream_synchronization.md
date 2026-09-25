# Upstream Baseline Synchronization & changes.md Ledger

> **Core Mandate:** Upstream template/baseline workspaces (`azcodr`) must remain strictly untouched during project development. When generic architectural improvements, rule refinements, or post-mortems are identified, record them solely into the `changes.md` ledger with zero automated repo merging or baseline contamination.

---

## 1. The Baseline-Project Decoupling Principle

Workspaces operate under a clean, decoupled flow:

```
[Upstream Generic Baseline: azcodr]
               │
               ▼  (Scaffolded via npx azcodr)
[Derived Project Workspace: my-app / others]
               │
               │  (Accumulates project code, specificities, and institutional lessons)
               │
               ▼  (Record reusable improvements)
[Upstream Changes Ledger: changes.md]
```

- **Pristine Upstream Mandate:** Never edit, commit, or attempt automated git merges to an upstream baseline repository during routine project development, feature implementation, or bug fixes.
- **Ledger-Only Synchronization:** When generic architectural discoveries or defect post-mortems occur, document them cleanly in `changes.md` at the workspace root. No automated merge AI or remote repo synchronization is executed.

---

## 2. Zero-Contamination Invariant (Generic vs. Specific)

When logging proposed changes into `changes.md`, enforce strict domain filtering:

| Element Category | Keep in Specific Project Workspace | Allow in changes.md for Upstream (`azcodr`) |
|---|---|---|
| **Domain Entities** | Concrete business models (`Order`, `Customer`, `Invoice`, etc.) | Abstract archetypes (`Entity`, `Aggregate`, `ValueObject`, `Resource`) |
| **Tech Stack / Adapters** | Concrete choices (Prisma, SQLite dev, PostgreSQL prod, Vite React) | Hexagonal Ports, abstract repository contracts, polyglot adapter guidance |
| **Architectural Rules** | Specific entity validation, specific route paths | Universal invariants (5-Phase Agile Lifecycle, SemVer trigger matrix, FK dropdowns) |
| **ADRs** | Stack decisions (`ADR-006: Target Tech Stack for Project`) | Generic architecture patterns (`ADR-007` to `ADR-010`) |
| **Test Suites** | Concrete domain tests (`order_domain.test.ts`, domain-specific suites) | Boundary smoke test pattern (`scripts/smoke_test.sh`), 100% coverage gate |

---

## 3. Atomic changes.md Entry Protocol

Every upstream-bound proposal logged to `changes.md` must follow the standardized format:

```markdown
### [YYYY-MM-DD] <Title of Change>
- **Category:** Rule | Skill | Infrastructure | CLI | Knowledge Hub
- **Target File(s):** `docs/rules/...`, `.agents/skills/...`, etc.
- **Rationale:** Why this improvement is necessary or valuable across all enterprise projects.
- **Description:** Concise summary of the mutation or invariant added.
- **Domain Filter Verification:** Verified 100% generic; purged of all project-specific business entities and models.
```

---

## 4. Invariants, DO's & DONT's

### DO's:
- **DO:** Record candidate generic architectural improvements in `changes.md`.
- **DO:** Distill all lessons and post-mortems into generic, domain-agnostic language before logging.
- **DO:** Colocate DOs and DONTs directly inside the relevant atomic rules and skills.
- **DO:** Verify that all entries in `changes.md` are 100% stack- and domain-agnostic.

### DONT's:
- **DONT:** Never execute automated upstream git cloning or merge AI workflows during project work.
- **DONT:** Never contaminate `changes.md` with project-specific business logic, schemas, or customer requirements.
- **DONT:** Never leave machine-specific or absolute user paths in scripts or documentation.
