#!/usr/bin/env bash
# ==============================================================================
# verify_completion.sh
# Example Stop hook ensuring tests and validation pass before agent exit
# ==============================================================================
set -euo pipefail

# Stop hook: block premature exit when validation or tests fail.
set -euo pipefail

# Run project validation script if configured in package.json
if [[ -f "package.json" ]] && grep -q '"validate"' "package.json"; then
  if ! npm run validate; then
    echo "🚨 Stop Verifier: 'npm run validate' failed. Fix agentic configuration before stopping." >&2
    exit 1
  fi
fi

# Run test suite if configured; never allow stopping with red tests.
if [[ -f "package.json" ]] && grep -q '"test"' "package.json"; then
  if ! npm test --silent; then
    echo "🚨 Stop Verifier: 'npm test' failed. Fix failing tests before stopping." >&2
    exit 1
  fi
fi

exit 0
