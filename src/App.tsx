import { useEffect, useMemo, useRef, useState } from "react";
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

interface GamePlaceholderProps {
  readonly course: CourseDefinition;
}

/**
 * Temporarily renders the selected course until Task 6 replaces it with GameScreen.
 */
function GamePlaceholder({ course }: GamePlaceholderProps): React.JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="screen">
      <h1 ref={headingRef} tabIndex={-1}>
        {course.title}
      </h1>
    </main>
  );
}

/**
 * Coordinates top-level game screens and persisted progress.
 */
export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: "trainSelect" });
  const [progress] = useState(() => loadProgress());

  const selectedTrain =
    screen.name === "courseSelect" ? trains.find((train) => train.id === screen.trainId) : undefined;

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

  if (screen.name === "game") {
    return <GamePlaceholder course={screen.course} />;
  }

  return <TrainSelect trains={trains} onSelectTrain={(trainId) => setScreen({ name: "courseSelect", trainId })} />;
}
