import { useEffect, useRef, useState } from "react";
import { FtoCenter } from "./components/FtoCenter";
import { colorPalette, getColorLabel } from "./data/colors";
import { centerSchemes } from "./data/centerSchemes";
import { generatePrompt } from "./lib/generatePrompt";

const selectableCenterIds = centerSchemes.map((center) => center.id);
const wrongFlashDurationMs = 220;

const createInitialState = () => ({
  selectedCenterIds: selectableCenterIds,
  prompt: generatePrompt(selectableCenterIds),
  isWrongGuessActive: false,
  isSoundMuted: false,
});

export default function App() {
  const [session, setSession] = useState(createInitialState);
  const wrongFlashTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(
    () => () => {
      if (wrongFlashTimeoutRef.current) {
        window.clearTimeout(wrongFlashTimeoutRef.current);
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    },
    [],
  );

  const getAudioContext = () => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ?? window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextClass();
    }

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  };

  const playWrongSound = () => {
    if (session.isSoundMuted) {
      return;
    }

    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    const startTime = audioContext.currentTime;
    const pulses = [
      { start: 0, duration: 0.09, frequency: 196 },
      { start: 0.13, duration: 0.09, frequency: 174 },
    ];

    pulses.forEach(({ start, duration, frequency }) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, startTime + start);
      gainNode.gain.setValueAtTime(0.0001, startTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + start + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + start + duration,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime + start);
      oscillator.stop(startTime + start + duration);
    });
  };

  const playSuccessSound = () => {
    if (session.isSoundMuted) {
      return;
    }

    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    const startTime = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, startTime + 0.16);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.06, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.28);
  };

  const triggerWrongFlash = () => {
    if (wrongFlashTimeoutRef.current) {
      window.clearTimeout(wrongFlashTimeoutRef.current);
    }

    setSession((current) => ({
      ...current,
      isWrongGuessActive: true,
    }));

    wrongFlashTimeoutRef.current = window.setTimeout(() => {
      setSession((current) => ({
        ...current,
        isWrongGuessActive: false,
      }));
      wrongFlashTimeoutRef.current = null;
    }, wrongFlashDurationMs);
  };

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
        isWrongGuessActive: false,
        isSoundMuted: current.isSoundMuted,
      };
    });
  };

  const handleSoundToggle = () => {
    setSession((current) => ({
      ...current,
      isSoundMuted: !current.isSoundMuted,
    }));
  };

  const handleAnswer = (selectedColor) => {
    const isCorrect = selectedColor === session.prompt.correctAnswer;

    if (!isCorrect) {
      playWrongSound();
      triggerWrongFlash();
      return;
    }

    playSuccessSound();

    setSession((current) => ({
      selectedCenterIds: current.selectedCenterIds,
      prompt: generatePrompt(current.selectedCenterIds),
      isWrongGuessActive: false,
      isSoundMuted: current.isSoundMuted,
    }));
  };

  const { prompt, selectedCenterIds, isWrongGuessActive, isSoundMuted } = session;
  const promptColors = prompt.answerOptions.map((colorId) => ({
    id: colorId,
    hex: colorPalette[colorId].hex,
  }));

  return (
    <main className="app-shell">
      <section
        className={`trainer-card${isWrongGuessActive ? " is-wrong-guess" : ""}`}
      >
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

            <button
              type="button"
              className={`sound-toggle${isSoundMuted ? " is-muted" : ""}`}
              onClick={handleSoundToggle}
              aria-pressed={isSoundMuted}
              aria-label={isSoundMuted ? "Unmute sounds" : "Mute sounds"}
            >
              <svg
                aria-hidden="true"
                className="sound-toggle-icon"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 9v6h4l5 4V5L9 9H5Z"
                  fill="currentColor"
                />
                {isSoundMuted ? (
                  <path
                    d="M6 6 18 18M18 6 6 18"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                ) : (
                  <>
                    <path
                      d="M17 9.5a4 4 0 0 1 0 5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M19.5 7a7.5 7.5 0 0 1 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
              <span className="sr-only">
                {isSoundMuted ? "Muted" : "Sound on"}
              </span>
            </button>
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
      </section>
    </main>
  );
}
