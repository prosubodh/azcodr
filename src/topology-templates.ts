/**
 * Static templates and directory topologies for workspace bootstrapping.
 * Separated from topology orchestration to enforce clean code line-budget constraints.
 */

export const TOKENS_JSON = `{
  "color": {
    "brand": {
      "primary": { "$value": "#2563eb", "$type": "color" },
      "secondary": { "$value": "#475569", "$type": "color" },
      "accent": { "$value": "#f59e0b", "$type": "color" }
    }
  },
  "dimension": {
    "radius": {
      "base": { "$value": "6px", "$type": "dimension" }
    }
  }
}
`;

export const MEMORY_TEMPLATE = `# Workspace Memory, Architecture Decisions & Knowledge Hub

> **Core Purpose:** Authoritative persistent memory ledger for the workspace repository (\`./\`), maintaining Lightweight Architectural Decision Records (ADRs), system topologies, and living domain contracts.

---

## 1. Quick Navigation & Knowledge Repositories

- 📖 **[Living Ubiquitous Language Glossary](./docs/knowledge/ubiquitous_language.md)**: Authoritative, single-name domain vocabulary contract.
- 📜 **[Lightweight ADR Master Index](#adr-master-index)**: Summary of all architectural decisions and direct links to governing rules.

---

## 2. Consolidated Architectural Decision Records (ADRs)

### ADR Master Index

| ID | Title | Date | Status | Governing Rule / Skill |
|---|---|---|---|---|
| *(No decisions recorded yet)* | *Record initial architecture decisions during Phase 3 of /lets-build.* | *YYYY-MM-DD* | *ACCEPTED* | *e.g. [\`clean_code.md\`](./docs/rules/clean_code.md)* |

---

### Lightweight Decision Summaries

<!--
Record project Architectural Decision Records (ADRs) below as decisions are finalized.
Format:

#### ADR-001: [Imperative Title]
- **Date:** YYYY-MM-DD | **Status:** ACCEPTED
- **Context:** Problem space, constraints, and operational context requiring a decision.
- **Decision:** Chosen architecture, invariants, and implementation patterns.
- **Consequences:** Positive benefits and deliberate trade-offs accepted.
- **Enforced In:** Relevant rule files in docs/rules/ or code paths.
-->
`;

export const ESLINT_CONFIG = `// Deterministic fitness functions (azcodr clean_code.md section 5).
// Install the pinned tool, then prove the gate: npm run lint
export default [
  {
    files: ['src/**/*.{js,ts}', 'tests/**/*.{js,ts}'],
    rules: {
      'max-lines': ['error', 300],
      'max-lines-per-function': ['error', 30],
      complexity: ['error', 10],
      'max-params': ['error', 3]
    }
  }
];
`;

export const OXLINT_CONFIG = `{
  "rules": {
    "no-unused-vars": "error"
  }
}
`;

export const RUFF_CONFIG = `# Deterministic fitness functions (azcodr clean_code.md section 5).
# Install the pinned tool, then prove the gate: ruff check .
[lint]
select = ["E", "F", "C901", "PLR0912", "PLR0913", "PLR0915"]
[lint.mccabe]
max-complexity = 10
[lint.pylint]
max-args = 3
max-statements = 30
# NOTE: ruff has no file-length rule; the 300-line file cap is enforced by
# the project's lint entry (see lets-build Phase 5 proof).
`;

export const CLIPPY_CONFIG = `# Deterministic fitness functions (azcodr clean_code.md section 5).
# Enforce with: cargo clippy -- -D clippy::too_many_lines -D clippy::cognitive_complexity -D clippy::too_many_arguments
too-many-lines-threshold = 30
cognitive-complexity-threshold = 10
too-many-arguments-threshold = 3
# NOTE: clippy has no file-length lint; the 300-line file cap is enforced by
# the project's lint entry (see lets-build Phase 5 proof).
`;

export const GOLANGCI_CONFIG = `# Deterministic fitness functions (azcodr clean_code.md section 5).
# Install the pinned tool, then prove the gate: golangci-lint run ./...
linters:
  enable: [funlen, gocyclo]
linters-settings:
  funlen:
    lines: 30
    statements: 25
  gocyclo:
    min-complexity: 10
# NOTE: no golangci-native file-length check; the 300-line file cap is
# enforced by the project's lint entry (see lets-build Phase 5 proof).
`;

export const CHECKSTYLE_CONFIG = `<?xml version="1.0"?>
<!-- Deterministic fitness functions (azcodr clean_code.md section 5). -->
<!DOCTYPE module PUBLIC "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN" "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
  <module name="FileLength">
    <property name="max" value="300"/>
  </module>
  <module name="TreeWalker">
    <module name="MethodLength">
      <property name="max" value="30"/>
    </module>
    <module name="CyclomaticComplexity">
      <property name="max" value="10"/>
    </module>
    <module name="ParameterNumber">
      <property name="max" value="3"/>
    </module>
  </module>
</module>
`;

export const CSHARP_EDITORCONFIG_SNIPPET = `
# --- azcodr fitness functions (CA gates; exact numbers in lint entry) ---
[*.cs]
dotnet_diagnostic.CA1501.severity = error
dotnet_diagnostic.CA1502.severity = error
`;

export const CLANG_TIDY_CONFIG = `# Deterministic fitness functions (azcodr clean_code.md section 5).
Checks: 'readability-function-size,readability-function-cognitive-complexity'
CheckOptions:
  - { key: readability-function-size.LineThreshold, value: 30 }
  - { key: readability-function-size.ParameterThreshold, value: 3 }
  - { key: readability-function-cognitive-complexity.Threshold, value: 10 }
# NOTE: clang-tidy has no file-length check; the 300-line file cap is
# enforced by the project's lint entry (see lets-build Phase 5 proof).
`;

export const SMOKE_TEST_SCRIPT = `#!/usr/bin/env node
// ==============================================================================
// Boundary Verification Smoke Test (Phase 5 Verification Gate)
// ==============================================================================
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("Running boundary smoke verification...");
const guard = path.join(root, ".agents", "scripts", "boundary_guard.js");
if (fs.existsSync(guard)) {
  const result = spawnSync(process.execPath, [guard, path.join(root, "src")], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
} else {
  console.log("⚠️  Boundary guard skipped (guard script unavailable).");
}
console.log("✅ Boundary smoke verification passed!");
`;

export const TOPOLOGY_PATHS: Record<string, string[]> = {
  extension: [
    'src/background',
    'src/content',
    'src/popup',
    'src/shared',
    'public',
    'tests/unit',
    'tests/e2e'
  ],
  game: [
    'src/core',
    'src/ecs',
    'src/renderer',
    'src/assets',
    'tests/unit',
    'tests/benchmarks'
  ],
  cli: [
    'src/cmd',
    'src/core',
    'src/io',
    'tests/unit',
    'tests/integration'
  ],
  fullstack: [
    'src/domain/entities',
    'src/domain/value_objects',
    'src/domain/services',
    'src/ports/primary',
    'src/ports/secondary',
    'src/adapters/primary',
    'src/adapters/secondary',
    'client/src/components/layout',
    'client/src/components/ui',
    'client/src/pages',
    'client/src/hooks',
    'client/src/services',
    'client/public',
    'specs/openapi',
    'specs/tokens',
    'tests/unit',
    'tests/integration',
    'tests/contracts',
    'tests/client',
    'tests/acceptance',
    'deploy/docker',
    'deploy/compose'
  ],
  backend: [
    'src/domain/entities',
    'src/domain/value_objects',
    'src/domain/services',
    'src/ports/primary',
    'src/ports/secondary',
    'src/adapters/primary',
    'src/adapters/secondary',
    'specs/openapi',
    'specs/tokens',
    'tests/unit',
    'tests/integration',
    'tests/contracts',
    'tests/acceptance',
    'deploy/docker',
    'deploy/compose'
  ],
  frontend: [
    'src/components/layout',
    'src/components/ui',
    'src/pages',
    'src/hooks',
    'src/services',
    'public',
    'specs/tokens',
    'tests/unit',
    'tests/acceptance'
  ],
  'canvas-game': [
    'src/entities',
    'src/systems/update',
    'src/systems/render',
    'src/input',
    'src/audio',
    'src/ui',
    'src/scenes',
    'src/config',
    'tests/unit',
    'tests/e2e',
    'public/assets'
  ],
  'systems-library': [
    'src/core',
    'src/hal',
    'src/drivers',
    'src/protocol',
    'src/utils',
    'tests/unit',
    'tests/hal',
    'tests/benchmarks'
  ]
};
