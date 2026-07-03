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

    const centerTriangles = container.querySelectorAll(
      'polygon[data-center-triangle]',
    );
    const topRight = container.querySelector('[data-position="topRight"] polygon');
    const topLeft = container.querySelector('[data-position="topLeft"] polygon');
    const bottom = container.querySelector('[data-position="bottom"] polygon');
    const topLeftLines = container.querySelectorAll('[data-position="topLeft-edges"] line');
    const bottomLines = container.querySelectorAll('[data-position="bottom-edges"] line');

    expect(topLeft).toBeInTheDocument();
    expect(topLeft).toHaveAttribute("fill", "transparent");
    expect(topLeftLines).toHaveLength(2);
    expect(topLeftLines[0]).toHaveAttribute("stroke", "#000000");
    expect(topLeftLines[0]).toHaveAttribute("stroke-width", "2.25");
    expect(topRight).toHaveAttribute("fill", "#facc15");
    expect(bottom).toHaveAttribute("fill", "transparent");
    expect(bottomLines).toHaveLength(0);
    expect(centerTriangles).toHaveLength(6);
    expect(centerTriangles[0]).toHaveAttribute("fill", "#6b7280");
    expect(centerTriangles[1]).toHaveAttribute("fill", "#6b7280");
    expect(centerTriangles[2]).toHaveAttribute("fill", "#d1d5db");
  });
});
