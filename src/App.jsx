import { useState } from "react";
import { FtoCenter } from "./components/FtoCenter";
import { colorPalette, getColorLabel } from "./data/colors";
import { generatePrompt } from "./lib/generatePrompt";

const createInitialState = () => ({
  prompt: generatePrompt(),
  stats: {
    total: 0,
    correct: 0,
    incorrect: 0,
  },
  lastResult: null,
});

export default function App() {
  const [session, setSession] = useState(createInitialState);

  const handleAnswer = (selectedColor) => {
    setSession((current) => {
      const isCorrect = selectedColor === current.prompt.correctAnswer;

      return {
        prompt: generatePrompt(),
        stats: {
          total: current.stats.total + 1,
          correct: current.stats.correct + (isCorrect ? 1 : 0),
          incorrect: current.stats.incorrect + (isCorrect ? 0 : 1),
        },
        lastResult: {
          isCorrect,
          selectedColor,
          correctAnswer: current.prompt.correctAnswer,
          centerId: current.prompt.center.id,
        },
      };
    });
  };

  const { prompt, stats, lastResult } = session;
  const promptColors = prompt.answerOptions.map((colorId) => ({
    id: colorId,
    label: getColorLabel(colorId),
    hex: colorPalette[colorId].hex,
  }));

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">FTO Scheme Trainer</p>
        <h1>Train secondary-color recognition by position.</h1>
        <p className="intro">
          One secondary color is revealed. Pick the correct color for the
          highlighted center-edge piece.
        </p>
        <div className="stats-row" aria-label="Session stats">
          <article>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </article>
          <article>
            <span>Correct</span>
            <strong>{stats.correct}</strong>
          </article>
          <article>
            <span>Incorrect</span>
            <strong>{stats.incorrect}</strong>
          </article>
        </div>
      </section>

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
          <p>
            Center: <strong>{getColorLabel(prompt.center.mainColor)}</strong>
          </p>
          {lastResult ? (
            <p className={lastResult.isCorrect ? "status-ok" : "status-bad"}>
              {lastResult.isCorrect ? "Correct." : "Incorrect."} Answer was{" "}
              <strong>{getColorLabel(lastResult.correctAnswer)}</strong>.
            </p>
          ) : (
            <p>Choose one of the two remaining secondary colors.</p>
          )}
        </div>
      </section>
    </main>
  );
}
