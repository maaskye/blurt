![blurt_logo](https://github.com/user-attachments/assets/2ff1b231-3afa-4976-95a9-4b0d6315312e)


# blurt.

A desktop revision app for the blurting method.

[![Latest Release](https://img.shields.io/github/v/release/maaskye/blurt?display_name=tag&sort=semver)](https://github.com/maaskye/blurt/releases)
[![License](https://img.shields.io/github/license/maaskye/blurt)](./LICENSE)

## What blurt helps you do

- Run a timed blurting session.
- Add ideas quickly by pressing `Enter`.
- Move notes around your board.
- End early when you are done.
- Review everything in one clean view.

## Download

Get the latest version from [Releases](https://github.com/maaskye/blurt/releases).

Look for:
- **macOS**: `.dmg` or `.app.tar.gz`
- **Windows**: `.exe` or `.msi`

## Install

### macOS
1. Download the latest macOS build from Releases.
2. Open the `.dmg` (or extract `.app.tar.gz` if needed).
3. Drag **Blurt.app** into **Applications**.
4. Open Blurt from Applications.

### Windows
1. Download the latest `.exe` or `.msi` from Releases.
2. Run the installer.
3. Open Blurt from Start Menu/Desktop.

## How to use

1. Open **Quick Start**.
2. Add your topic/session title.
3. Choose a duration.
4. Press **Lets Go!**.
5. Type a fact and press `Enter` to add notes.
6. Drag notes while the timer runs.
7. Press **Stop Early** or let the timer end.
8. Review and export if needed.

## Keyboard shortcuts

- `Enter` → add note
- `Ctrl/Cmd + Z` → undo last note

## Current status

blurt is actively improving. UI and flows may be updated between releases.

## Cloud Sync

blurt can run in three storage modes:

- `cloud` (default): Supabase cloud sync (requires login)
- `local`: local AppData files only
- `hybrid`: cloud primary + local mirror

For most users, no setup is needed (cloud is default in released builds).

To override mode or use your own Supabase project (developer setup):

1. Copy `blurt/.env.example` to `blurt/.env`
2. Set:
   - `VITE_STORAGE_MODE=cloud|local|hybrid`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_REDIRECT_URL=blurt://auth/callback`
3. Run `npm run tauri dev` from `blurt/`

Database schema and RLS setup:
- [Supabase Setup Guide](./docs/SUPABASE_SETUP.md)

Auth in cloud mode:
- Email magic link / email code
- SMS code (if phone provider is configured in Supabase)

## Need help?

If something is not working, open an issue here:
- [Report a bug](https://github.com/maaskye/blurt/issues)

## For developers

Technical/project docs are kept separately:

- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [QA Checklist](./docs/QA_CHECKLIST.md)
- [Release Checklist](./docs/RELEASE_CHECKLIST.md)
- [Supabase Setup](./docs/SUPABASE_SETUP.md)
