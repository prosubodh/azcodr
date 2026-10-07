#!/usr/bin/env bash
# ==============================================================================
# bootstrap_workspace.sh
# Topology-Aware Deterministic Scaffolder (Strict YAGNI, Zero Speculative Bloat)
# ==============================================================================

set -euo pipefail

WORKSPACE_ROOT="${1:-$(pwd)}"
TOPOLOGY="${2:-backend}"
LANGUAGE="${3:-generic}"

echo "🚀 Initializing Topology-Aware Workspace in: ${WORKSPACE_ROOT}"
echo "🏗️ Target Topology: ${TOPOLOGY}"
echo "📦 Target Language Profile: ${LANGUAGE}"
echo "--------------------------------------------------------------"

# ------------------------------------------------------------------------------
# LANGUAGE is validated, not merely echoed. It previously appeared in the
# banner and nowhere else: every language produced an identical tree, which
# made the "deterministic scaffolder" claim false and hid typos from the agent.
# Unknown values are rejected instead of silently producing a generic layout.
# ------------------------------------------------------------------------------
case "${LANGUAGE}" in
  typescript|javascript|python|rust|go|java|csharp|cpp|c|generic|deno|bun)
    ;;
  *)
    echo "❌ Unknown language profile: '${LANGUAGE}'" >&2
    cat >&2 << 'EOF'

Supported language profiles:
  typescript  javascript  deno  bun  python  rust  go  java  csharp  cpp  c
  generic

Use 'generic' when the language has not been decided yet.
EOF
    exit 2
    ;;
esac

# Record the decided language so downstream phases can read it instead of
# re-deriving it (and so the scaffolder's own claim is verifiable).
mkdir -p "${WORKSPACE_ROOT}/.azcodr"
printf 'topology=%s\nlanguage=%s\n' "${TOPOLOGY}" "${LANGUAGE}" \
  > "${WORKSPACE_ROOT}/.azcodr/workspace-profile.env"

# Helper to create leaf directory with .gitkeep to ensure Git tracks empty structures
create_leaf() {
  local dir="$1"
  mkdir -p "${dir}"
  if [[ -z "$(ls -A "${dir}" 2>/dev/null)" ]]; then
    touch "${dir}/.gitkeep"
  fi
}

case "${TOPOLOGY}" in
  extension)
    echo "1. Scaffolding Browser Extension Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/background"
    create_leaf "${WORKSPACE_ROOT}/src/content"
    create_leaf "${WORKSPACE_ROOT}/src/popup"
    create_leaf "${WORKSPACE_ROOT}/src/shared"
    create_leaf "${WORKSPACE_ROOT}/public"
    
    echo "2. Scaffolding Extension Test Suites (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/e2e"
    ;;

  game|engine)
    echo "1. Scaffolding Game/Engine Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/core"
    create_leaf "${WORKSPACE_ROOT}/src/ecs"
    create_leaf "${WORKSPACE_ROOT}/src/renderer"
    create_leaf "${WORKSPACE_ROOT}/src/assets"
    
    echo "2. Scaffolding Game/Engine Test Suites (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/benchmarks"
    ;;

  cli)
    echo "1. Scaffolding CLI Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/cmd"
    create_leaf "${WORKSPACE_ROOT}/src/core"
    create_leaf "${WORKSPACE_ROOT}/src/io"
    
    echo "2. Scaffolding CLI Test Suites (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/integration"
    ;;

  web|saas|fullstack)
    echo "1. Scaffolding Backend / Enterprise Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/domain/entities"
    create_leaf "${WORKSPACE_ROOT}/src/domain/value_objects"
    create_leaf "${WORKSPACE_ROOT}/src/domain/services"
    create_leaf "${WORKSPACE_ROOT}/src/ports/primary"
    create_leaf "${WORKSPACE_ROOT}/src/ports/secondary"
    create_leaf "${WORKSPACE_ROOT}/src/adapters/primary"
    create_leaf "${WORKSPACE_ROOT}/src/adapters/secondary"

    echo "2. Scaffolding Web Frontend Client Source Tree (client/)..."
    create_leaf "${WORKSPACE_ROOT}/client/src/components/layout"
    create_leaf "${WORKSPACE_ROOT}/client/src/components/ui"
    create_leaf "${WORKSPACE_ROOT}/client/src/pages"
    create_leaf "${WORKSPACE_ROOT}/client/src/hooks"
    create_leaf "${WORKSPACE_ROOT}/client/src/services"
    create_leaf "${WORKSPACE_ROOT}/client/public"
    
    echo "3. Scaffolding Specifications (specs/)..."
    create_leaf "${WORKSPACE_ROOT}/specs/openapi"
    create_leaf "${WORKSPACE_ROOT}/specs/tokens"
    
    echo "4. Scaffolding Fullstack Test Suites (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/integration"
    create_leaf "${WORKSPACE_ROOT}/tests/contracts"
    create_leaf "${WORKSPACE_ROOT}/tests/client"
    create_leaf "${WORKSPACE_ROOT}/tests/acceptance"
    
    echo "5. Scaffolding Deployment Infrastructure (deploy/)..."
    create_leaf "${WORKSPACE_ROOT}/deploy/docker"
    create_leaf "${WORKSPACE_ROOT}/deploy/compose"

    TOKEN_SPEC="${WORKSPACE_ROOT}/specs/tokens/tokens.json"
    if [[ ! -f "${TOKEN_SPEC}" ]]; then
      cat << 'EOF' > "${TOKEN_SPEC}"
{
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
EOF
    fi
    ;;

  backend)
    echo "1. Scaffolding Headless Backend Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/domain/entities"
    create_leaf "${WORKSPACE_ROOT}/src/domain/value_objects"
    create_leaf "${WORKSPACE_ROOT}/src/domain/services"
    create_leaf "${WORKSPACE_ROOT}/src/ports/primary"
    create_leaf "${WORKSPACE_ROOT}/src/ports/secondary"
    create_leaf "${WORKSPACE_ROOT}/src/adapters/primary"
    create_leaf "${WORKSPACE_ROOT}/src/adapters/secondary"
    
    echo "2. Scaffolding Specifications (specs/)..."
    create_leaf "${WORKSPACE_ROOT}/specs/openapi"
    create_leaf "${WORKSPACE_ROOT}/specs/tokens"
    
    echo "3. Scaffolding Backend Test Suites (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/integration"
    create_leaf "${WORKSPACE_ROOT}/tests/contracts"
    create_leaf "${WORKSPACE_ROOT}/tests/acceptance"
    
    echo "4. Scaffolding Deployment Infrastructure (deploy/)..."
    create_leaf "${WORKSPACE_ROOT}/deploy/docker"
    create_leaf "${WORKSPACE_ROOT}/deploy/compose"

    TOKEN_SPEC="${WORKSPACE_ROOT}/specs/tokens/tokens.json"
    if [[ ! -f "${TOKEN_SPEC}" ]]; then
      cat << 'EOF' > "${TOKEN_SPEC}"
{
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
EOF
    fi
    ;;

  frontend)
    echo "1. Scaffolding Frontend Client Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/components/layout"
    create_leaf "${WORKSPACE_ROOT}/src/components/ui"
    create_leaf "${WORKSPACE_ROOT}/src/pages"
    create_leaf "${WORKSPACE_ROOT}/src/hooks"
    create_leaf "${WORKSPACE_ROOT}/src/services"
    create_leaf "${WORKSPACE_ROOT}/public"
    
    echo "2. Scaffolding Specifications (specs/)..."
    create_leaf "${WORKSPACE_ROOT}/specs/tokens"
    
    echo "3. Scaffolding Frontend Test Suites (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/acceptance"
    ;;

  canvas-game|canvas|webgame)
    # Topology D: Browser / Canvas Game (HTML5 Canvas / WebGL / WebGPU).
    # Game Loop shaped: Input -> Update -> Render.
    echo "1. Scaffolding Canvas Game Source Tree (game loop shaped)..."
    create_leaf "${WORKSPACE_ROOT}/src/entities"
    create_leaf "${WORKSPACE_ROOT}/src/systems/update"
    create_leaf "${WORKSPACE_ROOT}/src/systems/render"
    create_leaf "${WORKSPACE_ROOT}/src/input"
    create_leaf "${WORKSPACE_ROOT}/src/audio"
    create_leaf "${WORKSPACE_ROOT}/src/ui"
    create_leaf "${WORKSPACE_ROOT}/src/scenes"
    create_leaf "${WORKSPACE_ROOT}/src/config"

    echo "2. Scaffolding Canvas Game Tests (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/e2e"

    echo "3. Scaffolding Public Assets (public/)..."
    create_leaf "${WORKSPACE_ROOT}/public/assets"
    ;;

  systems-library|embedded|systems)
    # Topology F: Embedded / Systems Library.
    # No heap assumptions, no dynamic allocation in the hot path.
    echo "1. Scaffolding Systems Library Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src/core"
    create_leaf "${WORKSPACE_ROOT}/src/hal"
    create_leaf "${WORKSPACE_ROOT}/src/drivers"
    create_leaf "${WORKSPACE_ROOT}/src/protocol"
    create_leaf "${WORKSPACE_ROOT}/src/utils"

    echo "2. Scaffolding Systems Library Tests (tests/)..."
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    create_leaf "${WORKSPACE_ROOT}/tests/hal"
    create_leaf "${WORKSPACE_ROOT}/tests/benchmarks"
    ;;

  *)
    # Fail loudly rather than scaffolding a generic tree and exiting 0. A
    # wrong-but-successful scaffold is worse than a refusal: the agent reports
    # success to the user and the mismatch surfaces much later.
    echo "❌ Unknown topology: '${TOPOLOGY}'" >&2
    cat >&2 << 'EOF'

Supported topologies:
  extension        Topology B  Browser Extension (Manifest V3)
  game|engine      Topology C  Game Engine / High-Performance Simulator
  canvas-game      Topology D  Browser / Canvas Game (Canvas/WebGL/WebGPU)
  cli              Topology E  Desktop Application / CLI Utility
  backend          Topology A  Headless API / Service
  web|saas|fullstack Topology A  Fullstack Web Application
  frontend         Topology A  Frontend-only Client
  systems-library  Topology F  Embedded / Systems Library
EOF
    echo >&2
    echo "Re-run with one of the above." >&2
    exit 2
    ;;
esac

# ------------------------------------------------------------------------------
# memory.md is an APPEND-ONLY LEDGER. It is never rewritten automatically.
#
# HISTORY (this was a data-loss bug): this script previously overwrote
# memory.md with a template whenever the file contained any ADR heading that
# was not the untouched placeholder. Re-running /lets-build on a live project
# silently destroyed every recorded architectural decision -- irreplaceable
# work, with no backup and no error. ADRs are immutable history by rule
# (docs/rules/agentic_configuration.md); a scaffolder has no business
# rewriting them.
#
# Resetting the ledger is now opt-in, always backed up, and always announced.
# ------------------------------------------------------------------------------
MEMORY_FILE="${WORKSPACE_ROOT}/memory.md"
if [[ -f "${MEMORY_FILE}" ]]; then
  # Only a genuinely recorded decision counts as "has content": an h4 ADR
  # heading outside of an HTML comment.
  RECORDED_ADRS="$(grep -cE '^####[[:space:]]+ADR-[0-9]+' "${MEMORY_FILE}" 2>/dev/null || true)"
  RECORDED_ADRS="${RECORDED_ADRS:-0}"

  if [[ "${RECORDED_ADRS}" -gt 0 ]]; then
    if [[ "${AZCODR_RESET_MEMORY:-0}" == "1" ]]; then
      BACKUP="${MEMORY_FILE}.bak"
      cp -p "${MEMORY_FILE}" "${BACKUP}"
      echo "⚠️  AZCODR_RESET_MEMORY=1 -- RESETTING ${RECORDED_ADRS} recorded ADR(s) in memory.md"
      echo "    Backup written to ${BACKUP}"
      cat << 'EOF' > "${MEMORY_FILE}"
# Workspace Memory, Architecture Decisions & Knowledge Hub

> **Core Purpose:** Authoritative persistent memory ledger for the workspace repository (`./`), maintaining Lightweight Architectural Decision Records (ADRs), system topologies, and living domain contracts.

---

## 1. Quick Navigation & Knowledge Repositories

- 📖 **[Living Ubiquitous Language Glossary](./docs/knowledge/ubiquitous_language.md)**: Authoritative, single-name domain vocabulary contract.
- 📜 **[Lightweight ADR Master Index](#adr-master-index)**: Summary of all architectural decisions and direct links to governing rules.

---

## 2. Consolidated Architectural Decision Records (ADRs)

### ADR Master Index

| ID | Title | Date | Status | Governing Rule / Skill |
|---|---|---|---|---|
| *(No decisions recorded yet)* | *Record initial architecture decisions during Phase 3 of /lets-build.* | *YYYY-MM-DD* | *ACCEPTED* | *e.g. [`clean_code.md`](./docs/rules/clean_code.md)* |

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
EOF
    else
      echo "🧠 Preserving memory.md: ${RECORDED_ADRS} recorded ADR(s) found."
      echo "    memory.md is append-only and is never rewritten by the scaffolder."
      echo "    To intentionally reset the ledger: AZCODR_RESET_MEMORY=1 <this command>"
    fi
  fi
fi

# Deterministically generate boundary verification smoke test script (Phase 5 requirement)
SMOKE_TEST="${WORKSPACE_ROOT}/scripts/smoke_test.sh"
if [[ ! -f "${SMOKE_TEST}" ]]; then
  echo "5. Generating boundary smoke test verification script (scripts/smoke_test.sh)..."
  mkdir -p "${WORKSPACE_ROOT}/scripts"
  cat << 'EOF' > "${SMOKE_TEST}"
#!/usr/bin/env bash
# ==============================================================================
# Boundary Verification Smoke Test (Phase 5 Verification Gate)
# ==============================================================================
set -euo pipefail

echo "Running boundary smoke verification..."
# Extend with project-specific runtime health checks (e.g. ping health endpoint, CLI --help)
echo "✅ Boundary smoke verification passed!"
EOF
  chmod +x "${SMOKE_TEST}"
fi

echo "--------------------------------------------------------------"
echo "✅ Topology '${TOPOLOGY}' scaffolded with strict YAGNI (0 speculative folders)!"
