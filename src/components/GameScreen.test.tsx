import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { courses } from "../data/courses";
import { createGapSlotLayouts, GameScreen } from "./GameScreen";

const mobileBoard = { width: 355, height: 557 };
const gapSlot = { width: 82, height: 82 };

function toRect(layout: { readonly leftPercent: number; readonly topPercent: number }): DOMRectReadOnly {
  const centerX = (layout.leftPercent / 100) * mobileBoard.width;
  const centerY = (layout.topPercent / 100) * mobileBoard.height;
  return new DOMRectReadOnly(centerX - gapSlot.width / 2, centerY - gapSlot.height / 2, gapSlot.width, gapSlot.height);
}

function intersects(first: DOMRectReadOnly, second: DOMRectReadOnly): boolean {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
}

describe("GameScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("places a selected tray piece into a gap", async () => {
    render(<GameScreen course={courses[0]} onClear={() => undefined} onExit={() => undefined} />);

    await userEvent.click(screen.getByRole("button", { name: /まっすぐ/ }));
    await userEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    expect(screen.getByRole("button", { name: /あな 1.*まっすぐ/ })).toBeInTheDocument();
  });

  it("keeps difficulty 4 and 5 gap slots from overlapping on a 375px mobile board", () => {
    for (const course of [courses[3], courses[4]]) {
      const rects = createGapSlotLayouts(course.gaps).map(toRect);

      for (const [index, rect] of rects.entries()) {
        for (const nextRect of rects.slice(index + 1)) {
          expect(intersects(rect, nextRect)).toBe(false);
        }
      }
    }
  });

  it("calls onClear only once for the same clear state", async () => {
    vi.useFakeTimers();
    const handleClear = vi.fn();
    render(<GameScreen course={courses[0]} onClear={handleClear} onExit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: /まっすぐ/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("returns to playing after retry from the retry overlay", async () => {
    vi.useFakeTimers();
    render(<GameScreen course={courses[0]} onClear={() => undefined} onExit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: /くるん/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "ここからもういっかい！" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "もういちど" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "あな 1" })).toBeInTheDocument();
  });

  it("focuses and traps tab inside the result overlay", async () => {
    vi.useFakeTimers();
    render(<GameScreen course={courses[0]} onClear={() => undefined} onExit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: /くるん/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    const dialog = screen.getByRole("dialog");
    const retryButton = within(dialog).getByRole("button", { name: "もういちど" });
    const exitButton = within(dialog).getByRole("button", { name: "コースをえらぶ" });

    expect(retryButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(exitButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(retryButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(exitButton).toHaveFocus();
  });

  it("cleans up the train interval when unmounted", () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    const { unmount } = render(<GameScreen course={courses[0]} onClear={() => undefined} onExit={() => undefined} />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
