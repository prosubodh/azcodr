# Continuous Integration (CI) & Quality Gates

> **Core Mandate:** Enforce shift-left automated quality gates, trunk-based development with short-lived branches, and mandatory green pipeline verification before merge.

---

## 1. Shift-Left Automated Quality Gates

Every pull request pipeline must execute automated checks in strict dependency stages:
1. **Security & Secrets**: Open-source secret scanning (`secretlint`) and SAST analysis (`semgrep`).
2. **Static Analysis**: ESLint (`npm run lint`) and TypeScript typecheck (`npm run typecheck`).
3. **Full-Stack Test Coverage**: Unit and acceptance tests verifying **100.00%** coverage (`npm run coverage`).
4. **Supply Chain Audit**: Vulnerability scan of dependencies and SBOM generation (`syft` + `grype`).

---

## 2. Trunk-Based Development

- **Short-Lived Branches**: Feature branches must live less than 24–48 hours before merging to the main trunk.
- **Fast Build Times**: Docker build layers and npm packages must be cached in CI runners to maintain pipeline execution times under 5 minutes.
