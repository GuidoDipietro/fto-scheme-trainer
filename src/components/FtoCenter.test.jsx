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
    const topLeftPolygons = container.querySelectorAll(
      '[data-position="topLeft"] polygon',
    );
    const topRight = container.querySelector('[data-position="topRight"] polygon');
    const bottom = container.querySelector('[data-position="bottom"] polygon');

    expect(topLeft).toBeInTheDocument();
    expect(topLeftPolygons[0]).toHaveAttribute("stroke-width", "4.5");
    expect(topLeftPolygons[0]).toHaveAttribute("stroke", "#111827");
    expect(topLeftPolygons[1]).toHaveAttribute("fill", "transparent");
    expect(topLeftPolygons[1]).toHaveAttribute("stroke", "#000000");
    expect(topLeftPolygons[1]).toHaveAttribute("stroke-width", "1.75");
    expect(topRight).toHaveAttribute("fill", "#facc15");
    expect(bottom).toHaveAttribute("fill", "transparent");
    expect(bottom).toHaveAttribute("stroke", "transparent");
  });
});
