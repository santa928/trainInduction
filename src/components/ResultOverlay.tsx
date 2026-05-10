import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { GameStatus } from "../game/createGameState";
import type { RetryMode } from "../data/types";

interface ResultOverlayProps {
  readonly status: Extract<GameStatus, "retry" | "cleared">;
  readonly retryMode: RetryMode;
  readonly onRetry: () => void;
  readonly onExit: () => void;
  readonly onTrainSelect: () => void;
  readonly onNext?: () => void;
}

/**
 * Shows a large modal result prompt after a train stops or clears a course.
 */
export function ResultOverlay({
  status,
  retryMode,
  onRetry,
  onExit,
  onTrainSelect,
  onNext,
}: ResultOverlayProps): React.JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
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
    const buttons = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    if (!firstButton || !lastButton) {
      return;
    }

    const activeElement = document.activeElement;
    const activeIndex = buttons.findIndex((button) => button === activeElement);
    if (event.shiftKey) {
      const previousIndex = activeIndex <= 0 ? buttons.length - 1 : activeIndex - 1;
      buttons[previousIndex].focus();
      return;
    }
    const nextIndex = activeIndex === -1 || activeElement === lastButton ? 0 : activeIndex + 1;
    buttons[nextIndex].focus();
  };

  return (
    <div
      className="result-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      onKeyDown={handleKeyDown}
    >
      <div ref={panelRef} className="result-panel">
        <h2 id="result-title">{message}</h2>
        <div className="result-actions">
          <button ref={retryButtonRef} className="result-button result-button-primary" onClick={onRetry}>
            もういちど
          </button>
          {isCleared && onNext ? (
            <button className="result-button result-button-next" onClick={onNext}>
              つぎへ
            </button>
          ) : null}
          <button className="result-button" onClick={onExit}>
            コースをえらぶ
          </button>
          <button className="result-button" onClick={onTrainSelect}>
            でんしゃをえらぶ
          </button>
        </div>
      </div>
    </div>
  );
}
