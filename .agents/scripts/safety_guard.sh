#!/usr/bin/env bash
# ==============================================================================
# safety_guard.sh
# Example PreToolUse hook for agent commands
# ==============================================================================
set -euo pipefail

COMMAND="${1:-}"

# Reject destructive system commands targeting root or home
if [[ "${COMMAND}" =~ (rm[[:space:]]+-[rf]{1,2}[[:space:]]+(/|\$HOME|~)) ]]; then
  echo "🚨 Safety Guard: Destructive command rejected: ${COMMAND}" >&2
  exit 1
fi

exit 0
