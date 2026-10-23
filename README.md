# azcodr: Architecture Governance Toolkit

[![npm version](https://img.shields.io/npm/v/azcodr.svg?color=cb3837)](https://www.npmjs.com/package/azcodr)
[![JSR Package](https://jsr.io/badges/@azcodr/azcodr)](https://jsr.io/@azcodr/azcodr)
[![CI Status](https://github.com/prosubodh/azcodr/actions/workflows/ci.yml/badge.svg)](https://github.com/prosubodh/azcodr/actions/workflows/ci.yml)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](https://www.npmjs.com/package/azcodr)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

# azcodr: Architecture Governance Toolkit

Azcodr is an architecture governance toolkit for software engineering. It provides executable checks that help teams maintain architectural integrity, but **it does not impose any methodology, architecture, language, or stack**.

## What It Does

azcodr provides a set of optional, configurable checks:

- **Boundary & cycle detection** - Detect circular imports and prohibited layer imports
- **Destructive command safety** - Block destructive filesystem and git commands
- **Protected targets** - Refuse to scaffold into `/`, `$HOME`, or drive roots
- **ADR ledger integrity** - Verify decision ledger consistency
- **Markdown link integrity** - Verify all internal links resolve

Nothing is mandatory. A project opts into checks via `harness.yaml`. Without a config file, `azcodr check` runs no optional checks.

## What It Does Not Do

- **Does not mandate TDD** - Test-first development is optional
- **Does not mandate any architecture** - Hexagonal, layered, monolith, microservices - your choice
- **Does not mandate any language** - Works with any stack
- **Does not enforce line counts, function sizes, or coverage thresholds** - These are team decisions
- **Does not require multi-tenancy, CQRS, outbox, or any other pattern** - Use what fits your domain
- **Does not enforce symlinks, ADRs, or glossaries** - Optional features

## Installation

```bash
npm install -g azcodr
# or
npx azcodr <project-directory>
```

## Quick Start

Initialize a new project:

```bash
npx azcodr my-new-project
cd my-new-project
```

Or add governance to an existing project:

```bash
cd my-project
npx azcodr check
```

## Configuration

Create a `harness.yaml` to declare which checks to enable:

```yaml
version: 1
checks:
  - id: destructive-commands    # Always on by default
  - id: protected-targets       # Always on by default
  - id: dependency-cycles       # Always on by default
  - id: max-file-lines
    params:
      max: 500
    applies_when:
      paths: ["src/**"]
  - id: layer-boundaries
    layers:
      domain: [infrastructure, adapters]
```

Available checks:
- `destructive-commands` - Blocks destructive filesystem/git commands
- `protected-targets` - Blocks scaffolding into root, home, or drive roots
- `dependency-cycles` - Detects circular imports
- `max-file-lines` - Checks file line budgets
- `layer-boundaries` - Checks layer import rules
- `coverage-floor` - Checks test coverage floors
- `markdown-links` - Checks internal markdown links
- `adr-envelope` - Checks ADR ledger format

## CLI Commands

| Command | Description |
|---|---|
| `azcodr [dir]` | Scaffold azcodr into a directory |
| `azcodr check [dir]` | Run governance checks |
| `azcodr boundaries [dir]` | Inspect dependency cycles and layer boundaries |
| `azcodr prompt [dir]` | Check prompt ledger integrity |

## Philosophy

azcodr is deliberately minimal. It does not:

- Mandate TDD, BDD, or any testing methodology
- Mandate Clean Architecture, hexagonal architecture, DDD, or any other pattern
- Mandate multi-tenancy, CQRS, event sourcing, or any other pattern
- Mandate TypeScript, JavaScript, Go, Rust, Python, or any language
- Enforce file size limits, function size limits, or parameter counts
- Enforce coverage thresholds
- Require specific tools (Jest, ESLint, etc.)

Teams adopt only the checks they want, via `harness.yaml`.

## License

MIT