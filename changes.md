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
