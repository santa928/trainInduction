import type { GameState } from "./createGameState";
import { createGameState } from "./createGameState";
import type { PieceDefinition } from "../data/types";

export type GameAction =
  | { readonly type: "placePiece"; readonly pieceId: string; readonly gapId: string }
  | { readonly type: "returnPiece"; readonly gapId: string }
  | { readonly type: "advanceTrain"; readonly deltaDistance: number }
  | { readonly type: "retry" };

/**
 * Rewinds a checkpoint course to just before the failed gap while keeping earlier correct work.
 */
function createCheckpointRetryState(state: GameState): GameState {
  const failedGap = state.course.gaps[state.nextGapIndex];
  if (!failedGap) {
    return createGameState(state.course);
  }

  const previousGap = state.course.gaps[state.nextGapIndex - 1];
  const checkpointDistance = Math.max(
    previousGap ? previousGap.arrivalDistance + 1 : 0,
    failedGap.arrivalDistance - 25,
  );
  const failedPieceId = state.placements[failedGap.id];
  const { [failedGap.id]: _removed, ...placements } = state.placements;
  const trayPieceIds =
    failedPieceId && !state.trayPieceIds.includes(failedPieceId)
      ? [...state.trayPieceIds, failedPieceId]
      : state.trayPieceIds;

  return {
    ...state,
    trainDistance: checkpointDistance,
    trayPieceIds,
    placements,
    status: "playing",
  };
}

/**
 * Treats identical-looking rail cards as interchangeable answers.
 */
function isMatchingRailPiece(placedPiece: PieceDefinition | undefined, requiredPiece: PieceDefinition | undefined): boolean {
  return Boolean(
    placedPiece &&
      requiredPiece &&
      placedPiece.shape === requiredPiece.shape &&
      placedPiece.direction === requiredPiece.direction,
  );
}

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
        const placedPiece = state.course.pieces.find((piece) => piece.id === placedPieceId);
        const requiredPiece = state.course.pieces.find((piece) => piece.id === nextGap.requiredPieceId);
        if (!isMatchingRailPiece(placedPiece, requiredPiece)) {
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
      if (state.status === "retry" && state.course.retryMode === "checkpoint") {
        return createCheckpointRetryState(state);
      }
      return createGameState(state.course);
  }
}
