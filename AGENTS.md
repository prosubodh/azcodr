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

## Adding standards

Do not add ad-hoc rules to this file. Requirements drive standards: conduct requirements-first discovery (e.g. `/lets-build`) before introducing governance. As concrete needs emerge during development, install capability packs via `npx azcodr add <pack>` or declare checks in `harness.yaml`.
