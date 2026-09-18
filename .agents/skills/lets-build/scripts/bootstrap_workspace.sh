#!/usr/bin/env bash
# ==============================================================================
# bootstrap_workspace.sh
# Deterministic Scaffolder for Hexagonal Multi-Tenant Workspaces
# ==============================================================================

set -euo pipefail

WORKSPACE_ROOT="${1:-$(pwd)}"
LANGUAGE="${2:-generic}"

echo "🚀 Initializing Hexagonal Architecture Workspace in: ${WORKSPACE_ROOT}"
echo "📦 Target Language Profile: ${LANGUAGE}"
echo "--------------------------------------------------------------"

# 1. Create Universal Specification Directories
echo "1. Scaffolding Contract Specification Directories (specs/)..."
mkdir -p "${WORKSPACE_ROOT}/specs/protobuf"
mkdir -p "${WORKSPACE_ROOT}/specs/openapi"
mkdir -p "${WORKSPACE_ROOT}/specs/schemas"
mkdir -p "${WORKSPACE_ROOT}/specs/tokens"

# 2. Create Universal Hexagonal Source Directories
echo "2. Scaffolding Hexagonal Source Tree (src/)..."
mkdir -p "${WORKSPACE_ROOT}/src/domain/entities"
mkdir -p "${WORKSPACE_ROOT}/src/domain/value_objects"
mkdir -p "${WORKSPACE_ROOT}/src/domain/services"
mkdir -p "${WORKSPACE_ROOT}/src/ports/primary"
mkdir -p "${WORKSPACE_ROOT}/src/ports/secondary"
mkdir -p "${WORKSPACE_ROOT}/src/adapters/primary"
mkdir -p "${WORKSPACE_ROOT}/src/adapters/secondary"

# 3. Create Universal Test Directories
echo "3. Scaffolding Test Suites (tests/)..."
mkdir -p "${WORKSPACE_ROOT}/tests/unit"
mkdir -p "${WORKSPACE_ROOT}/tests/integration"
mkdir -p "${WORKSPACE_ROOT}/tests/contracts"
mkdir -p "${WORKSPACE_ROOT}/tests/acceptance"

# 4. Create Deployment & Infrastructure Directories
echo "4. Scaffolding Deployment Infrastructure (deploy/)..."
mkdir -p "${WORKSPACE_ROOT}/deploy/docker"
mkdir -p "${WORKSPACE_ROOT}/deploy/compose"
mkdir -p "${WORKSPACE_ROOT}/deploy/k8s"

# 5. Create Default Design Tokens Spec
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

echo "--------------------------------------------------------------"
echo "✅ Hexagonal directory tree and contract specifications scaffolded successfully!"
