import { colorPalette } from "../data/colors";

const VIEWBOX_SIZE = 240;
const CENTER = 120;
const HEX_SIDE = 68;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIDE;
const OUTER_TRIANGLE_HEIGHT = 28;

const HEX_POINTS = {
  topLeft: { x: CENTER - HEX_SIDE / 2, y: CENTER - HEX_HEIGHT / 2 },
  topRight: { x: CENTER + HEX_SIDE / 2, y: CENTER - HEX_HEIGHT / 2 },
  rightMid: { x: CENTER + HEX_SIDE, y: CENTER },
  bottomRight: { x: CENTER + HEX_SIDE / 2, y: CENTER + HEX_HEIGHT / 2 },
  bottomLeft: { x: CENTER - HEX_SIDE / 2, y: CENTER + HEX_HEIGHT / 2 },
  leftMid: { x: CENTER - HEX_SIDE, y: CENTER },
};

const POSITION_SIDES = {
  topLeft: [HEX_POINTS.leftMid, HEX_POINTS.topLeft],
  topRight: [HEX_POINTS.topRight, HEX_POINTS.rightMid],
  bottom: [HEX_POINTS.bottomLeft, HEX_POINTS.bottomRight],
};

const POSITION_LABELS = {
  topRight: "top right",
  topLeft: "top left",
  bottom: "bottom",
};

function toPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
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
  const positionPolygons = Object.fromEntries(
    Object.entries(POSITION_SIDES).map(([position, [start, end]]) => [
      position,
      [start, end, buildOuterApex(start, end)],
    ]),
  );

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className="fto-center"
      role="img"
      aria-label={`FTO center with ${POSITION_LABELS[targetPosition]} piece highlighted`}
    >
      <polygon
        points={toPoints([
          HEX_POINTS.topLeft,
          HEX_POINTS.topRight,
          HEX_POINTS.rightMid,
          HEX_POINTS.bottomRight,
          HEX_POINTS.bottomLeft,
          HEX_POINTS.leftMid,
        ])}
        fill={mainFill}
        stroke="rgba(15, 23, 42, 0.28)"
        strokeWidth="2"
      />

      {[
        HEX_POINTS.topLeft,
        HEX_POINTS.topRight,
        HEX_POINTS.leftMid,
        HEX_POINTS.rightMid,
        HEX_POINTS.bottomLeft,
        HEX_POINTS.bottomRight,
      ].map(
        (point, index) => (
          <line
            key={`main-line-${index}`}
            x1={CENTER}
            y1={CENTER}
            x2={point.x}
            y2={point.y}
            stroke="rgba(15, 23, 42, 0.72)"
            strokeWidth="1.5"
          />
        ),
      )}

      {Object.entries(positionPolygons).map(([position, polygon]) => {
        const isRevealed = position === revealedSecondary.position;
        const isTarget = position === targetPosition;
        const wedgeFill = isRevealed ? getColorHex(revealedSecondary.color) : mainFill;

        return (
          <g key={position} data-position={position}>
            {isTarget ? (
              <polygon
                points={toPoints(polygon)}
                fill="none"
                stroke="#111827"
                strokeLinejoin="round"
                strokeWidth="7"
                filter="url(#target-shadow)"
              />
            ) : null}
            <polygon
              points={toPoints(polygon)}
              fill={wedgeFill}
              stroke={isTarget ? "#f8fafc" : "rgba(15, 23, 42, 0.68)"}
              strokeLinejoin="round"
              strokeWidth={isTarget ? "2.2" : "2.5"}
            />
          </g>
        );
      })}

      <defs>
        <filter id="target-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.4"
            floodColor="#111827"
            floodOpacity="0.16"
          />
        </filter>
      </defs>
    </svg>
  );
}

function buildOuterApex(start, end) {
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const edge = {
    x: end.x - start.x,
    y: end.y - start.y,
  };
  const edgeLength = Math.hypot(edge.x, edge.y) || 1;
  const normalA = { x: -edge.y / edgeLength, y: edge.x / edgeLength };
  const normalB = { x: edge.y / edgeLength, y: -edge.x / edgeLength };
  const candidateA = {
    x: midpoint.x + normalA.x * OUTER_TRIANGLE_HEIGHT,
    y: midpoint.y + normalA.y * OUTER_TRIANGLE_HEIGHT,
  };
  const candidateB = {
    x: midpoint.x + normalB.x * OUTER_TRIANGLE_HEIGHT,
    y: midpoint.y + normalB.y * OUTER_TRIANGLE_HEIGHT,
  };

  return distanceFromCenter(candidateA) > distanceFromCenter(candidateB)
    ? candidateA
    : candidateB;
}

function distanceFromCenter(point) {
  return Math.hypot(point.x - CENTER, point.y - CENTER);
}
