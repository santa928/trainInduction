# Remove legacy implementation

**Goal:** Remove the retired image-based game without changing the current game or saved progress.

**Scope:** User-approved cleanup from main `05df6d3`; no merge, push or deployment. Git history is the recovery source.

## Steps

- [x] Delete the 15 unreachable legacy source/CSS files, 10 PNGs, five legacy unit suites and two legacy E2E files identified by the entry/build audit.
- [x] Keep `src/railway/progress.ts` and current tests. Exercise every legacy difficulty's migration, unchanged old storage, and current arrival persistence.
- [x] Remove unused `@vitest/ui` after checking scripts/CI. Consolidate type checking into the existing no-emit tsconfig and explicitly select `vite.config.ts` so old generated JS cannot shadow it.
- [x] Update README and the station release status. Add concise repository-wide refactoring completion rules in `AGENTS.md`; do not add a new skill or audit framework.
- [x] Run typecheck, current unit tests, build and the existing Chromium/WebKit browser suite. Inspect actual touch-equivalent screenshots and a production arrival/save. Review the final diff and report current/removed test counts separately.

## Review focus

- Legacy save migration must not import deleted modules, change the old storage value or invent clears.
- Current rail geometry/previews, 12 stages, controls and rules must be unchanged.
- A stale generated Vite config must not override TypeScript configuration.
- Deleted legacy tests must not be counted as passing current coverage; retain all current behavior checks.
- Runtime bundles must contain the same current source modules; historical screenshots/docs are evidence, not shipped assets.

Verification evidence and final counts are recorded in `docs/legacy-cleanup.md` after execution.
