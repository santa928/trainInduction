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
  });
});
