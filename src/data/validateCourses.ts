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
