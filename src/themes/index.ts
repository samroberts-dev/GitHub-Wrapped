export const themes = {
  default: {
    name: "Wrapped Default",
    accent: "#9ee493",
    background: "#2f4858",
    text: "#edf7f4",
    muted: "#bed0d9",
  },
  midnight: {
    name: "Midnight",
    accent: "#a8baff",
    background: "#101b35",
    text: "#edf7f4",
    muted: "#bed0d9",
  },
  sunset: {
    name: "Sunset",
    accent: "#ffb17b",
    background: "#3d182d",
    text: "#fff5ed",
    muted: "#e0c9d2",
  },
} as const;
export type ThemeId = keyof typeof themes;
