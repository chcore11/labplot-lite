#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_DIR="$ROOT_DIR/.git/hooks"

if [ ! -d "$HOOK_DIR" ]; then
  echo "No .git/hooks directory found. Run this inside a Git checkout."
  exit 1
fi

cp "$ROOT_DIR/scripts/hooks/pre-commit" "$HOOK_DIR/pre-commit"
chmod +x "$HOOK_DIR/pre-commit"

echo "Installed pre-commit hook: .git/hooks/pre-commit"
