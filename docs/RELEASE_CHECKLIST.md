# Release Checklist

## Pre-flight

1. `npm install`
2. `npm run smoke`
3. `npm run verify:release`
4. Confirm no unintended files in `git status`

## Publish

1. Commit changes to `main`
2. Push `main`
3. Create annotated tag `blurt-vX.Y.Z`
4. Push tag

## Verify GitHub

1. `Release Blurt Desktop` workflow completes successfully
2. Release notes reflect current artifact policy
3. Artifacts are attached:
   - Windows bundle(s)
   - macOS `.app` bundle artifact

## Post-release sanity

1. Download artifact(s)
2. Launch app
3. Verify home dashboard renders
4. Start/finish one session
