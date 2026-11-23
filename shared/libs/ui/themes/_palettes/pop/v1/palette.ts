import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE pop v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from pop v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFBF2", black: "#2B1E1E" },
    brand: { "1": "#2F3FD8", "2": "#1B258A", "3": "#B5BCF0", "4": "#6B5A58" },
    status: { success: "#5BA865", info: "#3F7FB8", warning: "#E8B931", error: "#D7392E" },
    content: {
      tomato: { standard: "#CE5840", soft: "#FFD8CF" },
      red: { standard: "#CE5554", soft: "#FFD8D5" },
      ruby: { standard: "#CE5367", soft: "#FFD7DA" },
      crimson: { standard: "#D24F7E", soft: "#FFD7E1" },
      pink: { standard: "#C14E94", soft: "#FFD3EA" },
      plum: { standard: "#9C51A7", soft: "#F0D4F4" },
      purple: { standard: "#8353B0", soft: "#E5D5F9" },
      violet: { standard: "#6758B6", soft: "#DAD8FC" },
      iris: { standard: "#585CBB", soft: "#D4DAFF" },
      indigo: { standard: "#4262C1", soft: "#CDDCFF" },
      blue: { standard: "#358CE2", soft: "#D1E7FF" },
      sky: { standard: "#8BD8EF", soft: "#E1F8FF" },
      cyan: { standard: "#3A99B6", soft: "#CDEBF5" },
      teal: { standard: "#3D9B8D", soft: "#CEEBE5" },
      jade: { standard: "#44997F", soft: "#CFEBE0" },
      green: { standard: "#479A6D", soft: "#D0EBDA" },
      grass: { standard: "#549D5F", soft: "#D3ECD5" },
      mint: { standard: "#93DFCE", soft: "#E1FBF4" },
      lime: { standard: "#BCE47B", soft: "#EDFCD9" },
      yellow: { standard: "#F3E061", soft: "#FFF9D2" },
      amber: { standard: "#EFC161", soft: "#FFF1D7" },
      orange: { standard: "#E0723C", soft: "#FFE0D2" },
      brown: { standard: "#A07C5D", soft: "#EEE0D5" },
      bronze: { standard: "#967C71", soft: "#EAE0DC" },
      gold: { standard: "#8E7E66", soft: "#E7E1D8" },
    },
    semanticTokens: { primary: "#2F3FD8", secondary: "#1B258A", accent: "#B5BCF0", muted: "#6B5A58" },
  },
};
