import { useState } from "react";
import { FtoCenter } from "./components/FtoCenter";
import { colorPalette, getColorLabel } from "./data/colors";
import { centerSchemes } from "./data/centerSchemes";
import { generatePrompt } from "./lib/generatePrompt";

const selectableCenterIds = centerSchemes.map((center) => center.id);

const createInitialState = () => ({
  selectedCenterIds: selectableCenterIds,
  prompt: generatePrompt(selectableCenterIds),
  lastResult: null,
});

export default function App() {
  const [session, setSession] = useState(createInitialState);

  const handleCenterToggle = (centerId) => {
    setSession((current) => {
      const isSelected = current.selectedCenterIds.includes(centerId);
      const nextSelectedCenterIds =
        isSelected && current.selectedCenterIds.length === 1
          ? current.selectedCenterIds
          : isSelected
            ? current.selectedCenterIds.filter((id) => id !== centerId)
            : [...current.selectedCenterIds, centerId];

      return {
        selectedCenterIds: nextSelectedCenterIds,
        prompt: generatePrompt(nextSelectedCenterIds),
        lastResult: null,
      };
    });
  };

  const handleAnswer = (selectedColor) => {
    setSession((current) => {
      const isCorrect = selectedColor === current.prompt.correctAnswer;

      return {
        selectedCenterIds: current.selectedCenterIds,
        prompt: generatePrompt(current.selectedCenterIds),
        lastResult: {
          isCorrect,
          selectedColor,
          correctAnswer: current.prompt.correctAnswer,
          centerId: current.prompt.center.id,
        },
      };
    });
  };

  const { prompt, lastResult, selectedCenterIds } = session;
  const promptColors = prompt.answerOptions.map((colorId) => ({
    id: colorId,
    hex: colorPalette[colorId].hex,
  }));

  return (
    <main className="app-shell">
      <section className="trainer-card">
        <div className="trainer-layout">
          <div className="filter-row" aria-label="Center color filters">
            {selectableCenterIds.map((centerId) => {
              const centerColor = colorPalette[centerId];
              const isSelected = selectedCenterIds.includes(centerId);

              return (
                <button
                  key={centerId}
                  type="button"
                  className={`filter-button${isSelected ? " is-selected" : ""}`}
                  onClick={() => handleCenterToggle(centerId)}
                  aria-pressed={isSelected}
                  aria-label={`Toggle ${getColorLabel(centerId)} center cases`}
                  style={{
                    "--filter-color": centerColor.hex,
                  }}
                >
                  <span className="sr-only">{centerColor.label}</span>
                </button>
              );
            })}
          </div>

          <div className="center-stage">
            <FtoCenter
              mainColor={prompt.center.mainColor}
              revealedSecondary={prompt.revealedSecondary}
              targetPosition={prompt.targetPosition}
            />
          </div>
        </div>

        <div className="answer-row" aria-label="Answer choices">
          {promptColors.map((option) => (
            <button
              key={option.id}
              type="button"
              className="answer-button"
              onClick={() => handleAnswer(option.id)}
              style={{ backgroundColor: option.hex }}
              aria-label={`Choose ${getColorLabel(option.id)}`}
            >
              <span className="sr-only">{getColorLabel(option.id)}</span>
            </button>
          ))}
        </div>

        <div className="status-row" aria-live="polite">
          {lastResult ? (
            <p className={lastResult.isCorrect ? "status-ok" : "status-bad"}>
              {lastResult.isCorrect ? "Correct." : "Incorrect."}
            </p>
          ) : (
            <p>Pick the color for the highlighted piece.</p>
          )}
        </div>
      </section>
    </main>
  );
}
