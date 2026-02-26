#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../blurt"

echo "[verify] npm run build"
npm run build

echo "[verify] npm run tauri build -- --bundles app"
npm run tauri build -- --bundles app

echo "[verify] release verification complete"
