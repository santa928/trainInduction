export interface ProgressState {
  readonly clearedCourseIds: readonly string[];
}

const STORAGE_KEY = "train-induction-progress";

function createEmptyProgress(): ProgressState {
  return { clearedCourseIds: [] };
}

/**
 * Loads validated progress from localStorage and ignores corrupt values.
 */
export function loadProgress(): ProgressState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyProgress();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (!Array.isArray(parsed.clearedCourseIds)) {
      return createEmptyProgress();
    }
    return {
      clearedCourseIds: parsed.clearedCourseIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return createEmptyProgress();
  }
}

/**
 * Persists course clear progress to localStorage.
 */
export function saveProgress(progress: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage failures so progress persistence never interrupts gameplay.
  }
}
