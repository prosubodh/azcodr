# Upstream Baseline Synchronization & AI Knowledge Merging

> **Core Mandate:** Upstream template/baseline workspaces (`azcodr`) must remain strictly untouched until the user explicitly requests merging. When merging via `/merge-ai`, strictly filter out all domain-specific entities, stacks, and models, keeping the baseline 100% generic.

---

## 1. The Baseline-Project Decoupling Principle

Workspaces operate under a strict unidirectional and on-demand bidirectional flow:

```
[Upstream Generic Baseline: azcodr]
               │
               ▼  (One-time fork / clone at project inception)
[Derived Project Workspace: my-app / others]
               │
               │  (Accumulates project code, specificities, and institutional lessons)
               │
               ▼  (ONLY when user explicitly triggers /merge-ai)
[Distillation & Filter: Purge Domain Specificities, Colocate DOs/DONTs]
               │
               ▼
[Clean Merge into Upstream Baseline: azcodr]
```

- **Pristine Upstream Mandate:** Never edit, commit, or push changes to an upstream baseline repository (`azcodr`) during routine project development, feature implementation, or bug fixes.
- **Explicit Trigger Requirement:** Synchronization into the baseline template may occur **only and exclusively** when the user explicitly issues the `/merge-ai` slash command or direct merge directive.

---

## 2. Zero-Contamination Invariant (Generic vs. Specific)

When merging knowledge, rules, or skills back to the baseline, enforce strict domain filtering:

| Element Category | Keep in Specific Project Workspace | Allow in Generic Baseline (`azcodr`) |
|---|---|---|
| **Domain Entities** | Concrete business models (`Order`, `Customer`, `Invoice`, `Account`, etc.) | Abstract archetypes (`Entity`, `Aggregate`, `ValueObject`, `Resource`) |
| **Tech Stack / Adapters** | Concrete choices (Prisma, SQLite dev, PostgreSQL prod, Vite React) | Hexagonal Ports, abstract repository contracts, polyglot adapter guidance |
| **Architectural Rules** | Specific entity validation, specific route paths | Universal invariants (5-Phase Agile Lifecycle, SemVer trigger matrix, FK dropdowns) |
| **ADRs** | Stack decisions (`ADR-006: Target Tech Stack for Project`) | Generic architecture patterns (`ADR-007` to `ADR-010`) |
| **Test Suites** | Concrete domain tests (`order_domain.test.ts`, domain-specific suites) | Boundary smoke test pattern (`scripts/smoke_test.sh`), 100% coverage gate |

---

## 3. Direct Rule Colocation Protocol

To prevent token bloat and documentation rot:
1. **Never Duplicate in a Consolidated List:** Never dump merged rules into a monolithic `dos_and_donts.md`.
2. **Colocate at Source:** Embed DO's and DONT's directly into the relevant atomic rule (`docs/rules/<domain>.md`) and skill (`.agents/skills/<skill>/SKILL.md`).
3. **Index-Only Directory:** Maintain `docs/knowledge/dos_and_donts.md` strictly as a clean reference table pointing to atomic rules.

---

## 4. Invariants, DO's & DONT's

### DO's:
- **DO:** Leave the upstream baseline repository (`azcodr`) completely alone during regular development.
- **DO:** Require an explicit `/merge-ai` command before proposing or executing any upstream synchronization.
- **DO:** Distill all lessons and post-mortems into generic, domain-agnostic language before merging.
- **DO:** Colocate DOs and DONTs directly inside the relevant atomic rules and skills.
- **DO:** Run `validate_agentic_configs.sh` on the upstream baseline before and after any merge.

### DONT's:
- **DONT:** Never touch or edit the upstream baseline template automatically without explicit user command.
- **DONT:** Never contaminate the baseline template with project-specific domain models, entity names, or framework setups.
- **DONT:** Never overwrite upstream baseline files with raw project copies; merge generic concepts surgically.
