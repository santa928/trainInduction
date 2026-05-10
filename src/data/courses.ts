import type {
  CourseDefinition,
  CourseId,
  Difficulty,
  GapDefinition,
  PieceDefinition,
  RailDirection,
  RailGrid,
  RailPoint,
  RailShape,
  RetryMode,
  TrainId,
} from "./types";

interface PieceTemplate {
  readonly shape: RailShape;
  readonly direction: RailDirection;
}

interface CourseTemplate {
  readonly grid: RailGrid;
  readonly path: readonly RailPoint[];
  readonly gapIndexes: readonly number[];
  readonly distractors: readonly PieceTemplate[];
}

const retryMode = (difficulty: Difficulty): RetryMode => (difficulty <= 2 ? "checkpoint" : "courseStart");

const point = (x: number, y: number): RailPoint => ({ x, y });

const signature = (piece: PieceTemplate): string => `${piece.shape}:${piece.direction}`;

const pieceLabel = (shape: RailShape, direction: RailDirection): string => {
  if (shape === "straight" || shape === "bridge") {
    return direction === "north" || direction === "south" ? "たて" : shape === "bridge" ? "はし" : "よこ";
  }

  const labels: Record<RailDirection, string> = {
    east: "よこ",
    west: "よこ",
    north: "たて",
    south: "たて",
    northEast: "みぎうえ",
    southEast: "みぎした",
    southWest: "ひだりした",
    northWest: "ひだりうえ",
  };
  return labels[direction];
};

const rail = (shape: RailShape, direction: RailDirection): PieceTemplate => ({ shape, direction });

const directionBetween = (from: RailPoint, to: RailPoint): "north" | "east" | "south" | "west" => {
  if (to.x > from.x) {
    return "east";
  }
  if (to.x < from.x) {
    return "west";
  }
  if (to.y > from.y) {
    return "south";
  }
  return "north";
};

const tileForPathIndex = (path: readonly RailPoint[], index: number): PieceTemplate => {
  const current = path[index];
  const previous = path[index - 1];
  const next = path[index + 1];
  const directions = [previous ? directionBetween(current, previous) : undefined, next ? directionBetween(current, next) : undefined].filter(
    (direction): direction is "north" | "east" | "south" | "west" => Boolean(direction),
  );

  if (directions.length === 1) {
    return rail("straight", directions[0] === "north" || directions[0] === "south" ? "north" : "east");
  }

  const [first, second] = directions;
  if ((first === "east" && second === "west") || (first === "west" && second === "east")) {
    return rail("straight", "east");
  }
  if ((first === "north" && second === "south") || (first === "south" && second === "north")) {
    return rail("straight", "north");
  }

  const key = new Set(directions);
  if (key.has("north") && key.has("east")) {
    return rail("curve", "northEast");
  }
  if (key.has("east") && key.has("south")) {
    return rail("curve", "southEast");
  }
  if (key.has("south") && key.has("west")) {
    return rail("curve", "southWest");
  }
  return rail("curve", "northWest");
};

export const getPathTile = (course: CourseDefinition, pathIndex: number): PieceTemplate =>
  tileForPathIndex(course.path, pathIndex);

const gapArrivalDistance = (pathLength: number, index: number): number =>
  Math.round((index / Math.max(1, pathLength - 1)) * 100);

const templates: Record<Difficulty, CourseTemplate> = {
  1: {
    grid: { columns: 5, rows: 5 },
    path: [point(1, 3), point(2, 3), point(3, 3), point(4, 3), point(5, 3)],
    gapIndexes: [2],
    distractors: [rail("curve", "northEast")],
  },
  2: {
    grid: { columns: 5, rows: 5 },
    path: [point(1, 4), point(2, 4), point(2, 3), point(2, 2), point(3, 2), point(4, 2), point(5, 2)],
    gapIndexes: [2, 4],
    distractors: [rail("straight", "north")],
  },
  3: {
    grid: { columns: 5, rows: 5 },
    path: [point(1, 5), point(2, 5), point(2, 4), point(3, 4), point(4, 4), point(4, 3), point(4, 2), point(5, 2)],
    gapIndexes: [2, 4, 5],
    distractors: [rail("curve", "southWest")],
  },
  4: {
    grid: { columns: 6, rows: 5 },
    path: [
      point(1, 5),
      point(2, 5),
      point(2, 4),
      point(2, 3),
      point(3, 3),
      point(4, 3),
      point(4, 2),
      point(5, 2),
      point(6, 2),
    ],
    gapIndexes: [2, 4, 6],
    distractors: [rail("straight", "north")],
  },
  5: {
    grid: { columns: 6, rows: 6 },
    path: [
      point(1, 6),
      point(2, 6),
      point(2, 5),
      point(3, 5),
      point(4, 5),
      point(4, 4),
      point(4, 3),
      point(5, 3),
      point(5, 2),
      point(6, 2),
    ],
    gapIndexes: [2, 3, 4, 5],
    distractors: [],
  },
};

const makePieces = (id: CourseId, template: CourseTemplate): readonly PieceDefinition[] => {
  const requiredPieces = template.gapIndexes.map((index) => tileForPathIndex(template.path, index));
  const allPieces = [...requiredPieces, ...template.distractors];
  const seen = new Set<string>();

  return allPieces
    .filter((piece) => {
      const key = signature(piece);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((piece, index) => ({
      id: `${id}-piece-${index + 1}`,
      shape: piece.shape,
      direction: piece.direction,
      label: pieceLabel(piece.shape, piece.direction),
    }));
};

const makeGaps = (id: CourseId, template: CourseTemplate, pieces: readonly PieceDefinition[]): readonly GapDefinition[] =>
  template.gapIndexes.map((pathIndex, gapIndex) => {
    const required = tileForPathIndex(template.path, pathIndex);
    const requiredPiece = pieces.find((piece) => signature(piece) === signature(required));
    if (!requiredPiece) {
      throw new Error(`missing required piece for ${id} gap ${gapIndex + 1}`);
    }

    return {
      id: `${id}-gap-${gapIndex + 1}`,
      position: template.path[pathIndex],
      requiredPieceId: requiredPiece.id,
      arrivalDistance: gapArrivalDistance(template.path.length, pathIndex),
    };
  });

const makeCourse = (
  trainId: TrainId,
  difficulty: Difficulty,
  background: CourseDefinition["background"],
): CourseDefinition => {
  const id = `${trainId}-${difficulty}` as CourseId;
  const template = templates[difficulty];
  const pieces = makePieces(id, template);

  return {
    id,
    trainId,
    title: `${difficulty}ばんめのたび`,
    difficulty,
    background,
    grid: template.grid,
    trainSpeed: 0.006 + difficulty * 0.002,
    retryMode: retryMode(difficulty),
    path: template.path,
    pieces,
    gaps: makeGaps(id, template, pieces),
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
