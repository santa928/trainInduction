# Three.js Rebuild Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkbox syntax for tracking.

**Goal:** 時間切れで成否が決まる玩具ジオラマの完成版を専用ブランチに実装する。

**Architecture:** 純粋TSのゲーム/経路/保存、Three.js描画、ReactのDOM操作を分ける。旧実装は比較用として残す。

**Tech Stack:** React, TypeScript, Three.js, Vite, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-22-threejs-rebuild.md`

## Global Constraints

- 12 unique stages, 3 trains; preparation 3 seconds; automatic train and full reset on retry.
- Only new runtime dependency: three. No backend, physics engine, or R3F.
- Preserve old progress key, old source and assets; no merge/publish.
- Run Node/npm in Docker per README.

## Review Focus

- Large frame delta must stop the train nose before the first bad rail.
- Repeated taps and drag cancellation must never duplicate pieces or act under a modal.
- Background/resume/context loss must freeze the clock and require a deliberate resume.
- Narrow/landscape viewports must retain visible, non-overlapping touch targets.
- Damaged or blocked storage must not break the game or delete legacy progress.

### Task 1: Testable railway rules and authored stages

Files: `src/railway/model.ts`, `stages.ts`, `model.test.ts`.
Interfaces: `createRun(stage, seed)`, `reduceRun(state, action)`, `sampleRoute(stage, distance)`, `railAt(stage,index)`, `solveStage(stage)`.
- [x] Write and run failing tests: 12 distinct solvable paths, all wrong/missing gaps fail before entry, no incremental retry progress, equivalent pieces, stable shuffled tray, editing locks, pause/large delta, continuous arc sampling.
- [x] Implement rail endpoints, shared curved route, state reducer and authored progression; run domain tests.
- [x] Commit tested domain.

### Task 2: Safe progress and sound

Files: `src/railway/progress.ts`, `progress.test.ts`, `audio.ts`.
Interfaces: load/save v2 progress with preserved legacy key; gesture-activated audio with mute/dispose.
- [x] Write/run failing migration, corruption and blocked-storage tests.
- [x] Implement versioned progress and small Web Audio cues; run suite.

### Task 3: Diorama and touch UI

Files: `src/scene/Diorama.ts`, `models.ts`, `src/components/RailwayGame.tsx`, `RailIcon.tsx`, `src/App.tsx`, `styles.css`, `App.test.tsx`.
Consumes Task 1 route/state and Task 2 progress/audio. Three.js objects contain no game rules.
- [x] Add UI test for full-reset retry, stage selection and paused/resumed game; observe failing behavior.
- [x] Add three and its types via Docker; procedural models, fixed orthographic camera, shared route geometry, projections for DOM holes, frame timing, disposal/context handling.
- [x] Implement train/stage screens, tray SVGs, two-tap and pointer drag, pause/result overlays, audio and arrival celebration.
- [x] Run suite and build, correct screenshots at all four viewports.

### Task 4: Browser verification, review and handoff

Files: `tests/e2e/rebuild-v2.spec.ts`, Playwright config, README, `docs/rebuild-v2-results.md`.
- [ ] Test all 12 stages through real browser inputs and motion; assert wrong/missing failures, retry, rapid input, pause, resize, persistence, no invalid entry.
- [ ] Run build, unit suite and browser tests. Capture and inspect mobile/tablet/landscape/desktop and success/failure screenshots.
- [ ] Fresh whole-branch review, address correctness findings, record limitations, commit and keep local preview available. No merge/publish.
