import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { PROGRESS_KEY } from "./railway/progress";

const completed = vi.hoisted(() => ({ saved: null as string | null }));
vi.mock("./components/DioramaView", () => ({ DioramaView: () => null }));
// Drive App's completion boundary without waiting for the GPU/train animation.
vi.mock("./components/RailwayGame", () => ({
  RailwayGame: ({ onClear }: { onClear: (id: string) => void }) => (
    <button
      onClick={() => {
        onClear("journey-1");
        completed.saved = localStorage.getItem(PROGRESS_KEY);
      }}
    >
      Notify arrival
    </button>
  ),
}));
beforeEach(() => {
  localStorage.clear();
  completed.saved = null;
});
afterEach(cleanup);

it("persists arrival before returning to the result screen", () => {
  const app = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "あそぶ" }));
  fireEvent.click(screen.getByRole("button", { name: /^ステージ 1 / }));
  fireEvent.click(screen.getByRole("button", { name: "Notify arrival" }));
  const saved = JSON.parse(completed.saved!);
  expect(saved.clearedStageIds).toEqual(["journey-1"]);
  expect(saved.unlockedThrough).toBe(2);
  app.unmount();
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "あそぶ" }));
  expect(screen.getByRole("button", { name: /^ステージ 2 / })).toBeEnabled();
});
