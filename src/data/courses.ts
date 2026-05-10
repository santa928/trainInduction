import type {
  CourseDefinition,
  CourseId,
  Difficulty,
  GapDefinition,
  PieceDefinition,
  RailDirection,
  RailPoint,
  RailShape,
  RetryMode,
  TrainId,
} from "./types";

interface PieceTemplate {
  readonly shape: RailShape;
  readonly direction: RailDirection;
  readonly label: string;
}

interface GapTemplate extends PieceTemplate {
  readonly position: RailPoint;
  readonly arrivalDistance: number;
}

interface CourseTemplate {
  readonly path: readonly RailPoint[];
  readonly gaps: readonly GapTemplate[];
  readonly distractors: readonly PieceTemplate[];
}

const retryMode = (difficulty: Difficulty): RetryMode => (difficulty <= 2 ? "checkpoint" : "courseStart");

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

const rail = (shape: RailShape, direction: RailDirection): PieceTemplate => ({
  shape,
  direction,
  label: pieceLabel(shape, direction),
});

const gap = (
  position: RailPoint,
  arrivalDistance: number,
  shape: RailShape,
  direction: RailDirection,
): GapTemplate => ({
  ...rail(shape, direction),
  position,
  arrivalDistance,
});

const templates: Record<Difficulty, CourseTemplate> = {
  1: {
    path: [
      { x: 8, y: 58 },
      { x: 44, y: 58 },
      { x: 92, y: 58 },
    ],
    gaps: [gap({ x: 48, y: 58 }, 34, "straight", "east")],
    distractors: [rail("curve", "northEast")],
  },
  2: {
    path: [
      { x: 8, y: 66 },
      { x: 34, y: 66 },
      { x: 34, y: 36 },
      { x: 92, y: 36 },
    ],
    gaps: [gap({ x: 34, y: 66 }, 28, "curve", "northWest"), gap({ x: 62, y: 36 }, 66, "straight", "east")],
    distractors: [rail("straight", "north")],
  },
  3: {
    path: [
      { x: 8, y: 72 },
      { x: 32, y: 72 },
      { x: 32, y: 42 },
      { x: 58, y: 42 },
      { x: 58, y: 70 },
      { x: 92, y: 70 },
    ],
    gaps: [
      gap({ x: 32, y: 72 }, 24, "curve", "northWest"),
      gap({ x: 32, y: 42 }, 48, "curve", "southEast"),
      gap({ x: 58, y: 42 }, 68, "curve", "southWest"),
    ],
    distractors: [rail("straight", "east")],
  },
  4: {
    path: [
      { x: 8, y: 76 },
      { x: 26, y: 76 },
      { x: 26, y: 48 },
      { x: 52, y: 48 },
      { x: 52, y: 72 },
      { x: 78, y: 72 },
      { x: 78, y: 36 },
      { x: 92, y: 36 },
    ],
    gaps: [
      gap({ x: 26, y: 76 }, 20, "curve", "northWest"),
      gap({ x: 26, y: 48 }, 42, "curve", "southEast"),
      gap({ x: 52, y: 48 }, 60, "curve", "southWest"),
    ],
    distractors: [rail("straight", "north")],
  },
  5: {
    path: [
      { x: 8, y: 70 },
      { x: 24, y: 70 },
      { x: 24, y: 42 },
      { x: 48, y: 42 },
      { x: 48, y: 70 },
      { x: 72, y: 70 },
      { x: 72, y: 34 },
      { x: 92, y: 34 },
    ],
    gaps: [
      gap({ x: 24, y: 70 }, 18, "curve", "northWest"),
      gap({ x: 24, y: 42 }, 42, "curve", "southEast"),
      gap({ x: 48, y: 42 }, 58, "curve", "southWest"),
      gap({ x: 48, y: 70 }, 74, "curve", "northEast"),
    ],
    distractors: [],
  },
};

const makePieces = (id: CourseId, template: CourseTemplate): readonly PieceDefinition[] =>
  [...template.gaps, ...template.distractors].map((piece, index) => ({
    id: `${id}-piece-${index + 1}`,
    shape: piece.shape,
    direction: piece.direction,
    label: piece.label,
  }));

const makeGaps = (id: CourseId, template: CourseTemplate, pieces: readonly PieceDefinition[]): readonly GapDefinition[] =>
  template.gaps.map((gapTemplate, index) => ({
    id: `${id}-gap-${index + 1}`,
    position: gapTemplate.position,
    requiredPieceId: pieces[index].id,
    arrivalDistance: gapTemplate.arrivalDistance,
  }));

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
