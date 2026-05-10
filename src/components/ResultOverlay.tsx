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
  const isCleared = status === "cleared";
  const message = isCleared
    ? "えきについたよ！"
    : retryMode === "checkpoint"
      ? "ここからもういっかい！"
      : "さいしょからもういっかい！";

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result-panel">
        <h2 id="result-title">{message}</h2>
        <div className="result-actions">
          <button className="result-button result-button-primary" onClick={onRetry}>
            もういちど
          </button>
          <button className="result-button" onClick={onExit}>
            コースをえらぶ
          </button>
        </div>
      </div>
    </div>
  );
}
