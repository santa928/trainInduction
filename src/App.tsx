import { useCallback, useMemo, useState } from "react";
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
export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: "trainSelect" });
  const [progress, setProgress] = useState(() => loadProgress());

  const handleClear = useCallback((course: CourseDefinition): void => {
    setProgress((currentProgress) => {
      const clearedCourseIds = new Set(currentProgress.clearedCourseIds);
      clearedCourseIds.add(course.id);
      const nextProgress = { clearedCourseIds: [...clearedCourseIds] };
      saveProgress(nextProgress);
      return nextProgress;
    });
  }, []);

  const selectedTrain =
    screen.name === "courseSelect" ? trains.find((train) => train.id === screen.trainId) : undefined;

  const selectedCourses = useMemo(
    () => (selectedTrain ? courses.filter((course) => course.trainId === selectedTrain.id) : []),
    [selectedTrain],
  );

  const findNextCourse = (course: CourseDefinition): CourseDefinition | undefined =>
    courses.find((candidate) => candidate.trainId === course.trainId && candidate.difficulty === course.difficulty + 1);

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
    const nextCourse = findNextCourse(screen.course);
    return (
      <GameScreen
        key={screen.course.id}
        course={screen.course}
        onClear={handleClear}
        onExit={() => setScreen({ name: "courseSelect", trainId: screen.trainId })}
        onTrainSelect={() => setScreen({ name: "trainSelect" })}
        onNext={nextCourse ? () => setScreen({ name: "game", trainId: screen.trainId, course: nextCourse }) : undefined}
      />
    );
  }

  return <TrainSelect trains={trains} onSelectTrain={(trainId) => setScreen({ name: "courseSelect", trainId })} />;
}
