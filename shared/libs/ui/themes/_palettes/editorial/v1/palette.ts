import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE editorial v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from editorial v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FBF9F4", black: "#1A1A1A" },
    brand: { "1": "#1A1A1A", "2": "#C8401F", "3": "#E8C9BC", "4": "#5A564E" },
    status: { success: "#2F6B3A", info: "#3B5B8A", warning: "#B8860B", error: "#B8321F" },
    content: {
      tomato: { standard: "#A55746", soft: "#DEBAB2" },
      red: { standard: "#A55552", soft: "#DEB9B7" },
      ruby: { standard: "#A6545F", soft: "#DEB9BC" },
      crimson: { standard: "#A9526E", soft: "#E0B9C2" },
      pink: { standard: "#9C507C", soft: "#D9B7C9" },
      plum: { standard: "#7E4D85", soft: "#CBB5CE" },
      purple: { standard: "#6A4C89", soft: "#C1B4D0" },
      violet: { standard: "#564E8C", soft: "#B7B5D1" },
      iris: { standard: "#4C518F", soft: "#B2B7D3" },
      indigo: { standard: "#3E5594", soft: "#ADB9D5" },
      blue: { standard: "#457AB4", soft: "#B3C9E2" },
      sky: { standard: "#8FC1D0", soft: "#D2E6EC" },
      cyan: { standard: "#4A8497", soft: "#B6CCD5" },
      teal: { standard: "#4A837A", soft: "#B6CCC8" },
      jade: { standard: "#4D8170", soft: "#B6CBC3" },
      green: { standard: "#4E8264", soft: "#B7CCBE" },
      grass: { standard: "#56855C", soft: "#BACDBB" },
      mint: { standard: "#95C7BA", soft: "#D5E8E3" },
      lime: { standard: "#B0CC87", soft: "#DFEBCF" },
      yellow: { standard: "#D8CC7D", soft: "#EFEBCC" },
      amber: { standard: "#CFB174", soft: "#ECE0C8" },
      orange: { standard: "#B76E4C", soft: "#E5C4B6" },
      brown: { standard: "#856D59", soft: "#CDC2B9" },
      bronze: { standard: "#7E6C65", soft: "#CAC2BE" },
      gold: { standard: "#786D5D", soft: "#C7C2BB" },
    },
    semanticTokens: { primary: "#1A1A1A", secondary: "#C8401F", accent: "#E8C9BC", muted: "#5A564E" },
  },
};
