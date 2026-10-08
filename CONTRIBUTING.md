# Contributing to azcodr

Thank you for contributing to `azcodr`!

This repository is governed by strict systemic atomicity, Clean Code fitness functions, and test-driven development.

---

## 🛠️ Development Setup

### Prerequisites
- Node.js `>=22.8.0` (required for native ESM VM modules)
- npm `>=10.0.0`
- Git

### Installation
Clone the repository and install exact-pinned development tooling:
```bash
git clone https://github.com/prosubodh/azcodr.git
cd azcodr
npm ci
```

---

## 🧪 Verification & Quality Gates

Before submitting any code changes, all 5 quality gates must pass with zero errors:

1. **Type Checking:**
   ```bash
   npm run typecheck
   ```
2. **Production Build:**
   ```bash
   npm run build
   ```
3. **Clean Code Fitness Functions (ESLint):**
   ```bash
   npm run lint
   ```
   *Enforces:*
   - Maximum 300 lines per file (including comments)
   - Maximum 30 lines per function
   - Cyclomatic complexity $\le 10$
   - Maximum 3 parameters per function
4. **Test Suite & Coverage Gate (Jest):**
   ```bash
   npm test
   npm run test:coverage
   ```
   *Coverage gates enforced (CI fails below 100% on any metric):*
   - **100% lines coverage**
   - **100% functions coverage**
   - **100% branches coverage**
   - **100% statements coverage**
   - Plus **100% mutant-kill on guards** (`npm run test:mutation`) and rejection of assertion-free tests.
5. **Agentic Architecture Validation:**
   ```bash
   npm run validate
   ```
   Validates root harness parity, progressive disclosure rules, skill formats, markdown links, ADR ledger consistency, and toolchain gate presence.
6. **Vendored Guard Sync:** after any change under `src/agent-guard*.ts` and `npm run build`, re-copy the four compiled engine files into `.agents/lib/` (byte-equality is enforced by `tests/agent-guard.test.ts`):
   ```bash
   node -e "const fs=require('fs');for(const f of['agent-guard.js','agent-guard-command.js','agent-guard-file.js','agent-guard-tdd.js'])fs.copyFileSync('lib/'+f,'.agents/lib/'+f)"
   ```

---

## 🏛️ Architectural Invariants

Every contribution must preserve these core invariants:
- **Zero Runtime Dependencies:** `dependencies` in `package.json` must remain undefined. Runtime features rely strictly on Node.js standard builtins (`node:*`).
- **Exact-Pinned DevDependencies:** Any tool in `devDependencies` must have an exact version (no `^`, `~`, or floating ranges) and committed `package-lock.json`.
- **Refactor Before Adding:** When introducing changes, refactor structure first under existing green tests before adding new logic.
- **Lightweight ADRs:** Significant architectural decisions or boundary changes must be recorded in `memory.md`.

---

## 🔄 Pull Request Guidelines

1. Create a feature branch: `git checkout -b feat/your-feature-name`.
2. Follow Conventional Commits: `feat(...)`, `fix(...)`, `docs(...)`, `test(...)`.
3. Ensure all tests and validation pass locally (`npm run prepublishOnly`).
4. Submit your pull request with a concise summary and verification evidence.

---

## 📜 Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report any violations to `prosubodh+conduct@gmail.com`.
