import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import App from "./App";

vi.mock("./components/DioramaView", () => ({
  DioramaView: () => <div data-testid="diorama" />,
}));
beforeEach(() => {
  cleanup();
  localStorage.clear();
});
it("chooses a train and opens the shared stage map with progression locks", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "もりでんしゃ" }));
  fireEvent.click(screen.getByRole("button", { name: "あそぶ" }));
  expect(screen.getByRole("button", { name: /ステージ 1 / })).toBeEnabled();
  expect(screen.getByRole("button", { name: /ステージ 2 / })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /ステージ 1 / }));
  expect(screen.getByRole("region", { name: "レールの おきば" })).toBeVisible();
  expect(screen.getByRole("button", { name: "ひとやすみ" })).toBeVisible();
});
it("preserves legacy progress and exposes migrated stages without fake clears", () => {
  const raw = JSON.stringify({ clearedCourseIds: ["sora-3"] });
  localStorage.setItem("train-induction-progress", raw);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "あそぶ" }));
  expect(screen.getByRole("button", { name: /ステージ 8 / })).toBeEnabled();
  expect(screen.getByRole("button", { name: /ステージ 9 / })).toBeDisabled();
  expect(localStorage.getItem("train-induction-progress")).toBe(raw);
});
it("persists train and mute choices across reload", () => {
  const app = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "にじでんしゃ" }));
  fireEvent.click(screen.getByRole("button", { name: "おとを けす" }));
  app.unmount();
  render(<App />);
  expect(screen.getByRole("button", { name: "にじでんしゃ" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "おとを だす" })).toBeVisible();
});
