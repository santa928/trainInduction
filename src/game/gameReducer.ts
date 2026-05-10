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
      const pieceExists = state.course.pieces.some((piece) => piece.id === action.pieceId);
      const gapExists = state.course.gaps.some((gap) => gap.id === action.gapId);
      if (!pieceExists || !gapExists) {
        return state;
      }

      const existingPieceId = state.placements[action.gapId];
      if (existingPieceId === action.pieceId) {
        return state;
      }

      const sourceGapId = Object.entries(state.placements).find(([, pieceId]) => pieceId === action.pieceId)?.[0];
      const pieceIsInTray = state.trayPieceIds.includes(action.pieceId);
      if (!pieceIsInTray && !sourceGapId) {
        return state;
      }

      const placements = { ...state.placements };
      if (sourceGapId) {
        delete placements[sourceGapId];
      }
      placements[action.gapId] = action.pieceId;

      const trayPieceIds = new Set(state.trayPieceIds);
      trayPieceIds.delete(action.pieceId);
      if (existingPieceId) {
        trayPieceIds.add(existingPieceId);
      }

      return {
        ...state,
        trayPieceIds: [...trayPieceIds],
        placements,
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
      let nextGapIndex = state.nextGapIndex;

      while (nextGapIndex < state.course.gaps.length) {
        const nextGap = state.course.gaps[nextGapIndex];
        if (trainDistance < nextGap.arrivalDistance) {
          break;
        }
        const placedPieceId = state.placements[nextGap.id];
        if (placedPieceId !== nextGap.requiredPieceId) {
          return { ...state, trainDistance, nextGapIndex, status: "retry" };
        }
        nextGapIndex += 1;
      }

      return {
        ...state,
        trainDistance,
        nextGapIndex,
        status: nextGapIndex >= state.course.gaps.length && trainDistance >= 100 ? "cleared" : "playing",
      };
    }

    case "retry":
      return createGameState(state.course);
  }
}
