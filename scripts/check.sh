#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="node"
  elif command -v node.exe >/dev/null 2>&1; then
    NODE_BIN="node.exe"
  else
    echo "Node.js was not found. Install Node.js or set NODE_BIN to the node executable." >&2
    exit 127
  fi
fi

GIT_BIN="${GIT_BIN:-}"
if [ -z "$GIT_BIN" ]; then
  if [ "$NODE_BIN" = "node.exe" ] && command -v git.exe >/dev/null 2>&1; then
    GIT_BIN="git.exe"
  else
    GIT_BIN="git"
  fi
fi

echo "==> Checking JavaScript syntax"
for file in static/js/*.js static/theme.js; do
  "$NODE_BIN" --check "$file"
done

echo "==> Checking whitespace in git diff"
"$GIT_BIN" diff --check
if ! "$GIT_BIN" diff --cached --quiet --exit-code; then
  "$GIT_BIN" diff --cached --check
fi

echo "==> Checking workbench control ownership"
"$NODE_BIN" scripts/check-workbench-controls.mjs

echo "==> Checking architecture guardrails"
"$NODE_BIN" scripts/check-architecture.mjs

echo "==> All quality checks passed"
