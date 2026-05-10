import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { courses } from "../data/courses";
import { GameScreen } from "./GameScreen";

describe("GameScreen", () => {
  it("places a selected tray piece into a gap", async () => {
    render(<GameScreen course={courses[0]} onClear={() => undefined} onExit={() => undefined} />);

    await userEvent.click(screen.getByRole("button", { name: /まっすぐ/ }));
    await userEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    expect(screen.getByRole("button", { name: /あな 1.*まっすぐ/ })).toBeInTheDocument();
  });
});
