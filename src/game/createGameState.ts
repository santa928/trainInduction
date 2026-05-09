import type { CourseDefinition } from "../data/types";

export type GameStatus = "playing" | "retry" | "cleared";

export interface GameState {
  readonly course: CourseDefinition;
  readonly trainDistance: number;
  readonly nextGapIndex: number;
  readonly trayPieceIds: readonly string[];
  readonly placements: Readonly<Record<string, string>>;
  readonly status: GameStatus;
}

/**
 * Creates a fresh runtime state without mutating the immutable course definition.
 */
export function createGameState(course: CourseDefinition): GameState {
  return {
    course,
    trainDistance: 0,
    nextGapIndex: 0,
    trayPieceIds: course.pieces.map((piece) => piece.id),
    placements: {},
    status: "playing",
  };
}
