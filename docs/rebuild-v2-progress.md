# Execution ledger — 2026-10-22 Three.js rebuild

Plan: docs/superpowers/plans/2026-10-22-threejs-rebuild.md
Base: d7fe410812c9f0e56f6abf49896219630fa5d89e

- User approved timed automatic travel, failure for missing/wrong rails and full-stage retries; complete version scope replaces prototype-only scope.
- Dedicated branch created; existing baseline build and 60 tests passed during investigation.
- Shared interfaces: stage/route/run feed scene+UI; progress records stage IDs; UI supplies reducer actions. Scene never decides correctness.
- Execution: inline, authorized implementation after design agreement. No additional design approval loop; user requested implementation after agreement.
- Task 1: complete — new railway rules/stages RED (missing modules) → GREEN, 12 independent solvable paths, safe-stop tests over every missing/wrong gap.
- Task 2: complete — migration/corruption/storage tests RED → GREEN; old key preserved.
- Task 3: complete — new navigation tests RED against old UI → GREEN; 3D/UI integrated. Node 22 build and 71 tests pass.
- Browser regression found startup shader stalls caused an automatic pause. Removed frame-delay-as-pause heuristic, rendered first frame before starting clock. Background and context-loss pause remain explicit.
- Browser interaction checks: wrong rail, real touch drag/cancel and context restoration passed. Layout harness initially allowed the clock to run across four resizes and correctly hit timed failure; corrected harness to measure layouts while explicitly paused.
- Dependency audit: existing 6 entries (2 critical/2 high/2 moderate) → 0 after Vitest 5.0.5 and compatible Vite/source-map patch updates. No new runtime dependency beyond three.
- Pages workflow changed to manual execution and checks its own checkout before upload; no workflow was triggered.
- Task 4: in progress — full browser suite and fresh code review.

- Fresh independent review: 3 important findings (stale camera matrices, curved bumper safety, answer art on stage map) and repeated translated route. All four reproduced with new failing tests (RED log train-v2-review-red.log).
- Fix pass: refresh camera world matrices before projection; conservative curved-stop margin 0.65 checked against actual turned meshes at every gap; neutral destination stamps; redesign stage 9 and normalized-route uniqueness test.
- Review re-grade: repeated route treated as important under the user's quality requirement, fixed with the other findings. No deferred minor findings.
- Browser-run ruling: serialize GPU tests on this software renderer. Three concurrent software WebGL instances caused ~7-second input latencies and genuine timed failures; do not weaken game deadlines to make overloaded automation pass. Real-time tests will run one browser at a time.
