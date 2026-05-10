import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultOverlay } from "./ResultOverlay";

/**
 * Renders the result overlay with overridable callbacks for action behavior tests.
 */
function renderOverlay(props: { readonly onNext?: () => void } = {}): void {
  render(
    <ResultOverlay
      status="cleared"
      retryMode="checkpoint"
      onRetry={() => undefined}
      onExit={() => undefined}
      onTrainSelect={() => undefined}
      onNext={props.onNext}
    />,
  );
}

describe("ResultOverlay", () => {
  it("runs next only once even if the button is clicked repeatedly", () => {
    const handleNext = vi.fn();
    renderOverlay({ onNext: handleNext });

    const nextButton = screen.getByRole("button", { name: "つぎへ" });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(handleNext).toHaveBeenCalledTimes(1);
    expect(nextButton).toBeDisabled();
  });
});
