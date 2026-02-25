# Blurt (Tauri + React + TypeScript)

Blurt is a desktop study app that uses the blurting revision technique:

1. Set up a timed session.
2. Type facts into a large central input.
3. Press Enter to drop each blurt as a random note on the canvas.
4. Review and drag notes once the timer ends.

## Features

- **Core flow:** Session Setup → Blurt Mode → Review
- Countdown timer with pause/resume
- Keyboard shortcuts:
  - `Enter`: submit note
  - `Ctrl/Cmd+Z`: undo last note
  - `Space`: pause/resume timer
- Random non-overlapping note placement
- Session summary at end:
  - total notes
  - total words
  - notes/minute
- Local persistence to JSON files (Tauri app data directory)
- Past sessions list and reopen in review mode
- Draggable notes in review mode
- Export collage canvas to PNG

## Project structure

```txt
blurt/
  src/
    components/
      SessionSetupView.tsx
      BlurtView.tsx
      ReviewView.tsx
    hooks/useTimer.ts
    utils/placeNoteRandomly.ts
    services/sessionStore.ts
  src-tauri/
```


## Downloading Windows `.exe` / `.msi` builds from GitHub

This repository now includes a GitHub Actions workflow at `.github/workflows/release-blurt.yml` that builds desktop bundles and publishes them to GitHub Releases.

### One-time setup

1. Push this repository to GitHub.
2. Ensure Actions are enabled for the repository.
3. (Optional) If you later add app signing, configure the signing secrets in repository settings.

### Create a release build

Create and push a tag that matches `blurt-v*`:

```bash
git tag blurt-v0.1.0
git push origin blurt-v0.1.0
```

The workflow will:
- build on **Windows** and **macOS**
- publish generated installers/artifacts to a GitHub Release

For Windows, users can download installer artifacts (typically `.msi`, and depending on target setup, `.exe`/NSIS-style installer artifacts) directly from that release page.

You can also run the workflow manually from the **Actions** tab via `workflow_dispatch`.

## Prerequisites

- Node.js 18+
- Rust toolchain (`rustup`)
- Tauri dependencies for your OS:
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools + WebView2

## Setup

```bash
cd blurt
npm install
```

## Run in development

```bash
npm run tauri dev
```

## Build desktop app bundles

```bash
npm run tauri build
```

On macOS this can produce `.app` / `.dmg`, and on Windows `.msi` / `.exe` depending on your environment configuration.
