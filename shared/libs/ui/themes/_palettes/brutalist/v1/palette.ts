import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE brutalist v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from brutalist v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFFFF", black: "#000000" },
    brand: { "1": "#000000", "2": "#D9FF00", "3": "#F4FFB0", "4": "#3A3A3A" },
    status: { success: "#00C853", info: "#2979FF", warning: "#FFB300", error: "#FF3B30" },
    content: {
      tomato: { standard: "#F33500", soft: "#FF9F8A" },
      red: { standard: "#F42A3E", soft: "#FF9D98" },
      ruby: { standard: "#F4265F", soft: "#FF9BA6" },
      crimson: { standard: "#F80380", soft: "#FF9AB8" },
      pink: { standard: "#E31CA4", soft: "#FF8FCF" },
      plum: { standard: "#B438C6", soft: "#EB85FB" },
      purple: { standard: "#9440D6", soft: "#C993FF" },
      violet: { standard: "#704CE1", soft: "#AA9EFF" },
      iris: { standard: "#5A52EA", soft: "#9AA4FF" },
      indigo: { standard: "#355CF2", soft: "#89AAFF" },
      blue: { standard: "#0090FF", soft: "#90C4FF" },
      sky: { standard: "#79E2FF", soft: "#BCF0FF" },
      cyan: { standard: "#00A2C7", soft: "#6ED1F2" },
      teal: { standard: "#00A594", soft: "#6FD5C5" },
      jade: { standard: "#00A582", soft: "#6FD5B5" },
      green: { standard: "#00A767", soft: "#6FD79E" },
      grass: { standard: "#28AB4A", soft: "#78DA86" },
      mint: { standard: "#6FEED4", soft: "#98FEE7" },
      lime: { standard: "#B7F137", soft: "#CEFF76" },
      yellow: { standard: "#FFE629", soft: "#FFF39F" },
      amber: { standard: "#FFC53D", soft: "#FFE1A4" },
      orange: { standard: "#FA6800", soft: "#FFB390" },
      brown: { standard: "#B37C4C", soft: "#E3B288" },
      bronze: { standard: "#A67E6D", soft: "#D7B3A4" },
      gold: { standard: "#9A825E", soft: "#CDB897" },
    },
    semanticTokens: { primary: "#000000", secondary: "#D9FF00", accent: "#F4FFB0", muted: "#3A3A3A" },
  },
};
