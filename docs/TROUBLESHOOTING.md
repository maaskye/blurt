# Troubleshooting

## 1) `npm run dev` starts but app window is not visible

Symptoms:
- Vite runs on `http://localhost:1420` but no desktop app window appears.

Checks:
1. `npm run dev` runs only frontend; for desktop shell use `npm run tauri dev`.
2. Confirm port is reachable in browser (`http://localhost:1420`).
3. Stop old processes and retry.

## 2) `npm run tauri dev` fails

Checks:
1. Verify Rust is installed:
   ```bash
   rustup show
   ```
2. Verify Tauri dependencies are installed for your OS.
3. Reinstall node packages:
   ```bash
   cd blurt
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Retry:
   ```bash
   npm run tauri dev
   ```

## 3) Build passes but release artifacts are missing/mismatched

Checks:
1. Run preflight locally:
   ```bash
   npm run verify:release
   ```
2. Confirm expected policy:
   - Required: Windows artifacts + macOS `.app`
   - Optional: macOS `.dmg`
3. Confirm tag format is supported:
   - Preferred: `blUpdate-vX.Y.Z`
   - Legacy: `blurt-vX.Y.Z`

## 4) Icon update did not apply

Steps:
1. Replace source icon:
   - `blurt/src-tauri/icon.svg`
2. Regenerate platform icons:
   ```bash
   cd blurt
   npm run tauri icon src-tauri/icon.svg
   ```
3. Rebuild:
   ```bash
   npm run tauri build -- --bundles app
   ```

## 5) GitHub workflow fails on Windows/macOS

Checks:
1. Open Actions logs and find failing step (Node setup, Rust install, tauri-action, bundle step).
2. Confirm `package-lock.json` and `blurt/src-tauri/tauri.conf.json` are committed.
3. Re-run failed jobs after correcting config.
4. Validate tag points to intended commit.

## 6) Session data differs between dev and packaged app

Notes:
- `npm run dev` is browser-first; behavior can differ from packaged Tauri app.
- Persistence debugging should be validated in packaged app too:
  ```bash
  npm run tauri build -- --bundles app
  ```
- Always test critical persistence flows in both contexts before release.

## 7) Clean reset to latest release tag

From repo root:

```bash
git fetch --tags --all --prune
git reset --hard blUpdate-v1.1.1
git clean -fd
```

Use the exact tag you want to return to.
