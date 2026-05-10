import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { GameStatus } from "../game/createGameState";
import type { RetryMode } from "../data/types";

interface ResultOverlayProps {
  readonly status: Extract<GameStatus, "retry" | "cleared">;
  readonly retryMode: RetryMode;
  readonly onRetry: () => void;
  readonly onExit: () => void;
}

/**
 * Shows a large modal result prompt after a train stops or clears a course.
 */
export function ResultOverlay({ status, retryMode, onRetry, onExit }: ResultOverlayProps): React.JSX.Element {
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const isCleared = status === "cleared";
  const message = isCleared
    ? "えきについたよ！"
    : retryMode === "checkpoint"
      ? "ここからもういっかい！"
      : "さいしょからもういっかい！";

  useEffect(() => {
    retryButtonRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const firstButton = retryButtonRef.current;
    const lastButton = exitButtonRef.current;
    if (!firstButton || !lastButton) {
      return;
    }

    const activeElement = document.activeElement;
    if (event.shiftKey) {
      (activeElement === firstButton ? lastButton : firstButton).focus();
      return;
    }
    (activeElement === lastButton ? firstButton : lastButton).focus();
  };

  return (
    <div
      className="result-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      onKeyDown={handleKeyDown}
    >
      <div className="result-panel">
        <h2 id="result-title">{message}</h2>
        <div className="result-actions">
          <button ref={retryButtonRef} className="result-button result-button-primary" onClick={onRetry}>
            もういちど
          </button>
          <button ref={exitButtonRef} className="result-button" onClick={onExit}>
            コースをえらぶ
          </button>
        </div>
      </div>
    </div>
  );
}
