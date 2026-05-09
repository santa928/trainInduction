# Train Induction Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static GitHub Pages-ready browser game where 3-year-old players place rail pieces to guide an automatically moving train through 15 authored courses.

**Architecture:** Use a React + TypeScript + Vite static app with stage-definition-driven gameplay. Keep course data immutable, put validation and game state transitions in pure functions, and keep React components focused on rendering screens and dispatching player actions.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Playwright, CSS/SVG, `localStorage`, Docker-based npm execution.

---

## Execution Rules

- Do not run `npm`, `npx`, `pnpm`, or `yarn` on the host. Use Docker for all Node commands.
- Use this helper command pattern from the repository root:

```bash
docker run --rm -it \
  -u "$(id -u):$(id -g)" \
  -v "$PWD":/app \
  -w /app \
  node:22-bookworm \
  npm <command>
```

- When a task asks to commit, use a Japanese commit message.
- Keep `.superpowers/` and `progress.md` untracked.

## File Structure

- Create `package.json`: npm scripts and dependencies for Vite, React, Vitest, Playwright.
- Create `index.html`, `src/main.tsx`, `src/App.tsx`: app entry and top-level screen routing.
- Create `src/styles.css`: responsive layout, child-friendly controls, SVG rail visuals.
- Create `src/data/types.ts`: shared data types for trains, pieces, gaps, courses, progress.
- Create `src/data/trains.ts`: 3 train definitions.
- Create `src/data/courses.ts`: 15 authored course definitions.
- Create `src/data/validateCourses.ts`: course consistency checks.
- Create `src/game/createGameState.ts`: initial runtime state from course definitions.
- Create `src/game/gameReducer.ts`: pure placement, movement, retry, and clear transitions.
- Create `src/game/selectors.ts`: helpers for rendering and unlock state.
- Create `src/storage/progressStorage.ts`: validated `localStorage` read/write.
- Create `src/components/TrainSelect.tsx`: train selection screen.
- Create `src/components/CourseSelect.tsx`: course selection and unlock display.
- Create `src/components/GameScreen.tsx`: main play screen and input wiring.
- Create `src/components/RailPiece.tsx`: reusable SVG rail piece.
- Create `src/components/ResultOverlay.tsx`: clear/retry overlay.
- Create `src/test/setup.ts`: Testing Library setup.
- Create unit tests under `src/**/*.test.ts`.
- Create Playwright tests under `tests/e2e/`.
- Create `.github/workflows/ci.yml`: build and test workflow.
- Create or update `README.md`: overview, Docker commands, operation guide, GitHub Pages build output.

## Task 1: Scaffold Static React/Vite App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "name": "train-induction",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "tsc -b"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitest/ui": "^3.2.0",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.0",
    "@playwright/test": "^1.54.0"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="3歳児向けの電車誘導ブラウザゲーム" />
    <title>レールをつなごう！</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/trainInduction/",
  plugins: [react()],
});
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Create minimal app shell**

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
/**
 * Renders the current app shell while implementation tasks add real screens.
 */
export default function App(): JSX.Element {
  return (
    <main className="app-shell">
      <h1>レールをつなごう！</h1>
      <p>でんしゃをえらんで、レールをつなごう。</p>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  font-family: "Hiragino Maru Gothic ProN", "Yu Gothic", system-ui, sans-serif;
  color: #234;
  background: #d9f4ff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
}
```

- [ ] **Step 3: Install dependencies inside Docker**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm install
```

Expected: `package-lock.json` is created and dependencies are installed in `node_modules/`.

- [ ] **Step 4: Verify the scaffold**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run build
```

Expected: TypeScript build passes and `dist/` is generated.

- [ ] **Step 5: Commit scaffold**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts src
git commit -m "静的アプリの土台を追加"
```

## Task 2: Define Domain Types and Authored Course Data

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/trains.ts`
- Create: `src/data/courses.ts`
- Create: `src/data/validateCourses.ts`
- Create: `src/data/validateCourses.test.ts`

- [ ] **Step 1: Write course validation tests first**

Create `src/data/validateCourses.test.ts`:

```ts
import { courses } from "./courses";
import { trains } from "./trains";
import { validateCourses } from "./validateCourses";

describe("validateCourses", () => {
  it("accepts the authored 15-course set", () => {
    expect(validateCourses(trains, courses)).toEqual([]);
  });

  it("rejects gaps that reference missing pieces", () => {
    const broken = structuredClone(courses);
    broken[0].gaps[0].requiredPieceId = "missing-piece";

    expect(validateCourses(trains, broken)).toContain(
      "course sora-1 gap sora-1-gap-1 requires unknown piece missing-piece",
    );
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/data/validateCourses.test.ts
```

Expected: FAIL because `courses`, `trains`, and `validateCourses` do not exist.

- [ ] **Step 3: Add domain types**

Create `src/data/types.ts`:

```ts
export type TrainId = "sora" | "mori" | "niji";
export type CourseId = `${TrainId}-${1 | 2 | 3 | 4 | 5}`;
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type RailShape = "straight" | "curve" | "bridge";
export type RailDirection = "east" | "south" | "west" | "north" | "northEast" | "southEast" | "southWest" | "northWest";
export type RetryMode = "checkpoint" | "courseStart";

export interface TrainDefinition {
  readonly id: TrainId;
  readonly name: string;
  readonly color: string;
  readonly accentColor: string;
  readonly emoji: string;
}

export interface RailPoint {
  readonly x: number;
  readonly y: number;
}

export interface PieceDefinition {
  readonly id: string;
  readonly shape: RailShape;
  readonly direction: RailDirection;
  readonly label: string;
}

export interface GapDefinition {
  readonly id: string;
  readonly position: RailPoint;
  readonly requiredPieceId: string;
  readonly arrivalDistance: number;
}

export interface CourseDefinition {
  readonly id: CourseId;
  readonly trainId: TrainId;
  readonly title: string;
  readonly difficulty: Difficulty;
  readonly background: "sky" | "forest" | "rainbow" | "river" | "night";
  readonly trainSpeed: number;
  readonly retryMode: RetryMode;
  readonly path: readonly RailPoint[];
  readonly pieces: readonly PieceDefinition[];
  readonly gaps: readonly GapDefinition[];
}
```

- [ ] **Step 4: Add train definitions**

Create `src/data/trains.ts`:

```ts
import type { TrainDefinition } from "./types";

export const trains: readonly TrainDefinition[] = [
  { id: "sora", name: "そらでんしゃ", color: "#5db7ff", accentColor: "#ffe66d", emoji: "🚃" },
  { id: "mori", name: "もりでんしゃ", color: "#61c57b", accentColor: "#ffcf70", emoji: "🚂" },
  { id: "niji", name: "にじでんしゃ", color: "#ff78b7", accentColor: "#78e0ff", emoji: "🚆" },
] as const;
```

- [ ] **Step 5: Add 15 authored courses**

Create `src/data/courses.ts` with this pattern for all 15 courses:

```ts
import type { CourseDefinition, Difficulty, RetryMode, TrainId } from "./types";

const path = [
  { x: 8, y: 50 },
  { x: 28, y: 50 },
  { x: 48, y: 50 },
  { x: 68, y: 50 },
  { x: 92, y: 50 },
] as const;

const retryMode = (difficulty: Difficulty): RetryMode =>
  difficulty <= 2 ? "checkpoint" : "courseStart";

const makeCourse = (trainId: TrainId, difficulty: Difficulty, background: CourseDefinition["background"]): CourseDefinition => {
  const id = `${trainId}-${difficulty}` as CourseDefinition["id"];
  const gapCount = difficulty === 1 ? 1 : difficulty === 2 ? 2 : difficulty === 5 ? 4 : 3;
  const candidateCount = difficulty <= 2 ? 2 : difficulty === 3 ? 3 : 4;
  const pieces = Array.from({ length: candidateCount }, (_, index) => ({
    id: `${id}-piece-${index + 1}`,
    shape: index % 2 === 0 ? "straight" : "curve",
    direction: index % 2 === 0 ? "east" : index % 3 === 0 ? "southEast" : "northEast",
    label: index % 2 === 0 ? "まっすぐ" : "くるん",
  })) as CourseDefinition["pieces"];

  const gaps = Array.from({ length: gapCount }, (_, index) => ({
    id: `${id}-gap-${index + 1}`,
    position: { x: 24 + index * 16, y: index % 2 === 0 ? 50 : 42 },
    requiredPieceId: pieces[index % pieces.length].id,
    arrivalDistance: 20 + index * 20,
  })) as CourseDefinition["gaps"];

  return {
    id,
    trainId,
    title: `${difficulty}ばんめのたび`,
    difficulty,
    background,
    trainSpeed: 0.018 + difficulty * 0.004,
    retryMode: retryMode(difficulty),
    path,
    pieces,
    gaps,
  };
};

export const courses: readonly CourseDefinition[] = [
  makeCourse("sora", 1, "sky"),
  makeCourse("sora", 2, "forest"),
  makeCourse("sora", 3, "rainbow"),
  makeCourse("sora", 4, "river"),
  makeCourse("sora", 5, "night"),
  makeCourse("mori", 1, "forest"),
  makeCourse("mori", 2, "river"),
  makeCourse("mori", 3, "sky"),
  makeCourse("mori", 4, "rainbow"),
  makeCourse("mori", 5, "night"),
  makeCourse("niji", 1, "rainbow"),
  makeCourse("niji", 2, "sky"),
  makeCourse("niji", 3, "forest"),
  makeCourse("niji", 4, "river"),
  makeCourse("niji", 5, "night"),
] as const;
```

- [ ] **Step 6: Add validator implementation**

Create `src/data/validateCourses.ts`:

```ts
import type { CourseDefinition, TrainDefinition } from "./types";

/**
 * Returns human-readable consistency errors for authored train courses.
 */
export function validateCourses(
  trains: readonly TrainDefinition[],
  courses: readonly CourseDefinition[],
): string[] {
  const errors: string[] = [];
  const trainIds = new Set(trains.map((train) => train.id));
  const courseIds = new Set<string>();

  for (const course of courses) {
    if (!trainIds.has(course.trainId)) {
      errors.push(`course ${course.id} references unknown train ${course.trainId}`);
    }

    if (courseIds.has(course.id)) {
      errors.push(`duplicate course id ${course.id}`);
    }
    courseIds.add(course.id);

    const pieceIds = new Set(course.pieces.map((piece) => piece.id));
    for (const gap of course.gaps) {
      if (!pieceIds.has(gap.requiredPieceId)) {
        errors.push(`course ${course.id} gap ${gap.id} requires unknown piece ${gap.requiredPieceId}`);
      }
    }

    const sorted = [...course.gaps].sort((a, b) => a.arrivalDistance - b.arrivalDistance);
    if (sorted.some((gap, index) => gap.id !== course.gaps[index]?.id)) {
      errors.push(`course ${course.id} gaps must be ordered by arrivalDistance`);
    }
  }

  if (courses.length !== 15) {
    errors.push(`expected 15 courses but found ${courses.length}`);
  }

  return errors;
}
```

- [ ] **Step 7: Run tests**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/data/validateCourses.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit domain data**

```bash
git add src/data
git commit -m "コース定義と検証を追加"
```

## Task 3: Implement Pure Game State Transitions

**Files:**
- Create: `src/game/createGameState.ts`
- Create: `src/game/gameReducer.ts`
- Create: `src/game/selectors.ts`
- Create: `src/game/gameReducer.test.ts`

- [ ] **Step 1: Write reducer tests**

Create `src/game/gameReducer.test.ts`:

```ts
import { courses } from "../data/courses";
import { createGameState } from "./createGameState";
import { gameReducer } from "./gameReducer";

const course = courses[0];

describe("gameReducer", () => {
  it("places a piece into a gap and removes it from the tray", () => {
    const initial = createGameState(course);
    const pieceId = course.pieces[0].id;
    const gapId = course.gaps[0].id;

    const next = gameReducer(initial, { type: "placePiece", pieceId, gapId });

    expect(next.placements[gapId]).toBe(pieceId);
    expect(next.trayPieceIds).not.toContain(pieceId);
  });

  it("returns a placed piece to the tray", () => {
    const placed = gameReducer(createGameState(course), {
      type: "placePiece",
      pieceId: course.pieces[0].id,
      gapId: course.gaps[0].id,
    });

    const next = gameReducer(placed, { type: "returnPiece", gapId: course.gaps[0].id });

    expect(next.placements[course.gaps[0].id]).toBeUndefined();
    expect(next.trayPieceIds).toContain(course.pieces[0].id);
  });

  it("marks retry when train reaches an incorrect gap", () => {
    const initial = createGameState(course);
    const next = gameReducer(initial, {
      type: "advanceTrain",
      deltaDistance: course.gaps[0].arrivalDistance,
    });

    expect(next.status).toBe("retry");
  });

  it("marks cleared when all gaps are correct and the train reaches the goal", () => {
    const placed = gameReducer(createGameState(course), {
      type: "placePiece",
      pieceId: course.gaps[0].requiredPieceId,
      gapId: course.gaps[0].id,
    });

    const next = gameReducer(placed, { type: "advanceTrain", deltaDistance: 120 });

    expect(next.status).toBe("cleared");
  });
});
```

- [ ] **Step 2: Run the failing test**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/game/gameReducer.test.ts
```

Expected: FAIL because game modules do not exist.

- [ ] **Step 3: Add game state creation**

Create `src/game/createGameState.ts`:

```ts
import type { CourseDefinition } from "../data/types";

export type GameStatus = "playing" | "retry" | "cleared";

export interface GameState {
  readonly course: CourseDefinition;
  readonly trainDistance: number;
  readonly nextGapIndex: number;
  readonly trayPieceIds: readonly string[];
  readonly placements: Readonly<Record<string, string>>;
  readonly status: GameStatus;
}

/**
 * Creates a fresh runtime state without mutating the immutable course definition.
 */
export function createGameState(course: CourseDefinition): GameState {
  return {
    course,
    trainDistance: 0,
    nextGapIndex: 0,
    trayPieceIds: course.pieces.map((piece) => piece.id),
    placements: {},
    status: "playing",
  };
}
```

- [ ] **Step 4: Add reducer implementation**

Create `src/game/gameReducer.ts`:

```ts
import type { GameState } from "./createGameState";
import { createGameState } from "./createGameState";

export type GameAction =
  | { readonly type: "placePiece"; readonly pieceId: string; readonly gapId: string }
  | { readonly type: "returnPiece"; readonly gapId: string }
  | { readonly type: "advanceTrain"; readonly deltaDistance: number }
  | { readonly type: "retry" };

/**
 * Applies a single game action and returns a new immutable state.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status !== "playing" && action.type !== "retry") {
    return state;
  }

  switch (action.type) {
    case "placePiece": {
      const existingPieceId = state.placements[action.gapId];
      const trayPieceIds = state.trayPieceIds.filter((id) => id !== action.pieceId);
      const restoredTray = existingPieceId ? [...trayPieceIds, existingPieceId] : trayPieceIds;

      return {
        ...state,
        trayPieceIds: restoredTray,
        placements: { ...state.placements, [action.gapId]: action.pieceId },
      };
    }

    case "returnPiece": {
      const pieceId = state.placements[action.gapId];
      if (!pieceId) {
        return state;
      }
      const { [action.gapId]: _removed, ...placements } = state.placements;
      return {
        ...state,
        trayPieceIds: [...state.trayPieceIds, pieceId],
        placements,
      };
    }

    case "advanceTrain": {
      const trainDistance = state.trainDistance + action.deltaDistance;
      const nextGap = state.course.gaps[state.nextGapIndex];

      if (nextGap && trainDistance >= nextGap.arrivalDistance) {
        const placedPieceId = state.placements[nextGap.id];
        if (placedPieceId !== nextGap.requiredPieceId) {
          return { ...state, trainDistance, status: "retry" };
        }
        const nextGapIndex = state.nextGapIndex + 1;
        const status = nextGapIndex >= state.course.gaps.length && trainDistance >= 100 ? "cleared" : "playing";
        return { ...state, trainDistance, nextGapIndex, status };
      }

      return {
        ...state,
        trainDistance,
        status: trainDistance >= 100 ? "cleared" : "playing",
      };
    }

    case "retry":
      return createGameState(state.course);
  }
}
```

- [ ] **Step 5: Add selectors**

Create `src/game/selectors.ts`:

```ts
import type { CourseDefinition, TrainId } from "../data/types";
import type { GameState } from "./createGameState";

/**
 * Returns the next playable course number for a train based on cleared course ids.
 */
export function getUnlockedDifficulty(trainId: TrainId, clearedCourseIds: readonly string[]): number {
  let unlocked = 1;
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    if (clearedCourseIds.includes(`${trainId}-${difficulty}`)) {
      unlocked = Math.min(5, difficulty + 1);
    }
  }
  return unlocked;
}

/**
 * Returns the piece ids currently unavailable because they are placed in gaps.
 */
export function getPlacedPieceIds(state: GameState): readonly string[] {
  return Object.values(state.placements);
}

/**
 * Returns whether a course can be opened for the selected train.
 */
export function isCourseUnlocked(course: CourseDefinition, clearedCourseIds: readonly string[]): boolean {
  return course.difficulty <= getUnlockedDifficulty(course.trainId, clearedCourseIds);
}
```

- [ ] **Step 6: Run reducer tests**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/game/gameReducer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit pure game logic**

```bash
git add src/game
git commit -m "ゲーム状態の純粋ロジックを追加"
```

## Task 4: Add Progress Storage

**Files:**
- Create: `src/storage/progressStorage.ts`
- Create: `src/storage/progressStorage.test.ts`

- [ ] **Step 1: Write storage tests**

Create `src/storage/progressStorage.test.ts`:

```ts
import { loadProgress, saveProgress } from "./progressStorage";

describe("progressStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty progress when storage is empty", () => {
    expect(loadProgress()).toEqual({ clearedCourseIds: [] });
  });

  it("saves and loads cleared course ids", () => {
    saveProgress({ clearedCourseIds: ["sora-1"] });
    expect(loadProgress()).toEqual({ clearedCourseIds: ["sora-1"] });
  });

  it("falls back to empty progress when stored JSON is invalid", () => {
    localStorage.setItem("train-induction-progress", "{bad json");
    expect(loadProgress()).toEqual({ clearedCourseIds: [] });
  });
});
```

- [ ] **Step 2: Run the failing test**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/storage/progressStorage.test.ts
```

Expected: FAIL because storage module does not exist.

- [ ] **Step 3: Implement storage**

Create `src/storage/progressStorage.ts`:

```ts
export interface ProgressState {
  readonly clearedCourseIds: readonly string[];
}

const STORAGE_KEY = "train-induction-progress";
const emptyProgress: ProgressState = { clearedCourseIds: [] };

/**
 * Loads validated progress from localStorage and ignores corrupt values.
 */
export function loadProgress(): ProgressState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (!Array.isArray(parsed.clearedCourseIds)) {
      return emptyProgress;
    }
    return {
      clearedCourseIds: parsed.clearedCourseIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return emptyProgress;
  }
}

/**
 * Persists course clear progress to localStorage.
 */
export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
```

- [ ] **Step 4: Run storage tests**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/storage/progressStorage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit progress storage**

```bash
git add src/storage
git commit -m "進捗保存を追加"
```

## Task 5: Build Selection Screens and App Navigation

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/TrainSelect.tsx`
- Create: `src/components/CourseSelect.tsx`
- Create: `src/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write navigation tests**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App navigation", () => {
  it("starts with train selection and opens course selection", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));

    expect(screen.getByRole("heading", { name: /そらでんしゃ/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1ばんめのたび/ })).toBeEnabled();
  });
});
```

- [ ] **Step 2: Run the failing test**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/App.test.tsx
```

Expected: FAIL because real selection screens do not exist.

- [ ] **Step 3: Add train selection component**

Create `src/components/TrainSelect.tsx`:

```tsx
import type { TrainDefinition } from "../data/types";

interface TrainSelectProps {
  readonly trains: readonly TrainDefinition[];
  readonly onSelectTrain: (trainId: TrainDefinition["id"]) => void;
}

/**
 * Shows large child-friendly train cards.
 */
export function TrainSelect({ trains, onSelectTrain }: TrainSelectProps): JSX.Element {
  return (
    <section className="screen">
      <h1>レールをつなごう！</h1>
      <div className="card-grid" aria-label="でんしゃをえらぶ">
        {trains.map((train) => (
          <button
            className="train-card"
            key={train.id}
            style={{ "--train-color": train.color, "--train-accent": train.accentColor } as React.CSSProperties}
            onClick={() => onSelectTrain(train.id)}
          >
            <span className="train-emoji" aria-hidden="true">{train.emoji}</span>
            <span>{train.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add course selection component**

Create `src/components/CourseSelect.tsx`:

```tsx
import type { CourseDefinition, TrainDefinition } from "../data/types";
import { isCourseUnlocked } from "../game/selectors";

interface CourseSelectProps {
  readonly train: TrainDefinition;
  readonly courses: readonly CourseDefinition[];
  readonly clearedCourseIds: readonly string[];
  readonly onBack: () => void;
  readonly onSelectCourse: (course: CourseDefinition) => void;
}

/**
 * Lists five courses for a train with gentle locked-state wording.
 */
export function CourseSelect({
  train,
  courses,
  clearedCourseIds,
  onBack,
  onSelectCourse,
}: CourseSelectProps): JSX.Element {
  return (
    <section className="screen">
      <button className="text-button" onClick={onBack}>でんしゃをえらぶ</button>
      <h1>{train.name}</h1>
      <div className="course-list">
        {courses.map((course) => {
          const unlocked = isCourseUnlocked(course, clearedCourseIds);
          return (
            <button
              key={course.id}
              className="course-button"
              disabled={!unlocked}
              onClick={() => onSelectCourse(course)}
            >
              <span>{course.title}</span>
              <small>{unlocked ? `むずかしさ ${course.difficulty}` : "つぎのおたのしみ"}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire App navigation**

Replace `src/App.tsx`:

```tsx
import { useMemo, useState } from "react";
import { CourseSelect } from "./components/CourseSelect";
import { TrainSelect } from "./components/TrainSelect";
import { courses } from "./data/courses";
import { trains } from "./data/trains";
import type { CourseDefinition, TrainId } from "./data/types";
import { loadProgress } from "./storage/progressStorage";

type Screen =
  | { readonly name: "trainSelect" }
  | { readonly name: "courseSelect"; readonly trainId: TrainId }
  | { readonly name: "game"; readonly course: CourseDefinition };

/**
 * Coordinates top-level game screens and persisted progress.
 */
export default function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: "trainSelect" });
  const [progress] = useState(() => loadProgress());

  const selectedTrain = screen.name === "courseSelect"
    ? trains.find((train) => train.id === screen.trainId)
    : undefined;

  const selectedCourses = useMemo(
    () => (selectedTrain ? courses.filter((course) => course.trainId === selectedTrain.id) : []),
    [selectedTrain],
  );

  if (screen.name === "trainSelect") {
    return <TrainSelect trains={trains} onSelectTrain={(trainId) => setScreen({ name: "courseSelect", trainId })} />;
  }

  if (screen.name === "courseSelect" && selectedTrain) {
    return (
      <CourseSelect
        train={selectedTrain}
        courses={selectedCourses}
        clearedCourseIds={progress.clearedCourseIds}
        onBack={() => setScreen({ name: "trainSelect" })}
        onSelectCourse={(course) => setScreen({ name: "game", course })}
      />
    );
  }

  return <main className="screen"><h1>{screen.course.title}</h1></main>;
}
```

- [ ] **Step 6: Add selection styles**

Append to `src/styles.css`:

```css
.screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}

.card-grid,
.course-list {
  width: min(100%, 760px);
  display: grid;
  gap: 14px;
}

.card-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.train-card,
.course-button,
.text-button {
  border: 0;
  border-radius: 18px;
  min-height: 72px;
  padding: 18px;
  cursor: pointer;
}

.train-card {
  background: var(--train-color);
  color: #123;
  box-shadow: inset 0 -8px 0 color-mix(in srgb, var(--train-accent), #fff 45%);
  font-size: 1.35rem;
  font-weight: 800;
}

.train-emoji {
  display: block;
  font-size: 4rem;
}

.course-button {
  background: #fff8d7;
  color: #234;
  font-size: 1.2rem;
  font-weight: 800;
}

.course-button small {
  display: block;
  margin-top: 6px;
}

.course-button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.text-button {
  align-self: flex-start;
  background: #fff;
  color: #245;
}
```

- [ ] **Step 7: Run navigation test**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit selection screens**

```bash
git add src/App.tsx src/App.test.tsx src/components src/styles.css
git commit -m "電車選択とコース選択を追加"
```

## Task 6: Build Main Game Screen and Piece Interaction

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/GameScreen.tsx`
- Create: `src/components/RailPiece.tsx`
- Create: `src/components/ResultOverlay.tsx`
- Create: `src/components/GameScreen.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write game screen interaction test**

Create `src/components/GameScreen.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { courses } from "../data/courses";
import { GameScreen } from "./GameScreen";

describe("GameScreen", () => {
  it("places a selected tray piece into a gap", async () => {
    render(<GameScreen course={courses[0]} onClear={() => undefined} onExit={() => undefined} />);

    await userEvent.click(screen.getByRole("button", { name: /まっすぐ/ }));
    await userEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    expect(screen.getByRole("button", { name: /あな 1.*まっすぐ/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing test**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/components/GameScreen.test.tsx
```

Expected: FAIL because `GameScreen` does not exist.

- [ ] **Step 3: Add rail piece component**

Create `src/components/RailPiece.tsx`:

```tsx
import type { PieceDefinition } from "../data/types";

interface RailPieceProps {
  readonly piece: PieceDefinition;
}

/**
 * Renders a simple SVG rail piece that can be reused in tray and gap slots.
 */
export function RailPiece({ piece }: RailPieceProps): JSX.Element {
  const curve = piece.shape === "curve";
  return (
    <svg className="rail-piece" viewBox="0 0 80 80" aria-hidden="true">
      <rect x="6" y="6" width="68" height="68" rx="14" fill="#fff9dc" />
      {curve ? (
        <path d="M18 58 C18 30 38 18 62 18" fill="none" stroke="#66513d" strokeWidth="12" strokeLinecap="round" />
      ) : (
        <path d="M14 40 H66" fill="none" stroke="#66513d" strokeWidth="12" strokeLinecap="round" />
      )}
      <path d="M18 30 H62 M18 50 H62" stroke="#f2d27a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 4: Add game screen component**

Create `src/components/GameScreen.tsx`:

```tsx
import { useEffect, useMemo, useReducer, useState } from "react";
import type { CourseDefinition } from "../data/types";
import { createGameState } from "../game/createGameState";
import { gameReducer } from "../game/gameReducer";
import { RailPiece } from "./RailPiece";
import { ResultOverlay } from "./ResultOverlay";

interface GameScreenProps {
  readonly course: CourseDefinition;
  readonly onClear: (course: CourseDefinition) => void;
  readonly onExit: () => void;
}

/**
 * Hosts the active course, rail placement controls, train movement, and result overlay.
 */
export function GameScreen({ course, onClear, onExit }: GameScreenProps): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, course, createGameState);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const piecesById = useMemo(() => new Map(course.pieces.map((piece) => [piece.id, piece])), [course]);

  useEffect(() => {
    if (state.status !== "playing") {
      return undefined;
    }
    const id = window.setInterval(() => {
      dispatch({ type: "advanceTrain", deltaDistance: course.trainSpeed * 8 });
    }, 120);
    return () => window.clearInterval(id);
  }, [course.trainSpeed, state.status]);

  useEffect(() => {
    if (state.status === "cleared") {
      onClear(course);
    }
  }, [course, onClear, state.status]);

  return (
    <section className={`game-screen background-${course.background}`}>
      <header className="game-header">
        <button className="text-button" onClick={onExit}>コースをえらぶ</button>
        <h1>{course.title}</h1>
      </header>

      <div className="track-board" aria-label="せんろ">
        <div className="train-token" style={{ left: `${Math.min(90, 5 + state.trainDistance * 0.85)}%` }} aria-label="でんしゃ">
          🚃
        </div>
        {course.gaps.map((gap, index) => {
          const placedPieceId = state.placements[gap.id];
          const placedPiece = placedPieceId ? piecesById.get(placedPieceId) : undefined;
          return (
            <button
              className="gap-slot"
              key={gap.id}
              style={{ left: `${gap.position.x}%`, top: `${gap.position.y}%` }}
              aria-label={`あな ${index + 1}${placedPiece ? ` ${placedPiece.label}` : ""}`}
              onClick={() => {
                if (selectedPieceId) {
                  dispatch({ type: "placePiece", pieceId: selectedPieceId, gapId: gap.id });
                  setSelectedPieceId(null);
                } else if (placedPieceId) {
                  dispatch({ type: "returnPiece", gapId: gap.id });
                }
              }}
            >
              {placedPiece ? <RailPiece piece={placedPiece} /> : <span>?</span>}
            </button>
          );
        })}
      </div>

      <div className="piece-tray" aria-label="レールピース">
        {state.trayPieceIds.map((pieceId) => {
          const piece = piecesById.get(pieceId);
          if (!piece) {
            return null;
          }
          return (
            <button
              key={piece.id}
              className={selectedPieceId === piece.id ? "piece-button selected" : "piece-button"}
              aria-label={piece.label}
              onClick={() => setSelectedPieceId(piece.id)}
            >
              <RailPiece piece={piece} />
              <span>{piece.label}</span>
            </button>
          );
        })}
      </div>

      {state.status !== "playing" ? (
        <ResultOverlay
          status={state.status}
          retryMode={course.retryMode}
          onRetry={() => dispatch({ type: "retry" })}
          onExit={onExit}
        />
      ) : null}
    </section>
  );
}
```

- [ ] **Step 5: Add result overlay**

Create `src/components/ResultOverlay.tsx`:

```tsx
import type { RetryMode } from "../data/types";

interface ResultOverlayProps {
  readonly status: "retry" | "cleared";
  readonly retryMode: RetryMode;
  readonly onRetry: () => void;
  readonly onExit: () => void;
}

/**
 * Shows clear or retry choices with gentle language.
 */
export function ResultOverlay({ status, retryMode, onRetry, onExit }: ResultOverlayProps): JSX.Element {
  const retryText = retryMode === "checkpoint" ? "ここからもういっかい！" : "さいしょからもういっかい！";
  return (
    <div className="result-overlay" role="dialog" aria-modal="true">
      <h2>{status === "cleared" ? "えきについたよ！" : retryText}</h2>
      <div className="result-actions">
        <button onClick={onRetry}>もういちど</button>
        <button onClick={onExit}>でんしゃをえらぶ</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Wire GameScreen into App and save progress on clear**

Modify `src/App.tsx` so the game branch renders `GameScreen` and progress can update:

```tsx
import { useMemo, useState } from "react";
import { CourseSelect } from "./components/CourseSelect";
import { GameScreen } from "./components/GameScreen";
import { TrainSelect } from "./components/TrainSelect";
import { courses } from "./data/courses";
import { trains } from "./data/trains";
import type { CourseDefinition, TrainId } from "./data/types";
import { loadProgress, saveProgress } from "./storage/progressStorage";

type Screen =
  | { readonly name: "trainSelect" }
  | { readonly name: "courseSelect"; readonly trainId: TrainId }
  | { readonly name: "game"; readonly trainId: TrainId; readonly course: CourseDefinition };

/**
 * Coordinates top-level game screens and persisted progress.
 */
export default function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: "trainSelect" });
  const [progress, setProgress] = useState(() => loadProgress());

  const selectedTrainId = screen.name === "courseSelect" || screen.name === "game" ? screen.trainId : undefined;
  const selectedTrain = selectedTrainId ? trains.find((train) => train.id === selectedTrainId) : undefined;
  const selectedCourses = useMemo(
    () => (selectedTrain ? courses.filter((course) => course.trainId === selectedTrain.id) : []),
    [selectedTrain],
  );

  const handleClear = (course: CourseDefinition): void => {
    setProgress((current) => {
      const clearedCourseIds = Array.from(new Set([...current.clearedCourseIds, course.id]));
      const next = { clearedCourseIds };
      saveProgress(next);
      return next;
    });
  };

  if (screen.name === "trainSelect") {
    return <TrainSelect trains={trains} onSelectTrain={(trainId) => setScreen({ name: "courseSelect", trainId })} />;
  }

  if (screen.name === "courseSelect" && selectedTrain) {
    return (
      <CourseSelect
        train={selectedTrain}
        courses={selectedCourses}
        clearedCourseIds={progress.clearedCourseIds}
        onBack={() => setScreen({ name: "trainSelect" })}
        onSelectCourse={(course) => setScreen({ name: "game", trainId: selectedTrain.id, course })}
      />
    );
  }

  if (screen.name === "game") {
    return (
      <GameScreen
        course={screen.course}
        onClear={handleClear}
        onExit={() => setScreen({ name: "courseSelect", trainId: screen.trainId })}
      />
    );
  }

  return <TrainSelect trains={trains} onSelectTrain={(trainId) => setScreen({ name: "courseSelect", trainId })} />;
}
```

- [ ] **Step 7: Add game styles**

Append to `src/styles.css`:

```css
.game-screen {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto minmax(300px, 1fr) auto;
  gap: 12px;
  padding: 14px;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.track-board {
  position: relative;
  min-height: 360px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(#c9f2ff, #e8ffd9);
  border: 4px solid #fff;
}

.background-forest .track-board { background: linear-gradient(#c9f2ff, #c9f0c8); }
.background-rainbow .track-board { background: linear-gradient(135deg, #c9f2ff, #ffe1f3, #fff4b8); }
.background-river .track-board { background: linear-gradient(#c9f2ff, #b8ecff); }
.background-night .track-board { background: linear-gradient(#29385f, #6c7fc5); }

.train-token {
  position: absolute;
  top: 44%;
  transform: translate(-50%, -50%);
  font-size: clamp(2.5rem, 9vw, 5rem);
  transition: left 120ms linear;
}

.gap-slot {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(70px, 18vw, 112px);
  aspect-ratio: 1;
  border: 4px dashed #53758a;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  font-size: 2rem;
  display: grid;
  place-items: center;
}

.piece-tray {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 10px;
  padding: 12px;
  border-radius: 22px;
  background: #fff7d6;
}

.piece-button {
  min-height: 104px;
  border: 4px solid transparent;
  border-radius: 18px;
  background: #fff;
  font-weight: 800;
}

.piece-button.selected {
  border-color: #ff8b3d;
}

.rail-piece {
  width: 72px;
  max-width: 100%;
}

.result-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 18px;
  background: rgba(255, 255, 255, 0.82);
  text-align: center;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.result-actions button {
  min-height: 64px;
  border: 0;
  border-radius: 18px;
  padding: 12px 22px;
  background: #ffe66d;
  font-weight: 800;
}
```

- [ ] **Step 8: Run component tests**

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test -- src/components/GameScreen.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit game screen**

```bash
git add src/App.tsx src/components src/styles.css
git commit -m "ゲーム画面とピース操作を追加"
```

## Task 7: Add Visual Polish, Generated Asset Decision, and Responsive QA

**Files:**
- Modify: `src/styles.css`
- Create: `tests/e2e/basic-flow.spec.ts`
- Create: `playwright.config.ts`
- Optional create after approval: `src/assets/generated/README.md`

- [ ] **Step 1: Decide whether to generate bitmap assets**

If the current SVG/CSS look is too plain after Task 6, use the `imagegen` skill to create child-friendly assets:

```text
Generate three transparent-background picture-book style train sprites for a 3-year-old children's rail puzzle game. Make them distinct: sky blue train, forest green train, rainbow pink train. Rounded shapes, friendly, no text, no scary faces, simple readable silhouettes.
```

Save approved assets under `src/assets/generated/` and document the prompt in `src/assets/generated/README.md`:

```md
# Generated Assets

These assets are generated for the picture-book style train induction game.

Prompt:
Generate three transparent-background picture-book style train sprites for a 3-year-old children's rail puzzle game. Make them distinct: sky blue train, forest green train, rainbow pink train. Rounded shapes, friendly, no text, no scary faces, simple readable silhouettes.
```

- [ ] **Step 2: Add Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173/trainInduction/",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:4173/trainInduction/",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "tablet", use: { ...devices["iPad Mini"] } },
  ],
});
```

- [ ] **Step 3: Add e2e smoke test**

Create `tests/e2e/basic-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("player can open first train and first course", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /そらでんしゃ/ }).click();
  await page.getByRole("button", { name: /1ばんめのたび/ }).click();

  await expect(page.getByRole("heading", { name: /1ばんめのたび/ })).toBeVisible();
  await expect(page.getByLabel("レールピース")).toBeVisible();
  await expect(page.getByLabel("せんろ")).toBeVisible();
});
```

- [ ] **Step 4: Install Playwright browsers inside Docker**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npx playwright install --with-deps chromium
```

Expected: Chromium browser dependencies install inside the container context. If this fails due to Docker image permissions, record the error and switch to `mcr.microsoft.com/playwright:v1.54.0-noble` for e2e commands.

- [ ] **Step 5: Run e2e in Docker**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.54.0-noble npm run test:e2e
```

Expected: mobile and tablet projects pass.

- [ ] **Step 6: Commit visual QA setup**

```bash
git add playwright.config.ts tests/e2e src/styles.css src/assets
git commit -m "表示確認とアセット方針を追加"
```

## Task 8: Add CI, README, and Final Verification

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Modify: `package.json` if scripts need correction

- [ ] **Step 1: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
```

- [ ] **Step 2: Add README**

Create `README.md`:

```md
# レールをつなごう！

3歳児向けの電車誘導ブラウザゲームです。欠けた線路に正しいレールピースを置き、自動で走る電車をゴール駅まで導きます。

## 技術構成

- React
- TypeScript
- Vite
- Vitest
- Playwright
- GitHub Pages 向け静的ビルド

## ローカル開発

ホスト環境を汚さないため、Node.js の実行は Docker コンテナ内で行います。

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm install
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run dev
```

## 検証

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run build
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.54.0-noble npm run test:e2e
```

## 操作

1. 電車を選びます。
2. 解放済みのコースを選びます。
3. 下のレールピースを選び、穴になっている線路へ置きます。
4. 電車が正しい線路を通るとゴールへ進みます。
5. クリアすると次のコースが解放されます。
```

- [ ] **Step 3: Run full verification**

Run:

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run build
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.54.0-noble npm run test:e2e
```

Expected: build, unit tests, and e2e tests pass.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intended files are modified or untracked.

- [ ] **Step 5: Commit docs and CI**

```bash
git add .github/workflows/ci.yml README.md package.json
git commit -m "検証とREADMEを追加"
```

## Self-Review

- Spec coverage: Tasks cover static GitHub Pages app, 3 trains, 15 courses, course unlocks, automatic train movement, missing rail pieces, use-once pieces, retry, clear, progress storage, responsive QA, and optional generated assets.
- Placeholder scan: The plan contains no incomplete-marker wording and no intentionally vague implementation steps.
- Type consistency: `TrainDefinition`, `CourseDefinition`, `GapDefinition`, `PieceDefinition`, `ProgressState`, `GameState`, and reducer action names are introduced before later tasks use them.
- Scope check: This is one coherent static game implementation. Online accounts, server persistence, ranking, random generation, payment, and multiplayer remain out of scope.
