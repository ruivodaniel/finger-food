import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE wireframes v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from wireframes v2.

export const palette: Palette = {
  colors: {
    main: {
      white: "#ffffff",
      black: "#000000",
    },
    brand: {
      "1": "#000000",
      "2": "#666666",
      "3": "#999999",
      "4": "#cccccc",
    },
    status: {
      success: "content-green-soft",
      info: "content-blue-standard",
      warning: "content-orange-soft",
      error: "content-red-standard",
    },
    content: {
      tomato: { standard: "#F33500", soft: "#FFA995" },
      red: { standard: "#FC0436", soft: "#FFA6A2" },
      ruby: { standard: "#FB005B", soft: "#FFA5AE" },
      crimson: { standard: "#F90080", soft: "#FFA5BE" },
      pink: { standard: "#E700A5", soft: "#FF9BD3" },
      plum: { standard: "#B82CCC", soft: "#E699F2" },
      purple: { standard: "#9637DE", soft: "#CD9EFF" },
      violet: { standard: "#7145EB", soft: "#B1A7FF" },
      iris: { standard: "#5A4CF4", soft: "#A3ACFF" },
      indigo: { standard: "#3157FD", soft: "#94B2FF" },
      blue: { standard: "#0090FF", soft: "#9BCAFF" },
      sky: { standard: "#79E2FF", soft: "#C3F1FF" },
      cyan: { standard: "#00A2C7", soft: "#92D3E9" },
      teal: { standard: "#00A594", soft: "#92D5C9" },
      jade: { standard: "#00A582", soft: "#92D5BE" },
      green: { standard: "#00A767", soft: "#92D6AE" },
      grass: { standard: "#03AD41", soft: "#92DA9B" },
      mint: { standard: "#61F0D4", soft: "#B0FBE9" },
      lime: { standard: "#B5F200", soft: "#D6FD97" },
      yellow: { standard: "#FFE629", soft: "#FFF4A8" },
      amber: { standard: "#FFC53D", soft: "#FFE3AD" },
      orange: { standard: "#FA6800", soft: "#FFBA9B" },
      brown: { standard: "#B77B45", soft: "#E1BB9B" },
      bronze: { standard: "#A87D6B", soft: "#D7BBB0" },
      gold: { standard: "#9C825A", soft: "#CFBEA6" },
    },
    semanticTokens: {
      primary: "#000000",
      secondary: "#666666",
      accent: "#999999",
      muted: "#cccccc",
    },
  },
};
