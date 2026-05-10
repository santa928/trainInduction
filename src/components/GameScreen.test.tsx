import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { courses } from "../data/courses";
import { GameScreen, getRoutePoint } from "./GameScreen";

function renderGameScreen(
  course = courses[0],
  props: {
    readonly onClear?: (course: typeof courses[number]) => void;
    readonly onExit?: () => void;
    readonly onTrainSelect?: () => void;
    readonly onNext?: () => void;
  } = {},
): ReturnType<typeof render> {
  return render(
    <GameScreen
      course={course}
      onClear={props.onClear ?? (() => undefined)}
      onExit={props.onExit ?? (() => undefined)}
      onTrainSelect={props.onTrainSelect ?? (() => undefined)}
      onNext={props.onNext}
    />,
  );
}

/**
 * Advances fake timers past the 1.5s start pause, then lets the train run.
 */
async function advanceAfterStartPause(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("GameScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("places a selected tray piece into a gap", async () => {
    renderGameScreen();

    await userEvent.click(screen.getByRole("button", { name: /よこ/ }));
    await userEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    expect(screen.getByRole("button", { name: /あな 1.*よこ/ })).toBeInTheDocument();
  });

  it("places a dragged tray piece into a gap", () => {
    renderGameScreen();

    const pieceButton = screen.getByRole("button", { name: /よこ/ });
    const gapButton = screen.getByRole("button", { name: /あな 1/ });
    fireEvent.dragStart(pieceButton);
    fireEvent.dragOver(gapButton);
    fireEvent.drop(gapButton);

    expect(screen.getByRole("button", { name: /あな 1.*よこ/ })).toBeInTheDocument();
  });

  it("keeps difficulty 4 and 5 gap slots on unique grid cells", () => {
    for (const course of [courses[3], courses[4]]) {
      const cells = course.gaps.map((gap) => `${gap.position.x}:${gap.position.y}`);

      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it("places the train on the top-down route", () => {
    const point = getRoutePoint(courses[1].path, courses[1].gaps[0].arrivalDistance);

    expect(point.x).toBeGreaterThan(1);
    expect(point.y).toBeGreaterThan(3);
  });

  it("waits before the train starts moving", async () => {
    vi.useFakeTimers();
    renderGameScreen();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "あな 1" })).toBeInTheDocument();
  });

  it("starts moving after the opening wait", async () => {
    vi.useFakeTimers();
    renderGameScreen();
    const trainToken = document.querySelector<HTMLElement>(".train-token");

    expect(trainToken?.style.left).toBe("10%");

    await advanceAfterStartPause(200);

    expect(trainToken?.style.left).not.toBe("10%");
  });

  it("calls onClear only once for the same clear state", async () => {
    vi.useFakeTimers();
    const handleClear = vi.fn();
    renderGameScreen(courses[0], { onClear: handleClear });

    fireEvent.click(screen.getByRole("button", { name: /よこ/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await advanceAfterStartPause(16000);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("returns to playing after retry from the retry overlay", async () => {
    vi.useFakeTimers();
    renderGameScreen();

    fireEvent.click(screen.getByRole("button", { name: /みぎうえ/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await advanceAfterStartPause(12000);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "ここからもういっかい！" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "もういちど" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "あな 1" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses and traps tab inside the result overlay", async () => {
    vi.useFakeTimers();
    renderGameScreen();

    fireEvent.click(screen.getByRole("button", { name: /みぎうえ/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await advanceAfterStartPause(12000);

    const dialog = screen.getByRole("dialog");
    const retryButton = within(dialog).getByRole("button", { name: "もういちど" });
    const exitButton = within(dialog).getByRole("button", { name: "コースをえらぶ" });
    const trainSelectButton = within(dialog).getByRole("button", { name: "でんしゃをえらぶ" });

    expect(retryButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(exitButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(trainSelectButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(retryButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(trainSelectButton).toHaveFocus();
  });

  it("cleans up the start pause timeout when unmounted", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = renderGameScreen();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
