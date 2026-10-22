import { stages, trains } from "./stages";
export const PROGRESS_KEY = "train-induction-progress-v2";
export interface Journey {
  version: 2;
  clearedStageIds: string[];
  unlockedThrough: number;
  trainId: string;
  sound: boolean;
}
type StorageAccess = Pick<Storage, "getItem" | "setItem">;
const empty = (): Journey => ({
  version: 2,
  clearedStageIds: [],
  unlockedThrough: 1,
  trainId: "sora",
  sound: true,
});
const stageNumber = (id: unknown): number =>
  stages.find((s) => s.id === id)?.number ?? 0;

export function loadJourney(storage?: StorageAccess): Journey {
  const initial = empty();
  try {
    const store = storage ?? window.localStorage;
    let legacyReach = 0;
    try {
      const legacy = JSON.parse(
        store.getItem("train-induction-progress") ?? "null",
      );
      if (Array.isArray(legacy?.clearedCourseIds))
        for (const id of legacy.clearedCourseIds) {
          if (typeof id !== "string") continue;
          const match = /^(sora|mori|niji)-([1-5])$/.exec(id);
          if (match) legacyReach = Math.max(legacyReach, Number(match[2]));
        }
    } catch {
      /* A damaged legacy record does not invalidate the new record. */
    }
    const migrated = [1, 3, 5, 8, 10, 12][legacyReach];
    let saved;
    try {
      saved = JSON.parse(store.getItem(PROGRESS_KEY) ?? "null");
    } catch {
      /* Use preserved legacy reach. */
    }
    if (saved?.version !== 2) return { ...initial, unlockedThrough: migrated };
    const clearedStageIds = Array.isArray(saved.clearedStageIds)
      ? [
          ...new Set<string>(
            saved.clearedStageIds.filter((id: unknown) => stageNumber(id) > 0),
          ),
        ]
      : [];
    return {
      version: 2,
      clearedStageIds,
      unlockedThrough: Math.min(
        12,
        Math.max(
          migrated,
          Number.isInteger(saved.unlockedThrough) ? saved.unlockedThrough : 1,
          ...clearedStageIds.map((id) => stageNumber(id) + 1),
        ),
      ),
      trainId: trains.some((t) => t.id === saved.trainId)
        ? saved.trainId
        : "sora",
      sound: typeof saved.sound === "boolean" ? saved.sound : true,
    };
  } catch {
    return initial;
  }
}
export function saveJourney(progress: Journey, storage?: StorageAccess): void {
  try {
    (storage ?? window.localStorage).setItem(
      PROGRESS_KEY,
      JSON.stringify(progress),
    );
  } catch {
    /* Private mode/quota must not interrupt play. */
  }
}
export function completeJourney(progress: Journey, id: string): Journey {
  const number = stageNumber(id);
  if (!number) return progress;
  return {
    ...progress,
    clearedStageIds: [...new Set([...progress.clearedStageIds, id])],
    unlockedThrough: Math.min(
      12,
      Math.max(progress.unlockedThrough, number + 1),
    ),
  };
}
