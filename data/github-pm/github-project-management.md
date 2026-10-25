# GitHub Project Management Guide

This guide covers the GitHub surfaces that cannot be shipped as repository files
(branch protection rules, Projects v2 boards, environments) and the conventions
azcodr recommends for issue tracking, PRs, ADRs, and releases.

## 1. Issue tracking modes

Configure in `harness.yaml`:

```yaml
github:
  issueTracking: github   # local | github | both (default: github)
  adrHosting: repo        # repo | discussions | both (default: repo)
  prGovernance: true      # default: true
```

- `local`: the `.agents/ledger/pending.md` prompt ledger is the source of truth.
- `github`: GitHub Issues are the source of truth; branches/PRs should reference issue numbers.
- `both`: keep the local ledger for agent directives AND file GitHub Issues for human-facing work.

## 2. Branch & PR conventions

- Branch names: `<type>/<issue>-<kebab-desc>` (e.g. `feat/123-add-export`) when an issue exists.
- Every PR body must include `Closes #N` (or `Refs #N`) when issueTracking is `github` or `both`.
- Direct pushes to protected branches are blocked by the pre-push hook and agent guard.

## 3. ADR recording

- Canonical ADRs live in `memory.md` (append-only, versioned).
- With `adrHosting: discussions` or `both`, mirror ADRs to a GitHub Discussion in the
  `Architecture Decisions` category using `npx azcodr adr publish` (requires `gh` CLI).

## 4. Releases

- `.github/release.yml` configures GitHub's auto-generated release notes.
- Tag a release; GitHub generates categorized notes from PR labels.

## 5. Server-side setup (free tier)

### Branch protection (classic)

1. Repo Settings -> Branches -> Add rule for `main`/`master`.
2. Enable: require pull request before merging; require status checks (CI); require conversation resolution.
3. (Free private repos: classic protection is available; advanced rulesets may require Pro.)

### Projects v2 (boards)

1. Repo -> Projects -> New project -> choose Board or Roadmap template.
2. Add fields: Status, Priority, Size. Link issues/PRs.
3. (Free tier: 1,000 items per project.)

### Environments

- Repo Settings -> Environments -> create `staging`/`production` with required reviewers (Pro for private repos).

### Dependabot

- `.github/dependabot.yml` is installed by the `github-pm` pack; enable Dependabot alerts in Repo Settings -> Security.

## 6. Labels (recommended, optional)

Suggested labels: `type:bug`, `type:feature`, `type:adr`, `type:docs`, `triage`, `breaking`,
`dependencies`, `ci`. Projects may define their own in `harness.yaml`-adjacent docs.