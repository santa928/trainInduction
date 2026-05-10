import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App navigation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with train selection and opens course selection", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));

    expect(screen.getByRole("heading", { name: /そらでんしゃ/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1ばんめのたび/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /でんしゃをえらぶ/ })).toHaveFocus();
  });

  it("returns from course selection to train selection", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));
    await userEvent.click(screen.getByRole("button", { name: /でんしゃをえらぶ/ }));

    expect(screen.getByRole("heading", { name: /レールをつなごう！/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /そらでんしゃ/ })).toBeInTheDocument();
  });

  it("keeps locked courses disabled with gentle wording", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));

    expect(screen.getByRole("button", { name: /2ばんめのたび/ })).toBeDisabled();
    expect(screen.getAllByText("つぎのおたのしみ")).toHaveLength(4);
  });

  it("opens the game screen from an unlocked course", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));
    await userEvent.click(screen.getByRole("button", { name: /1ばんめのたび/ }));

    expect(screen.getByRole("heading", { name: "1ばんめのたび" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /コースをえらぶ/ })).toHaveFocus();
    expect(screen.getByLabelText("せんろ")).toBeInTheDocument();
    expect(screen.getByLabelText("レールピース")).toBeInTheDocument();
  });

  it("saves clear progress and unlocks the next course", async () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));
    fireEvent.click(screen.getByRole("button", { name: /1ばんめのたび/ }));
    fireEvent.click(screen.getByRole("button", { name: /よこ/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(13000);
    });

    expect(screen.getByRole("heading", { name: "えきについたよ！" })).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "つぎへ" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "でんしゃをえらぶ" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /コースをえらぶ/ }));

    expect(screen.getByRole("button", { name: /2ばんめのたび/ })).toBeEnabled();
  });

  it("opens the next course from the clear overlay", async () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));
    fireEvent.click(screen.getByRole("button", { name: /1ばんめのたび/ }));
    fireEvent.click(screen.getByRole("button", { name: /よこ/ }));
    fireEvent.click(screen.getByRole("button", { name: /あな 1/ }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(13000);
    });

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "つぎへ" }));

    expect(screen.getByRole("heading", { name: "2ばんめのたび" })).toBeInTheDocument();
  });
});
