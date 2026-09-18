---
name: merge-ai
description: Use when the user invokes /merge-ai or asks to merge generic AI rules, skills, lessons learned, and post-mortems from the current workspace back into the generic mvp baseline repository. Do not use for merging application business logic or routine Git branches.
---

# Merge AI Knowledge, Rules & Skills Skill (`/merge-ai`)

> **Core Philosophy:** Upstream baseline repositories (e.g. `https://github.com/prosubodh/mvp`) must remain pristine, generic, and untouched until the user explicitly triggers `/merge-ai`. When triggered from any project workspace (e.g. `https://github.com/prosubodh/sthanori`), detect if the baseline repo is already cloned locally (apply directly) or clone it first, purge all project-specific domain models, colocate DOs and DONTs into atomic rules, and synchronize the generic baseline.

---

## 1. When to Use This Skill
- The user issues `/merge-ai` or requests syncing AI rules, skills, issue logs, and lessons learned back into the generic baseline repository.
- User references repository URLs (e.g. Source: `https://github.com/prosubodh/sthanori`, Target: `https://github.com/prosubodh/mvp`).
- Auditing divergences between the current project workspace and the generic baseline repository.
- Exporting newly discovered architectural patterns, defect post-mortems, or reusable skills to the generic starter.
- **DO NOT USE** during routine project feature development or bug fixes.
- **DO NOT USE** to merge application domain entities, business logic, or project-specific data models.
- **DO NOT USE** without explicit user invocation.

---

## 2. Step-by-Step Execution Workflow

### Phase 1: Target Baseline Repository Resolution (URL or Local)
When `/merge-ai` is triggered with repository URLs (e.g. `/merge-ai https://github.com/prosubodh/sthanori https://github.com/prosubodh/mvp`):
1. **Execute Repo Resolver Script:**
   ```bash
   # Discovers existing local clone or automatically clones fresh
   eval $(bash .agents/skills/merge-ai/scripts/resolve_repo.sh "$TARGET_REPO_URL")
   ```
   - **If already cloned locally:** Discovers its directory, verifies clean working tree, and exports `STATUS=ALREADY_CLONED` and `LOCAL_PATH` (e.g. `/home/prosubodh/projects/mvp`).
   - **If not cloned locally:** Automatically executes `git clone "$TARGET_REPO_URL"` to `$HOME/projects/<name>` and exports `STATUS=CLONED_FRESH` and `LOCAL_PATH`.
2. Set `$BASELINE_DIR="$LOCAL_PATH"`.
3. If `STATUS=ALREADY_CLONED`, ensure the repository is on branch `main` (`git -C "$BASELINE_DIR" pull --ff-only`).

---

### Phase 2: Divergence Audit & Domain Purging
1. Run the divergence audit script:
   ```bash
   bash .agents/skills/merge-ai/scripts/audit_divergence.sh "$BASELINE_DIR"
   ```
2. Systematically filter out all project-specific elements before proposing changes:
   - **Purge Business Domain Entities:** Replace project-specific nouns (`Property`, `Unit`, `Lease`, `Payment`, `Application`, `Rent`) with universal architectural archetypes (`Entity`, `Aggregate`, `ValueObject`, `Resource`, `Transaction`).
   - **Purge Concrete Stack Specifics:** Keep core rules stack-agnostic (Hexagonal Ports, abstract repositories). Keep project-specific setups (e.g. SQLite dev / Postgres prod, React Vite client) in the project workspace.
   - **Colocate DOs & DONTs into Atomic Rules:** Embed DOs and DONTs directly inside their governing atomic rule files in `docs/rules/` (`## Invariants, DO's & DONT's`). Keep `docs/knowledge/dos_and_donts.md` strictly as a clean cross-reference index directory.
   - **Transform ADRs & Post-Mortems:** Port universal decisions (ADR-007 CRUD & Selectors, ADR-008 Bootstrapping Decoupling, ADR-009 Agile Domain TDD, ADR-010 M:N Skill Composability) as generic ADRs in `memory.md`. Port universal post-mortems (`ISSUE-004`, `ISSUE-005`) into `issue_log.md` and `lessons_learned.md`.

---

### Phase 3: Dry-Run Review & Explicit User Confirmation
1. Present a concise, structured dry-run report to the user summarizing:
   - Target baseline repo URL and resolved local directory (`$BASELINE_DIR`).
   - Generic rules, skills, post-mortems, and ADRs to be merged.
   - Domain-specific elements purged.
2. **STOP AND ASK FOR EXPLICIT CONFIRMATION** before modifying `$BASELINE_DIR`.

---

### Phase 4: Apply Merge, Validate & Sync
Upon user confirmation:
1. Apply the generic updates to `$BASELINE_DIR`:
   - `AGENTS.md` (Unified Agent Cognitive & Agile Domain Lifecycle).
   - `docs/rules/` (Updated atomic rules with colocated DOs/DONTs).
   - `.agents/skills/` (Updated generic skills, e.g. decoupled `lets-build`).
   - `docs/knowledge/` (Index-only `dos_and_donts.md`, generic post-mortems in `issue_log.md`, `lessons_learned.md`, `knowledge_graph.md`).
   - `memory.md` (Generic ADRs).
2. Validate agentic configuration integrity in the baseline:
   ```bash
   bash "$BASELINE_DIR/.agents/skills/agentic-architect/scripts/validate_agentic_configs.sh"
   ```
   *Requirement: 0 warnings, AGENTS.md <= 120 lines, valid symlinks.*
3. Commit and push the baseline repository to remote:
   ```bash
   git -C "$BASELINE_DIR" add -A
   git -C "$BASELINE_DIR" commit -m "feat(ai-sync): merge generic rules, skills, and lifecycle improvements from workspace"
   git -C "$BASELINE_DIR" push origin main
   ```
4. Confirm successful synchronization with the remote generic baseline URL.

---

## 3. Gotchas & What NOT to Do

- **MAJOR DONT: Never touch, edit, or commit to the baseline repository (`mvp`) during routine feature development.** The baseline must be left completely alone until `/merge-ai` is explicitly invoked.
- **DO NOT** copy application domain models, database tables, or framework-specific configs to the baseline.
- **DO NOT** create monolithic DO/DONT lists. Always colocate directives in atomic rules.
- **DO NOT** execute the merge without presenting a dry-run summary and receiving explicit approval.
- **DO NOT** push to the baseline repository if `validate_agentic_configs.sh` fails or reports warnings.
