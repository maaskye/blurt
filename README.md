# blurt.

A desktop app for blurting revision sessions, built with Tauri + React + TypeScript.

[![Latest Release](https://img.shields.io/github/v/release/Correxxt/blurt?display_name=tag&sort=semver)](https://github.com/Correxxt/blurt/releases)
[![Release Workflow](https://img.shields.io/github/actions/workflow/status/Correxxt/blurt/release-blurt.yml?label=release)](https://github.com/Correxxt/blurt/actions/workflows/release-blurt.yml)
[![License](https://img.shields.io/github/license/Correxxt/blurt)](./LICENSE)

## Quick Start (60 seconds)

```bash
git clone https://github.com/Correxxt/blurt.git
cd blurt/blurt
npm install
npm run tauri dev
```

## What Is In This Repo

| Path | Purpose |
| --- | --- |
| `blurt/` | Desktop app source (React frontend + Tauri backend shell). |
| `docs/` | QA checklist, release checklist, troubleshooting, and docs assets. |
| `scripts/` | Local verification scripts (`smoke`, `verify-release`). |
| `.github/workflows/` | GitHub Actions release pipeline. |

## Features

### User-Facing
- Dashboard home screen with Recents and Quick Start.
- Timed blurting sessions with Enter-to-add notes.
- Note drag with motion effects.
- Stop Early control and review mode.
- PNG export (view and full board).

### Developer-Facing
- Local smoke and release verification scripts.
- Release automation through GitHub Actions.
- Structured QA and release checklists.
- Changelog-driven release notes workflow.

## Release Flow

Preferred tag format (stable/hotfix):

```bash
git tag -a blUpdate-vX.Y.Z -m "blUpdate vX.Y.Z"
git push origin blUpdate-vX.Y.Z
```

Legacy tag format is still supported:

```bash
git tag -a blurt-vX.Y.Z -m "Blurt vX.Y.Z"
git push origin blurt-vX.Y.Z
```

Release workflow behavior:
- Trigger: tag push matching `blUpdate-v*` or `blurt-v*`.
- Release title: uses the exact tag name automatically.
- Required artifacts: Windows bundle(s) + macOS `.app`.
- `.dmg`: optional best-effort artifact.

## Known Limits / Current Caveats

- Persistence behavior may differ between `npm run dev` and packaged app context.
- macOS bundle identifier currently ends in `.app` (warning only, should be cleaned up later).
- Non-home nav sections are still iterating and may change quickly between releases.

## Docs Index

- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [QA Checklist](./docs/QA_CHECKLIST.md)
- [Release Checklist](./docs/RELEASE_CHECKLIST.md)

## Screenshots

Reference image paths (place files in `docs/assets/`):
- `docs/assets/home.png`
- `docs/assets/session.png`
- `docs/assets/review.png`
- `docs/assets/note-flow.gif` (optional)

Example markdown:

```md
![Home](docs/assets/home.png)
![Session](docs/assets/session.png)
![Review](docs/assets/review.png)
```
