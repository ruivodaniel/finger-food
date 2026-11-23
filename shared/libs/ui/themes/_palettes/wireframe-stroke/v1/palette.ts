import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE wireframe-stroke v1 — the colours alone: colors and gradients, nothing else. The colour modes are the theme's: they do not depend on the palette. Extracted from wireframe stroke v4.

export const palette: Palette = {
  colors: {
    main: { white: "#ffffff", black: "#1a1823" },
    brand: { "1": "#4a2d8f", "2": "#241a3d", "3": "#a495c7", "4": "#6b6779" },
    status: { success: "#2f6d4f", info: "#4a2d8f", warning: "#c99b2a", error: "#a83232" },
    content: {
      tomato: { standard: "#B05A48", soft: "#F1CEC6" },
      red: { standard: "#B05855", soft: "#F1CDCA" },
      ruby: { standard: "#B05763", soft: "#F1CDCF" },
      crimson: { standard: "#B45474", soft: "#F2CCD6" },
      pink: { standard: "#A65283", soft: "#EDCBDC" },
      plum: { standard: "#86518F", soft: "#DFCBE2" },
      purple: { standard: "#715093", soft: "#D7CBE5" },
      violet: { standard: "#5C5297", soft: "#CDCCE7" },
      iris: { standard: "#50559B", soft: "#C9CDE9" },
      indigo: { standard: "#415A9F", soft: "#C4CFEB" },
      blue: { standard: "#4580C0", soft: "#C6DCF4" },
      sky: { standard: "#91C8D9", soft: "#DDF1F6" },
      cyan: { standard: "#4A8A9F", soft: "#C9DEE6" },
      teal: { standard: "#4B8A80", soft: "#C9DFDA" },
      jade: { standard: "#4E8875", soft: "#CADED6" },
      green: { standard: "#4F8968", soft: "#CADED1" },
      grass: { standard: "#588C5F", soft: "#CDDFCE" },
      mint: { standard: "#97CEC1", soft: "#DFF2ED" },
      lime: { standard: "#B5D388", soft: "#E9F4DA" },
      yellow: { standard: "#E0D37B", soft: "#F7F3D6" },
      amber: { standard: "#D8B773", soft: "#F6EBD4" },
      orange: { standard: "#C2714C", soft: "#F5D5C8" },
      brown: { standard: "#8D725C", soft: "#E0D5CD" },
      bronze: { standard: "#85726A", soft: "#DDD5D2" },
      gold: { standard: "#7E7362", soft: "#DAD6CF" },
    },
    semanticTokens: { primary: "#4a2d8f", secondary: "#241a3d", accent: "#a495c7", muted: "#6b6779" },
  },
};
