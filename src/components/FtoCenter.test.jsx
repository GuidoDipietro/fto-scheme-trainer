import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FtoCenter } from "./FtoCenter";

describe("FtoCenter", () => {
  it("renders the center and highlights the target position", () => {
    const { container } = render(
      <FtoCenter
        mainColor="gray"
        revealedSecondary={{ position: "topRight", color: "yellow" }}
        targetPosition="topLeft"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: /top left piece highlighted/i,
      }),
    ).toBeInTheDocument();

    const topLeft = container.querySelector('[data-position="topLeft"] polygon');
    const topRight = container.querySelector(
      '[data-position="topRight"] polygon',
    );

    expect(topLeft).toHaveAttribute("stroke-width", "5");
    expect(topRight).toHaveAttribute("fill", "#facc15");
  });
});
