import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CourseDefinition, GapDefinition } from "../data/types";
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

interface GapSlotLayout {
  readonly leftPercent: number;
  readonly topPercent: number;
}

/**
 * Creates display-only gap positions with enough mobile spacing for large touch slots.
 */
export function createGapSlotLayouts(gaps: readonly GapDefinition[]): readonly GapSlotLayout[] {
  if (gaps.length <= 1) {
    return gaps.map((gap) => ({ leftPercent: gap.position.x, topPercent: gap.position.y }));
  }

  const firstX = gaps.length === 2 ? 30 : gaps.length === 3 ? 22 : 20;
  const lastX = gaps.length === 2 ? 70 : gaps.length === 3 ? 78 : 80;
  const step = (lastX - firstX) / (gaps.length - 1);

  return gaps.map((_, index) => ({
    leftPercent: firstX + step * index,
    topPercent: index % 2 === 0 ? 38 : 62,
  }));
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
  const gapSlotLayouts = useMemo(() => createGapSlotLayouts(course.gaps), [course.gaps]);
  const trainPosition = 10 + Math.min(state.trainDistance, 100) * 0.8;

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
        <div className="track-line" aria-hidden="true" />
        <div className="train-token" style={{ left: `${trainPosition}%` }} aria-hidden="true">
          🚃
        </div>
        {course.gaps.map((gap, index) => {
          const placedPiece = state.placements[gap.id] ? piecesById.get(state.placements[gap.id]) : undefined;
          const layout = gapSlotLayouts[index] ?? { leftPercent: gap.position.x, topPercent: gap.position.y };
          return (
            <button
              key={gap.id}
              className="gap-slot"
              style={{ left: `${layout.leftPercent}%`, top: `${layout.topPercent}%` }}
              aria-label={`あな ${index + 1}${placedPiece ? ` ${placedPiece.label}` : ""}`}
              onClick={() => handleGapClick(gap.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleGapDrop(gap.id)}
            >
              {placedPiece ? (
                <>
                  <RailPiece shape={placedPiece.shape} />
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
              <RailPiece shape={piece.shape} />
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
