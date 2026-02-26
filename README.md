# Blurt (Tauri + React + TypeScript)

Blurt is a desktop study app for the blurting revision technique:

1. Start a timed session.
2. Type facts and press Enter to drop notes onto the board.
3. Drag notes while the timer is running.
4. End naturally or use **Stop Early**.
5. Review arranged notes and export PNGs.

## Current feature set

- Dashboard-style home screen with:
  - latest session **Recents** card and **Continue** action
  - compact **Quick Start** form
  - visual nav/sidebar shell
- Motion system in Blurt view:
  - inertia drag on release
  - Enter-submit launch animation into note board
  - morph-to-grid transition at session finish
- Session timer with pause/resume and Stop Early
- Keyboard shortcuts:
  - `Enter`: submit note
  - `Ctrl/Cmd+Z`: undo last note
- Local persistence in app data:
  - sessions (`schemaVersion` aware)
  - session templates
- Session templates:
  - save/update/delete template
  - apply template to quick start fields
- Export current board and full arranged board to PNG

## Project structure

```txt
blurt/
  src/
    components/
      SessionSetupView.tsx
      BlurtView.tsx
      ReviewView.tsx
    hooks/
    services/
      sessionStore.ts
      templateStore.ts
    utils/
      placeNoteRandomly.ts
      arrangeNotesIntoGrid.ts
      motion.ts
  src-tauri/
  .github/workflows/release-blurt.yml
```

## Release policy

GitHub workflow: `.github/workflows/release-blurt.yml`

- Trigger: push tag matching `blurt-v*`
- Windows: default Tauri bundle args
- macOS: `--bundles app` (predictable)
- `.dmg` is considered best-effort and not required for a successful release

### Create a release

```bash
git tag -a blurt-v0.1.7 -m "Blurt v0.1.7"
git push origin blurt-v0.1.7
```

Then verify:
- Actions run is green
- Release has expected Windows + macOS `.app` artifacts

## Prerequisites

- Node.js 20+
- Rust toolchain (`rustup`)
- OS dependencies for Tauri

## Local setup

```bash
cd blurt
npm install
```

## Development

```bash
npm run tauri dev
```

## Verification scripts

```bash
npm run smoke
npm run verify:release
```

- `smoke` runs a basic production build.
- `verify:release` runs build + macOS `.app` bundle validation.
