#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# resolve_repo.sh
# Deterministically resolves whether a remote Git URL is cloned locally,
# EVEN IF CLONED UNDER A COMPLETELY DIFFERENT FOLDER NAME.
#
# Usage: ./resolve_repo.sh <REPO_URL> [--check-only] [--dest-dir <DIR>]
# ==============================================================================

REPO_URL="${1:-}"
CHECK_ONLY=false
DEST_DIR=""

if [ -z "$REPO_URL" ]; then
  echo "Usage: $0 <REPO_URL> [--check-only] [--dest-dir <DIR>]" >&2
  exit 1
fi

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-only)
      CHECK_ONLY=true
      shift
      ;;
    --dest-dir)
      DEST_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

normalize_git_url() {
  local url="$1"
  url="${url%.git}"
  url="${url%/}"
  url=$(echo "$url" | sed -E 's/^(https?:\/\/|ssh:\/\/git@|ssh:\/\/|git@)//')
  url=$(echo "$url" | sed -E 's/:/\//')
  echo "$url" | tr '[:upper:]' '[:lower:]'
}

TARGET_NORM=$(normalize_git_url "$REPO_URL")
REPO_NAME=$(basename "$TARGET_NORM")
CURRENT_DIR="$(pwd)"

# Check if a specific directory matches the target URL by inspecting its remotes
matches_target_url() {
  local dir="$1"
  if [ ! -d "$dir/.git" ]; then
    return 1
  fi

  # Check all configured remotes (origin, upstream, etc.)
  local remotes
  remotes=$(git -C "$dir" config --get-regexp '^remote\..*\.url' 2>/dev/null | awk '{print $2}' || true)
  for r in $remotes; do
    local r_norm
    r_norm=$(normalize_git_url "$r")
    if [ "$r_norm" = "$TARGET_NORM" ]; then
      return 0
    fi
  done
  return 1
}

FOUND_PATH=""

# ------------------------------------------------------------------------------
# Pass 1: Fast Probe of Standard Conventions
# ------------------------------------------------------------------------------
FAST_CANDIDATES=(
  "${DEST_DIR:-}"
  "$HOME/projects/$REPO_NAME"
  "$(dirname "$CURRENT_DIR")/$REPO_NAME"
  "$CURRENT_DIR/$REPO_NAME"
  "$CURRENT_DIR"
)

for cand in "${FAST_CANDIDATES[@]}"; do
  [ -z "$cand" ] && continue
  if matches_target_url "$cand"; then
    FOUND_PATH="$(cd "$cand" && pwd)"
    break
  fi
done

# ------------------------------------------------------------------------------
# Pass 2: Deep Scan Across Sibling & Project Roots (Handles ANY folder name!)
# ------------------------------------------------------------------------------
if [ -z "$FOUND_PATH" ]; then
  SEARCH_ROOTS=()
  PARENT_DIR="$(dirname "$CURRENT_DIR")"
  SEARCH_ROOTS+=("$PARENT_DIR")
  [ -d "$HOME/projects" ] && [ "$HOME/projects" != "$PARENT_DIR" ] && SEARCH_ROOTS+=("$HOME/projects")
  [ -d "$HOME/workspace" ] && SEARCH_ROOTS+=("$HOME/workspace")
  [ -d "$HOME/dev" ] && SEARCH_ROOTS+=("$HOME/dev")
  [ -d "$HOME/code" ] && SEARCH_ROOTS+=("$HOME/code")

  for root in "${SEARCH_ROOTS[@]}"; do
    [ ! -d "$root" ] && continue
    # Search maxdepth 2 for any .git directory
    while IFS= read -r gitdir; do
      repo_candidate="$(dirname "$gitdir")"
      if matches_target_url "$repo_candidate"; then
        FOUND_PATH="$(cd "$repo_candidate" && pwd)"
        break 2
      fi
    done < <(find "$root" -maxdepth 2 -name ".git" -type d 2>/dev/null || true)
  done
fi

# ------------------------------------------------------------------------------
# Output Resolution
# ------------------------------------------------------------------------------
if [ -n "$FOUND_PATH" ]; then
  BRANCH=$(git -C "$FOUND_PATH" branch --show-current 2>/dev/null || true)
  if [ -z "$BRANCH" ]; then
    BRANCH=$(git -C "$FOUND_PATH" rev-parse --short HEAD 2>/dev/null || echo "unknown")
  fi
  PORCELAIN=$(git -C "$FOUND_PATH" status --porcelain 2>/dev/null || true)
  IS_CLEAN="true"
  if [ -n "$PORCELAIN" ]; then
    IS_CLEAN="false"
  fi
  FOLDER_NAME=$(basename "$FOUND_PATH")

  echo "STATUS=ALREADY_CLONED"
  echo "LOCAL_PATH=$FOUND_PATH"
  echo "LOCAL_FOLDER_NAME=$FOLDER_NAME"
  echo "CANONICAL_SLUG=$TARGET_NORM"
  echo "CURRENT_BRANCH=$BRANCH"
  echo "IS_CLEAN=$IS_CLEAN"
  exit 0
fi

if [ "$CHECK_ONLY" = true ]; then
  echo "STATUS=NOT_CLONED"
  echo "LOCAL_PATH="
  echo "LOCAL_FOLDER_NAME="
  echo "CANONICAL_SLUG=$TARGET_NORM"
  exit 1
fi

# ------------------------------------------------------------------------------
# Fallback: Fresh Clone
# ------------------------------------------------------------------------------
if [ -z "$DEST_DIR" ]; then
  if [ -d "$HOME/projects" ]; then
    DEST_DIR="$HOME/projects/$REPO_NAME"
  else
    DEST_DIR="$(dirname "$CURRENT_DIR")/$REPO_NAME"
  fi
fi

echo "📥 Repository '$REPO_URL' not found locally under any folder name. Cloning into '$DEST_DIR'..." >&2
mkdir -p "$(dirname "$DEST_DIR")"
git clone "$REPO_URL" "$DEST_DIR" >&2

FINAL_PATH="$(cd "$DEST_DIR" && pwd)"
BRANCH=$(git -C "$FINAL_PATH" branch --show-current 2>/dev/null || true)
if [ -z "$BRANCH" ]; then
  BRANCH=$(git -C "$FINAL_PATH" rev-parse --short HEAD 2>/dev/null || echo "unknown")
fi

echo "STATUS=CLONED_FRESH"
echo "LOCAL_PATH=$FINAL_PATH"
echo "LOCAL_FOLDER_NAME=$(basename "$FINAL_PATH")"
echo "CANONICAL_SLUG=$TARGET_NORM"
echo "CURRENT_BRANCH=$BRANCH"
echo "IS_CLEAN=true"
exit 0
