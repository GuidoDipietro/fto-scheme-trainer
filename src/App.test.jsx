import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { generatePrompt } from "./lib/generatePrompt";

vi.mock("./lib/generatePrompt", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    generatePrompt: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("App", () => {
  const buildPrompt = (
    mainColor,
    correctAnswer = "blue",
    distractor = "red",
    overrides = {},
  ) => ({
    center: { id: mainColor, mainColor, rotationOffset: 0 },
    revealedSecondary: { position: "topRight", color: "yellow" },
    targetPosition: "topLeft",
    correctAnswer,
    distractor,
    caseKey: `${mainColor}:yellow:topLeft:0`,
    answerOptions: [correctAnswer, distractor],
    ...overrides,
  });

  const startRun = () => {
    fireEvent.keyDown(window, { key: "a" });
  };

  it("starts with all center colors selected", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);

    expect(generatePrompt).not.toHaveBeenCalled();
    expect(screen.getByText(/press any key to start\./i)).toBeInTheDocument();
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
    startRun();

    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray", "orange", "green"]);
    expect(screen.getByRole("button", { name: /white/i })).toBeInTheDocument();
  });

  it("lets ArrowLeft choose the left answer", () => {
    generatePrompt
      .mockReturnValueOnce(buildPrompt("gray", "blue", "red"))
      .mockReturnValueOnce(buildPrompt("orange", "white", "green"));

    render(<App />);
    startRun();

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray", "orange", "green"]);
    expect(screen.getByRole("button", { name: /white/i })).toBeInTheDocument();
  });

  it("lets ArrowRight choose the right answer", () => {
    vi.useFakeTimers();
    generatePrompt.mockReturnValue(buildPrompt("gray", "red", "blue"));

    const { container } = render(<App />);
    startRun();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(generatePrompt).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".trainer-card")).toHaveClass(
      "is-wrong-guess",
    );
  });

  it("shows a live timer for the current case", () => {
    vi.useFakeTimers();
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);
    startRun();

    expect(screen.getByLabelText(/case timer/i)).toHaveTextContent("0.0s");

    act(() => {
      vi.advanceTimersByTime(340);
    });

    expect(screen.getByLabelText(/case timer/i)).toHaveTextContent("0.3s");
  });

  it("limits future prompts to the selected center colors", () => {
    generatePrompt.mockImplementation(
      (selectedCenterIds = ["gray", "orange", "green"]) =>
        buildPrompt(selectedCenterIds[0]),
    );

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /orange center cases/i }));
    fireEvent.click(screen.getByRole("button", { name: /green center cases/i }));
    startRun();

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
    startRun();

    expect(generatePrompt).toHaveBeenLastCalledWith(["gray"]);
    expect(
      screen.getByRole("button", { name: /gray center cases/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the same case after an incorrect guess and flashes red", () => {
    vi.useFakeTimers();
    generatePrompt.mockReturnValue(buildPrompt("gray", "blue", "red"));

    const { container } = render(<App />);
    startRun();

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

  it("stores per-case incorrect and correct counts with solve time", () => {
    vi.useFakeTimers();
    generatePrompt
      .mockReturnValueOnce(buildPrompt("gray", "blue", "red"))
      .mockReturnValueOnce(buildPrompt("orange", "white", "green"));

    render(<App />);
    startRun();

    act(() => {
      vi.advanceTimersByTime(450);
    });

    fireEvent.click(screen.getByRole("button", { name: /red/i }));

    act(() => {
      vi.advanceTimersByTime(650);
    });

    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(
      JSON.parse(window.localStorage.getItem("fto-scheme-trainer-case-stats")),
    ).toEqual({
      "gray:yellow:topLeft:0": {
        correctCount: 1,
        incorrectCount: 1,
        totalSolveTimeMs: 1100,
        lastSolveTimeMs: 1100,
      },
    });
  });

  it("does not show a case in stats until it has been solved correctly", () => {
    vi.useFakeTimers();
    generatePrompt.mockReturnValue(buildPrompt("gray", "blue", "red"));

    render(<App />);
    startRun();

    fireEvent.click(screen.getByRole("button", { name: /red/i }));

    expect(
      JSON.parse(window.localStorage.getItem("fto-scheme-trainer-case-stats")),
    ).toEqual({
      "gray:yellow:topLeft:0": {
        correctCount: 0,
        incorrectCount: 1,
        totalSolveTimeMs: 0,
        lastSolveTimeMs: 0,
      },
    });
    expect(screen.getByText(/no case stats yet\./i)).toBeInTheDocument();
  });

  it("shows stored case stats sorted by worst average time first", () => {
    window.localStorage.setItem(
      "fto-scheme-trainer-case-stats",
      JSON.stringify({
        "gray:yellow:topLeft:0": {
          correctCount: 2,
          incorrectCount: 0,
          totalSolveTimeMs: 8000,
          lastSolveTimeMs: 3000,
        },
        "orange:purple:bottom:1": {
          correctCount: 2,
          incorrectCount: 0,
          totalSolveTimeMs: 2000,
          lastSolveTimeMs: 1000,
        },
      }),
    );
    generatePrompt.mockReturnValue(buildPrompt("gray"));

    const { container } = render(<App />);
    const caseRows = [...container.querySelectorAll("tbody tr")];

    expect(caseRows[0]).toHaveAttribute("data-case-key", "gray:yellow:topLeft:0");
    expect(caseRows[1]).toHaveAttribute("data-case-key", "orange:purple:bottom:1");
  });

  it("shows the mean average time and mean accuracy above the stats table", () => {
    window.localStorage.setItem(
      "fto-scheme-trainer-case-stats",
      JSON.stringify({
        "gray:yellow:topLeft:0": {
          correctCount: 2,
          incorrectCount: 2,
          totalSolveTimeMs: 8000,
          lastSolveTimeMs: 3000,
        },
        "orange:purple:bottom:1": {
          correctCount: 2,
          incorrectCount: 0,
          totalSolveTimeMs: 2000,
          lastSolveTimeMs: 1000,
        },
      }),
    );
    generatePrompt.mockReturnValue(buildPrompt("gray"));

    render(<App />);

    expect(screen.getByLabelText(/average average time/i)).toHaveTextContent(
      "Avg Avg: 2.5s",
    );
    expect(screen.getByLabelText(/average accuracy/i)).toHaveTextContent(
      "Avg Acc: 75%",
    );
  });

  it("toggles stats sorting when a metric header is clicked", () => {
    window.localStorage.setItem(
      "fto-scheme-trainer-case-stats",
      JSON.stringify({
        "gray:yellow:topLeft:0": {
          correctCount: 1,
          incorrectCount: 3,
          totalSolveTimeMs: 1000,
          lastSolveTimeMs: 1000,
        },
        "orange:purple:bottom:1": {
          correctCount: 3,
          incorrectCount: 1,
          totalSolveTimeMs: 3000,
          lastSolveTimeMs: 1000,
        },
      }),
    );
    generatePrompt.mockReturnValue(buildPrompt("gray"));

    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /accuracy/i }));

    let caseRows = [...container.querySelectorAll("tbody tr")];
    expect(caseRows[0]).toHaveAttribute("data-case-key", "gray:yellow:topLeft:0");

    fireEvent.click(screen.getByRole("button", { name: /accuracy/i }));

    caseRows = [...container.querySelectorAll("tbody tr")];
    expect(caseRows[0]).toHaveAttribute("data-case-key", "orange:purple:bottom:1");
  });

  it("collapses and expands the stats panel", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);

    const toggleButton = screen.getByRole("button", { name: /case stats/i });

    fireEvent.click(toggleButton);
    expect(screen.queryByText(/no case stats yet\./i)).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText(/no case stats yet\./i)).toBeInTheDocument();
  });

  it("resets stored case stats from the panel", () => {
    window.localStorage.setItem(
      "fto-scheme-trainer-case-stats",
      JSON.stringify({
        "gray:yellow:topLeft:0": {
          correctCount: 1,
          incorrectCount: 0,
          totalSolveTimeMs: 1000,
          lastSolveTimeMs: 1000,
        },
      }),
    );
    generatePrompt.mockReturnValue(buildPrompt("gray"));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /reset stats/i }));

    expect(window.localStorage.getItem("fto-scheme-trainer-case-stats")).toBeNull();
    expect(screen.getByText(/no case stats yet\./i)).toBeInTheDocument();
  });

  it("reveals the correct target color when a stats case icon is clicked", () => {
    window.localStorage.setItem(
      "fto-scheme-trainer-case-stats",
      JSON.stringify({
        "orange:purple:bottom:1": {
          correctCount: 1,
          incorrectCount: 0,
          totalSolveTimeMs: 1000,
          lastSolveTimeMs: 1000,
        },
      }),
    );
    generatePrompt.mockReturnValue(buildPrompt("gray"));

    const { container } = render(<App />);
    const row = container.querySelector('[data-case-key="orange:purple:bottom:1"]');

    expect(row.querySelector("text")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /show correct answer/i }));

    expect(row.querySelector("text")).toBeNull();
  });

  it("waits for any key to start a run and pauses again after 20 solved cases", () => {
    generatePrompt.mockImplementation(() => buildPrompt("gray", "blue", "red"));
    render(<App />);

    expect(screen.queryByRole("button", { name: /blue/i })).not.toBeInTheDocument();

    startRun();

    expect(generatePrompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /blue/i })).toBeInTheDocument();

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: /blue/i }));
    }

    expect(screen.queryByRole("button", { name: /blue/i })).not.toBeInTheDocument();
    expect(screen.getByText(/press any key to continue\./i)).toBeInTheDocument();
  });

  it("starts a run when the waiting screen is clicked", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /press any key to start\./i }));

    expect(generatePrompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /blue/i })).toBeInTheDocument();
  });

  it("does not start a run from the waiting screen with left or right arrow keys", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(generatePrompt).not.toHaveBeenCalled();
    expect(screen.getByText(/press any key to start\./i)).toBeInTheDocument();
  });

  it("prevents spacebar scrolling and allows space to start a run", () => {
    generatePrompt.mockReturnValue(buildPrompt("gray"));
    render(<App />);

    const event = createEvent.keyDown(window, { key: " ", code: "Space" });
    fireEvent(window, event);

    expect(event.defaultPrevented).toBe(true);
    expect(generatePrompt).toHaveBeenCalledTimes(1);
  });

  it("persists the training batch size locally", () => {
    generatePrompt.mockImplementation(() => buildPrompt("gray", "blue", "red"));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });

    expect(screen.getByText(/3-case set/i)).toBeInTheDocument();

    cleanup();

    render(<App />);

    expect(screen.getByText(/3-case set/i)).toBeInTheDocument();

    startRun();
    fireEvent.click(screen.getByRole("button", { name: /blue/i }));
    fireEvent.click(screen.getByRole("button", { name: /blue/i }));
    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(screen.getByText(/press any key to continue\./i)).toBeInTheDocument();
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

    startRun();
    fireEvent.click(screen.getByRole("button", { name: /mute sounds/i }));
    fireEvent.click(screen.getByRole("button", { name: /blue/i }));

    expect(
      screen.getByRole("button", { name: /unmute sounds/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
