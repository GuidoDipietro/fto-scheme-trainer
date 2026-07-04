import { useEffect, useRef, useState } from "react";
import { FtoCenter } from "./components/FtoCenter";
import { colorPalette, getColorLabel } from "./data/colors";
import { centerSchemes } from "./data/centerSchemes";
import { generatePrompt, rotateCenter } from "./lib/generatePrompt";

const selectableCenterIds = centerSchemes.map((center) => center.id);
const wrongFlashDurationMs = 220;
const timerTickMs = 100;
const caseStatsStorageKey = "fto-scheme-trainer-case-stats";

const defaultStatsSort = {
  metric: "averageTime",
  direction: "desc",
};

function getNow() {
  return Date.now();
}

function getStoredCaseStats() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawStats = window.localStorage.getItem(caseStatsStorageKey);

    return rawStats ? JSON.parse(rawStats) : {};
  } catch {
    return {};
  }
}

function storeCaseStats(caseStats) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(caseStatsStorageKey, JSON.stringify(caseStats));
}

function clearStoredCaseStats() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(caseStatsStorageKey);
}

function formatElapsedMs(elapsedMs) {
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

function formatAverageTime(elapsedMs) {
  if (elapsedMs == null) {
    return "—";
  }

  return formatElapsedMs(elapsedMs);
}

function parseCaseKey(caseKey) {
  const [mainColor, revealedColor, targetPosition, offsetRaw] = caseKey.split(":");

  return {
    mainColor,
    revealedColor,
    targetPosition,
    rotationOffset: Number(offsetRaw),
  };
}

function getRevealedPosition(mainColor, revealedColor, rotationOffset) {
  const center = centerSchemes.find((scheme) => scheme.mainColor === mainColor);

  if (!center) {
    return "topRight";
  }

  const rotatedCenter = rotateCenter(center, rotationOffset);

  return (
    Object.entries(rotatedCenter.secondaryColorsByPosition).find(
      ([, color]) => color === revealedColor,
    )?.[0] ?? "topRight"
  );
}

function getAccuracy(caseStats) {
  const totalAttempts = caseStats.correctCount + caseStats.incorrectCount;

  return totalAttempts > 0 ? caseStats.correctCount / totalAttempts : 0;
}

function buildStatsRows(caseStats) {
  return Object.entries(caseStats)
    .filter(([, stats]) => (stats.correctCount ?? 0) > 0)
    .map(([caseKey, stats]) => {
    const { mainColor, revealedColor, targetPosition, rotationOffset } =
      parseCaseKey(caseKey);
    const correctCount = stats.correctCount ?? 0;
    const incorrectCount = stats.incorrectCount ?? 0;
    const totalAttempts = correctCount + incorrectCount;
    const center = centerSchemes.find((scheme) => scheme.mainColor === mainColor);
    const rotatedCenter = center ? rotateCenter(center, rotationOffset) : null;

    return {
      caseKey,
      mainColor,
      revealedColor,
      targetPosition,
      rotationOffset,
      revealedPosition: getRevealedPosition(
        mainColor,
        revealedColor,
        rotationOffset,
      ),
      targetSecondaryColor:
        rotatedCenter?.secondaryColorsByPosition[targetPosition] ?? null,
      averageTimeMs:
        correctCount > 0 ? stats.totalSolveTimeMs / correctCount : null,
      accuracy: getAccuracy(stats),
      totalAttempts,
    };
    });
}

function getDefaultSortDirection(metric) {
  return metric === "averageTime" ? "desc" : "asc";
}

function sortStatsRows(rows, statsSort) {
  const directionFactor = statsSort.direction === "asc" ? 1 : -1;

  return [...rows].sort((leftRow, rightRow) => {
    let comparison = 0;

    if (statsSort.metric === "averageTime") {
      const leftValue =
        leftRow.averageTimeMs ?? (
          statsSort.direction === "desc"
            ? Number.POSITIVE_INFINITY
            : Number.NEGATIVE_INFINITY
        );
      const rightValue =
        rightRow.averageTimeMs ?? (
          statsSort.direction === "desc"
            ? Number.POSITIVE_INFINITY
            : Number.NEGATIVE_INFINITY
        );

      comparison = leftValue - rightValue;
    } else {
      comparison = leftRow.accuracy - rightRow.accuracy;
    }

    if (comparison !== 0) {
      return comparison * directionFactor;
    }

    return leftRow.caseKey.localeCompare(rightRow.caseKey);
  });
}

const createInitialState = () => ({
  selectedCenterIds: selectableCenterIds,
  prompt: generatePrompt(selectableCenterIds),
  isWrongGuessActive: false,
  isSoundMuted: false,
  promptStartedAtMs: getNow(),
  elapsedMs: 0,
});

export default function App() {
  const [session, setSession] = useState(createInitialState);
  const [caseStats, setCaseStats] = useState(getStoredCaseStats);
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [statsSort, setStatsSort] = useState(defaultStatsSort);
  const [revealedStatsCases, setRevealedStatsCases] = useState({});
  const wrongFlashTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSession((current) => ({
        ...current,
        elapsedMs: getNow() - current.promptStartedAtMs,
      }));
    }, timerTickMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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

  const recordCaseResult = ({ caseKey, isCorrect, elapsedMs = 0 }) => {
    setCaseStats((currentCaseStats) => {
      const existingCaseStats = currentCaseStats[caseKey] ?? {
        correctCount: 0,
        incorrectCount: 0,
        totalSolveTimeMs: 0,
        lastSolveTimeMs: 0,
      };

      const nextCaseStats = isCorrect
        ? {
            ...existingCaseStats,
            correctCount: existingCaseStats.correctCount + 1,
            totalSolveTimeMs: existingCaseStats.totalSolveTimeMs + elapsedMs,
            lastSolveTimeMs: elapsedMs,
          }
        : {
            ...existingCaseStats,
            incorrectCount: existingCaseStats.incorrectCount + 1,
          };

      const nextStatsByCase = {
        ...currentCaseStats,
        [caseKey]: nextCaseStats,
      };

      storeCaseStats(nextStatsByCase);

      return nextStatsByCase;
    });
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
        promptStartedAtMs: getNow(),
        elapsedMs: 0,
      };
    });
  };

  const handleSoundToggle = () => {
    setSession((current) => ({
      ...current,
      isSoundMuted: !current.isSoundMuted,
    }));
  };

  const handleStatsSort = (metric) => {
    setStatsSort((currentSort) => {
      if (currentSort.metric === metric) {
        return {
          ...currentSort,
          direction: currentSort.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        metric,
        direction: getDefaultSortDirection(metric),
      };
    });
  };

  const handleResetStats = () => {
    clearStoredCaseStats();
    setCaseStats({});
    setRevealedStatsCases({});
  };

  const handleStatsCaseToggle = (caseKey) => {
    setRevealedStatsCases((current) => ({
      ...current,
      [caseKey]: !current[caseKey],
    }));
  };

  const handleAnswer = (selectedColor) => {
    const isCorrect = selectedColor === session.prompt.correctAnswer;
    const elapsedMs = getNow() - session.promptStartedAtMs;

    if (!isCorrect) {
      recordCaseResult({
        caseKey: session.prompt.caseKey,
        isCorrect: false,
      });
      playWrongSound();
      triggerWrongFlash();
      return;
    }

    recordCaseResult({
      caseKey: session.prompt.caseKey,
      isCorrect: true,
      elapsedMs,
    });
    playSuccessSound();

    setSession((current) => ({
      selectedCenterIds: current.selectedCenterIds,
      prompt: generatePrompt(current.selectedCenterIds),
      isWrongGuessActive: false,
      isSoundMuted: current.isSoundMuted,
      promptStartedAtMs: getNow(),
      elapsedMs: 0,
    }));
  };

  const {
    prompt,
    selectedCenterIds,
    isWrongGuessActive,
    isSoundMuted,
    elapsedMs,
  } = session;
  const promptColors = prompt.answerOptions.map((colorId) => ({
    id: colorId,
    hex: colorPalette[colorId].hex,
  }));
  const statsRows = sortStatsRows(buildStatsRows(caseStats), statsSort);

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

        <p className="timer-readout" aria-label="Case timer">
          {formatElapsedMs(elapsedMs)}
        </p>
      </section>

      <aside className={`stats-panel${isStatsOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="stats-panel-toggle"
          onClick={() => setIsStatsOpen((current) => !current)}
          aria-expanded={isStatsOpen}
        >
          Case Stats
        </button>

        {isStatsOpen ? (
          <div className="stats-panel-body">
            <button
              type="button"
              className="stats-reset-button"
              onClick={handleResetStats}
            >
              Reset Stats
            </button>

            {statsRows.length > 0 ? (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th scope="col">Case</th>
                    <th scope="col">
                      <button
                        type="button"
                        className="stats-sort-button"
                        onClick={() => handleStatsSort("averageTime")}
                      >
                        Average
                      </button>
                    </th>
                    <th scope="col">
                      <button
                        type="button"
                        className="stats-sort-button"
                        onClick={() => handleStatsSort("accuracy")}
                      >
                        Accuracy
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statsRows.map((row) => (
                    <tr key={row.caseKey} data-case-key={row.caseKey}>
                      <td className="stats-case-cell">
                        <div className="stats-case-icon">
                          <button
                            type="button"
                            className="stats-case-button"
                            onClick={() => handleStatsCaseToggle(row.caseKey)}
                            aria-label={
                              revealedStatsCases[row.caseKey]
                                ? "Hide correct answer"
                                : "Show correct answer"
                            }
                          >
                            <FtoCenter
                              mainColor={row.mainColor}
                              revealedSecondary={{
                                position: row.revealedPosition,
                                color: row.revealedColor,
                              }}
                              targetPosition={row.targetPosition}
                              targetSecondaryColor={
                                revealedStatsCases[row.caseKey]
                                  ? row.targetSecondaryColor
                                  : null
                              }
                            />
                          </button>
                        </div>
                      </td>
                      <td>{formatAverageTime(row.averageTimeMs)}</td>
                      <td>{Math.round(row.accuracy * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="stats-empty">No case stats yet.</p>
            )}
          </div>
        ) : null}
      </aside>
    </main>
  );
}
