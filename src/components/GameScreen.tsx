import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CourseDefinition, RailPoint } from "../data/types";
import { getPathTile } from "../data/courses";
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

const cellKey = (point: RailPoint): string => `${point.x}:${point.y}`;

const cellToPercent = (point: RailPoint, course: CourseDefinition): RailPoint => ({
  x: ((point.x - 0.5) / course.grid.columns) * 100,
  y: ((point.y - 0.5) / course.grid.rows) * 100,
});

const range = (size: number): readonly number[] => Array.from({ length: size }, (_, index) => index + 1);

/**
 * Renders the main rail board, tray selection, and train progression loop.
 */
export function GameScreen({ course, onClear, onExit, onTrainSelect, onNext }: GameScreenProps): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, course, createGameState);
  const [selectedPieceId, setSelectedPieceId] = useState<string | undefined>();
  const [draggedPieceId, setDraggedPieceId] = useState<string | undefined>();
  const [restartPaused, setRestartPaused] = useState(true);
  const clearNotifiedRef = useRef(false);

  const piecesById = useMemo(
    () => new Map(course.pieces.map((piece) => [piece.id, piece] as const)),
    [course.pieces],
  );
  const gapByCell = useMemo(() => new Map(course.gaps.map((gap, index) => [cellKey(gap.position), { gap, index }])), [course.gaps]);
  const routeTileByCell = useMemo(
    () => new Map(course.path.map((point, index) => [cellKey(point), getPathTile(course, index)] as const)),
    [course],
  );
  const startCell = course.path[0];
  const goalCell = course.path[course.path.length - 1];
  const trainPosition = cellToPercent(getRoutePoint(course.path, state.trainDistance), course);
  const remainingGaps = Math.max(0, course.gaps.length - state.nextGapIndex);
  const gameEnded = state.status !== "playing";
  const canPlacePieces = !gameEnded && remainingGaps > 0;
  const instruction = remainingGaps === 0
    ? "えきまで いこう！"
    : selectedPieceId
      ? "あなをタップしてね"
      : Object.keys(state.placements).length === course.gaps.length
        ? "えきまで いこう！"
        : "レールをえらんでね";

  useEffect(() => {
    if (state.status !== "playing" || restartPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: "advanceTrain", deltaDistance: course.trainSpeed * 100 });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [course.trainSpeed, restartPaused, state.status]);

  useEffect(() => {
    if (!restartPaused) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setRestartPaused(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [restartPaused]);

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
    setRestartPaused(true);
    dispatch({ type: "retry" });
  };

  return (
    <main className="game-screen">
      <header className="game-header" aria-label="コースじょうほう" inert={gameEnded}>
        <button autoFocus className="icon-button game-exit-button" aria-label="コースをえらぶ" onClick={onExit}>
          ←
        </button>
        <div className="game-title-cluster">
          <span>コース</span>
          <h1>{course.title}</h1>
        </div>
        <div className="course-stars" aria-label={`むずかしさ ${course.difficulty}`}>
          {range(5).map((star) => (
            <span key={star} className={star <= course.difficulty ? "active" : ""} aria-hidden="true">
              ★
            </span>
          ))}
        </div>
      </header>

      <div className="game-guidance" inert={gameEnded}>
        <div className="status-chip" aria-live="polite">
          <span aria-hidden="true">★</span>
          <strong>えきまで あと{remainingGaps}かしょ</strong>
        </div>
        <p className="play-instruction" aria-live="polite">{instruction}</p>
      </div>

      <section
        className={`track-board track-board-${course.background}`}
        style={{ "--columns": course.grid.columns, "--rows": course.grid.rows } as CSSProperties}
        aria-label="せんろ"
        inert={gameEnded}
      >
        <div className="track-surface">
        <div className="track-grid" aria-hidden="true">
          {range(course.grid.rows).flatMap((row) =>
            range(course.grid.columns).map((column) => {
              const point = { x: column, y: row };
              const key = cellKey(point);
              const routeTile = routeTileByCell.get(key);
              const gapInfo = gapByCell.get(key);
              const isStart = startCell && cellKey(startCell) === key;
              const isGoal = goalCell && cellKey(goalCell) === key;
              return (
                <div
                  key={key}
                  className={`track-cell${routeTile ? " track-cell-route" : ""}${gapInfo ? " track-cell-gap" : ""}`}
                  style={{ gridColumn: column, gridRow: row }}
                >
                  {routeTile && !gapInfo ? <RailPiece shape={routeTile.shape} direction={routeTile.direction} /> : null}
                  {isStart ? <span className="station-badge">はじまり</span> : null}
                  {isGoal ? <span className="station-badge">ゴール</span> : null}
                </div>
              );
            }),
          )}
        </div>
        <div
          className="train-token"
          style={{ left: `${trainPosition.x}%`, top: `${trainPosition.y}%` }}
          aria-hidden="true"
        >
          <span className={`train-token-sprite train-art train-art-${course.trainId}`} />
        </div>
        {course.gaps.map((gap, index) => {
          const placedPiece = state.placements[gap.id] ? piecesById.get(state.placements[gap.id]) : undefined;
          return (
            <button
              key={gap.id}
              className={`gap-slot${placedPiece ? " gap-slot-filled" : ""}`}
              style={{ gridColumn: gap.position.x, gridRow: gap.position.y }}
              aria-label={`あな ${index + 1}${placedPiece ? ` ${placedPiece.label}` : ""}`}
              disabled={index < state.nextGapIndex}
              onClick={() => handleGapClick(gap.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleGapDrop(gap.id)}
            >
              {placedPiece ? (
                <>
                  <RailPiece shape={placedPiece.shape} direction={placedPiece.direction} />
                  <span className="gap-slot-label">{placedPiece.label}</span>
                </>
              ) : (
                <span>あな {index + 1}</span>
              )}
            </button>
          );
        })}
        </div>
      </section>

      <section
        className="piece-tray"
        aria-label="レールピース"
        inert={gameEnded}
        style={{ "--tray-columns": course.pieces.length, "--compact-columns": Math.min(3, course.pieces.length) } as CSSProperties}
      >
        {course.pieces.map((piece) => {
          const isPlaced = !state.trayPieceIds.includes(piece.id);
          if (isPlaced) {
            return (
              <div key={piece.id} className="piece-placeholder" aria-label={`${piece.label} おいたよ`}>
                <span aria-hidden="true">✓</span>
                <span>おいたよ</span>
              </div>
            );
          }
          return (
            <button
              key={piece.id}
              className={`piece-button${canPlacePieces && selectedPieceId === piece.id ? " selected" : ""}`}
              aria-pressed={canPlacePieces && selectedPieceId === piece.id}
              disabled={!canPlacePieces}
              draggable={canPlacePieces}
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
