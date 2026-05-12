#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${1:-${PORT:-8000}}"

cd "$ROOT_DIR"

echo "Serving LabPlot Lite at http://${HOST}:${PORT}/"
python3 -m http.server "$PORT" --bind "$HOST"
