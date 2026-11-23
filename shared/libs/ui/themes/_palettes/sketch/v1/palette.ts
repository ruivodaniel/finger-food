import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE sketch v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from sketch v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFFFF", black: "#1E1E1E" },
    brand: { "1": "#1E1E1E", "2": "#2B2B2B", "3": "#F1D3CF", "4": "#F3F1EB" },
    status: { success: "#A3C13A", info: "#7FB7CF", warning: "#E0B93C", error: "#E8604C" },
    content: {
      tomato: { standard: "#C25D47", soft: "#FCD9D1" },
      red: { standard: "#C25A58", soft: "#FCD8D5" },
      ruby: { standard: "#C35968", soft: "#FCD7DA" },
      crimson: { standard: "#C6557C", soft: "#FDD7E0" },
      pink: { standard: "#B7548E", soft: "#F8D6E7" },
      plum: { standard: "#94549E", soft: "#EBD6EE" },
      purple: { standard: "#7D54A4", soft: "#E3D7F1" },
      violet: { standard: "#6458A9", soft: "#DAD8F4" },
      iris: { standard: "#575CAE", soft: "#D5DAF6" },
      indigo: { standard: "#4461B3", soft: "#D0DCF7" },
      blue: { standard: "#4189D4", soft: "#D0E6FE" },
      sky: { standard: "#91D4E7", soft: "#E4F7FC" },
      cyan: { standard: "#4695AE", soft: "#D3E8F0" },
      teal: { standard: "#489689", soft: "#D3E9E4" },
      jade: { standard: "#4C947D", soft: "#D4E8E0" },
      green: { standard: "#4F946D", soft: "#D4E9DC" },
      grass: { standard: "#599762", soft: "#D7E9D8" },
      mint: { standard: "#98DACA", soft: "#E5F8F3" },
      lime: { standard: "#BCDF85", soft: "#EEFADF" },
      yellow: { standard: "#ECDD72", soft: "#FCF8DB" },
      amber: { standard: "#E7BF6E", soft: "#FDF1DA" },
      orange: { standard: "#D47548", soft: "#FFDFD1" },
      brown: { standard: "#9A7A60", soft: "#EBE0D7" },
      bronze: { standard: "#917A70", soft: "#E8E0DD" },
      gold: { standard: "#897B67", soft: "#E5E0DA" },
    },
    semanticTokens: { primary: "#1E1E1E", secondary: "#2B2B2B", accent: "#F1D3CF", muted: "#F3F1EB" },
  },
};
