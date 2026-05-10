import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CourseDefinition, RailPoint } from "../data/types";
import { createGameState } from "../game/createGameState";
import { gameReducer } from "../game/gameReducer";
import { RailPiece } from "./RailPiece";
import { ResultOverlay } from "./ResultOverlay";

interface GameScreenProps {
  readonly course: CourseDefinition;
  readonly onClear: (course: CourseDefinition) => void;
  readonly onExit: () => void;
  readonly onTrainSelect: () => void;
  readonly onNext?: () => void;
}

/**
 * Finds a top-down map point along the authored course route.
 */
export function getRoutePoint(path: readonly RailPoint[], distancePercent: number): RailPoint {
  if (path.length === 0) {
    return { x: 0, y: 0 };
  }
  if (path.length === 1) {
    return path[0];
  }

  const segmentLengths = path.slice(1).map((point, index) => {
    const previous = path[index];
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const routeLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  let remainingLength = (Math.max(0, Math.min(distancePercent, 100)) / 100) * routeLength;

  for (const [index, segmentLength] of segmentLengths.entries()) {
    if (remainingLength > segmentLength) {
      remainingLength -= segmentLength;
      continue;
    }
    const start = path[index];
    const end = path[index + 1];
    const ratio = segmentLength === 0 ? 0 : remainingLength / segmentLength;
    return {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
    };
  }

  return path[path.length - 1];
}

/**
 * Renders the main rail board, tray selection, and train progression loop.
 */
export function GameScreen({ course, onClear, onExit, onTrainSelect, onNext }: GameScreenProps): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, course, createGameState);
  const [selectedPieceId, setSelectedPieceId] = useState<string | undefined>();
  const [draggedPieceId, setDraggedPieceId] = useState<string | undefined>();
  const clearNotifiedRef = useRef(false);

  const piecesById = useMemo(
    () => new Map(course.pieces.map((piece) => [piece.id, piece] as const)),
    [course.pieces],
  );
  const routePoints = useMemo(() => course.path.map((point) => `${point.x},${point.y}`).join(" "), [course.path]);
  const trainPosition = getRoutePoint(course.path, state.trainDistance);

  useEffect(() => {
    if (state.status !== "playing") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: "advanceTrain", deltaDistance: course.trainSpeed * 100 });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [course.trainSpeed, state.status]);

  useEffect(() => {
    if (state.status !== "cleared" || clearNotifiedRef.current) {
      return;
    }
    clearNotifiedRef.current = true;
    onClear(course);
  }, [course, onClear, state.status]);

  const handleSelectPiece = (pieceId: string): void => {
    setSelectedPieceId((currentPieceId) => (currentPieceId === pieceId ? undefined : pieceId));
  };

  const handleGapClick = (gapId: string): void => {
    if (selectedPieceId) {
      dispatch({ type: "placePiece", pieceId: selectedPieceId, gapId });
      setSelectedPieceId(undefined);
      return;
    }
    dispatch({ type: "returnPiece", gapId });
  };

  const handleGapDrop = (gapId: string): void => {
    if (!draggedPieceId) {
      return;
    }
    dispatch({ type: "placePiece", pieceId: draggedPieceId, gapId });
    setDraggedPieceId(undefined);
    setSelectedPieceId(undefined);
  };

  const handleRetry = (): void => {
    clearNotifiedRef.current = false;
    setSelectedPieceId(undefined);
    setDraggedPieceId(undefined);
    dispatch({ type: "retry" });
  };

  return (
    <main className="game-screen">
      <header className="game-header">
        <button autoFocus className="text-button game-exit-button" onClick={onExit}>
          コースをえらぶ
        </button>
        <h1>{course.title}</h1>
      </header>

      <section className={`track-board track-board-${course.background}`} aria-label="せんろ">
        <svg className="track-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline className="track-route track-route-shadow" points={routePoints} />
          <polyline className="track-route track-route-base" points={routePoints} />
          <polyline className="track-route track-route-rail" points={routePoints} />
        </svg>
        <div className="station-token station-token-start" aria-hidden="true">
          はじまり
        </div>
        <div className="station-token station-token-goal" aria-hidden="true">
          ゴール
        </div>
        <div
          className="train-token"
          style={{ left: `${trainPosition.x}%`, top: `${trainPosition.y}%` }}
          aria-hidden="true"
        >
          🚃
        </div>
        {course.gaps.map((gap, index) => {
          const placedPiece = state.placements[gap.id] ? piecesById.get(state.placements[gap.id]) : undefined;
          return (
            <button
              key={gap.id}
              className="gap-slot"
              style={{ left: `${gap.position.x}%`, top: `${gap.position.y}%` }}
              aria-label={`あな ${index + 1}${placedPiece ? ` ${placedPiece.label}` : ""}`}
              onClick={() => handleGapClick(gap.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleGapDrop(gap.id)}
            >
              {placedPiece ? (
                <>
                  <RailPiece shape={placedPiece.shape} direction={placedPiece.direction} />
                  <span>{placedPiece.label}</span>
                </>
              ) : (
                <span>あな {index + 1}</span>
              )}
            </button>
          );
        })}
      </section>

      <section className="piece-tray" aria-label="レールピース">
        {state.trayPieceIds.map((pieceId) => {
          const piece = piecesById.get(pieceId);
          if (!piece) {
            return null;
          }
          return (
            <button
              key={piece.id}
              className={`piece-button${selectedPieceId === piece.id ? " selected" : ""}`}
              aria-pressed={selectedPieceId === piece.id}
              draggable
              onClick={() => handleSelectPiece(piece.id)}
              onDragStart={() => setDraggedPieceId(piece.id)}
              onDragEnd={() => setDraggedPieceId(undefined)}
            >
              <RailPiece shape={piece.shape} direction={piece.direction} />
              <span>{piece.label}</span>
            </button>
          );
        })}
      </section>

      {state.status === "retry" || state.status === "cleared" ? (
        <ResultOverlay
          status={state.status}
          retryMode={course.retryMode}
          onRetry={handleRetry}
          onExit={onExit}
          onTrainSelect={onTrainSelect}
          onNext={state.status === "cleared" ? onNext : undefined}
        />
      ) : null}
    </main>
  );
}
