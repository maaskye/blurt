#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../blurt"

echo "[smoke] npm run build"
npm run build

echo "[smoke] complete"
