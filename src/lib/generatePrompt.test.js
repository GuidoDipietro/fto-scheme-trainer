import { describe, expect, it, vi } from "vitest";
import { centerSchemes } from "../data/centerSchemes";
import {
  buildCaseKey,
  buildPrompt,
  generatePrompt,
  rotateCenter,
} from "./generatePrompt";

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

  it("builds a stable case key from center, shown color, target, and offset", () => {
    const center = rotateCenter(centerSchemes[1], 2);

    expect(buildCaseKey(center, "blue", "topLeft")).toBe(
      "orange:blue:topLeft:2",
    );
  });

  it("rotates center secondary colors by one step", () => {
    const center = rotateCenter(centerSchemes[1], 1);

    expect(center.secondaryColorsByPosition).toEqual({
      topRight: "purple",
      topLeft: "blue",
      bottom: "yellow",
    });
  });

  it("rotates center secondary colors by two steps", () => {
    const center = rotateCenter(centerSchemes[1], 2);

    expect(center.secondaryColorsByPosition).toEqual({
      topRight: "blue",
      topLeft: "yellow",
      bottom: "purple",
    });
  });

  it("limits prompt generation to the selected centers", () => {
    for (let index = 0; index < 25; index += 1) {
      expect(generatePrompt(["green", "gray"]).center.id).toMatch(/green|gray/);
    }
  });

  it("includes rotation offsets when generating prompts", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(1 / 3)
      .mockReturnValueOnce(2 / 3)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const prompt = generatePrompt(["orange"]);

    expect(prompt.center.rotationOffset).toBe(2);
    expect(prompt.center.secondaryColorsByPosition).toEqual({
      topRight: "blue",
      topLeft: "yellow",
      bottom: "purple",
    });
    expect(prompt.caseKey).toBe("orange:blue:topLeft:2");

    vi.restoreAllMocks();
  });

  it("throws when no selected centers are available", () => {
    expect(() => generatePrompt(["pink"])).toThrow(/at least one selectable center/i);
  });
});
