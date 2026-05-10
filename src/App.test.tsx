import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App navigation", () => {
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

  it("opens the placeholder game screen from an unlocked course", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /そらでんしゃ/ }));
    await userEvent.click(screen.getByRole("button", { name: /1ばんめのたび/ }));

    expect(screen.getByRole("heading", { name: "1ばんめのたび" })).toHaveFocus();
  });
});
