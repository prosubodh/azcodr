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

case "${TOPOLOGY}" in
  extension)
    echo "1. Scaffolding Browser Extension Source Tree (src/)..."
    mkdir -p "${WORKSPACE_ROOT}/src/background"
    mkdir -p "${WORKSPACE_ROOT}/src/content"
    mkdir -p "${WORKSPACE_ROOT}/src/popup"
    mkdir -p "${WORKSPACE_ROOT}/src/shared"
    mkdir -p "${WORKSPACE_ROOT}/public"
    
    echo "2. Scaffolding Extension Test Suites (tests/)..."
    mkdir -p "${WORKSPACE_ROOT}/tests/unit"
    mkdir -p "${WORKSPACE_ROOT}/tests/e2e"
    ;;

  game|engine)
    echo "1. Scaffolding Game/Engine Source Tree (src/)..."
    mkdir -p "${WORKSPACE_ROOT}/src/core"
    mkdir -p "${WORKSPACE_ROOT}/src/ecs"
    mkdir -p "${WORKSPACE_ROOT}/src/renderer"
    mkdir -p "${WORKSPACE_ROOT}/src/assets"
    
    echo "2. Scaffolding Game/Engine Test Suites (tests/)..."
    mkdir -p "${WORKSPACE_ROOT}/tests/unit"
    mkdir -p "${WORKSPACE_ROOT}/tests/benchmarks"
    ;;

  cli)
    echo "1. Scaffolding CLI Source Tree (src/)..."
    mkdir -p "${WORKSPACE_ROOT}/src/cmd"
    mkdir -p "${WORKSPACE_ROOT}/src/core"
    mkdir -p "${WORKSPACE_ROOT}/src/io"
    
    echo "2. Scaffolding CLI Test Suites (tests/)..."
    mkdir -p "${WORKSPACE_ROOT}/tests/unit"
    mkdir -p "${WORKSPACE_ROOT}/tests/integration"
    ;;

  backend|web|saas)
    echo "1. Scaffolding Backend / Enterprise Source Tree (src/)..."
    mkdir -p "${WORKSPACE_ROOT}/src/domain/entities"
    mkdir -p "${WORKSPACE_ROOT}/src/domain/value_objects"
    mkdir -p "${WORKSPACE_ROOT}/src/domain/services"
    mkdir -p "${WORKSPACE_ROOT}/src/ports/primary"
    mkdir -p "${WORKSPACE_ROOT}/src/ports/secondary"
    mkdir -p "${WORKSPACE_ROOT}/src/adapters/primary"
    mkdir -p "${WORKSPACE_ROOT}/src/adapters/secondary"
    
    echo "2. Scaffolding Specifications (specs/)..."
    mkdir -p "${WORKSPACE_ROOT}/specs/openapi"
    mkdir -p "${WORKSPACE_ROOT}/specs/tokens"
    
    echo "3. Scaffolding Backend Test Suites (tests/)..."
    mkdir -p "${WORKSPACE_ROOT}/tests/unit"
    mkdir -p "${WORKSPACE_ROOT}/tests/integration"
    mkdir -p "${WORKSPACE_ROOT}/tests/contracts"
    mkdir -p "${WORKSPACE_ROOT}/tests/acceptance"
    
    echo "4. Scaffolding Deployment Infrastructure (deploy/)..."
    mkdir -p "${WORKSPACE_ROOT}/deploy/docker"
    mkdir -p "${WORKSPACE_ROOT}/deploy/compose"

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
    mkdir -p "${WORKSPACE_ROOT}/src"
    mkdir -p "${WORKSPACE_ROOT}/tests/unit"
    ;;
esac

echo "--------------------------------------------------------------"
echo "✅ Topology '${TOPOLOGY}' scaffolded with strict YAGNI (0 speculative folders)!"
