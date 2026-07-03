# AGENTS Guide

This repository is a small React + Vite app for training FTO center secondary-color recognition.

## Goal

Preserve the current training interaction while making incremental improvements:

- one rendered FTO center
- one revealed secondary-color piece
- one target piece to infer
- two answer buttons
- immediate correct/incorrect feedback

Do not add broad product complexity unless explicitly requested.

## Important Domain Rules

- Center secondary colors are ordered as `topRight -> topLeft -> bottom`.
- Prompt generation must always choose:
  - one revealed position
  - one different target position
  - the correct answer from the target position
  - the distractor as the only other unseen secondary color for that same center
- The hidden third outer piece should remain hidden unless the user requests a different teaching mode.

## Key Files

- `src/App.jsx`
  - owns the current session prompt
  - handles answer submission
  - advances to the next prompt
- `src/components/FtoCenter.jsx`
  - owns the SVG geometry and rendering rules
  - this file is sensitive to visual regressions
- `src/lib/generatePrompt.js`
  - owns prompt construction rules
- `src/data/centerSchemes.js`
  - canonical center mappings
- `src/data/colors.js`
  - visual palette values

## Working Guidelines

- Keep the UI minimal unless asked otherwise.
- Prefer visual clarity over decorative styling.
- Be careful with SVG linework.
  - Shared edges can look thicker if stroked twice.
  - Fill ordering matters.
  - Small coordinate changes can create obvious visual artifacts.
- When changing FTO geometry, test all three target positions:
  - `topLeft`
  - `topRight`
  - `bottom`
- When changing target cues, verify they stay inside the target triangle and remain legible on all centers.

## Testing Expectations

Always run:

```bash
npm test
```

When changing build config or deployment behavior, also run:

```bash
npm run build
```

## Contribution Strategy

Prefer small, isolated steps:

1. update data, geometry, or UI behavior
2. adjust tests to match intended behavior
3. run the test suite
4. summarize the user-visible effect clearly

## Things To Avoid

- Do not silently change the center ordering convention.
- Do not replace the current trainer logic with a more generic quiz model unless requested.
- Do not reintroduce large banners, dashboards, or extra controls unless requested.
- Do not add persistence or spaced repetition logic yet unless the user asks for it.
