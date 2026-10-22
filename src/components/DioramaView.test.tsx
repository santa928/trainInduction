import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createRun } from "../railway/model";
import { stages, trains } from "../railway/stages";
import { DioramaView } from "./DioramaView";

vi.mock("../scene/Diorama", () => ({
  Diorama: class {
    render() {}
    dispose() {}
  },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("excludes a suspended interval even when pause and resume occur between animation frames", async () => {
  let next: FrameRequestCallback;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    next = callback;
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  const onFrame = vi.fn(),
    onReady = vi.fn();
  const run = createRun(stages[0], 1);
  const view = (paused: boolean) => (
    <DioramaView
      run={{ ...run, paused }}
      train={trains[0]}
      onFrame={onFrame}
      onReady={onReady}
    />
  );
  const app = render(view(false));
  await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
  act(() => next(1000));
  act(() => next(1100));
  expect(onFrame).toHaveBeenLastCalledWith(0.1);
  app.rerender(view(true));
  app.rerender(view(false));
  act(() => next(61100));
  expect(onFrame).toHaveBeenLastCalledWith(0);
  act(() => next(61200));
  expect(onFrame).toHaveBeenLastCalledWith(0.1);
  // Genuine stalls during active play still consume time; they cannot skip a bad rail.
  act(() => next(70000));
  expect(onFrame).toHaveBeenLastCalledWith(8.8);
});
