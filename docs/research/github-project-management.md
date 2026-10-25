# Research: Using GitHub Fully for Project Management

**Date:** 2026-10-25
**Status:** Draft for review (audit + proposed spec). No code written yet.
**Scope:** Both azcodr itself and reusable capability packs for downstream projects. Free GitHub tier only.

---

## 1. Phase 1 — Audit of Current State

### 1.1 What azcodr already ships (GitHub-related)

| Capability | Location | Status |
|---|---|---|
| Pull Request template | `data/pull_request_template.md`, `.github/pull_request_template.md` | Shipped |
| CI workflow template | `data/ci.template` → `.github/workflows/ci.yml` | Shipped via `azcodr add ci` |
| Publish workflow template | `data/publish.template` → `.github/workflows/publish.yml` | Shipped via `azcodr add publish-workflow` |
| Pre-push hook (protected branches) | `scripts/pre-push.js`, `data/pre-push.template` | Shipped via `azcodr add pre-push` |
| Protected branch interception (agent guard) | `src/agent-guard-command.ts` | Shipped |
| ADR ledger (repo-local) | `memory.md` (append-only) | Shipped |
| Prompt ledger (local, ephemeral) | `.agents/ledger/pending.md` | Shipped |
| ADR validator | `src/validator/adr.ts` | Shipped |
| Issue/PR linking convention | PR template asks "Link any relevant issue/task" | Partial |
| GitHub Discussions integration | None | Missing |
| Issue templates | None | Missing |
| CODEOWNERS | None | Missing |
| Dependabot / security updates | None | Missing |
| Labels / milestones config | None | Missing |
| GitHub Projects (boards) integration | None | Missing |
| Branch protection *rulesets* (server-side) | Documented only; not enforceable from repo | N/A (server-side) |
| Release notes / changelog automation | None | Missing |
| Issue forms (YAML) | None | Missing |

### 1.2 Free-tier GitHub capabilities relevant to PM

| Surface | Free for public | Free for private | Notes |
|---|---|---|---|
| Issues (with templates/forms) | Yes | Yes | Unlimited |
| Pull requests + templates | Yes | Yes | |
| Projects v2 (boards, roadmaps, automation) | Yes | Yes | Free tier: 1,000 items/project, unlimited projects |
| Milestones | Yes | Yes | |
| Labels | Yes | Yes | |
| Discussions | Yes (public repos; private repos need... actually Discussions available for public; for private requires... Discussions are free for public repos; private repo discussions require GitHub Pro? Historically Discussions free for public. For private, Discussions available on all plans as of 2023? Verify.) |
| Releases + auto-generated notes | Yes | Yes | |
| Actions minutes | Unlimited (public) / 2,000 min (private) | 2,000 min/mo | |
| Branch protection (classic) | Yes | Yes (limited rulesets) | Classic protection free for all |
| Rulesets | Partial (some features paid) | Limited | Document as "configure in UI" |
| CODEOWNERS | Yes | Yes | |
| Dependabot | Yes | Yes | |
| GitHub Pages | Yes (public) | Yes (private with Pro for custom domain? basic available) | |
| Environments / deployment protection | Yes (with limits) | Limited | |

### 1.3 Gaps (prioritized)

1. **No issue templates / issue forms** — users file unstructured issues.
2. **No CODEOWNERS** — no automatic reviewer routing.
3. **No Discussions integration** — ADRs live only in `memory.md`; no community visibility.
4. **No release automation** — no changelog/release notes generation.
5. **No Dependabot config** — supply-chain hygiene gap (deps not monitored).
6. **No labels/milestone conventions** — inconsistent triage.
7. **No Projects v2 templates** — no board setup guidance.
8. **No issue↔branch↔PR linking convention enforced** — PR template mentions linking but not branch naming with issue numbers.
9. **Configurability gap** — `harness.yaml` has no knobs for "issue tracking mode" (local ledger vs GitHub Issues vs both). User explicitly wants this configurable.
10. **ADR dual-hosting** — user wants ADRs in repo + GitHub Discussions.

### 1.4 Constraints from free tier

- Design must assume public-repo generosity but document private-repo limits.
- No paid-only features (advanced rulesets, environments with reviewers requiring Pro) as hard dependencies.
- Server-side config (branch protection rulesets) cannot be shipped as files; provide a setup guide + maybe a `gh` CLI script (optional, user-run).

---

## 2. Phase 2 — Proposed Specification (draft for review)

### 2.1 Strategic Alignment (product-analyst)

- **Product Goal:** Make azcodr a complete, free-tier GitHub project-management harness: every repo scaffolded or audited by azcodr can adopt issues, PRs, ADRs, releases, and triage with zero paid features and zero opinionated defaults.
- **Target OKR:**
  - Objective: Eliminate unstructured issue/PR/ADR workflows in governed repos.
  - Key Result: `npx azcodr add github-pm` installs a complete, non-clobbering GitHub PM bundle (issue templates, PR template, CODEOWNERS, dependabot, release workflow, discussion guide) in < 60s.
  - Key Result: 100% of governed repos have a documented issue↔branch↔PR↔ADR traceability convention.
- **Prioritization:** Kano = Must-be (table stakes for OSS governance); MoSCoW = Must for templates/CODEOWNERS/dependabot, Should for Discussions/release automation, Could for Projects v2 board templates.

### 2.2 Scope

**In scope (Must/Should):**
- New capability pack: `github-pm` (aliases: `github`, `pm`, `project-management`) installing:
  - `.github/ISSUE_TEMPLATE/` (bug report, feature request, ADR proposal, config.yml)
  - `.github/pull_request_template.md` (already exists; ensure installed by pack)
  - `.github/CODEOWNERS`
  - `.github/dependabot.yml`
  - `.github/workflows/release.yml` (release notes + tag) — or extend publish workflow
  - `.github/DISCUSSION_TEMPLATE/` (ADR category guide) — documentation + optional
  - `docs/github-project-management.md` guide (server-side setup: branch protection, Projects v2, labels)
- Configurable harness knobs in `harness.yaml`:
  - `issueTracking: local | github | both` (default: `github` per user decision 2026-10-25)
  - `adrHosting: repo | discussions | both` (default: `repo`)
  - `prGovernance: true/false` (default true)
- Issue↔branch↔PR convention: branch names may include issue number `<type>/<issue>-<desc>`; PR template requires "Closes #N".
- ADR mirroring to GitHub Discussions: optional script `npx azcodr adr publish` (or document manual). Given free tier and API auth complexity, recommend documentation-first + optional `gh` CLI script, not a hard dependency.
- Release notes: leverage GitHub's auto-generated release notes via `.github/release.yml` (free, native).

**Out of scope (Won't have this time):**
- GitHub Projects v2 board automation via API (requires auth, complex) — provide template/guide only.
- Server-side branch protection ruleset provisioning (cannot be done from repo files) — provide `gh` CLI snippet + UI guide.
- Paid features (advanced rulesets, environment reviewers requiring Pro).
- Replacing local prompt ledger — keep local; make GitHub Issues additive and configurable.

### 2.3 Non-Story Requirements (NFRs / system invariants)

- **Neutrality:** No opinionated labels/milestones beyond a documented recommended set; projects declare in `harness.yaml`.
- **Non-clobbering:** All template installs skip existing files unless `--force`.
- **Free-tier safe:** No hard dependency on paid features or `gh` CLI; `gh` is optional.
- **Configurable tracking mode:** `harness.yaml` `issueTracking` and `adrHosting` knobs; validator respects declared mode (e.g., if `local`, don't require issue links).
- **100% coverage / clean code:** all new TS modules obey ≤300 lines/file, ≤30 lines/function, ≤3 params, complexity ≤10.
- **Zero runtime deps:** new code uses node builtins only.

### 2.4 User Stories (INVEST, vertical slices)

#### US-01: Install GitHub PM bundle
**As a** maintainer of a governed repo
**I want to** run `npx azcodr add github-pm`
**So that** my repo gets issue templates, PR template, CODEOWNERS, dependabot, release config, and a PM guide without clobbering existing files

Gherkin:
```gherkin
Scenario: Fresh install
  Given a repo with no .github directory
  When I run `npx azcodr add github-pm`
  Then .github/ISSUE_TEMPLATE/, pull_request_template.md, CODEOWNERS, dependabot.yml, release.yml are created
  And harness.yaml gains pack: github-pm
  And no existing files are overwritten

Scenario: Re-run is idempotent
  Given github-pm already installed
  When I run `npx azcodr add github-pm`
  Then it reports already installed and changes nothing

Scenario: Force overwrite
  Given a custom .github/CODEOWNERS exists
  When I run `npx azcodr add github-pm --force`
  Then CODEOWNERS is replaced and an action is logged
```

#### US-02: Configurable issue tracking mode
**As a** project adopting azcodr
**I want to** declare `issueTracking: local | github | both` in harness.yaml
**So that** the validator and agents know whether to require GitHub issue links

Gherkin:
```gherkin
Scenario: Local mode
  Given harness.yaml has issueTracking: local
  When azcodr check runs
  Then no issue-link requirement is enforced
  And the prompt ledger remains the source of truth

Scenario: GitHub mode
  Given harness.yaml has issueTracking: github
  When a PR is opened without "Closes #N"
  Then the governance check fails (or warns, per severity)
```

#### US-03: ADR mirroring to Discussions
**As a** maintainer
**I want to** optionally mirror ADRs from memory.md to a GitHub Discussion
**So that** stakeholders can read/comment without editing the repo

Gherkin:
```gherkin
Scenario: Mirror on demand
  Given adrHosting: discussions (or both) and gh CLI authenticated
  When I run `npx azcodr adr publish`
  Then a Discussion is created/updated in the ADR category with the latest ADRs
  And memory.md remains the canonical source
```

#### US-04: Release notes automation
**As a** maintainer
**I want** `.github/release.yml` categories
**So that** GitHub auto-generates categorized release notes on tag

#### US-05: CODEOWNERS routing
**As a** maintainer
**I want** a starter CODEOWNERS
**So that** PRs auto-request review from owners

### 2.5 SMART Developer Tasks (inner-loop, time-boxed)

- [ ] **T1 [2h]:** Design harness.yaml schema additions (`issueTracking`, `adrHosting`, `prGovernance`) + validator parsing + tests.
- [ ] **T2 [3h]:** Create template files under `data/github-pm/` (issue templates, CODEOWNERS, dependabot.yml, release.yml, discussion guide).
- [ ] **T3 [2h]:** Implement `installGithubPmPack` side-effect in `pack.ts` (non-clobbering, like ci/pre-push).
- [ ] **T4 [2h]:** Add pack registration + aliases in `pack.ts` and `cli-add.ts`.
- [ ] **T5 [3h]:** Add validator checks (optional): `issue-link` check gated by `issueTracking` mode; `adr-index` already exists.
- [ ] **T6 [2h]:** Documentation guide `docs/github-project-management.md` (server-side setup: branch protection, Projects v2, labels, environments) + `.github` README.
- [ ] **T7 [2h]:** Optional `adr publish` CLI command (gh CLI wrapper, fails gracefully if gh missing).
- [ ] **T8 [2h]:** Tests: pack install, idempotency, force, non-clobber, validator gating, coverage.

### 2.6 Edge Case & Error Matrix

| Condition | Severity | Expected Behavior |
|---|---|---|
| `.github` exists with custom files | warn/skip | Non-clobber; log skip |
| `gh` CLI missing (adr publish) | info | Print manual instructions, exit 0 |
| Private repo free-tier limits | doc | Guide notes limits |
| `issueTracking: github` but no issue number in branch | error/warn | Per harness severity |
| Discussions disabled on repo | doc | Guide explains enabling |

### 2.7 Open questions for review

1. Default for `issueTracking`: `local` (preserve current) or `both`? Recommend `local` default to avoid breaking existing repos; opt-in to `github` (decided: default github).
2. Should `github-pm` pack be split into smaller packs (`issue-templates`, `codeowners`, `dependabot`, `release-notes`) or one bundle? Recommend one bundle + aliases for discoverability, but allow individual? Current pattern is bundles (ci, publish-workflow). Keep bundle.
3. Should CODEOWNERS default owner be `@{repo-owner}` placeholder or empty? Recommend placeholder comment requiring edit.
4. Discussions ADR mirroring: implement now or document-only first? Recommend document + optional command in v2 (lower risk).

---

## 3. Review Gate

Please review the audit and proposed spec. On approval, I will:
1. Append an ADR to `memory.md` for this decision.
2. Implement in vertical slices (T1→T8) with tests.
3. Run `npm test`, `npm run lint`, `npm run typecheck`, `npx azcodr check`.

**Do not implement until you confirm.**
