import type { WebTheme } from "../../../types";

// HONEY v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/honey.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Honey — a warm wash, cards without edges, figures without boxes
//   a gradient from sand to honey behind everything, with a honey glow at the top right; cards are translucent white
//   with no border and no shadow; a few carry the honey gradient. Black is the active state; amber is for data only.
//   The rail has no fill: a column of milk tiles, the current one black.
//   interaction: hover whitens a card or a pill and lifts it 1px; pressed presses it flat; the current row is a warmer
//   translucent white; focus is a soft dark ring; 200ms.
//
// L1 read of the mood
//   anchors     background #FFFFFF · foreground #1D1B18 (grays mixed 8% towards the ink: warm)
//   brand       1 #1D1B18 ink (the action, the active tile) · 2 #F5C342 amber (data, the glow) · 3 #FBE39A honey (the gradient's
//               start) · 4 #6E6860 (quiet text)
//   flat        pink #F3EEE6 sand · mint #F5EBD6 · lime #F8E3AE · yellow #F5C342 · orange #F8D264 (the wash and its glow)
//   status      success #3BA776 · info #5F7D9C · warning #E8A317 · error #E0574F — a pale fill, no line
//   fonts       Manrope; headings 500, light and large
//   rhythm      unit 0.75rem · radius md 18 lg 22 xl 26 · pills · no border, no shadow at rest
//
// What the engine cannot do: the KPIs as bare figures (the app's KPIs are plain cards with no concept to address);
// the rail as a grid of tiles two across (the rail is one column: the tiles stack); the status chips' dot.

export const honeyTheme: WebTheme = {
  id: "honey",
  name: "Honey",
  version: 1,
  type: "high-fidelity",
  kind: "product",
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
  typography: {
    fonts: {
      primary: "Manrope, Inter, Helvetica, Arial, sans-serif",
      secondary: "Manrope, Inter, Helvetica, Arial, sans-serif",
      quote: "Manrope, Inter, Helvetica, Arial, sans-serif",
      monoPrimary: "Manrope, Inter, Helvetica, Arial, sans-serif",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      Manrope: { type: "google", url: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 36,
        fontSizeDesktop: 40,
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 23,
        fontSizeDesktop: 26,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 20,
        fontSizeDesktop: 22,
        fontWeight: 500,
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
      },
      heading4: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 17,
        fontWeight: 600,
        lineHeight: 1.35,
      },
      bodyExtraLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      bodyLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      body: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      bodySmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.45,
      },
      bodyExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 12,
        fontWeight: 400,
        lineHeight: 1.4,
      },
      quoteLarge: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      quote: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      quoteSmall: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      code: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      numbersExtraLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 43,
        fontSizeDesktop: 48,
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 32,
        fontSizeDesktop: 36,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0.08em",
      },
      link: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 600,
        lineHeight: 1.5,
      },
    },
  },
  spacing: { unit: 0.75 },
  radius: {
    none: "0px",
    "3xs": "6px",
    "2xs": "8px",
    xs: "12px",
    sm: "14px",
    md: "18px",
    lg: "22px",
    xl: "26px",
    "2xl": "30px",
    "3xl": "34px",
    full: "9999px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 0, y: 40, blur: 90, spread: -30, color: "secondary", opacity: 0.45 }],
    drawer: [{ type: "drop-shadow", x: -24, y: 0, blur: 60, spread: 0, color: "secondary", opacity: 0.3 }],
    popover: [{ type: "drop-shadow", x: 0, y: 12, blur: 28, spread: -10, color: "main-black", opacity: 0.3 }],
    "card-hover": [{ type: "drop-shadow", x: 0, y: 20, blur: 44, spread: -24, color: "secondary", opacity: 0.35 }],
    "pill-hover": [{ type: "drop-shadow", x: 0, y: 10, blur: 20, spread: -10, color: "main-black", opacity: 0.4 }],
    pressed: [{ type: "inner-shadow", x: 0, y: 2, blur: 4, spread: 0, color: "main-black", opacity: 0.3 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "80ms", fast: "140ms", average: "200ms", slow: "320ms", extraSlow: "500ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#1D1B18",
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
      dark: {
        background: "#1D1B18",
        foreground: "#F5EBD6",
        chroma: { saturationFactor: 0.9, gamma: 1 },
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },
  layouts: {
    surface: { interior: { background: "gradient-wash", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none" } },
      },
    },
    secondPageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none" } },
      },
    },
    mainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "transparent", foreground: "smart-fb" },
      },
    },
    secondMainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "transparent", foreground: "smart-fb" },
      },
    },
    leftSidebar: {
      width: "272px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { background: "transparent" },
      },
    },
    rightSidebar: {
      width: "320px",
      sm: { width: "280px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } } },
    },
    contextPanel: {
      width: "320px",
      sm: { width: "260px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: {
        interior: { background: "background", backgroundAlpha: 0.55 },
        boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "none" }, radius: { all: "lg" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "background", foreground: "smart-fb", backgroundAlpha: 0.55 } } },
    },
    container: { sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "transparent", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {}, backgroundAlpha: 0.55 },
      boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "lg" }, effect: "none" },
      defaultTypography: { typographyType: "body", textTransform: "none" },
      transition: { duration: "average", timing: "ease" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
        {
          where: { status: "error" },
          partialSurface: {
            interior: { background: "background", foreground: "status-error" },
            boundary: { border: { color: "transparent" } },
            tint: "status-error",
          },
        },
        {
          where: { status: "success" },
          partialSurface: {
            interior: { background: "background", foreground: "status-success" },
            boundary: { border: { color: "transparent" } },
            tint: "status-success",
          },
        },
        {
          where: { status: "warning" },
          partialSurface: {
            interior: { background: "background", foreground: "status-warning" },
            boundary: { border: { color: "transparent" } },
            tint: "status-warning",
          },
        },
        {
          where: { status: "info" },
          partialSurface: {
            interior: { background: "background", foreground: "status-info" },
            boundary: { border: { color: "transparent" } },
            tint: "status-info",
          },
        },
        {
          where: { emphasis: "hero" },
          partialSurface: {
            interior: { background: "gradient-hero", backgroundAlpha: 1, foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
          },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: {
            interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-600" },
            boundary: { border: { color: "transparent" } },
          },
        },
      ],
    },
    field: {
      sizes: {
        "3xs": {
          partialSurface: { interior: { padding: { x: "2xs", y: "3xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } },
        },
        "2xs": {
          partialSurface: { interior: { padding: { x: "xs", y: "2xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } },
        },
        xs: {
          partialSurface: { interior: { padding: { x: "xs", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } },
        },
        sm: {
          partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } },
        },
        md: { partialSurface: { interior: { padding: { x: "sm", y: "sm" } }, defaultTypography: { typographyType: "body" } } },
        lg: {
          partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "bodyLarge" } },
        },
        xl: {
          partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
        },
        "2xl": {
          partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
        },
        "3xl": {
          partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
        },
      },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "transparent" }, radius: { all: "full" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "transparent" } } } },
          {
            where: { state: "focus" },
            partialSurface: {
              interior: { background: "background" },
              boundary: {
                border: { color: "transparent" },
                outline: { width: "thin", style: "solid", color: "gray-300", offset: "0px" },
              },
            },
          },
          {
            where: { status: "error" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "status-error" } }, tint: "transparent" },
          },
          {
            where: { status: "success" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "status-success" } }, tint: "transparent" },
          },
          {
            where: { status: "warning" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "status-warning" } }, tint: "transparent" },
          },
          {
            where: { state: "disabled" },
            partialSurface: { interior: { background: "gray-100", opacity: 0.6 }, cursor: "not-allowed" },
          },
        ],
      },
      placeholderColor: "gray-500",
      placeholderOpacity: 1,
      caretColor: "primary",
    },
    elevatedOverlay: {
      surface: {
        interior: { background: "background", backgroundAlpha: 0.95 },
        boundary: { effect: "sheet", border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "xl" } },
      },
      overlay: { scrimColor: "secondary", scrimOpacity: 0.2, scrimBlur: "sm" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-100" }, width: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.5 } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.85 } } },
        ],
      },
      separator: { height: "1px", surface: { interior: { background: "transparent" } } },
    },
    interactiveControlGroup: {
      surface: {
        interior: { background: "transparent", gap: { all: "none" }, padding: {} },
        boundary: { border: { width: "none" } },
      },
    },
    interactiveControl: {
      sizes: {
        "3xs": {
          partialSurface: { interior: { padding: { x: "2xs", y: "3xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } },
          icon: { size: "3xs" },
        },
        "2xs": {
          partialSurface: { interior: { padding: { x: "xs", y: "2xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } },
          icon: { size: "2xs" },
        },
        xs: {
          partialSurface: { interior: { padding: { x: "xs", y: "xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } },
          icon: { size: "xs" },
        },
        sm: {
          partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } },
          icon: { size: "xs" },
        },
        md: {
          partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "body" } },
          icon: { size: "sm" },
        },
        lg: {
          partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "bodyLarge" } },
          icon: { size: "md" },
        },
        xl: {
          partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
          icon: { size: "lg" },
        },
        "2xl": {
          partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
          icon: { size: "lg" },
        },
        "3xl": {
          partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
          icon: { size: "lg" },
        },
      },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        cursor: "pointer",
        combined: [
          {
            where: { emphasis: "hero" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: {
              interior: { background: "transparent", foreground: "gray-600" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "status-error" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "status-error" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "status-success" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "status-warning" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "status-info" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-success", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-warning", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-info", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "error", emphasis: "hero" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "hero" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success", emphasis: "hero" },
            partialSurface: {
              interior: { background: "status-success", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning", emphasis: "hero" },
            partialSurface: {
              interior: { background: "status-warning", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info", emphasis: "hero" },
            partialSurface: {
              interior: { background: "status-info", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "background" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "hero" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", emphasis: "quiet" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "error", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "destructive", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "success", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-success", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "warning", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-warning", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "info", emphasis: "primary" },
            partialSurface: {
              interior: { background: "status-info", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          { where: { state: "active" }, partialSurface: { interior: { background: "background" } } },
          {
            where: { state: "active", emphasis: "primary" },
            partialSurface: { interior: { background: "foreground", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "active", emphasis: "hero" },
            partialSurface: { interior: { background: "foreground", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "active", emphasis: "secondary" },
            partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "selected", status: "error" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "status-error" } },
            },
          },
          {
            where: { state: "selected", status: "destructive" },
            partialSurface: {
              interior: { background: "status-error", foreground: "smart-fb" },
              boundary: { border: { color: "status-error" } },
            },
          },
          {
            where: { state: "selected", status: "success" },
            partialSurface: {
              interior: { background: "status-success", foreground: "smart-fb" },
              boundary: { border: { color: "status-success" } },
            },
          },
          {
            where: { state: "selected", status: "warning" },
            partialSurface: {
              interior: { background: "status-warning", foreground: "smart-fb" },
              boundary: { border: { color: "status-warning" } },
            },
          },
          {
            where: { state: "selected", status: "info" },
            partialSurface: {
              interior: { background: "status-info", foreground: "smart-fb" },
              boundary: { border: { color: "status-info" } },
            },
          },
          {
            where: { state: "focus" },
            partialSurface: { boundary: { outline: { width: "thick", style: "solid", color: "gray-300", offset: "0px" } } },
          },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
          { where: { state: "loading" }, partialSurface: { interior: { opacity: 0.7 }, cursor: "progress" } },
        ],
      },
    },
    shape: {
      surface: {
        interior: { foreground: "currentColor", background: "transparent", padding: {} },
        boundary: { border: { width: "none" } },
      },
    },
    media: {
      surface: {
        interior: { background: "gray-100", padding: {} },
        boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "md" } },
      },
      objectFit: "cover",
    },
  },
  elements: {
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: {} },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
        ],
      },
    },
    fieldDescription: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: {} },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
        ],
      },
    },
    fieldMessage: {
      surface: {
        interior: { background: "transparent", padding: {} },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
              tint: "transparent",
            },
          },
        ],
      },
    },
    tableHeaderCell: {
      interior: { padding: { x: "lg", y: "xs" }, foreground: "gray-500", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" } }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      interior: { background: "transparent", backgroundAlpha: 1 },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.5 } } },
        { where: { state: "selected" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.85 } } },
      ],
    },
    tableCell: {
      interior: { padding: { x: "lg", y: "sm" } },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "body", textTransform: "none" },
    },
    card: { interior: { padding: { x: "lg", y: "lg" }, gap: { all: "md" } }, boundary: { effect: "none" } },
    header: {
      interior: { background: "transparent", padding: { x: "lg", y: "md" }, gap: { all: "sm" }, backgroundAlpha: 1 },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", padding: { x: "lg", y: "md" }, backgroundAlpha: 1 },
      boundary: { border: { width: "none" } },
    },
    footer: {
      interior: { background: "transparent", padding: { x: "lg", y: "sm" }, gap: { all: "sm" }, backgroundAlpha: 1 },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-100" } } },
    },
    panel: { interior: { padding: { all: "lg" } } },
    tile: {
      interior: {
        background: "background",
        foreground: "smart-fb",
        padding: { all: "md" },
        gap: { all: "xs" },
        backgroundAlpha: 0.55,
      },
      boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "md" } },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "gradient-hero", backgroundAlpha: 1, foreground: "smart-fb" } },
        },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", backgroundAlpha: 1 } } },
      ],
    },
    separator: {
      surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "none" } } },
      height: "1px",
    },
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
          backgroundAlpha: 1,
        },
        boundary: { border: { width: "thin", style: "dashed", color: "gray-200" }, radius: { all: "lg" } },
      },
    },
    alert: {
      surface: {
        interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" }, background: "background", backgroundAlpha: 0.55 },
        boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "md" } },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
              tint: "status-error",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
              tint: "status-success",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
              tint: "status-warning",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
              tint: "status-info",
            },
          },
        ],
      },
    },
    badge: {
      surface: {
        interior: {
          background: "background",
          foreground: "gray-700",
          padding: { x: "xs", y: "3xs" },
          gap: { all: "2xs" },
          backgroundAlpha: 0.7,
        },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { tint: "status-error", interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" } },
          },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "status-error", interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" } },
          },
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success", interior: { background: "background", backgroundAlpha: 1, foreground: "status-success" } },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning", interior: { background: "background", backgroundAlpha: 1, foreground: "status-warning" } },
          },
          {
            where: { status: "info" },
            partialSurface: { tint: "status-info", interior: { background: "background", backgroundAlpha: 1, foreground: "status-info" } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: { interior: { background: "secondary", backgroundAlpha: 1, foreground: "smart-fb" } },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: { tint: "status-error", interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" } },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: { tint: "status-error", interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" } },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { tint: "status-success", interior: { background: "background", backgroundAlpha: 1, foreground: "status-success" } },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { tint: "status-warning", interior: { background: "background", backgroundAlpha: 1, foreground: "status-warning" } },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { tint: "status-info", interior: { background: "background", backgroundAlpha: 1, foreground: "status-info" } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-500" } },
          },
        ],
      },
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "8px", height: "8px" } } },
        "2xs": {
          partialSurface: { interior: { padding: { x: "2xs", y: "none" } }, defaultTypography: { typographyType: "numbersExtraSmall" } },
        },
        xs: {
          partialSurface: { interior: { padding: { x: "xs", y: "3xs" } }, defaultTypography: { typographyType: "numbersExtraSmall" } },
        },
        sm: {
          partialSurface: { interior: { padding: { x: "xs", y: "3xs" } }, defaultTypography: { typographyType: "numbersSmall" } },
        },
        md: {
          partialSurface: { interior: { padding: { x: "xs", y: "2xs" } }, defaultTypography: { typographyType: "numbersSmall" } },
        },
        lg: {
          partialSurface: { interior: { padding: { x: "sm", y: "2xs" } }, defaultTypography: { typographyType: "numbers" } },
        },
        xl: {
          partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbers" } },
        },
      },
    },
    chip: {
      surface: {
        interior: {
          background: "background",
          foreground: "smart-fb",
          padding: { x: "sm", y: "2xs" },
          gap: { all: "2xs" },
          backgroundAlpha: 0.7,
        },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background", backgroundAlpha: 1 } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" } },
          },
        ],
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } } } },
        sm: { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } } } },
        md: { partialSurface: { interior: { padding: { x: "sm", y: "2xs" } } } },
        lg: {
          partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } },
        },
        xl: {
          partialSurface: { interior: { padding: { x: "md", y: "xs" } }, defaultTypography: { typographyType: "numbers" } },
        },
      },
    },
    avatar: {
      surface: {
        interior: {
          background: "accent",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
      },
      sizes: {
        "2xs": {
          partialSurface: {
            interior: { padding: { all: "none" } },
            dimensionPosition: { width: "20px", height: "20px" },
            defaultTypography: { typographyType: "numbersExtraSmall" },
          },
        },
        xs: {
          partialSurface: {
            interior: { padding: { all: "none" } },
            dimensionPosition: { width: "24px", height: "24px" },
            defaultTypography: { typographyType: "numbersExtraSmall" },
          },
        },
        sm: {
          partialSurface: {
            interior: { padding: { all: "none" } },
            dimensionPosition: { width: "32px", height: "32px" },
            defaultTypography: { typographyType: "numbersSmall" },
          },
        },
        md: {
          partialSurface: {
            interior: { padding: { all: "none" } },
            dimensionPosition: { width: "40px", height: "40px" },
            defaultTypography: { typographyType: "numbersSmall" },
          },
        },
        lg: {
          partialSurface: {
            interior: { padding: { all: "none" } },
            dimensionPosition: { width: "48px", height: "48px" },
            defaultTypography: { typographyType: "numbers" },
          },
        },
        xl: {
          partialSurface: {
            interior: { padding: { all: "none" } },
            dimensionPosition: { width: "64px", height: "64px" },
            defaultTypography: { typographyType: "numbers" },
          },
        },
      },
    },
    icon: {},
    progress: {
      surface: {
        interior: { background: "gray-100", padding: {} },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        dimensionPosition: { height: "8px" },
      },
    },
    progressInner: { interior: { background: "gradient-progress" }, boundary: { radius: { all: "full" } } },
    skeleton: {
      surface: {
        interior: { background: "background", backgroundAlpha: 0.5 },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
      },
    },
    spinner: {
      surface: { interior: { foreground: "primary", background: "transparent" }, boundary: { border: { width: "none" } } },
    },
    button: {
      surface: {
        interior: { gap: { all: "sm" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        combined: [
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "hover", emphasis: "primary" }, partialSurface: { boundary: { effect: "pill-hover" } } },
          { where: { state: "hover", emphasis: "hero" }, partialSurface: { boundary: { effect: "pill-hover" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "pressed" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "pressed" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "46px", height: "26px" },
        interior: { background: "gray-200", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gray-200", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: { tint: "transparent", interior: { backgroundAlpha: 1, background: "primary" } },
          },
        ],
      },
      thumb: {
        dimensionPosition: { width: "20px", height: "20px", translateX: "3px", translateY: "0px" },
        interior: { background: "background" },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "5px", translateY: "0px" } } }],
      },
    },
    checkbox: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-400" }, radius: { all: "2xs" } },
        dimensionPosition: { width: "20px", height: "20px" },
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "gray-400" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: {
              tint: "transparent",
              boundary: { border: { color: "primary" } },
              interior: { backgroundAlpha: 1, background: "primary", foreground: "smart-fb" },
            },
          },
        ],
      },
    },
    radio: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-400" }, radius: { all: "full" } },
        dimensionPosition: { width: "20px", height: "20px" },
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { boundary: { border: { width: "extraThick", color: "primary" } } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "gray-400" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: {
              tint: "transparent",
              boundary: { border: { width: "extraThick", color: "primary" } },
              interior: { backgroundAlpha: 1 },
            },
          },
        ],
      },
    },
    tabBar: {
      surface: {
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } }, radius: { all: "full" } },
        interior: { gap: { all: "2xs" }, background: "background", backgroundAlpha: 0.5, padding: { all: "3xs" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "md", y: "xs" }, backgroundAlpha: 1 },
        boundary: {
          border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "full" },
        },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "background", backgroundAlpha: 0.7, foreground: "smart-fb" } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" } },
          },
        ],
        defaultTypography: { typographyType: "link", textTransform: "none" },
      },
    },
    sidebar: {
      widthExpanded: "272px",
      widthCollapsed: "88px",
      surface: {
        interior: { background: "transparent", padding: { y: "sm" }, gap: { all: "xs" }, foreground: "gray-700" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "transparent" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "background",
          foreground: "gray-700",
          padding: { x: "md", y: "md" },
          gap: { all: "sm" },
          childAlign: { horizontal: "start", vertical: "center" },
          backgroundAlpha: 0.55,
        },
        boundary: { border: { width: "none", left: { width: "thick", style: "solid", color: "transparent" } }, radius: { all: "md" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "background", backgroundAlpha: 0.55, foreground: "gray-700" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "none" },
              tint: "transparent",
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "transparent",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "transparent",
            },
          },
        ],
      },
    },
    list: { surface: { interior: { gap: { all: "none" } } } },
    listDraggable: { surface: { interior: { gap: { all: "xs" } } } },
    listDraggableGroup: {
      interior: { background: "transparent", padding: { left: "xl" }, gap: { all: "xs" } },
      boundary: { border: { width: "none" } },
    },
    listDraggableRow: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "gray-300" } } } },
          {
            where: { state: "selected" },
            partialSurface: { tint: "primary", interior: { background: "background" }, boundary: { border: { color: "primary" } } },
          },
        ],
      },
    },
    listDraggableHandle: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { all: "2xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        cursor: "grab",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "active" }, partialSurface: { interior: { foreground: "primary" }, cursor: "grabbing" } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listDraggableGhost: {
      interior: { background: "gray-100", padding: {} },
      boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "none" } },
    },
    listDraggableOverlay: {
      surface: {
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "primary" } },
      },
    },
    listDraggableDropLine: {
      surface: {
        interior: { background: "primary", padding: {} },
        boundary: { border: { width: "none" } },
        dimensionPosition: { height: "3px" },
      },
    },
    listDraggableDropInto: {
      surface: {
        interior: { background: "transparent", padding: {} },
        boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "none" } },
      },
    },
    listTree: { surface: { interior: { gap: { all: "none" } } } },
    listTreeRow: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "xs", y: "2xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background" } } },
        ],
      },
    },
    listTreeToggle: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { all: "2xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        cursor: "pointer",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listTreeLine: { surface: { interior: { background: "gray-300", padding: {} }, boundary: { border: { width: "none" } } } },
    listTreeHandle: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { all: "2xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        cursor: "grab",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "active" }, partialSurface: { interior: { foreground: "primary" }, cursor: "grabbing" } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listTreeGhost: {
      interior: { background: "gray-100", padding: {} },
      boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "none" } },
    },
    listTreeOverlay: {
      surface: {
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "primary" } },
      },
    },
    listTreeDropLine: {
      surface: {
        interior: { background: "primary", padding: {} },
        boundary: { border: { width: "none" } },
        dimensionPosition: { height: "3px" },
      },
    },
    listTreeDropInto: {
      surface: {
        interior: { background: "transparent", padding: {} },
        boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "none" } },
      },
    },
    listItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "lg", y: "sm" }, gap: { all: "sm" }, backgroundAlpha: 1 },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, radius: { all: "none" } },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "destructive" },
            partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "success" },
            partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "warning" },
            partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "info" },
            partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          { where: { state: "hover" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.5 } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "background", backgroundAlpha: 0.85, foreground: "smart-fb" } },
          },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    menuItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "md", y: "xs" }, backgroundAlpha: 1 },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "background", backgroundAlpha: 0.7, foreground: "smart-fb" } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "accent", backgroundAlpha: 1, foreground: "smart-fb" } },
          },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    accordionTrigger: {
      surface: {
        interior: { background: "transparent", padding: { x: "none", y: "sm" } },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "heading4" },
      },
    },
    fileUpload: {
      surface: {
        interior: {
          background: "background",
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
          backgroundAlpha: 0.55,
        },
        boundary: { border: { width: "thin", style: "dashed", color: "gray-200" }, radius: { all: "lg" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "accent", backgroundAlpha: 1 }, boundary: { border: { color: "secondary" } } },
          },
        ],
      },
    },
    select: { surface: { cursor: "pointer" } },
    dialog: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    sheet: { surface: { boundary: { effect: "drawer", border: { width: "none" } }, interior: { padding: { all: "none" } } } },
    popover: {
      surface: {
        boundary: { effect: "sheet", border: { width: "none" }, radius: { all: "lg" } },
        interior: { padding: { all: "sm" } },
      },
    },
    tooltip: {
      surface: {
        interior: { background: "primary", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
        boundary: { border: { width: "none" }, effect: "popover", radius: { all: "sm" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    toast: {
      surface: {
        interior: { padding: { x: "md", y: "sm" } },
        boundary: { effect: "sheet", border: { width: "none" }, radius: { all: "lg" } },
      },
    },
    breadcrumbItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: { all: "none" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" }, effect: "none" },
              defaultTypography: { typographyType: "link", textTransform: "none" },
              tint: "transparent",
            },
          },
        ],
      },
    },
    breadcrumbSeparator: {
      surface: {
        interior: { background: "transparent", foreground: "gray-300", padding: { x: "xs" } },
        boundary: { border: { width: "none" } },
      },
    },
    otp: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" }, gap: { all: "sm" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
      },
    },
    otpSlot: {
      surface: {
        interior: {
          background: "background",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "solid", color: "transparent" }, radius: { all: "lg" }, margin: { x: "xs" } },
        defaultTypography: { typographyType: "numbers", textAlign: "center" },
        dimensionPosition: { width: "44px", height: "48px" },
      },
    },
    otpSeparator: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { x: "xs" } },
        boundary: { border: { width: "none" } },
      },
    },
    radioInner: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "full" }, effect: "none" },
      },
    },
    checkboxInner: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
      },
    },
    textarea: { surface: { boundary: { radius: { all: "lg" } } } },
  },
  contextual: {
    sidebar: {
      header: { interior: { padding: { x: "md", y: "md" } } },
      content: { interior: { padding: { x: "sm", y: "sm" } } },
      footer: { interior: { padding: { x: "md", y: "sm" }, background: "transparent" } },
      sidebarItem: { interior: { padding: { x: "md", y: "sm" }, gap: { all: "md" } } },
    },
  },
  concepts: {
    "persona-previewer": {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { left: { width: "extraThick", style: "solid", color: "gray-200" } } },
      },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "persona-previewer-stacked": {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { top: { width: "extraThick", style: "solid", color: "gray-200" } } },
      },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "organization-previewer": {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { left: { width: "extraThick", style: "solid", color: "gray-200" } } },
      },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "organization-previewer-stacked": {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { top: { width: "extraThick", style: "solid", color: "gray-200" } } },
      },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "goal-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: {
        interior: { padding: { all: "none" }, gap: { all: "none" }, background: "accent", foreground: "smart-fb" },
        boundary: { border: { width: "none" } },
      },
    },
    "goal-group-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: {
        interior: { padding: { all: "none" }, gap: { all: "none" }, background: "primary", foreground: "smart-fb" },
        boundary: { border: { width: "none" } },
      },
    },
    "exploration-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: {
        interior: { padding: { all: "none" }, gap: { all: "none" }, background: "status-success", foreground: "smart-fb" },
        boundary: { border: { width: "none" } },
      },
    },
    "live-play-player": { button: { boundary: { radius: { all: "full" } } } },
    "erd-node-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "use-case-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: { tint: "primary",
        interior: { padding: { all: "none" }, gap: { all: "none" }, background: "background", foreground: "smart-fb" },
        boundary: { border: { width: "none" } },
      },
    },
  },
  rules: [
    { chain: [{ key: "leftSidebar" }, { key: "button" }], tokens: { interior: { childAlign: { horizontal: "start" } } } },
    {
      chain: [{ key: "sidebar", where: { flag: "expanded" } }],
      tokens: {
        interior: { background: "transparent", foreground: "gray-700" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "transparent" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "transparent", foreground: "gray-700" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "transparent" } } },
      },
    },
  ],
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
    progress: { type: "linear", angle: 90, stops: [{ color: "accent" }, { color: "secondary" }] },
  },
};
