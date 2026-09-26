#!/usr/bin/env bash
# ==============================================================================
# verify_completion.sh
# Example Stop hook ensuring tests and validation pass before agent exit
# ==============================================================================
set -euo pipefail

# Run project validation script if configured in package.json
if [[ -f "package.json" ]] && grep -q '"validate"' "package.json"; then
  npm run validate
fi

exit 0
