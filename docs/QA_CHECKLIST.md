# UI / Flow QA Checklist

## Home + Quick Start

- [ ] Latest session appears in Recents card
- [ ] Continue opens unfinished session in Blurt view
- [ ] Continue opens finished session in Review view
- [ ] Duration wheel opens and commits chosen minute
- [ ] Quick Start starts exactly one session per click/Enter

## Blurt Session

- [ ] Enter submits note
- [ ] Ctrl/Cmd+Z undoes latest note
- [ ] Drag inertia feels smooth and bounded
- [ ] Stop Early ends session
- [ ] Finish morphs notes into grid

## Review

- [ ] Review loads from finished session route
- [ ] Notes can be repositioned in review
- [ ] Summary metrics render correctly

## Persistence (Current Target Behavior)

- [ ] Reopen app and previous sessions still exist
- [ ] Final note positions persist after session end

## Cloud Sync (when `VITE_STORAGE_MODE=cloud` or `hybrid`)

- [ ] Login screen appears when signed out
- [ ] Magic link sign-in allows app access
- [ ] Session save appears in Supabase `sessions` table
- [ ] Template CRUD appears in Supabase `templates` table
- [ ] Offline launch shows cached data as read-only
- [ ] Reconnect restores write ability

## Export

- [ ] Export View PNG succeeds
- [ ] Export Full PNG succeeds

## Release Candidate Sanity

- [ ] No unintended tracked file changes in `git status`
- [ ] Manual checks match release notes scope
