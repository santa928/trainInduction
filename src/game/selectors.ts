import type { CourseDefinition, TrainId } from "../data/types";
import type { GameState } from "./createGameState";

/**
 * Returns the next playable course number for a train based on cleared course ids.
 */
export function getUnlockedDifficulty(trainId: TrainId, clearedCourseIds: readonly string[]): number {
  let unlocked = 1;
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    if (!clearedCourseIds.includes(`${trainId}-${difficulty}`)) {
      break;
    }
    unlocked = Math.min(5, difficulty + 1);
  }
  return unlocked;
}

/**
 * Returns the piece ids currently unavailable because they are placed in gaps.
 */
export function getPlacedPieceIds(state: GameState): readonly string[] {
  return Object.values(state.placements);
}

/**
 * Returns whether a course can be opened for the selected train.
 */
export function isCourseUnlocked(course: CourseDefinition, clearedCourseIds: readonly string[]): boolean {
  return course.difficulty <= getUnlockedDifficulty(course.trainId, clearedCourseIds);
}
