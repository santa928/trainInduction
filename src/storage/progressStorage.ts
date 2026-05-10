export interface ProgressState {
  readonly clearedCourseIds: readonly string[];
}

const STORAGE_KEY = "train-induction-progress";
const emptyProgress: ProgressState = { clearedCourseIds: [] };

/**
 * Loads validated progress from localStorage and ignores corrupt values.
 */
export function loadProgress(): ProgressState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (!Array.isArray(parsed.clearedCourseIds)) {
      return emptyProgress;
    }
    return {
      clearedCourseIds: parsed.clearedCourseIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return emptyProgress;
  }
}

/**
 * Persists course clear progress to localStorage.
 */
export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
