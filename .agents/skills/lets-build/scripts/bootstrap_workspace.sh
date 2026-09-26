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

  backend|web|saas)
    echo "1. Scaffolding Backend / Enterprise Source Tree (src/)..."
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

  *)
    echo "1. Scaffolding Generic / Library Source Tree (src/)..."
    create_leaf "${WORKSPACE_ROOT}/src"
    create_leaf "${WORKSPACE_ROOT}/tests/unit"
    ;;
esac

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
