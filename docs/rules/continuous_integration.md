# Continuous Integration: Automated Builds, Continuous Inspection & Database Synchronization

> **Core Mandate:** Enforce Paul Duvall, Steve Matyas, and Andrew Glover's Continuous Integration canon: every developer and agent integrates changes at least daily into trunk via automated builds, private builds run before committing, tests and inspections execute continuously, broken builds stop the line immediately, and database migrations are automated and tested alongside application code.

---

## 1. The 7 Core Practices of Continuous Integration

Continuous Integration (*Duvall, Matyas, Glover*) transforms software development from an unpredictable, late-stage integration nightmare into a routine, low-risk, automated habit:

1. **Commit Code Frequently:**
   Integrate code into the mainline (trunk/main) at least once per day. Small, frequent commits expose integration conflicts within hours rather than weeks, dramatically reducing merge complexity.
2. **Don't Commit Broken Code:**
   Never push code that fails compilation, linter gates, or test suites. Every commit pushed to remote must represent a verified, working increment.
3. **Fix Broken Builds Immediately:**
   A failing build on trunk is an emergency. The entire team halts new feature commits to assist in diagnosing and fixing the build regression. If a fix cannot be implemented within 10 minutes, the offending commit must be reverted (`git revert`).
4. **Write Automated Developer Tests:**
   Every class, function, and module must be accompanied by automated developer tests (Unit and Component tests). Code without automated tests is unverified legacy debt.
5. **All Tests and Inspections Must Pass:**
   A build is not successful simply because compilation succeeded. A green build requires:
   - 100% test pass rate with zero skipped or suppressed assertions.
   - Zero linter or static analysis errors (`npm run lint`).
   - Zero typecheck errors (`tsc --noEmit`).
   - Architectural boundary and cyclomatic complexity compliance.
6. **Run Private Builds Before Committing:**
   Developers and autonomous agents must execute private local builds (`npm test`, `npm run validate`) on their workstation before committing and pushing.
7. **Avoid Getting Broken Code:**
   Always update from mainline (`git pull --rebase origin main`) and run local verification before pushing. Never build on top of unverified or stale baselines.

---

## 2. Continuous Database Integration (CDBI)

Database schema mutations and data migrations are software artifacts and must be governed under the exact same CI rigor as application source code:

1. **Single Source of Truth:**
   All database migration scripts (DDL), reference data seeds, and rollback scripts must reside in version control in the same repository as the application code.
2. **Automated Migration Execution:**
   CI builds must provision a clean, ephemeral test database, apply migrations from scratch, and verify that the schema is at the exact expected revision.
3. **Deterministic Test Data Fixtures:**
   Tests must never depend on shared, mutable, or pre-existing database records. Each test suite must seed its own isolated fixtures and clean up state deterministically.
4. **Rollback Verification:**
   Every database migration script must have a tested, verified rollback path. CI pipelines should periodically test migration forward-and-backward execution.

---

## 3. Continuous Inspection & Fitness Functions

Static analysis and code inspections must run continuously to prevent gradual codebase entropy:

```
[Source Code] ──► [Continuous Inspection] ──► [Fitness Function Gates]
                        • Line Budgets             • Pass: Merge Allowed
                        • Function Budgets         • Fail: Build Broken
                        • Cyclomatic Complexity
                        • Boundary & Cycle Guard
```

1. **Executable Fitness Functions:**
   Enforce architectural fitness functions directly in the CI pipeline:
   - File size budget: $\le 300$ lines per file.
   - Function size budget: $\le 30$ lines per function.
   - Parameter budget: $\le 3$ parameters per function.
   - Cyclomatic complexity cap: $\le 10$ branches per function.
2. **Architectural Boundary & Cycle Prevention:**
   Inspect module dependency graphs continuously (`azcodr check` / `azcodr boundaries`). Zero circular cycles and zero upward/inward layer violations permitted.
3. **Zero Suppression Tolerance:**
   Disabling linters via inline suppression comments (`// eslint-disable`, `// @ts-ignore`) is prohibited unless accompanied by an approved ADR documenting the technical necessity.

---

## 4. Build Automation & Feedback Loops

1. **Single-Command Build:**
   A freshly cloned repository must be buildable and testable via a single canonical command (e.g., `npm test` or `npx azcodr check`). Never require manual multi-step configuration or tribal knowledge.
2. **Fast Feedback SLA:**
   The CI commit build must report pass/fail status in **under 5 minutes** (never exceeding 10 minutes). Slow feedback encourages developers to context-switch, degrading CI effectiveness.
3. **Ubiquitous, Unambiguous Feedback:**
   Build status must be instantly broadcast via clear terminal outputs, pull request status checks, and notification webhooks. Green means ready for candidate release; red means immediate stop-the-line.

---

## 5. Continuous Integration Verification Checklist

Before marking any CI pipeline or task complete, verify:
- [ ] **Single Command Execution:** Clean checkout builds and tests with `npm test`.
- [ ] **Fast Feedback Cycle:** Local test suite executes in $\le 5$ minutes.
- [ ] **Automated Migrations:** Database migrations execute and verify cleanly against ephemeral test instances.
- [ ] **Zero Inspection Warnings:** Linters, typecheckers, and boundary guards report 0 errors and 0 warnings.
- [ ] **Stop-the-Line Enforced:** Git pre-push and PR status checks block commits on broken test baselines.
- [ ] **Private Build Routine:** Local tests run and pass before every git push.
