import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { generatePrompt } from "./lib/generatePrompt";

vi.mock("./lib/generatePrompt", () => ({
  generatePrompt: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("App", () => {
  const buildPrompt = (mainColor, correctAnswer = "blue", distractor = "red") => ({
    center: { id: mainColor, mainColor },
    revealedSecondary: { position: "topRight", color: "yellow" },
    targetPosition: "topLeft",
    correctAnswer,
    distractor,
    answerOptions: [correctAnswer, distractor],
  });

  it("starts with all center colors selected", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
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
    generatePrompt
      .mockReturnValueOnce(buildPrompt("gray", "blue", "red"))
      .mockReturnValueOnce(buildPrompt("orange", "white", "green"));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray", "orange", "green"]);
    expect(screen.getByRole("button", { name: /white/i })).toBeInTheDocument();
  });

  it("limits future prompts to the selected center colors", () => {
    generatePrompt.mockImplementation(
      (selectedCenterIds = ["gray", "orange", "green"]) =>
        buildPrompt(selectedCenterIds[0]),
    );

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
    generatePrompt.mockImplementation(
      (selectedCenterIds = ["gray", "orange", "green"]) =>
        buildPrompt(selectedCenterIds[0]),
    );

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /orange center cases/i }));
    fireEvent.click(screen.getByRole("button", { name: /green center cases/i }));
    fireEvent.click(screen.getByRole("button", { name: /gray center cases/i }));

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray"]);
    expect(
      screen.getByRole("button", { name: /gray center cases/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the same case after an incorrect guess and flashes red", () => {
    vi.useFakeTimers();
    generatePrompt.mockReturnValue(buildPrompt("gray", "blue", "red"));

    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /red/i }));

    expect(generatePrompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /blue/i })).toBeInTheDocument();
    expect(container.querySelector(".trainer-card")).toHaveClass(
      "is-wrong-guess",
    );

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(container.querySelector(".trainer-card")).not.toHaveClass(
      "is-wrong-guess",
    );
  });

  it("toggles sound mute state", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);

    const soundButton = screen.getByRole("button", { name: /mute sounds/i });

    expect(soundButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(soundButton);

    expect(
      screen.getByRole("button", { name: /unmute sounds/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps sound muted after a correct guess advances the prompt", () => {
    generatePrompt
      .mockReturnValueOnce(buildPrompt("gray", "blue", "red"))
      .mockReturnValueOnce(buildPrompt("orange", "white", "green"));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /mute sounds/i }));
    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(
      screen.getByRole("button", { name: /unmute sounds/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
