import { centerSchemes, trainerPositions } from "../data/centerSchemes";

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function rotateCenter(center, rotationOffset) {
  const normalizedOffset = rotationOffset % trainerPositions.length;
  const rotatedSecondaryColorsByPosition = Object.fromEntries(
    trainerPositions.map((position, index) => {
      const sourcePosition =
        trainerPositions[
          (index + normalizedOffset) % trainerPositions.length
        ];

      return [position, center.secondaryColorsByPosition[sourcePosition]];
    }),
  );

  return {
    ...center,
    rotationOffset: normalizedOffset,
    secondaryColorsByPosition: rotatedSecondaryColorsByPosition,
  };
}

export function buildPrompt(center, revealedPosition, targetPosition) {
  if (revealedPosition === targetPosition) {
    throw new Error("revealedPosition and targetPosition must differ");
  }

  const positions = trainerPositions.filter(
    (position) => position !== revealedPosition,
  );
  const correctAnswer = center.secondaryColorsByPosition[targetPosition];
  const distractor = positions
    .filter((position) => position !== targetPosition)
    .map((position) => center.secondaryColorsByPosition[position])[0];

  return {
    center,
    revealedSecondary: {
      position: revealedPosition,
      color: center.secondaryColorsByPosition[revealedPosition],
    },
    targetPosition,
    correctAnswer,
    distractor,
    answerOptions: shuffle([correctAnswer, distractor]),
  };
}

function shuffle(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

export function generatePrompt(selectedCenterIds) {
  const availableCenters =
    selectedCenterIds?.length > 0
      ? centerSchemes.filter((center) => selectedCenterIds.includes(center.id))
      : centerSchemes;

  if (availableCenters.length === 0) {
    throw new Error("generatePrompt requires at least one selectable center");
  }

  const center = randomItem(availableCenters);
  const rotationOffset = randomItem([0, 1, 2]);
  const revealedPosition = randomItem(trainerPositions);
  const targetPosition = randomItem(
    trainerPositions.filter((position) => position !== revealedPosition),
  );

  return buildPrompt(
    rotateCenter(center, rotationOffset),
    revealedPosition,
    targetPosition,
  );
}
