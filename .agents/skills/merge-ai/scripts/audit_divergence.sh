#!/usr/bin/env bash
set -euo pipefail

BASELINE_DIR="${1:-/home/prosubodh/projects/mvp}"
CURRENT_DIR="$(pwd)"

echo "=================================================================="
echo "🔍 Auditing AI Knowledge & Rule Divergence"
echo "Current Workspace: $CURRENT_DIR"
echo "Baseline Template: $BASELINE_DIR"
echo "=================================================================="

if [ ! -d "$BASELINE_DIR" ]; then
  echo "❌ Error: Baseline directory '$BASELINE_DIR' does not exist."
  exit 1
fi

echo ""
echo "--- 1. Checking Core Directives (AGENTS.md) ---"
if diff -q "$CURRENT_DIR/AGENTS.md" "$BASELINE_DIR/AGENTS.md" > /dev/null 2>&1; then
  echo "✅ AGENTS.md is identical."
else
  echo "⚠️ AGENTS.md differs between workspaces."
fi

echo ""
echo "--- 2. Checking Atomic Rules (docs/rules/) ---"
DIFF_RULES=$(diff -qr "$CURRENT_DIR/docs/rules" "$BASELINE_DIR/docs/rules" 2>/dev/null || true)
if [ -z "$DIFF_RULES" ]; then
  echo "✅ All atomic rules in docs/rules/ are identical."
else
  echo "$DIFF_RULES"
fi

echo ""
echo "--- 3. Checking Specialized Skills (.agents/skills/) ---"
DIFF_SKILLS=$(diff -qr "$CURRENT_DIR/.agents/skills" "$BASELINE_DIR/.agents/skills" 2>/dev/null || true)
if [ -z "$DIFF_SKILLS" ]; then
  echo "✅ All skills in .agents/skills/ are identical."
else
  echo "$DIFF_SKILLS"
fi

echo ""
echo "--- 4. Checking Knowledge Hub (docs/knowledge/) ---"
DIFF_KNOW=$(diff -qr "$CURRENT_DIR/docs/knowledge" "$BASELINE_DIR/docs/knowledge" 2>/dev/null || true)
if [ -z "$DIFF_KNOW" ]; then
  echo "✅ All knowledge files in docs/knowledge/ are identical."
else
  echo "$DIFF_KNOW"
fi

echo ""
echo "--- 5. Checking Architecture Decision Records (memory.md) ---"
if diff -q "$CURRENT_DIR/memory.md" "$BASELINE_DIR/memory.md" > /dev/null 2>&1; then
  echo "✅ memory.md is identical."
else
  echo "⚠️ memory.md differs (check for generic ADRs to port)."
fi

echo "=================================================================="
echo "Audit complete. Run /merge-ai to filter and merge generic changes."
echo "=================================================================="
