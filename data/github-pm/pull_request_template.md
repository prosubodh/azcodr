## Summary & Problem Statement

<!-- Provide a brief, clear summary of what this PR does and why. Link the issue: Closes #N -->

## Type of Change

- [ ] `feat`: New feature or capability
- [ ] `fix`: Bug fix
- [ ] `refactor`: Code refactoring without behavior change
- [ ] `docs`: Documentation updates
- [ ] `chore`: Tooling, CI/CD, or maintenance

## Verification & Test Evidence

<!-- MANDATORY: Paste real command lines and real terminal output for every claim. -->

```
Command: npm test
Output:

Command: npm run lint
Output:

Command: npm run validate
Output:
```

## Invariants & Architecture Checklist

- [ ] **No Direct Push to Protected Branch**: PR originates from a feature or topic branch.
- [ ] **Issue Linked**: PR references an issue (`Closes #N`) when issueTracking is `github` or `both`.
- [ ] **Zero Runtime Dependencies**: No new production runtime dependencies introduced.
- [ ] **Clean Code Limits**: Author files respect the ≤ 300 lines/file, ≤ 30 lines/function, ≤ 3 parameters envelope.
- [ ] **Deterministic Types & Lints**: `npm run typecheck` and `npm run lint` report 0 errors and 0 warnings.
- [ ] **Decision Records**: Any architectural trade-off or boundary shift is appended to `memory.md`.