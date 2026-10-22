export type Direction = "N" | "E" | "S" | "W";
export type Rail = "EW" | "NS" | "NE" | "ES" | "SW" | "WN";
export interface Point {
  x: number;
  z: number;
}
export interface Piece {
  id: string;
  rail: Rail;
}
export interface Gap {
  id: string;
  pathIndex: number;
}
export interface Stage {
  id: string;
  number: number;
  title: string;
  theme: "meadow" | "river" | "sunset";
  chapter: number;
  path: Point[];
  gaps: Gap[];
  pieces: Piece[];
  speed: number;
}
export const ends: Record<Rail, readonly [Direction, Direction]> = {
  EW: ["W", "E"],
  NS: ["N", "S"],
  NE: ["N", "E"],
  ES: ["E", "S"],
  SW: ["S", "W"],
  WN: ["W", "N"],
};
export const vectors: Record<Direction, Point> = {
  N: { x: 0, z: -1 },
  E: { x: 1, z: 0 },
  S: { x: 0, z: 1 },
  W: { x: -1, z: 0 },
};
export const railNames: Record<Rail, string> = {
  EW: "よこ",
  NS: "たて",
  NE: "みぎうえ",
  ES: "みぎした",
  SW: "ひだりした",
  WN: "ひだりうえ",
};
const opposite: Record<Direction, Direction> = {
  N: "S",
  E: "W",
  S: "N",
  W: "E",
};
function direction(from: Point, to: Point): Direction {
  return to.x > from.x ? "E" : to.x < from.x ? "W" : to.z > from.z ? "S" : "N";
}
export function railAt(stage: Pick<Stage, "path">, index: number): Rail {
  const p = stage.path[index];
  const previous = stage.path[index - 1];
  const next = stage.path[index + 1];
  const entry = previous
    ? direction(p, previous)
    : opposite[direction(p, next)];
  const exit = next ? direction(p, next) : opposite[entry];
  return (Object.keys(ends) as Rail[]).find(
    (r) => ends[r].includes(entry) && ends[r].includes(exit),
  )!;
}

export interface RouteTile {
  index: number;
  entry: Direction;
  exit: Direction;
  start: number;
  end: number;
  length: number;
}
const routeCache = new WeakMap<Stage, RouteTile[]>();
export function routeTiles(stage: Stage): RouteTile[] {
  const cached = routeCache.get(stage);
  if (cached) return cached;
  let distance = 0;
  const tiles = stage.path.map((p, index) => {
    const entry = index
      ? direction(p, stage.path[index - 1])
      : opposite[direction(p, stage.path[1])];
    const exit =
      index < stage.path.length - 1
        ? direction(p, stage.path[index + 1])
        : opposite[entry];
    const length =
      index === 0 || index === stage.path.length - 1
        ? 0.5
        : opposite[entry] === exit
          ? 1
          : Math.PI / 4;
    const tile = {
      index,
      entry,
      exit,
      start: distance,
      end: distance + length,
      length,
    };
    distance += length;
    return tile;
  });
  routeCache.set(stage, tiles);
  return tiles;
}

/** A single rail's centerline. Shared by geometry, thumbnails and train motion. */
export function sampleRail(
  entry: Direction,
  exit: Direction,
  t: number,
): Point & { dx: number; dz: number } {
  const a = vectors[entry],
    b = vectors[exit];
  if (opposite[entry] === exit)
    return {
      x: a.x * 0.5 + (b.x - a.x) * t * 0.5,
      z: a.z * 0.5 + (b.z - a.z) * t * 0.5,
      dx: b.x,
      dz: b.z,
    };
  const angle = (t * Math.PI) / 2;
  return {
    x: (a.x + b.x - b.x * Math.cos(angle) - a.x * Math.sin(angle)) * 0.5,
    z: (a.z + b.z - b.z * Math.cos(angle) - a.z * Math.sin(angle)) * 0.5,
    dx: b.x * Math.sin(angle) - a.x * Math.cos(angle),
    dz: b.z * Math.sin(angle) - a.z * Math.cos(angle),
  };
}
export function sampleRoute(
  stage: Stage,
  distance: number,
): Point & { dx: number; dz: number } {
  const tiles = routeTiles(stage);
  const d = Math.max(0, Math.min(distance, tiles.at(-1)!.end));
  const tile = tiles.find((t) => d <= t.end) ?? tiles.at(-1)!;
  const local = (d - tile.start) / tile.length;
  const t =
    tile.index === 0
      ? 0.5 + local * 0.5
      : tile.index === tiles.length - 1
        ? local * 0.5
        : local;
  const point = sampleRail(tile.entry, tile.exit, t);
  return {
    ...point,
    x: stage.path[tile.index].x + point.x,
    z: stage.path[tile.index].z + point.z,
  };
}

// Includes the bumper width projected during a preceding curve; verified against the 3D meshes.
export const STOP_MARGIN = 0.65;
export interface Run {
  stage: Stage;
  seed: number;
  order: string[];
  placements: Record<string, string>;
  distance: number;
  preparation: number;
  status: "ready" | "running" | "failed" | "cleared";
  nextGap: number;
  paused: boolean;
  failedGap: string | null;
}
export type Action =
  | { type: "place"; gapId: string; pieceId: string }
  | { type: "return"; gapId: string }
  | { type: "tick"; seconds: number }
  | { type: "retry" }
  | { type: "pause" }
  | { type: "resume" };

export function createRun(stage: Stage, seed: number): Run {
  const order = stage.pieces.map((p) => p.id);
  let value = (seed >>> 0) + 0x6d2b79f5;
  for (let i = order.length - 1; i > 0; i--) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((value / 4294967296) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    stage,
    seed,
    order,
    placements: {},
    distance: 0,
    preparation: 3,
    status: "ready",
    nextGap: 0,
    paused: false,
    failedGap: null,
  };
}
export function editableGap(run: Run, gapId: string): boolean {
  return (
    !run.paused &&
    (run.status === "ready" || run.status === "running") &&
    run.stage.gaps.findIndex((g) => g.id === gapId) >= run.nextGap
  );
}
export function reduceRun(run: Run, action: Action): Run {
  if (action.type === "retry")
    return run.status === "failed" || run.status === "cleared"
      ? createRun(run.stage, run.seed)
      : run;
  if (action.type === "pause")
    return !run.paused && (run.status === "ready" || run.status === "running")
      ? { ...run, paused: true }
      : run;
  if (action.type === "resume")
    return run.paused ? { ...run, paused: false } : run;
  if (run.paused || run.status === "failed" || run.status === "cleared")
    return run;
  if (action.type === "place") {
    if (
      !editableGap(run, action.gapId) ||
      !run.stage.pieces.some((p) => p.id === action.pieceId)
    )
      return run;
    const source = Object.keys(run.placements).find(
      (g) => run.placements[g] === action.pieceId,
    );
    if (source && !editableGap(run, source)) return run;
    const placements = { ...run.placements };
    if (source) delete placements[source];
    placements[action.gapId] = action.pieceId;
    return { ...run, placements };
  }
  if (action.type === "return") {
    if (!editableGap(run, action.gapId) || !run.placements[action.gapId])
      return run;
    const placements = { ...run.placements };
    delete placements[action.gapId];
    return { ...run, placements };
  }
  if (!Number.isFinite(action.seconds) || action.seconds <= 0) return run;
  const preparation = Math.max(0, run.preparation - action.seconds);
  const seconds = Math.max(0, action.seconds - run.preparation);
  if (preparation > 0) return { ...run, preparation };
  const tiles = routeTiles(run.stage);
  const total = tiles.at(-1)!.end;
  const slowdown = run.distance > total - 1 ? 0.65 : 1;
  const distance = Math.min(
    total,
    run.distance + seconds * run.stage.speed * slowdown,
  );
  let nextGap = run.nextGap;
  while (nextGap < run.stage.gaps.length) {
    const gap = run.stage.gaps[nextGap];
    const boundary = tiles[gap.pathIndex].start - STOP_MARGIN;
    if (distance < boundary) break;
    const piece = run.stage.pieces.find((p) => p.id === run.placements[gap.id]);
    if (!piece || piece.rail !== railAt(run.stage, gap.pathIndex))
      return {
        ...run,
        preparation: 0,
        distance: boundary,
        nextGap,
        status: "failed",
        failedGap: gap.id,
      };
    nextGap++;
  }
  return {
    ...run,
    preparation: 0,
    distance,
    nextGap,
    status: distance >= total ? "cleared" : "running",
  };
}

/** Finds a finite-piece assignment by rail connectivity, never by answer IDs. */
export function solveStage(stage: Stage): [string, string][] {
  const available = [...stage.pieces];
  return stage.gaps.map((gap) => {
    const index = available.findIndex(
      (piece) => piece.rail === railAt(stage, gap.pathIndex),
    );
    if (index < 0) throw new Error(`Unsolvable stage ${stage.id}: ${gap.id}`);
    return [gap.id, available.splice(index, 1)[0].id];
  });
}
