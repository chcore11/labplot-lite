#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking JavaScript syntax"
for file in static/js/*.js static/theme.js; do
  node --check "$file"
done

echo "==> Checking whitespace in git diff"
git diff --check
if ! git diff --cached --quiet --exit-code; then
  git diff --cached --check
fi

echo "==> Checking workbench control ownership"
node scripts/check-workbench-controls.mjs

echo "==> Checking architecture guardrails"
node scripts/check-architecture.mjs

echo "==> All quality checks passed"
