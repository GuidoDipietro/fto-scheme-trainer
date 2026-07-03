import { colorPalette } from "../data/colors";

const VIEWBOX_SIZE = 240;
const CENTER = 120;
const HEX_RADIUS = 72;
const INNER_RADIUS = 34;

const POSITION_ANGLES = {
  topRight: -30,
  topLeft: -150,
  bottom: 90,
};

const POSITION_LABELS = {
  topRight: "top right",
  topLeft: "top left",
  bottom: "bottom",
};

function polarPoint(radius, angleDegrees) {
  const angle = (Math.PI / 180) * angleDegrees;

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function toPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function createWedge(angleDegrees) {
  const start = polarPoint(INNER_RADIUS, angleDegrees - 30);
  const end = polarPoint(INNER_RADIUS, angleDegrees + 30);
  const outer = polarPoint(HEX_RADIUS, angleDegrees);

  return [start, end, outer];
}

function createHexTriangle(index) {
  const start = polarPoint(0, 0);
  const left = polarPoint(INNER_RADIUS, index * 60 - 30);
  const right = polarPoint(INNER_RADIUS, index * 60 + 30);

  return [start, left, right];
}

function getColorHex(colorId) {
  return colorPalette[colorId]?.hex ?? colorId;
}

export function FtoCenter({
  mainColor,
  revealedSecondary,
  targetPosition,
}) {
  const mainFill = getColorHex(mainColor);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className="fto-center"
      role="img"
      aria-label={`FTO center with ${POSITION_LABELS[targetPosition]} piece highlighted`}
    >
      <g transform={`translate(${CENTER}, ${CENTER})`}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const points = createHexTriangle(index).map((point) => ({
            x: point.x - CENTER,
            y: point.y - CENTER,
          }));

          return (
            <polygon
              key={`hex-${index}`}
              points={toPoints(points)}
              fill={mainFill}
              stroke="rgba(15, 23, 42, 0.28)"
              strokeWidth="2"
            />
          );
        })}
      </g>

      {Object.entries(POSITION_ANGLES).map(([position, angle]) => {
        const isRevealed = position === revealedSecondary.position;
        const isTarget = position === targetPosition;
        const wedgeFill = isRevealed ? getColorHex(revealedSecondary.color) : mainFill;
        const wedgePoints = createWedge(angle);

        return (
          <g key={position} data-position={position}>
            <polygon
              points={toPoints(wedgePoints)}
              fill={wedgeFill}
              stroke={isTarget ? "#f8fafc" : "rgba(15, 23, 42, 0.42)"}
              strokeWidth={isTarget ? "5" : "3"}
              filter={isTarget ? "url(#target-glow)" : undefined}
            />
            {isTarget ? (
              <polygon
                points={toPoints(wedgePoints)}
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="10"
                opacity="0.75"
              />
            ) : null}
          </g>
        );
      })}

      <defs>
        <filter id="target-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="6"
            floodColor="#fff7d6"
            floodOpacity="0.95"
          />
        </filter>
      </defs>
    </svg>
  );
}
