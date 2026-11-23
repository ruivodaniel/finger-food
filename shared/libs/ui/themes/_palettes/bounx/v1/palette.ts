import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE bounx v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from bounx v1.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFFFF", black: "#1A1813" },
    brand: { "1": "#ff0000", "2": "#1A1813", "3": "#E2902B", "4": "#7C7666" },
    status: { success: "#1F9D5C", info: "#1F9D5C", warning: "#E2902B", error: "#D6453B" },
    content: {
      tomato: { standard: "#C04C34", soft: "#F0B7A9" },
      red: { standard: "#C04849", soft: "#F0B5B1" },
      ruby: { standard: "#C0475C", soft: "#F0B4B9" },
      crimson: { standard: "#C44272", soft: "#F2B3C4" },
      pink: { standard: "#B44288", soft: "#EAB2CF" },
      plum: { standard: "#8F459B", soft: "#D5B2DA" },
      purple: { standard: "#7747A3", soft: "#C7B3DF" },
      violet: { standard: "#5D4CA9", soft: "#B9B5E3" },
      iris: { standard: "#4E50AE", soft: "#B1B8E6" },
      indigo: { standard: "#3856B4", soft: "#A8BBE9" },
      blue: { standard: "#267FD5", soft: "#A9CDF6" },
      sky: { standard: "#7ECBE1", soft: "#CAEBF5" },
      cyan: { standard: "#2B8DAA", soft: "#ACD2DF" },
      teal: { standard: "#2E8E81", soft: "#ADD2CB" },
      jade: { standard: "#368C73", soft: "#AED1C4" },
      green: { standard: "#398D61", soft: "#AFD2BC" },
      grass: { standard: "#489053", soft: "#B3D3B6" },
      mint: { standard: "#86D2C1", soft: "#CEEEE6" },
      lime: { standard: "#B0D76E", soft: "#DEF0C3" },
      yellow: { standard: "#E5D352", soft: "#F5EEBB" },
      amber: { standard: "#E2B553", soft: "#F6E1BA" },
      orange: { standard: "#D2662E", soft: "#F6C1AA" },
      brown: { standard: "#947052", soft: "#D5C3B5" },
      bronze: { standard: "#8A7065", soft: "#D0C3BE" },
      gold: { standard: "#82725B", soft: "#CCC4B9" },
    },
    semanticTokens: { primary: "#ff0000", secondary: "#1A1813", accent: "#E2902B", muted: "#7C7666" },
  },
};
