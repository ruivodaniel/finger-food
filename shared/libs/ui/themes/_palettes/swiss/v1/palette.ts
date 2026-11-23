import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE swiss v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from swiss v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFFFF", black: "#000000" },
    brand: { "1": "#0047FF", "2": "#000000", "3": "#B3C7FF", "4": "#4A4A4A" },
    status: { success: "#008A3E", info: "#000000", warning: "#F29100", error: "#E30613" },
    content: {
      tomato: { standard: "#D33B1B", soft: "#E58A76" },
      red: { standard: "#D3363E", soft: "#E68883" },
      ruby: { standard: "#D33458", soft: "#E68691" },
      crimson: { standard: "#D72873", soft: "#E984A2" },
      pink: { standard: "#C42D90", soft: "#DC83B5" },
      plum: { standard: "#9B3AAA", soft: "#BD84C6" },
      purple: { standard: "#7F3EB5", soft: "#A886CE" },
      violet: { standard: "#6146BE", soft: "#928AD3" },
      iris: { standard: "#4E4BC5", soft: "#858DD8" },
      indigo: { standard: "#3153CC", soft: "#7693DC" },
      blue: { standard: "#0081E5", soft: "#77AFEC" },
      sky: { standard: "#6BD2ED", soft: "#A9E1F2" },
      cyan: { standard: "#0091B3", soft: "#7CB7CC" },
      teal: { standard: "#009485", soft: "#7CB8AE" },
      jade: { standard: "#079374", soft: "#7CB8A3" },
      green: { standard: "#17945D", soft: "#7EB996" },
      grass: { standard: "#349749", soft: "#85BB8B" },
      mint: { standard: "#75D9C4", soft: "#AEE6D8" },
      lime: { standard: "#ADDD51", soft: "#CBE99D" },
      yellow: { standard: "#EED500", soft: "#F2E58E" },
      amber: { standard: "#EEB524", soft: "#F2D08C" },
      orange: { standard: "#E25E00", soft: "#EE9C77" },
      brown: { standard: "#9D704A", soft: "#BEA18A" },
      bronze: { standard: "#927164", soft: "#B6A198" },
      gold: { standard: "#887457", soft: "#AFA391" },
    },
    semanticTokens: { primary: "#0047FF", secondary: "#000000", accent: "#B3C7FF", muted: "#4A4A4A" },
  },
};
