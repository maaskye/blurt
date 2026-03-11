<img width="2048" height="852" alt="blurtrtansparent12" src="https://github.com/user-attachments/assets/57dbdb3f-f362-42bd-8f1b-6229f618a9cc" />


# blurt.

A desktop revision app for the blurting method.

[![Latest Release](https://img.shields.io/github/v/release/maaskye/blurt?display_name=tag&sort=semver)](https://github.com/maaskye/blurt/releases)
[![License](https://img.shields.io/github/license/maaskye/blurt)](./LICENSE)
![downloads](https://img.shields.io/github/downloads/maaskye/blurt/total)
![last commit](https://img.shields.io/github/last-commit/maaskye/blurt)
![platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![platform](https://img.shields.io/badge/platform-Windows-grey)

<img width="2560" height="400" alt="blurtrepo-text" src="https://github.com/user-attachments/assets/719fd486-554e-44fb-b4fe-3470f1238836" />

- Run a timed blurting session.
- Add ideas quickly by pressing `Enter`.
- Move notes around your board.
- End early when you are done.
- Review everything in one clean view.

<img width="2560" height="400" alt="blurtrepo-text (1)" src="https://github.com/user-attachments/assets/21776dc6-fb6e-415f-9520-d3090834fd1f" />

**Get the latest version from** [Releases](https://github.com/maaskye/blurt/releases).

Look for:
- **macOS**: `.dmg` or `.app.tar.gz`
- **Windows**: `.exe` or `.msi`

<img width="2560" height="400" alt="blurtrepo-text (2)" src="https://github.com/user-attachments/assets/4058bb53-133a-489b-982d-bc3b3610332c" />

### macOS
1. Download the latest macOS build from Releases.
2. Open the `.dmg` (or extract `.app.tar.gz` if needed).
3. Drag **Blurt.app** into **Applications**.
4. Open Blurt from Applications.

### Windows
1. Download the latest `.exe` or `.msi` from Releases.
2. Run the installer.
3. Open Blurt from Start Menu/Desktop.

<img width="2560" height="400" alt="blurtrepo-text (3)" src="https://github.com/user-attachments/assets/e2e6e2d3-7def-45f0-8f60-338bf712372d" />

1. Open **Quick Start**.
2. Add your topic/session title.
3. Choose a duration.
4. Press **Lets Go!**.
5. Type a fact and press `Enter` to add notes.
6. Drag notes while the timer runs.
7. Press **Stop Early** or let the timer end.
8. Review and export if needed.

### Keyboard shortcuts

- `Enter` → add note
- `Ctrl/Cmd + Z` → undo last note

### Current status

blurt is actively improving. UI and flows may be updated between releases.

<img width="2560" height="400" alt="blurtrepo-text (4)" src="https://github.com/user-attachments/assets/eccbeaad-dfec-4c15-af60-7032df47f483" />

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

<img width="2560" height="400" alt="blurtrepo-text (5)" src="https://github.com/user-attachments/assets/f9d4aaf4-ffbc-44c0-bb24-4e2adc7e2a31" />

If something is not working, open an issue here:
- [Report a bug](https://github.com/maaskye/blurt/issues)

<img width="2560" height="400" alt="blurtrepo-text (6)" src="https://github.com/user-attachments/assets/1503eca7-0ebc-4360-8726-ad81fb709827" />

Technical/project docs are kept separately:

- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [QA Checklist](./docs/QA_CHECKLIST.md)
- [Release Checklist](./docs/RELEASE_CHECKLIST.md)
- [Supabase Setup](./docs/SUPABASE_SETUP.md)
