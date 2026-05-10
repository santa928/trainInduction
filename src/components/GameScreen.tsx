import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CourseDefinition } from "../data/types";
import { createGameState } from "../game/createGameState";
import { gameReducer } from "../game/gameReducer";
import { RailPiece } from "./RailPiece";
import { ResultOverlay } from "./ResultOverlay";

interface GameScreenProps {
  readonly course: CourseDefinition;
  readonly onClear: (course: CourseDefinition) => void;
  readonly onExit: () => void;
}

/**
 * Renders the main rail board, tray selection, and train progression loop.
 */
export function GameScreen({ course, onClear, onExit }: GameScreenProps): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, course, createGameState);
  const [selectedPieceId, setSelectedPieceId] = useState<string | undefined>();
  const clearNotifiedRef = useRef(false);

  const piecesById = useMemo(
    () => new Map(course.pieces.map((piece) => [piece.id, piece] as const)),
    [course.pieces],
  );
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

  const handleRetry = (): void => {
    clearNotifiedRef.current = false;
    setSelectedPieceId(undefined);
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
          return (
            <button
              key={gap.id}
              className="gap-slot"
              style={{ left: `${gap.position.x}%`, top: `${gap.position.y}%` }}
              aria-label={`あな ${index + 1}${placedPiece ? ` ${placedPiece.label}` : ""}`}
              onClick={() => handleGapClick(gap.id)}
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
              onClick={() => handleSelectPiece(piece.id)}
            >
              <RailPiece shape={piece.shape} />
              <span>{piece.label}</span>
            </button>
          );
        })}
      </section>

      {state.status === "retry" || state.status === "cleared" ? (
        <ResultOverlay status={state.status} retryMode={course.retryMode} onRetry={handleRetry} onExit={onExit} />
      ) : null}
    </main>
  );
}
