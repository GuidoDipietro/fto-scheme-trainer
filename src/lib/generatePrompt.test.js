import { describe, expect, it } from "vitest";
import { centerSchemes } from "../data/centerSchemes";
import { buildPrompt } from "./generatePrompt";

describe("buildPrompt", () => {
  it("uses the target position secondary color as the correct answer", () => {
    const center = centerSchemes[0];
    const prompt = buildPrompt(center, "topRight", "topLeft");

    expect(prompt.correctAnswer).toBe(
      center.secondaryColorsByPosition.topLeft,
    );
    expect(prompt.revealedSecondary.color).toBe(
      center.secondaryColorsByPosition.topRight,
    );
  });

  it("uses the only other unseen secondary as the distractor", () => {
    const center = centerSchemes[0];
    const prompt = buildPrompt(center, "bottom", "topRight");

    expect(prompt.distractor).toBe(center.secondaryColorsByPosition.topLeft);
    expect(new Set(prompt.answerOptions).size).toBe(2);
  });

  it("throws when revealed and target positions match", () => {
    const center = centerSchemes[0];

    expect(() => buildPrompt(center, "topRight", "topRight")).toThrow(
      /must differ/i,
    );
  });
});
