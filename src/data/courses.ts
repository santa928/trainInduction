import type {
  CourseDefinition,
  CourseId,
  Difficulty,
  GapDefinition,
  PieceDefinition,
  RetryMode,
  TrainId,
} from "./types";

const path = [
  { x: 8, y: 50 },
  { x: 28, y: 50 },
  { x: 48, y: 50 },
  { x: 68, y: 50 },
  { x: 92, y: 50 },
] as const;

const retryMode = (difficulty: Difficulty): RetryMode =>
  difficulty <= 2 ? "checkpoint" : "courseStart";

const makeCourse = (
  trainId: TrainId,
  difficulty: Difficulty,
  background: CourseDefinition["background"],
): CourseDefinition => {
  const id = `${trainId}-${difficulty}` as CourseId;
  const gapCount = difficulty === 1 ? 1 : difficulty === 2 ? 2 : difficulty === 5 ? 4 : 3;
  const candidateCount = difficulty <= 2 ? 2 : difficulty === 3 ? 3 : 4;
  const pieces = Array.from(
    { length: candidateCount },
    (_, index): PieceDefinition => ({
      id: `${id}-piece-${index + 1}`,
      shape: index % 2 === 0 ? "straight" : "curve",
      direction: index % 2 === 0 ? "east" : index % 3 === 0 ? "southEast" : "northEast",
      label: index % 2 === 0 ? "まっすぐ" : "くるん",
    }),
  );

  const gaps = Array.from(
    { length: gapCount },
    (_, index): GapDefinition => ({
      id: `${id}-gap-${index + 1}`,
      position: { x: 24 + index * 16, y: index % 2 === 0 ? 50 : 42 },
      requiredPieceId: pieces[index % pieces.length].id,
      arrivalDistance: 32 + index * 18,
    }),
  );

  return {
    id,
    trainId,
    title: `${difficulty}ばんめのたび`,
    difficulty,
    background,
    trainSpeed: 0.006 + difficulty * 0.002,
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
