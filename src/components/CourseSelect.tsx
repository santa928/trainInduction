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
}: CourseSelectProps): React.JSX.Element {
  return (
    <section className="screen">
      <button autoFocus className="text-button" onClick={onBack}>
        でんしゃをえらぶ
      </button>
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
