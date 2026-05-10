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
    const pieceSignatures = new Set<string>();
    for (const piece of course.pieces) {
      const signature = `${piece.shape}:${piece.direction}`;
      if (pieceSignatures.has(signature)) {
        errors.push(`course ${course.id} has duplicate-looking piece ${signature}`);
      }
      pieceSignatures.add(signature);
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

    const requiredPieceIds = new Set<string>();
    for (const gap of course.gaps) {
      if (requiredPieceIds.has(gap.requiredPieceId)) {
        errors.push(`course ${course.id} uses piece ${gap.requiredPieceId} for multiple gaps`);
      }
      requiredPieceIds.add(gap.requiredPieceId);
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
