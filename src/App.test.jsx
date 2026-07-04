import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { generatePrompt } from "./lib/generatePrompt";

vi.mock("./lib/generatePrompt", () => ({
  generatePrompt: vi.fn((selectedCenterIds = ["gray", "orange", "green"]) => {
    const mainColor = selectedCenterIds[0];

    return {
      center: { id: mainColor, mainColor },
      revealedSecondary: { position: "topRight", color: "yellow" },
      targetPosition: "topLeft",
      correctAnswer: "blue",
      distractor: "red",
      answerOptions: ["blue", "red"],
    };
  }),
}));

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("starts with all center colors selected", () => {
    render(<App />);

    expect(generatePrompt).toHaveBeenCalledWith(["gray", "orange", "green"]);
    expect(screen.getByRole("button", { name: /gray center cases/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: /orange center cases/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /green center cases/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("records a correct answer and advances to the next prompt", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(screen.getByText(/correct\./i)).toBeInTheDocument();
    expect(generatePrompt).toHaveBeenLastCalledWith(["gray", "orange", "green"]);
  });

  it("limits future prompts to the selected center colors", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /orange center cases/i }));
    fireEvent.click(screen.getByRole("button", { name: /green center cases/i }));

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray"]);
    expect(
      screen.getByRole("button", { name: /gray center cases/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /orange center cases/i }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /green center cases/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps one center selected when toggling the last active filter", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /orange center cases/i }));
    fireEvent.click(screen.getByRole("button", { name: /green center cases/i }));
    fireEvent.click(screen.getByRole("button", { name: /gray center cases/i }));

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray"]);
    expect(
      screen.getByRole("button", { name: /gray center cases/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
