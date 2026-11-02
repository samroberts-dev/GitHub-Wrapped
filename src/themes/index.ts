export const themes = {
  default: {
    name: "Wrapped Default",
    accent: "#c3fa68",
    background: "#21132e",
  },
  midnight: { name: "Midnight", accent: "#a8baff", background: "#101b35" },
  sunset: { name: "Sunset", accent: "#ffb17b", background: "#3d182d" },
} as const;
export type ThemeId = keyof typeof themes;
