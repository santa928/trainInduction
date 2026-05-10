import type { GameState } from "./createGameState";
import { createGameState } from "./createGameState";

export type GameAction =
  | { readonly type: "placePiece"; readonly pieceId: string; readonly gapId: string }
  | { readonly type: "returnPiece"; readonly gapId: string }
  | { readonly type: "advanceTrain"; readonly deltaDistance: number }
  | { readonly type: "retry" };

/**
 * Applies a single game action and returns a new immutable state.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status !== "playing" && action.type !== "retry") {
    return state;
  }

  switch (action.type) {
    case "placePiece": {
      const existingPieceId = state.placements[action.gapId];
      const trayPieceIds = state.trayPieceIds.filter((id) => id !== action.pieceId);
      const restoredTray = existingPieceId ? [...trayPieceIds, existingPieceId] : trayPieceIds;

      return {
        ...state,
        trayPieceIds: restoredTray,
        placements: { ...state.placements, [action.gapId]: action.pieceId },
      };
    }

    case "returnPiece": {
      const pieceId = state.placements[action.gapId];
      if (!pieceId) {
        return state;
      }
      const { [action.gapId]: _removed, ...placements } = state.placements;
      return {
        ...state,
        trayPieceIds: [...state.trayPieceIds, pieceId],
        placements,
      };
    }

    case "advanceTrain": {
      const trainDistance = state.trainDistance + action.deltaDistance;
      const nextGap = state.course.gaps[state.nextGapIndex];

      if (nextGap && trainDistance >= nextGap.arrivalDistance) {
        const placedPieceId = state.placements[nextGap.id];
        if (placedPieceId !== nextGap.requiredPieceId) {
          return { ...state, trainDistance, status: "retry" };
        }
        const nextGapIndex = state.nextGapIndex + 1;
        const status = nextGapIndex >= state.course.gaps.length && trainDistance >= 100 ? "cleared" : "playing";
        return { ...state, trainDistance, nextGapIndex, status };
      }

      return {
        ...state,
        trainDistance,
        status: state.nextGapIndex >= state.course.gaps.length && trainDistance >= 100 ? "cleared" : "playing",
      };
    }

    case "retry":
      return createGameState(state.course);
  }
}
