# FTO Scheme Trainer

A small single-page trainer for learning FTO center secondary-color recognition.

The current app teaches one skill:

- given a center's main color
- given one revealed secondary-color outer piece
- given one outlined target outer piece
- guess the missing secondary color from two color-only buttons

## Current Behavior

- The app renders one FTO center at a time.
- Only the relevant center triangles stay in the active main color.
- The revealed outer triangle shows the hint secondary color.
- The target outer triangle is outline-only and marked with a subtle red `?`.
- The other unseen outer triangle is hidden.
- Answers are checked in memory only.

## Canonical Center Data

Secondary colors are stored in counter-clockwise order:

- `topRight`
- `topLeft`
- `bottom`

Current mappings:

- Gray: yellow, blue, red
- Orange: yellow, purple, blue
- Green: yellow, red, purple

## Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

## Project Layout

- `src/App.jsx`: main trainer loop and answer handling
- `src/components/FtoCenter.jsx`: SVG renderer for the center and outer pieces
- `src/data/centerSchemes.js`: center/color mapping data
- `src/data/colors.js`: shared color palette
- `src/lib/generatePrompt.js`: prompt generation logic

## Next Likely Features

- timing per attempt
- correct/incorrect history
- spaced repetition scheduling
- filtering by center or subset
- GitHub Pages deployment

## Notes

- The app is intentionally minimal right now.
- State is local and resets on refresh.
- Answer buttons are color-only, with accessible labels for screen readers.
