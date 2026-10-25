# azcodr: Architecture Governance Toolkit

Azcodr provides executable governance checks: boundary & cycle detection, fail-closed validation, and declarative configuration via `harness.yaml`. Nothing is opinionated by default — a project enforces only what it declares.

## Ground rules (universal)

1. **Read before you edit.** Read a file in full before modifying it.
2. **Verify, do not assume.** A claim is not a result until a command produced it.
3. **State evidence.** Quote the command and its real output for every completion claim.
4. **Extend existing patterns.** Match the nearest existing code style rather than inventing a new one.
5. **Ask before irreversible actions.** Deploys, publishes, migrations, data deletion, or messages to third parties require explicit user confirmation.
6. **Refuse destructive commands.** No force-push, direct push to protected branches (`main`, `master`), `reset --hard`, `git clean -f`, `rm -rf /`, `rm -rf ~`, `rm -rf .`, or dropped databases.
7. **Stable error contracts.** Errors crossing a boundary carry a stable code and stable shape.
8. **Append decisions.** Record architecture decisions in `memory.md`; git is the archive of everything else.
9. **No dead code.** Delete it or wire it up.
10. **Say when unsure.** Degraded or ambiguous input is unverified; say so rather than guess.
11. **Zero unattended requests.** Every user request must be logged and tracked until resolved with concrete evidence (tests, output, or explicit answer). Once all items in the ledger are verified and resolved, delete the completed ledger.
12. **Focus on the project, not the governance tooling.** Focus strictly on this project's own application code, domain logic, and user requirements. Do not refactor, patch, or alter `azcodr` itself or its internal governance rules from within this project. If an edge case, bug, or limitation in `azcodr` is observed, do not digress to fix it: note the issue with full context (command, reproduction steps, expected vs. actual behavior); suppress all reporting during normal task execution and only print the Markdown inline when explicitly asked for by the user.

## Commands

| Task | Command |
|---|---|
| Test | `npm test` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Governance | `npx azcodr check` |

## Installed packs

Read `harness.yaml` to see which governance checks this project has opted into. If no `harness.yaml` exists, no optional check is active.

```
npx azcodr check
```

## Rules & Standards Index

When addressing domain-specific tasks, inspect the corresponding governing standard:

| Domain | Governing Standard | Scope |
|---|---|---|
| **Clean Code & Refactoring** | [docs/rules/clean_code.md](./docs/rules/clean_code.md) | File limits (<=300 lines), function limits (<=30 lines), SLAP, naming. |
| **Testing & TDD** | [docs/rules/test_driven_development.md](./docs/rules/test_driven_development.md) | Uncle Bob's 3 laws, nano-cycles (RED-GREEN-REFACTOR), behavioral assertions. |
| **Architecture & Design** | [docs/rules/design_patterns.md](./docs/rules/design_patterns.md) | GoF patterns (Adapter, Strategy, Repository), Result pattern. |
| **Security & Compliance** | [docs/rules/security_compliance.md](./docs/rules/security_compliance.md) | OWASP Top 10, SOC 2, secret scanning, input sanitization. |
| **Agentic Governance** | [docs/rules/agentic_configuration.md](./docs/rules/agentic_configuration.md) | Progressive disclosure, ADR ledger, harness parity, skill inquiry. |
| **Relentless Questioning** | [docs/rules/relentless_questioning.md](./docs/rules/relentless_questioning.md) | Context-aware interrogation loops, adaptive decision trees. |
| **Requirements Engineering** | [docs/rules/requirements_engineering.md](./docs/rules/requirements_engineering.md) | User stories vs requirements, INVEST, Gherkin acceptance criteria. |
| **Product Ownership** | [docs/rules/product_ownership.md](./docs/rules/product_ownership.md) | OKRs, backlog ordering (Kano/MoSCoW/RICE), value validation. |
| **Project Management** | [docs/rules/project_management.md](./docs/rules/project_management.md) | WIP limits, anti-rubber-stamp, project sovereignty. |
| **CI/CD & Delivery** | [docs/rules/continuous_delivery.md](./docs/rules/continuous_delivery.md) | Trunk-based delivery, verifiable artifacts, deployment pipelines. |
| **Error Handling** | [docs/rules/error_handling.md](./docs/rules/error_handling.md) | Stable error shapes, typed Result contracts, RFC 9457 envelopes. |
| **Type Safety** | [docs/rules/type_safety.md](./docs/rules/type_safety.md) | Zero `any`, strict null checks, structural contracts. |

## Adding standards

Do not add ad-hoc rules to this file. Requirements drive standards: conduct requirements-first discovery (e.g. `/lets-build`) before introducing governance. As concrete needs emerge during development, install capability packs via `npx azcodr add <pack>` or declare checks in `harness.yaml`.
