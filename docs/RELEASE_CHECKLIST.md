# Release Checklist

## Pre-Flight

1. `cd blurt && npm install`
2. `npm run smoke`
3. `npm run verify:release`
4. Confirm no unintended files in `git status`
5. Confirm docs/checklists reflect current behavior

## Publish

1. Commit and push release-ready changes to `main`
2. Create annotated tag (preferred):
   - `blUpdate-vX.Y.Z`
3. Push tag:
   - `git push origin blUpdate-vX.Y.Z`

Legacy fallback tag remains supported:
- `blurt-vX.Y.Z`

## Verify GitHub Release

1. `Release Blurt Desktop` workflow completes
2. Release title matches tag automatically
3. Release body reflects artifact policy
4. Required artifacts are present:
   - Windows bundle(s)
   - macOS `.app`
5. Optional artifact (best-effort):
   - macOS `.dmg`

## Post-Release Sanity

1. Download artifact(s)
2. Launch app
3. Verify home dashboard renders
4. Start and finish one session
5. Confirm release notes/changelog entry is accurate
