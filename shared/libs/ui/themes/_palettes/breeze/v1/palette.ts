import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE breeze v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from breeze v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFFFF", black: "#16191D" },
    brand: { "1": "#16191D", "2": "#3B9DF2", "3": "#CFE6FF", "4": "#6B7280" },
    status: { success: "#1CB85C", info: "#3B9DF2", warning: "#FFB020", error: "#FF5A5F" },
    content: {
      tomato: { standard: "#D95B41", soft: "#FFDED6" },
      red: { standard: "#D95757", soft: "#FFDDDA" },
      ruby: { standard: "#D9556B", soft: "#FFDDDF" },
      crimson: { standard: "#DD5083", soft: "#FFDCE5" },
      pink: { standard: "#CC509B", soft: "#FFD9ED" },
      plum: { standard: "#A454B1", soft: "#F3D9F7" },
      purple: { standard: "#8A56BA", soft: "#E9DAFB" },
      violet: { standard: "#6D5CC1", soft: "#DFDDFE" },
      iris: { standard: "#5D60C7", soft: "#D9DEFF" },
      indigo: { standard: "#4567CD", soft: "#D4E1FF" },
      blue: { standard: "#3391EF", soft: "#D8EAFF" },
      sky: { standard: "#8CE0F7", soft: "#E8FAFF" },
      cyan: { standard: "#38A0BF", soft: "#D3EEF8" },
      teal: { standard: "#3BA293", soft: "#D4EFE9" },
      jade: { standard: "#44A084", soft: "#D5EEE5" },
      green: { standard: "#47A171", soft: "#D6EFDF" },
      grass: { standard: "#56A462", soft: "#D8EFDA" },
      mint: { standard: "#95E7D4", soft: "#E5FCF6" },
      lime: { standard: "#C1EB7A", soft: "#F0FEDD" },
      yellow: { standard: "#FBE65C", soft: "#FFFBDD" },
      amber: { standard: "#F8C75F", soft: "#FFF4DF" },
      orange: { standard: "#EB753A", soft: "#FFE4D9" },
      brown: { standard: "#A88160", soft: "#F1E4DA" },
      bronze: { standard: "#9D8175", soft: "#EEE4E0" },
      gold: { standard: "#95846A", soft: "#EBE5DD" },
    },
    custom: {
      lavender: "#E7D9FF",
      ice: "#EEF3FA",
      sky: "#145FA6",
    },
    semanticTokens: { primary: "#16191D", secondary: "#3B9DF2", accent: "#CFE6FF", muted: "#6B7280" },
  },

  gradients: {
    progress: { type: "linear", angle: 90, stops: [{ color: "content-purple-standard" }, { color: "content-violet-standard" }] },
    hero: { type: "linear", angle: 135, stops: [{ color: "accent" }, { color: "custom-lavender" }] },
  },
};
