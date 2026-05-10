import type { CourseDefinition, TrainDefinition } from "./types";

const expectedCourseIdentity = (
  id: CourseDefinition["id"],
): { difficulty: number; trainId: string } => {
  const [trainId, difficulty] = id.split("-");

  return {
    trainId,
    difficulty: Number(difficulty),
  };
};

const pieceSignature = (piece: { readonly shape: string; readonly direction: string }): string =>
  `${piece.shape}:${piece.direction}`;

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
    const expected = expectedCourseIdentity(course.id);
    if (course.trainId !== expected.trainId || course.difficulty !== expected.difficulty) {
      errors.push(
        `course ${course.id} id expects train ${expected.trainId} difficulty ${expected.difficulty} but found train ${course.trainId} difficulty ${course.difficulty}`,
      );
    }

    if (!trainIds.has(course.trainId)) {
      errors.push(`course ${course.id} references unknown train ${course.trainId}`);
    }

    if (courseIds.has(course.id)) {
      errors.push(`duplicate course id ${course.id}`);
    }
    courseIds.add(course.id);

    const pieceIds = new Set(course.pieces.map((piece) => piece.id));
    const pieceCounts = new Map<string, number>();
    for (const piece of course.pieces) {
      const signature = pieceSignature(piece);
      pieceCounts.set(signature, (pieceCounts.get(signature) ?? 0) + 1);
    }

    for (const gap of course.gaps) {
      if (!pieceIds.has(gap.requiredPieceId)) {
        errors.push(`course ${course.id} gap ${gap.id} requires unknown piece ${gap.requiredPieceId}`);
      }
    }

    const pathCells = new Set<string>();
    for (const [index, point] of course.path.entries()) {
      if (point.x < 1 || point.x > course.grid.columns || point.y < 1 || point.y > course.grid.rows) {
        errors.push(`course ${course.id} path point ${index + 1} is outside the grid`);
      }
      pathCells.add(`${point.x}:${point.y}`);

      const nextPoint = course.path[index + 1];
      if (nextPoint && Math.abs(nextPoint.x - point.x) + Math.abs(nextPoint.y - point.y) !== 1) {
        errors.push(`course ${course.id} path point ${index + 1} is not adjacent to the next point`);
      }
    }

    for (const gap of course.gaps) {
      if (!pathCells.has(`${gap.position.x}:${gap.position.y}`)) {
        errors.push(`course ${course.id} gap ${gap.id} is not on the route`);
      }
    }

    const requiredCounts = new Map<string, number>();
    for (const gap of course.gaps) {
      const requiredPiece = course.pieces.find((piece) => piece.id === gap.requiredPieceId);
      if (requiredPiece) {
        const signature = pieceSignature(requiredPiece);
        requiredCounts.set(signature, (requiredCounts.get(signature) ?? 0) + 1);
      }
    }
    for (const [signature, requiredCount] of requiredCounts) {
      const availableCount = pieceCounts.get(signature) ?? 0;
      if (availableCount < requiredCount) {
        errors.push(
          `course ${course.id} needs ${requiredCount} ${signature} pieces but only has ${availableCount}`,
        );
      }
    }

    const sorted = [...course.gaps].sort((a, b) => a.arrivalDistance - b.arrivalDistance);
    if (sorted.some((gap, index) => gap.id !== course.gaps[index]?.id)) {
      errors.push(`course ${course.id} gaps must be ordered by arrivalDistance`);
    }

    const firstGap = course.gaps[0];
    const firstGapPathIndex = firstGap
      ? course.path.findIndex((point) => point.x === firstGap.position.x && point.y === firstGap.position.y)
      : -1;
    if (firstGap && firstGapPathIndex <= 1) {
      errors.push(`course ${course.id} first gap is too close to the start`);
    }
  }

  if (courses.length !== 15) {
    errors.push(`expected 15 courses but found ${courses.length}`);
  }

  return errors;
}
