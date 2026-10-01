#!/usr/bin/env bash
# ==============================================================================
# safety_guard.sh
# Example PreToolUse hook for agent commands
# ==============================================================================
set -euo pipefail

COMMAND="$*"

# Reject destructive filesystem commands targeting root, home, or recursive deletes
if [[ "${COMMAND}" =~ rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*[[:space:]]+\"?(/|\$HOME|~|/)\"? ]]; then
  echo "🚨 Safety Guard: Destructive rm targeting root/home rejected: ${COMMAND}" >&2
  exit 1
fi

# Reject database destruction without explicit confirmation
if [[ "${COMMAND}" =~ (DROP[[:space:]]+(DATABASE|SCHEMA)|TRUNCATE[[:space:]]+[A-Za-z_]+|DELETE[[:space:]]+FROM[[:space:]]+[A-Za-z_]+[[:space:]]*;[[:space:]]*$) ]]; then
  echo "🚨 Safety Guard: Destructive SQL rejected (require explicit user confirmation): ${COMMAND}" >&2
  exit 1
fi

# Reject force-push and hard resets (history destruction)
if [[ "${COMMAND}" =~ git[[:space:]]+push[[:space:]]+--force ]] || [[ "${COMMAND}" =~ git[[:space:]]+reset[[:space:]]+--hard ]]; then
  echo "🚨 Safety Guard: History-destructive git command rejected (require explicit user confirmation): ${COMMAND}" >&2
  exit 1
fi

# Reject disk-level destruction
if [[ "${COMMAND}" =~ (mkfs|dd[[:space:]]+if=|: *\(\)[[:space:]]*\{[[:space:]]*:) ]]; then
  echo "🚨 Safety Guard: Disk/fork-bomb command rejected: ${COMMAND}" >&2
  exit 1
fi

exit 0
