import { useState } from "react";
import { FtoCenter } from "./components/FtoCenter";
import { colorPalette, getColorLabel } from "./data/colors";
import { generatePrompt } from "./lib/generatePrompt";

const createInitialState = () => ({
  prompt: generatePrompt(),
  lastResult: null,
});

export default function App() {
  const [session, setSession] = useState(createInitialState);

  const handleAnswer = (selectedColor) => {
    setSession((current) => {
      const isCorrect = selectedColor === current.prompt.correctAnswer;

      return {
        prompt: generatePrompt(),
        lastResult: {
          isCorrect,
          selectedColor,
          correctAnswer: current.prompt.correctAnswer,
          centerId: current.prompt.center.id,
        },
      };
    });
  };

  const { prompt, lastResult } = session;
  const promptColors = prompt.answerOptions.map((colorId) => ({
    id: colorId,
    label: getColorLabel(colorId),
    hex: colorPalette[colorId].hex,
  }));

  return (
    <main className="app-shell">
      <section className="trainer-card">
        <div className="center-stage">
          <FtoCenter
            mainColor={prompt.center.mainColor}
            revealedSecondary={prompt.revealedSecondary}
            targetPosition={prompt.targetPosition}
          />
        </div>

        <div className="answer-row" aria-label="Answer choices">
          {promptColors.map((option) => (
            <button
              key={option.id}
              type="button"
              className="answer-button"
              onClick={() => handleAnswer(option.id)}
            >
              <span
                className="answer-swatch"
                style={{ backgroundColor: option.hex }}
                aria-hidden="true"
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="status-row" aria-live="polite">
          {lastResult ? (
            <p className={lastResult.isCorrect ? "status-ok" : "status-bad"}>
              {lastResult.isCorrect ? "Correct." : "Incorrect."} Answer was{" "}
              <strong>{getColorLabel(lastResult.correctAnswer)}</strong>.
            </p>
          ) : (
            <p>Pick the color for the highlighted piece.</p>
          )}
        </div>
      </section>
    </main>
  );
}
