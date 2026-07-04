import { describe, expect, it } from "vitest";
import { centerSchemes } from "../data/centerSchemes";
import { buildPrompt, generatePrompt } from "./generatePrompt";

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

  it("limits prompt generation to the selected centers", () => {
    for (let index = 0; index < 25; index += 1) {
      expect(generatePrompt(["green", "gray"]).center.id).toMatch(/green|gray/);
    }
  });

  it("throws when no selected centers are available", () => {
    expect(() => generatePrompt(["pink"])).toThrow(/at least one selectable center/i);
  });
});
