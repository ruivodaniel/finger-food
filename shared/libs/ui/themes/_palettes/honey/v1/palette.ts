import type { Palette } from "../../../../theme-engine/web/v2";

// PALETTE honey v1 — the colours alone: colors and the gradients made of them. The colour modes are the theme's. Extracted from honey v2.

export const palette: Palette = {
  colors: {
    main: { white: "#FFFFFF", black: "#1D1B18" },
    brand: { "1": "#1D1B18", "2": "#F5C342", "3": "#FBE39A", "4": "#6E6860" },
    status: { success: "#3BA776", info: "#5F7D9C", warning: "#E8A317", error: "#E0574F" },
    content: {
      tomato: { standard: "#DA4B2E", soft: "#FEC1B3" },
      red: { standard: "#DA474B", soft: "#FFBFBB" },
      ruby: { standard: "#DA4562", soft: "#FFBFC4" },
      crimson: { standard: "#DE3D7C", soft: "#FFBECF" },
      pink: { standard: "#CC3F98", soft: "#F8BCDC" },
      plum: { standard: "#A247B0", soft: "#E3BDE8" },
      purple: { standard: "#874BBB", soft: "#D5BFEE" },
      violet: { standard: "#6852C4", soft: "#C5C2F3" },
      iris: { standard: "#5657CA", soft: "#BDC4F6" },
      indigo: { standard: "#3B5ED1", soft: "#B3C8F9" },
      blue: { standard: "#0D8AF3", soft: "#B6D8FF" },
      sky: { standard: "#7BDBF5", soft: "#D1F4FE" },
      cyan: { standard: "#0F9BBE", soft: "#B5DDEC" },
      teal: { standard: "#1A9E8E", soft: "#B6DED6" },
      jade: { standard: "#2B9C7E", soft: "#B8DDCF" },
      green: { standard: "#319D68", soft: "#B9DEC7" },
      grass: { standard: "#45A055", soft: "#BDDFC0" },
      mint: { standard: "#85E2CE", soft: "#D4F7ED" },
      lime: { standard: "#B8E664", soft: "#E4F8C8" },
      yellow: { standard: "#F7DF35", soft: "#FDF5BF" },
      amber: { standard: "#F6BF42", soft: "#FFE9BF" },
      orange: { standard: "#EC681C", soft: "#FFCCB6" },
      brown: { standard: "#A57A55", soft: "#E2CEBF" },
      bronze: { standard: "#9A7B6D", soft: "#DCCEC9" },
      gold: { standard: "#907D61", soft: "#D8D0C4" },
    },
    semanticTokens: { primary: "#1D1B18", secondary: "#F5C342", accent: "#FBE39A", muted: "#6E6860" },
  },

  gradients: {
    wash: [
      {
        type: "radial",
        shape: "ellipse",
        position: "90% 0%",
        stops: [
          { color: "content-orange-soft", position: "0%" },
          { color: "content-lime-soft", position: "40%" },
          { color: "content-mint-soft", position: "72%" },
        ],
      },
      {
        type: "linear",
        angle: 160,
        stops: [{ color: "content-pink-soft" }, { color: "content-mint-soft", position: "55%" }, { color: "content-lime-soft" }],
      },
    ],
    hero: { type: "linear", angle: 135, stops: [{ color: "accent" }, { color: "secondary" }] },
    clear: { type: "linear", angle: 0, stops: [{ color: "transparent" }, { color: "transparent" }] },
    progress: { type: "linear", angle: 90, stops: [{ color: "accent" }, { color: "secondary" }] },
  },
};
