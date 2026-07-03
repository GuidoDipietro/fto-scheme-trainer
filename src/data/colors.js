export const colorPalette = {
  gray: { label: "Gray", hex: "#9ca3af" },
  orange: { label: "Orange", hex: "#f97316" },
  green: { label: "Green", hex: "#22c55e" },
  yellow: { label: "Yellow", hex: "#facc15" },
  red: { label: "Red", hex: "#ef4444" },
  blue: { label: "Blue", hex: "#3b82f6" },
  white: { label: "White", hex: "#f8fafc" },
  purple: { label: "Purple", hex: "#a855f7" },
  pink: { label: "Pink", hex: "#ec4899" },
  teal: { label: "Teal", hex: "#14b8a6" },
  lime: { label: "Lime", hex: "#84cc16" },
  brown: { label: "Brown", hex: "#92400e" },
};

export function getColorLabel(colorId) {
  return colorPalette[colorId]?.label ?? colorId;
}
