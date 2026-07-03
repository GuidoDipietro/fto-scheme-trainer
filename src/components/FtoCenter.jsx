import { colorPalette } from "../data/colors";

const VIEWBOX_SIZE = 240;
const CENTER = 120;
const HEX_SIDE = 68;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIDE;
const OUTER_TRIANGLE_HEIGHT = 28;
const DISABLED_CENTER_FILL = "#d1d5db";

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

const CENTER_TRIANGLES = [
  [HEX_POINTS.topLeft, HEX_POINTS.topRight],
  [HEX_POINTS.topRight, HEX_POINTS.rightMid],
  [HEX_POINTS.rightMid, HEX_POINTS.bottomRight],
  [HEX_POINTS.bottomRight, HEX_POINTS.bottomLeft],
  [HEX_POINTS.bottomLeft, HEX_POINTS.leftMid],
  [HEX_POINTS.leftMid, HEX_POINTS.topLeft],
];

const ACTIVE_TRIANGLES_BY_PAIR = {
  "bottom-topLeft": [3, 4, 5],
  "bottom-topRight": [1, 2, 3],
  "topLeft-topRight": [5, 0, 1],
};

const HEX_OUTLINE_POINTS = [
  HEX_POINTS.topLeft,
  HEX_POINTS.topRight,
  HEX_POINTS.rightMid,
  HEX_POINTS.bottomRight,
  HEX_POINTS.bottomLeft,
  HEX_POINTS.leftMid,
];

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
  const activeTriangles = getActiveCenterTriangles(
    revealedSecondary.position,
    targetPosition,
  );
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
      {CENTER_TRIANGLES.map(([start, end], index) => (
        <polygon
          key={`center-triangle-${index}`}
          data-center-triangle={index}
          points={toPoints([{ x: CENTER, y: CENTER }, start, end])}
          fill={activeTriangles.has(index) ? mainFill : DISABLED_CENTER_FILL}
        />
      ))}

      {Object.entries(positionPolygons).map(([position, polygon]) => {
        const isRevealed = position === revealedSecondary.position;
        const wedgeFill = isRevealed ? getColorHex(revealedSecondary.color) : "transparent";

        return (
          <g key={`${position}-fill`} data-position={position}>
            <polygon
              points={toPoints(polygon)}
              fill={wedgeFill}
            />
          </g>
        );
      })}

      <polygon
        points={toPoints(HEX_OUTLINE_POINTS)}
        fill="none"
        stroke="#000000"
        strokeWidth="1.75"
        strokeLinejoin="round"
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
            stroke="#000000"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        ),
      )}

      {Object.entries(positionPolygons).map(([position, polygon]) => {
        const isTarget = position === targetPosition;
        const isHidden = position !== revealedSecondary.position && !isTarget;
        const [start, end, apex] = polygon;
        const labelPoint = getInsetTriangleLabelPoint(polygon);

        return (
          <g key={`${position}-edges`} data-position={`${position}-edges`}>
            {isHidden ? null : (
              <>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={apex.x}
                  y2={apex.y}
                  stroke="#000000"
                  strokeWidth={isTarget ? "2.25" : "1.75"}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <line
                  x1={apex.x}
                  y1={apex.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#000000"
                  strokeWidth={isTarget ? "2.25" : "1.75"}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            )}

            {isTarget ? (
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                fill="#dc2626"
                fillOpacity="0.72"
                fontSize="16"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                ?
              </text>
            ) : null}
          </g>
        );
      })}
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

function getActiveCenterTriangles(revealedPosition, targetPosition) {
  const pairKey = [revealedPosition, targetPosition].sort().join("-");
  const indices = ACTIVE_TRIANGLES_BY_PAIR[pairKey] ?? [];

  return new Set(indices);
}

function getTriangleCentroid(points) {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };
}

function getInsetTriangleLabelPoint(points) {
  const [start, end, apex] = points;
  const baseMidpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  return {
    x: baseMidpoint.x + (apex.x - baseMidpoint.x) * 0.42,
    y: baseMidpoint.y + (apex.y - baseMidpoint.y) * 0.42,
  };
}
