# Repository instructions

Node/npm commands run in Docker as described in README.md; do not run host npm/npx/pnpm/yarn.

## Refactoring completion

- Trace the current entry points, imports, asset references and production build modules before declaring old code unused.
- Delete obsolete implementations and unused assets, tests and dependencies as part of the same refactor. Use Git history for recovery; do not keep retired code in current `src/` solely for comparison or restoration.
- Preserve required save-data migration and verify it with current tests. Never delete or overwrite legacy user storage merely because its old implementation is removed.
- Run `npm run typecheck`, `npm test`, `npm run build` and affected browser checks (`npm run test:e2e`) in Docker; inspect actual touch-equivalent screens. Report current test counts separately from legacy/removed tests and intentional skips; deletion is not new coverage.
- Explain the concrete runtime, compatibility or evidence reason for anything retained. Check the final diff and update affected documentation.
- Keep cleanup scoped to the authorized task. Merge, push and deployment still follow the user's authorization.
