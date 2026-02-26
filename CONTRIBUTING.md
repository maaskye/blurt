# Contributing to blurt.

## Prerequisites

- Node.js 20+
- Rust toolchain (`rustup`)
- macOS or Windows environment that can build Tauri

## Local Setup

```bash
cd blurt
npm install
npm run tauri dev
```

## Branch Naming

Use descriptive branches. Preferred patterns:
- `main` for production-ready code.
- `codex/<topic>` for assistant-generated work.
- `feature/<topic>` or `fix/<topic>` for manual work.

## Commit Message Style

Use concise, action-focused messages:
- `feat: add quickstart duration wheel`
- `fix: stabilize sidebar collapse`
- `docs: refresh release checklist`

## Required Local Checks

Before opening a PR:

```bash
cd blurt
npm run smoke
```

Before creating a release tag:

```bash
cd blurt
npm run verify:release
```

## Pull Request Checklist

- [ ] Scope is clear and limited.
- [ ] Behavior changes are explained.
- [ ] Local checks passed.
- [ ] UI changes include screenshots or short video/GIF.
- [ ] Related docs/checklists were updated.

## Release Etiquette

Preferred release tags:
- Stable: `blUpdate-vX.Y.Z`
- Hotfix: `blUpdate-vX.Y.Z` with hotfix notes in release body

Legacy compatibility:
- `blurt-vX.Y.Z` remains supported by workflow.

Artifact expectations:
- Required: Windows installer/bundles, macOS `.app`.
- Optional: macOS `.dmg` (best-effort).
