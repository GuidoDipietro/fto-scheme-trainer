import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./lib/generatePrompt", () => ({
  generatePrompt: vi
    .fn()
    .mockReturnValueOnce({
      center: { id: "gray", mainColor: "gray" },
      revealedSecondary: { position: "topRight", color: "yellow" },
      targetPosition: "topLeft",
      correctAnswer: "blue",
      distractor: "red",
      answerOptions: ["blue", "red"],
    })
    .mockReturnValueOnce({
      center: { id: "orange", mainColor: "orange" },
      revealedSecondary: { position: "bottom", color: "blue" },
      targetPosition: "topRight",
      correctAnswer: "white",
      distractor: "green",
      answerOptions: ["green", "white"],
    }),
}));

describe("App", () => {
  it("records a correct answer and advances to the next prompt", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    const stats = screen.getByLabelText(/session stats/i);

    expect(stats).toHaveTextContent("Total1");
    expect(stats).toHaveTextContent("Correct1");
    expect(stats).toHaveTextContent("Incorrect0");
    expect(screen.getByText(/correct\./i)).toBeInTheDocument();
    expect(screen.getByText(/center:/i)).toHaveTextContent("Center: Orange");
    expect(screen.getByRole("button", { name: /white/i })).toBeInTheDocument();
  });
});
