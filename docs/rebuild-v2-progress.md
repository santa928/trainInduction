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
- Follow-up projection regression reproduced overlap of two 44+ px touch squares in the steeper desktop pose. Reduced target scaling from 0.80 to 0.72 cell units, retaining the 44px minimum; full portrait/tablet/desktop target-box test added RED→GREEN.
- Manual Chromium touch run: stage 12 filled with ES/EW/WN/EW/NE by two-tap inputs; rotated through landscape/tablet/desktop while the train ran; reached station in real time. Screenshots retained under docs/rebuild-v2/screenshots. No simulated clock or solver mutation used for this run; a legacy fixture only unlocked access.
- Additional data validation: enumerated all finite-piece arrangements and walked the visible rail graph. Found one station-reaching shortcut in stage 12 that canonical-route validation would reject. Reproduced RED; replaced the unused SW distractor with NS, retaining the intended 5-piece solution and preventing the shortcut. No production graph engine added.
- Trace diagnosis: a failed 80-second case recorded 516 raster images / 16 MB. Action latency reached 1.5–4 seconds even with one worker. Keep DOM/source traces but disable trace screencast screenshots; static milestone screenshots remain. The game's clock/speed and input checks stay unchanged.
- Short-viewport regression: WebKit's iPhone 13 viewport is 390×664 (the device screen is 390×844). Its 323px board projected adjacent 44px targets ~42px apart. Reproduced RED; use a shallower camera under 400px board height and a 320px mobile-board minimum. Resize checks wait for ResizeObserver + React projection before measuring.
- Resume clock regression: paused time could be charged when pause/resume occurred without a frame between them. Added a real component/RAF regression (60 seconds charged before fix), reset the frame timestamp in a layout effect on pause transitions. Active-play stalls still count. Final unit suite: 12 files / 78 passing; final build succeeds.
- Automation ruling: trace raster screenshots AND DOM snapshots caused substantial software-GPU stalls. Disable trace collection, keep static milestones/failure images and assertion logs. Read fixed button coordinates during explicit pause for the repeated-edit case; send real touch input on resume, with no reducer/clock mutation.
- Task 4: complete — 20 distinct browser checks confirmed across repair/retest runs (12 Chromium real-time clears, 5 Chromium interaction cases, 3 WebKit interaction cases). Final resize/edit recheck: Chromium + WebKit 2/2 pass. The report maps every success to a retained log and explicitly does not claim one full green run.
- Production handoff: ZIP's 4 assets verified against the build SHA-256 manifest. Actual production touch session cleared stage 12 with pause/resume and three live resizes. A trailing ambiguous menu locator halted that script after clear; a separately scoped production session passed PC placement, return/missing failure, menu navigation and short-screen capture. Ten screenshots inspected. Physical iOS, audio listening, child acceptance remain unverified.
- Integration choice already specified by user: keep branch/workspace. No push, PR, main merge, Pages publish or existing-publication replacement. Development and packaged-review servers remain available locally.
