import type { WebTheme } from "../../../types";

// LIQUID v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/liquid.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Liquid — light glass on a pastel wash
//   a peach-to-ice gradient behind everything; every surface a sheet of white at 40%, with a bright line on top and a
//   soft coloured shadow beneath; pills everywhere; violet is the one action colour and glows.
//   interaction: hover brightens the glass and lifts it 1px under a bigger glow; pressed presses it into the sheet;
//   the current row is a violet-tinted glass; focus is a soft violet glow; everything eases over 220ms.
//
// L1 read of the mood
//   anchors     background #FFFFFF · foreground #1C1A2E (grays mixed 8% towards the ink: cool)
//   brand       1 #6B5CF6 violet · 2 #4B3DD0 deep · 3 #9C92FA soft · 4 #5D5A75 muted
//   flat        the wash: pink #F6D3CB peach · violet #E3DBF7 · blue #C9DDF7 ice · mint #D4EEF0 · turquoise #5ED8C9 (data)
//   status      success #2EC4A6 · info #5B9CFF · warning #FFB04D · error #FF6B7A — a pastel glass with a glow of its hue
//   fonts       Inter 400/500/600/700
//   rhythm      unit 0.75rem · radius xs 10 sm 14 md 18 lg 24 xl 28 · pills · white edges (main-white) · the polished edge is an
//               inner shadow, the glow a coloured drop shadow
//
// What the engine cannot do: the blur behind the glass (backdrop-filter is not emitted: the glass is translucent, not
// frosted); the avatar's iridescent ring (a conic border).

export const liquidTheme: WebTheme = {
  id: "liquid",
  name: "Liquid",
  version: 2,
  type: "high-fidelity",
  kind: "product",
  colors: {
    main: { white: "#FFFFFF", black: "#1C1A2E" },
    brand: { "1": "#6B5CF6", "2": "#4B3DD0", "3": "#9C92FA", "4": "#5D5A75" },
    status: { success: "#2EC4A6", info: "#5B9CFF", warning: "#FFB04D", error: "#FF6B7A" },
    content: {
      tomato: { standard: "#D55F46", soft: "#FED6CD" },
      red: { standard: "#D55B5A", soft: "#FED5D2" },
      ruby: { standard: "#D55A6D", soft: "#FED4D7" },
      crimson: { standard: "#D95584", soft: "#FFD4DE" },
      pink: { standard: "#C8559A", soft: "#F9D3E6" },
      plum: { standard: "#A257AE", soft: "#EBD3EE" },
      purple: { standard: "#8859B6", soft: "#E1D4F2" },
      violet: { standard: "#6D5EBC", soft: "#D7D5F5" },
      iris: { standard: "#5D62C2", soft: "#D2D7F7" },
      indigo: { standard: "#4868C8", soft: "#CCD9F9" },
      blue: { standard: "#3C92E9", soft: "#CEE5FF" },
      sky: { standard: "#91DFF5", soft: "#E2F8FF" },
      cyan: { standard: "#419FBD", soft: "#CFE8F1" },
      teal: { standard: "#44A193", soft: "#CFE8E3" },
      jade: { standard: "#4A9F85", soft: "#D0E8DF" },
      green: { standard: "#4DA073", soft: "#D1E8D9" },
      grass: { standard: "#5AA365", soft: "#D4E9D5" },
      mint: { standard: "#99E6D4", soft: "#E4FAF4" },
      lime: { standard: "#C3EB81", soft: "#EFFBDD" },
      yellow: { standard: "#F9E668", soft: "#FEFAD8" },
      amber: { standard: "#F6C867", soft: "#FFF1D7" },
      orange: { standard: "#E77843", soft: "#FFDDCF" },
      brown: { standard: "#A68263", soft: "#EADED4" },
      bronze: { standard: "#9C8277", soft: "#E7DEDA" },
      gold: { standard: "#94846C", soft: "#E4DFD7" },
    },
    semanticTokens: { primary: "#6B5CF6", secondary: "#4B3DD0", accent: "#9C92FA", muted: "#5D5A75" },
  },
  typography: {
    fonts: {
      primary: "Inter, -apple-system, Helvetica Neue, sans-serif",
      secondary: "Inter, -apple-system, Helvetica Neue, sans-serif",
      quote: "Inter, -apple-system, Helvetica Neue, sans-serif",
      monoPrimary: "Inter, -apple-system, Helvetica Neue, sans-serif",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      Inter: { type: "google", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 36,
        fontSizeDesktop: 40,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: "-0.03em",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 20,
        fontSizeDesktop: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.015em",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 18,
        fontSizeDesktop: 20,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: "-0.015em",
      },
      heading4: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
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
        fontSizeMobile: 40,
        fontSizeDesktop: 44,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.03em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 31,
        fontSizeDesktop: 34,
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: "-0.03em",
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 700,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 700,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0.06em",
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
    xs: "10px",
    sm: "14px",
    md: "18px",
    lg: "24px",
    xl: "28px",
    "2xl": "32px",
    "3xl": "36px",
    full: "9999px",
  },
  effects: {
    card: [
      { type: "inner-shadow", x: 0, y: 1, blur: 0, spread: 0, color: "main-white", opacity: 0.9 },
      { type: "drop-shadow", x: 0, y: 20, blur: 40, spread: -24, color: "secondary", opacity: 0.3 },
    ],
    sheet: [
      { type: "inner-shadow", x: 0, y: 1, blur: 0, spread: 0, color: "main-white", opacity: 1 },
      { type: "drop-shadow", x: 0, y: 40, blur: 90, spread: -30, color: "secondary", opacity: 0.45 },
    ],
    drawer: [{ type: "drop-shadow", x: -24, y: 0, blur: 60, spread: 0, color: "secondary", opacity: 0.3 }],
    popover: [{ type: "drop-shadow", x: 0, y: 12, blur: 28, spread: -10, color: "main-black", opacity: 0.3 }],
    "card-hover": [
      { type: "inner-shadow", x: 0, y: 1, blur: 0, spread: 0, color: "main-white", opacity: 1 },
      { type: "drop-shadow", x: 0, y: 28, blur: 56, spread: -24, color: "primary", opacity: 0.4 },
    ],
    glow: [
      { type: "inner-shadow", x: 0, y: 1, blur: 0, spread: 0, color: "main-white", opacity: 0.55 },
      { type: "inner-shadow", x: 0, y: -2, blur: 4, spread: 0, color: "main-black", opacity: 0.12 },
      { type: "drop-shadow", x: 0, y: 10, blur: 24, spread: -8, color: "primary", opacity: 0.6 },
    ],
    "glow-hover": [
      { type: "inner-shadow", x: 0, y: 1, blur: 0, spread: 0, color: "main-white", opacity: 0.6 },
      { type: "drop-shadow", x: 0, y: 16, blur: 32, spread: -10, color: "primary", opacity: 0.7 },
    ],
    pressed: [{ type: "inner-shadow", x: 0, y: 3, blur: 6, spread: 0, color: "main-black", opacity: 0.25 }],
    edge: [
      { type: "inner-shadow", x: 0, y: 1, blur: 0, spread: 0, color: "main-white", opacity: 0.9 },
      { type: "drop-shadow", x: 0, y: 8, blur: 20, spread: -10, color: "secondary", opacity: 0.25 },
    ],
    focus: [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.22 },
      { type: "drop-shadow", x: 0, y: 0, blur: 24, spread: 0, color: "primary", opacity: 0.35 },
    ],
    none: [],
  },
  transitions: {
    duration: { extraFast: "80ms", fast: "140ms", average: "220ms", slow: "340ms", extraSlow: "500ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#1C1A2E",
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
      dark: {
        background: "#1C1A2E",
        foreground: "#F4F1FF",
        chroma: { saturationFactor: 0.85, gamma: 1 },
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },
  layouts: {
    surface: { interior: { background: "gradient-wash", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "gradient-wash" } } },
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
    pageLeftSidebar: {
      width: "272px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { background: "transparent" },
      },
    },
    pageRightSidebar: {
      width: "320px",
      sm: { width: "280px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } } },
    },
    mainRightSidebar: {
      width: "320px",
      sm: { width: "260px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: {
        interior: { background: "background", backgroundAlpha: 0.4 },
        boundary: {
          border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "thin", style: "solid", color: "background" },
          radius: { all: "lg" },
        },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "gradient-primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "background", foreground: "smart-fb", backgroundAlpha: 0.4 } } },
    },
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "transparent", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {}, backgroundAlpha: 0.4 },
      boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "lg" }, effect: "card" },
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
            boundary: { border: { color: "background" } },
          },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: {
            interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-600" },
            boundary: { border: { color: "transparent" }, effect: "none" },
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
        boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "full" }, effect: "edge" },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "background" } } } },
          {
            where: { state: "focus" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "accent" }, effect: "focus" } },
          },
          {
            where: { status: "error" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "status-error" } }, tint: "background" },
          },
          {
            where: { status: "success" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "status-success" } }, tint: "background" },
          },
          {
            where: { status: "warning" },
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "status-warning" } }, tint: "background" },
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
        interior: { background: "background", backgroundAlpha: 0.85 },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "background" }, radius: { all: "xl" } },
      },
      overlay: { scrimColor: "secondary", scrimOpacity: 0.25, scrimBlur: "sm" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.5 } } },
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background" } } },
        ],
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
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
          partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } },
          icon: { size: "xs" },
        },
        md: {
          partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "link" } },
          icon: { size: "sm" },
        },
        lg: {
          partialSurface: { interior: { padding: { x: "2xl", y: "lg" } }, defaultTypography: { typographyType: "link" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        cursor: "pointer",
        combined: [
          {
            where: { emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "background" } },
            },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: { interior: { background: "transparent", foreground: "secondary" }, boundary: { border: { color: "transparent" } } },
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
              tint: "background",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "status-error" } },
              tint: "background",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "status-success" } },
              tint: "background",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "status-warning" } },
              tint: "background",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "status-info" } },
              tint: "background",
            },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-success", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-warning", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-info", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "error", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-status-error", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-status-success", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-status-warning", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-status-info", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "background" },
              boundary: { border: { color: "background" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-primary-hover", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-primary-hover", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "background", foreground: "secondary" },
              boundary: { border: { color: "background" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "tertiary" },
            partialSurface: { interior: { background: "background", foreground: "secondary" }, boundary: { border: { color: "transparent" } } },
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
              interior: { background: "gradient-status-error-dark", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "destructive", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-error-dark", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "success", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-success-dark", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "warning", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-warning-dark", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", status: "info", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-status-info-dark", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "active" },
            partialSurface: { interior: { background: "background" }, dimensionPosition: { translateX: "0px", translateY: "1px" } },
          },
          {
            where: { state: "active", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-primary-pressed", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-primary-pressed", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "background", foreground: "secondary" },
              boundary: { border: { color: "background" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "background", foreground: "secondary" },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-selected", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
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
            partialSurface: { boundary: { outline: { width: "thick", style: "solid", color: "accent", offset: "0px" } } },
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
        boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "md" } },
      },
      objectFit: "cover",
    },
  },
  elements: {
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: {} },
        boundary: { border: { width: "none" }, effect: "none" },
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
        boundary: { border: { width: "none" }, effect: "none" },
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
        boundary: { border: { width: "none" }, effect: "none" },
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
      interior: { padding: { x: "lg", y: "sm" }, foreground: "gray-600", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, effect: "none" },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" }, effect: "none" }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, effect: "none" },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "background", backgroundAlpha: 0.5 } } },
        { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background" } } },
      ],
    },
    tableCell: {
      interior: { padding: { x: "lg", y: "md" } },
      boundary: { border: { width: "none" }, effect: "none" },
      defaultTypography: { typographyType: "body", textTransform: "none" },
    },
    tableFooterCell: {
      interior: { padding: { x: "lg", y: "md" }, background: "transparent" },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "bodySmall" },
    },
    card: {
      interior: { padding: { x: "xl", y: "xl", childrenSmartBleed: true }, gap: { all: "md" } },
      boundary: { effect: "card" },
    },
    panel: { interior: { padding: { all: "lg", childrenSmartBleed: true }, gap: { all: "none" } } },
    header: {
      interior: {
        background: "transparent",
        foreground: "currentColor",
        padding: { y: "md", x: "lg" },
        gap: { all: "sm" },
        backgroundAlpha: 1,
      },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, effect: "none" },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" }, backgroundAlpha: 1 },
      boundary: { border: { width: "none" }, effect: "none" },
    },
    footer: {
      interior: {
        background: "transparent",
        foreground: "currentColor",
        padding: { y: "sm", x: "lg" },
        gap: { all: "sm" },
        backgroundAlpha: 1,
      },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-100" } }, effect: "none" },
    },
    tile: {
      interior: {
        background: "background",
        foreground: "smart-fb",
        padding: { all: "md" },
        gap: { all: "xs" },
        backgroundAlpha: 0.4,
      },
      boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "md" }, effect: "card" },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "gradient-hero", backgroundAlpha: 1, foreground: "smart-fb" } },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: {
            interior: { background: "transparent", backgroundAlpha: 1 },
            boundary: { border: { color: "transparent" }, effect: "none" },
          },
        },
      ],
    },
    separator: {
      surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "none" }, effect: "none" } },
      height: "1px",
    },
    badge: {
      surface: {
        interior: {
          background: "background",
          foreground: "gray-700",
          padding: { x: "md", y: "xs" },
          gap: { all: "sm" },
          backgroundAlpha: 0.6,
        },
        boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "full" }, effect: "none" },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: { tint: "primary",
              interior: { background: "background", backgroundAlpha: 1, foreground: "secondary" },
              boundary: { border: { color: "background" } },
            },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", backgroundAlpha: 1, foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-500" },
              boundary: { border: { color: "transparent" } },
            },
          },
        ],
      },
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "8px", height: "8px" } } },
        "2xs": {
          partialSurface: { interior: { padding: { x: "2xs", y: "none" } }, defaultTypography: { typographyType: "numbersExtraSmall" } },
        },
        xs: {
          partialSurface: { interior: { padding: { x: "md", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } },
        },
        sm: {
          partialSurface: { interior: { padding: { x: "md", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } },
        },
        md: {
          partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } },
        },
        lg: {
          partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "numbers" } },
        },
        xl: {
          partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbers" } },
        },
      },
    },
    chip: {
      surface: {
        interior: {
          background: "gradient-flat-brand-1-light",
          foreground: "smart-fb",
          padding: { x: "sm", y: "2xs" },
          gap: { all: "2xs" },
        },
        boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "accent" } } } },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-selected", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
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
    image: {
      sizes: {
        "3xs": { partialSurface: { dimensionPosition: { width: "16px", height: "16px" } } },
        "2xs": { partialSurface: { dimensionPosition: { width: "24px", height: "24px" } } },
        xs: { partialSurface: { dimensionPosition: { width: "32px", height: "32px" } } },
        sm: { partialSurface: { dimensionPosition: { width: "48px", height: "48px" } } },
        md: { partialSurface: { dimensionPosition: { width: "64px", height: "64px" } } },
        lg: { partialSurface: { dimensionPosition: { width: "96px", height: "96px" } } },
        xl: { partialSurface: { dimensionPosition: { width: "160px", height: "160px" } } },
        "2xl": { partialSurface: { dimensionPosition: { width: "240px", height: "240px" } } },
        "3xl": { partialSurface: { dimensionPosition: { width: "320px", height: "320px" } } },
      },
      surface: { combined: [{ where: { state: "loading" }, partialSurface: { interior: { background: "gray-50" } } }] },
    },
    avatar: {
      surface: {
        interior: {
          background: "gradient-avatar",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { radius: { all: "full" }, border: { width: "thick", style: "solid", color: "background" }, effect: "none" },
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
    icon: { boundary: { effect: "none" } },
    progress: {
      surface: {
        interior: { background: "gray-100", padding: {} },
        boundary: { border: { width: "none" }, radius: { all: "full" }, effect: "none" },
        dimensionPosition: { height: "8px" },
      },
    },
    progressInner: { interior: { background: "gradient-progress" }, boundary: { radius: { all: "full" }, effect: "none" } },
    skeleton: {
      surface: {
        interior: { background: "background", backgroundAlpha: 0.5 },
        boundary: { border: { width: "none" }, radius: { all: "sm" }, effect: "none" },
      },
    },
    spinner: {
      surface: {
        interior: { foreground: "primary", background: "transparent", padding: { all: "none" } },
        boundary: { border: { width: "none" }, effect: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "primary" },
              boundary: { border: { color: "transparent" } },
            },
          },
        ],
      },
    },
    button: {
      surface: {
        interior: { gap: { all: "sm" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        boundary: { effect: "edge" },
        combined: [
          { where: { emphasis: "hero" }, partialSurface: { boundary: { effect: "glow" } } },
          { where: { emphasis: "primary" }, partialSurface: { boundary: { effect: "glow" } } },
          { where: { emphasis: "secondary" }, partialSurface: { boundary: { effect: "edge" } } },
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "hover", emphasis: "primary" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "hover", emphasis: "hero" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "hover", emphasis: "secondary" }, partialSurface: { boundary: { effect: "card-hover" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "pressed" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "pressed" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "selected" }, partialSurface: { boundary: { effect: "glow" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "46px", height: "26px" },
        interior: { background: "gradient-flat-gray-200", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "pressed" },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-gray-200", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" }, effect: "pressed" },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: { tint: "transparent", interior: { backgroundAlpha: 1, background: "gradient-primary" } },
          },
        ],
      },
      thumb: {
        dimensionPosition: { width: "20px", height: "20px", translateX: "3px", translateY: "0px" },
        interior: { background: "gradient-flat-background" },
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "popover" },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "5px", translateY: "0px" } } }],
      },
    },
    checkbox: {
      sizes: {
        xs: { partialSurface: { dimensionPosition: { width: "12px", height: "12px" } }, icon: { size: "xs" } },
        sm: { partialSurface: { dimensionPosition: { width: "14px", height: "14px" } }, icon: { size: "xs" } },
        md: { partialSurface: { dimensionPosition: { width: "16px", height: "16px" } }, icon: { size: "sm" } },
        lg: { partialSurface: { dimensionPosition: { width: "20px", height: "20px" } }, icon: { size: "md" } },
        xl: { partialSurface: { dimensionPosition: { width: "24px", height: "24px" } }, icon: { size: "lg" } },
      },
      surface: {
        interior: {
          background: "gradient-flat-background",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "solid", color: "gray-400" }, radius: { all: "2xs" } },
        dimensionPosition: { width: "20px", height: "20px" },
        combined: [
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" }, effect: "glow" },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "gray-400" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: {
              tint: "transparent",
              boundary: { border: { color: "transparent" }, effect: "glow" },
              interior: { backgroundAlpha: 1, background: "gradient-primary", foreground: "smart-fb" },
            },
          },
        ],
      },
    },
    checkboxInner: {
      interior: { background: "transparent", foreground: "currentColor", padding: { all: "none" } },
      boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
    },
    radio: {
      sizes: {
        xs: { partialSurface: { dimensionPosition: { width: "12px", height: "12px" } } },
        sm: { partialSurface: { dimensionPosition: { width: "14px", height: "14px" } } },
        md: { partialSurface: { dimensionPosition: { width: "16px", height: "16px" } } },
        lg: { partialSurface: { dimensionPosition: { width: "20px", height: "20px" } } },
        xl: { partialSurface: { dimensionPosition: { width: "24px", height: "24px" } } },
      },
      surface: {
        interior: { background: "gradient-flat-background", padding: { all: "none" } },
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
              interior: { background: "gradient-flat-background", backgroundAlpha: 1, foreground: "smart-fb" },
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
    choiceGroup: {
      surface: { interior: { background: "transparent", gap: { all: "sm" }, padding: {} }, boundary: { border: { width: "none" } } },
    },
    radioInner: {
      interior: { background: "transparent", foreground: "primary", padding: { all: "none" } },
      boundary: { border: { width: "none" }, radius: { all: "full" }, effect: "none" },
    },
    tabBar: {
      surface: {
        boundary: {
          border: {
            width: "thin",
            bottom: { width: "thin", style: "solid", color: "gray-200" },
            style: "solid",
            color: "background",
          },
          radius: { all: "full" },
        },
        interior: { gap: { all: "sm" }, background: "background", backgroundAlpha: 0.4, padding: { all: "xs" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: {
          background: "gradient-flat-transparent",
          foreground: "smart-fb",
          padding: { x: "lg", y: "sm" },
          backgroundAlpha: 1,
        },
        boundary: {
          border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "full" },
        },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "gradient-flat-background", backgroundAlpha: 0.6, foreground: "smart-fb" } },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-primary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { effect: "glow" },
            },
          },
        ],
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    tabPanel: {
      interior: { background: "transparent", padding: { x: "none", y: "md" } },
      boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
    },
    treeView: {
      surface: {
        interior: { background: "transparent", padding: {}, gap: { all: "none" } },
        boundary: { border: { width: "none" } },
      },
    },
    treeViewGroup: {
      surface: {
        interior: { background: "transparent", padding: { left: "md" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, effect: "none" },
      },
    },
    treeViewItem: {
      surface: {
        interior: {
          background: "gradient-flat-transparent",
          foreground: "smart-fb",
          padding: { x: "xs", y: "2xs" },
          gap: { all: "xs" },
        },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "gradient-flat-gray-100" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-brand-1-light", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
        ],
      },
    },
    calendar: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
      },
    },
    group: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
      },
    },
    alert: {
      surface: {
        interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" }, background: "background", backgroundAlpha: 0.4 },
        boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "lg" }, effect: "edge" },
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
    breadcrumb: {
      surface: { interior: { background: "transparent", padding: {}, gap: { all: "xs" } }, boundary: { border: { width: "none" } } },
    },
    breadcrumbItem: {
      surface: {
        interior: {
          background: "gradient-flat-transparent",
          foreground: "smart-fb",
          padding: { x: "xs", y: "2xs" },
          gap: { all: "xs" },
        },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "gradient-flat-transparent", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
        ],
      },
    },
    breadcrumbSeparator: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: {} },
        boundary: { border: { width: "none" }, effect: "none" },
      },
    },
    sidebar: {
      widthExpanded: "272px",
      widthCollapsed: "80px",
      surface: {
        interior: { background: "transparent", padding: { y: "xl", x: "lg" }, gap: { all: "sm" }, foreground: "gray-700" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "transparent" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "gradient-flat-transparent",
          foreground: "smart-fb",
          padding: { x: "lg", y: "md" },
          gap: { all: "sm" },
          childAlign: { horizontal: "start", vertical: "center" },
        },
        boundary: {
          border: { width: "none", left: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "full" },
        },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "gradient-flat-background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "glow" },
              defaultTypography: { typographyType: "link", textTransform: "none" },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-flat-transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "none" },
              tint: "transparent",
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-flat-background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "background",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-primary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "glow" },
              tint: "transparent",
              defaultTypography: { typographyType: "link", textTransform: "none" },
            },
          },
        ],
        dimensionPosition: { height: "49px" },
        defaultTypography: { typographyType: "body", textTransform: "none" },
      },
    },
    list: { surface: { interior: { padding: { x: "lg", childrenSmartBleed: true }, gap: { all: "md" } } } },
    listDraggable: { surface: { interior: { gap: { all: "xs" } } } },
    listDraggableGroup: {
      interior: { background: "transparent", padding: { left: "xl" }, gap: { all: "xs" } },
      boundary: { border: { width: "none" }, effect: "none" },
    },
    listDraggableRow: {
      surface: {
        interior: { background: "gradient-flat-background", foreground: "smart-fb", padding: { x: "md", y: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "gray-300" } } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "gradient-flat-brand-1-light" }, boundary: { border: { color: "primary" } } },
          },
        ],
      },
    },
    listDraggableHandle: {
      surface: {
        interior: { background: "gradient-flat-transparent", foreground: "smart-fb", padding: { all: "2xs" } },
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
        interior: { background: "gradient-flat-transparent", foreground: "smart-fb", padding: { x: "xs", y: "2xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gradient-flat-gray-100" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-flat-brand-1-light" } } },
        ],
      },
    },
    listTreeToggle: {
      surface: {
        interior: { background: "gradient-flat-transparent", foreground: "smart-fb", padding: { all: "2xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        cursor: "pointer",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listTreeLine: {
      surface: { interior: { background: "gray-300", padding: {} }, boundary: { border: { width: "none" }, effect: "none" } },
    },
    listTreeHandle: {
      surface: {
        interior: { background: "gradient-flat-transparent", foreground: "smart-fb", padding: { all: "2xs" } },
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
        interior: { background: "gradient-flat-transparent", padding: { y: "sm", x: "lg" }, gap: { all: "sm" }, backgroundAlpha: 1 },
        boundary: {
          border: { width: "none", style: "solid", color: "gray-200", bottom: { width: "thin", style: "solid", color: "gray-100" } },
          radius: { all: "none" },
        },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { interior: { background: "gradient-flat-transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "destructive" },
            partialSurface: { interior: { background: "gradient-flat-transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "success" },
            partialSurface: { interior: { background: "gradient-flat-transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "warning" },
            partialSurface: { interior: { background: "gradient-flat-transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "info" },
            partialSurface: { interior: { background: "gradient-flat-transparent", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "gradient-flat-background", backgroundAlpha: 0.5 } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "gradient-flat-brand-1-light", foreground: "smart-fb" } },
          },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    dropdownMenu: { surface: { interior: { padding: { all: "sm" }, gap: { all: "none" } } } },
    menuItem: {
      surface: {
        interior: { background: "gradient-flat-transparent", padding: { x: "md", y: "xs" }, backgroundAlpha: 1 },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "gradient-flat-background", backgroundAlpha: 0.7, foreground: "smart-fb" } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "gradient-flat-brand-1-light", foreground: "smart-fb" } },
          },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    accordionTrigger: {
      surface: {
        interior: { background: "gradient-flat-gray-50", padding: { x: "md", y: "sm" } },
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
          backgroundAlpha: 0.4,
        },
        boundary: { border: { width: "thin", style: "dashed", color: "background" }, radius: { all: "lg" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { tint: "primary", interior: { background: "background", backgroundAlpha: 1 }, boundary: { border: { color: "primary" } } },
          },
        ],
      },
    },
    otp: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" }, gap: { all: "xs" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "none" }, margin: { x: "xs" } },
        dimensionPosition: { width: "36px", height: "40px" },
        defaultTypography: { typographyType: "numbers", textAlign: "center" },
        combined: [
          {
            where: { state: "selected" },
            partialSurface: {
              boundary: { border: { color: "primary" }, outline: { width: "thin", style: "solid", color: "primary", offset: "0px" } },
            },
          },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "primary" } } } },
        ],
      },
    },
    otpSeparator: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { x: "xs" } },
        boundary: { border: { width: "none" }, effect: "none" },
      },
    },
    inputGroupAddon: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "xs", y: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
        defaultTypography: { typographyType: "bodySmall" },
      },
    },
    select: { surface: { cursor: "pointer" } },
    dialog: { surface: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } } } },
    alertDialog: { surface: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } } } },
    sheet: {
      surface: {
        boundary: { effect: "drawer", border: { width: "none" } },
        interior: { padding: { x: "lg", y: "md" }, gap: { all: "md" } },
      },
    },
    popover: {
      surface: {
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "background" }, radius: { all: "lg" } },
        interior: { padding: { all: "sm" }, gap: { all: "sm" } },
      },
    },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
    tooltip: {
      surface: {
        interior: { background: "foreground", foreground: "smart-fb", padding: { x: "sm", y: "xs" }, backgroundAlpha: 0.92 },
        boundary: { border: { width: "none" }, effect: "popover", radius: { all: "sm" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    toast: {
      surface: {
        interior: { padding: { x: "md", y: "sm" } },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "background" }, radius: { all: "lg" } },
      },
    },
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          backgroundAlpha: 1,
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "background" }, radius: { all: "lg" }, effect: "none" },
      },
    },
    textarea: { surface: { boundary: { radius: { all: "lg" } } } },
  },
  contextual: {
    dialog: { footer: { interior: { childAlign: { horizontal: "end" } } } },
    alertDialog: { footer: { interior: { childAlign: { horizontal: "end" } } } },
    accordionItem: { content: { interior: { padding: { x: "md", y: "sm" } } } },
    sheet: {
      header: { interior: { padding: { x: "none", y: "sm" } } },
      content: { interior: { padding: { x: "none", y: "sm" } } },
      footer: { interior: { padding: { x: "none", y: "sm" } } },
    },
    menu: {
      label: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "xs" } },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "heading4", textTransform: "none" },
      },
      separator: { interior: { background: "gray-200" } },
    },
    sidebar: {
      header: { interior: { padding: { x: "sm", y: "md" } } },
      content: { interior: { padding: { x: "sm", y: "sm" } } },
      footer: { interior: { padding: { x: "sm", y: "sm" }, background: "transparent" } },
      sidebarItem: { interior: { padding: { x: "md", y: "sm" }, gap: { all: "md" } } },
    },
  },
  concepts: {
    summary: {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { effect: "none" } },
      content: { interior: { padding: { x: "lg", y: "md" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "lg", y: "none" }, gap: { all: "2xs" } },
        boundary: { border: { width: "none", left: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: { interior: { padding: { left: "none" } }, boundary: { border: { left: { width: "none" } } } },
          },
        ],
      },
    },
    product: {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { effect: "card" } },
      content: { interior: { padding: { all: "none" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "xl", y: "lg" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, effect: "none" },
      },
      badge: {
        interior: { background: "background", foreground: "gray-600", padding: { x: "sm", y: "2xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: { boundary: { border: { color: "transparent" } }, defaultTypography: { typographyType: "numbersSmall" } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "gray-100" }, boundary: { border: { color: "transparent" } } },
          },
        ],
      },
      icon: {
        combined: [
          { where: { status: "success" }, partialSurface: { interior: { foreground: "status-success" } } },
          { where: { status: "warning" }, partialSurface: { interior: { foreground: "status-warning" } } },
          { where: { status: "error" }, partialSurface: { interior: { foreground: "status-error" } } },
        ],
      },
    },
    aside: {
      tile: {
        interior: { background: "transparent", padding: { all: "xl" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none", left: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
        dimensionPosition: { height: "100%" },
      },
      button: { dimensionPosition: { width: "100%" }, interior: { childAlign: { horizontal: "center" } } },
    },
    figures: {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, effect: "none" },
      },
      content: { interior: { padding: { all: "none" } } },
      tile: {
        interior: { background: "background", padding: { x: "lg", y: "md" }, gap: { all: "xs" } },
        boundary: { border: { width: "none", left: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: { interior: { background: "gray-50" }, boundary: { border: { left: { width: "none" } } } },
          },
        ],
      },
    },
    wordmark: { avatar: { boundary: { radius: { all: "none" } } } },
    sort: { tabBar: { boundary: { border: { width: "none" } }, interior: { gap: { all: "lg" } } } },
    group: { separator: { interior: { background: "gray-300" } } },
    timeline: { separator: { interior: { background: "gray-200" } } },
    hero: {
      label: { interior: { foreground: "secondary" } },
      button: {
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "currentColor" },
              boundary: { border: { color: "currentColor" } },
            },
          },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "currentColor" } } },
        ],
      },
      card: { interior: { padding: { all: "none" } } },
      content: { interior: { padding: { x: "3xl", y: "2xl" } } },
    },
    progressList: { progress: { dimensionPosition: { height: "8px" } } },
    keyValues: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "md" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    rows: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "md" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
        defaultTypography: { typographyType: "body", textTransform: "none" },
      },
    },
    chosen: {
      label: { interior: { foreground: "secondary" } },
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "currentColor" } } }] },
      card: { interior: { padding: { all: "none" } } },
      content: { interior: { padding: { all: "xl" } } },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { left: "xl", right: "none", y: "md" } },
        boundary: {
          border: {
            width: "none",
            left: { width: "thin", style: "solid", color: "background" },
            bottom: { width: "thin", style: "solid", color: "background" },
          },
          effect: "none",
          radius: { all: "none" },
        },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
      },
    },
    document: {
      content: {
        interior: { padding: { x: "none", y: "md" }, gap: { all: "md" } },
        defaultTypography: { typographyType: "bodyExtraLarge" },
      },
    },
    "persona-previewer": {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { left: { width: "extraThick", style: "solid", color: "gray-200" } } },
        breakpoints: { narrow: "520px" },
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
    "canvas-card": { card: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    "canvas-note": { tile: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    "live-play-player": { button: { boundary: { radius: { all: "full" } } } },
    "role-select": { button: { interior: { childAlign: { horizontal: "start" } } } },
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
    alert: {
      card: { interior: { padding: { all: "none" } }, boundary: { radius: { all: "xl" } } },
      content: { interior: { padding: { x: "xl", y: "lg" } } },
      button: {
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              tint: "background",
              interior: { background: "background", backgroundAlpha: 0.55, foreground: "smart-fb" },
              boundary: { border: { color: "background" } },
            },
          },
        ],
      },
    },
  },
  rules: [
    {
      chain: [{ key: "badge", concept: "dot" }],
      tokens: {
        interior: { padding: { all: "none" }, background: "gray-300" },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        combined: [
          { where: { status: "success" }, partialSurface: { interior: { background: "status-success" } } },
          { where: { status: "warning" }, partialSurface: { interior: { background: "status-warning" } } },
          { where: { status: "error" }, partialSurface: { interior: { background: "status-error" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error" } } },
          { where: { status: "info" }, partialSurface: { interior: { background: "primary" } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "gray-300" } } },
        ],
      },
    },
    {
      chain: [{ key: "badge" }, { key: "badge", concept: "dot" }],
      tokens: {
        dimensionPosition: { width: "6px", height: "6px" },
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "background", interior: { background: "background" } } },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "background", interior: { background: "background" } },
          },
        ],
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }],
      tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "content" }],
      tokens: { interior: { padding: { x: "none" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }],
      tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "sidebarItem" }],
      tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } },
    },
    {
      chain: [{ key: "sidebar" }, { key: "badge" }],
      tokens: {
        tint: "content-red-standard",
        interior: { background: "content-red-standard", backgroundAlpha: 1, foreground: "smart-fb", padding: { x: "sm", y: "3xs" } },
        boundary: { border: { color: "transparent" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
      },
    },
    {
      chain: [{ key: "paginationBar" }, { key: "button" }],
      tokens: {
        interior: { padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { radius: { all: "full" } },
        dimensionPosition: { width: "40px", height: "40px" },
      },
    },
    {
      chain: [{ key: "pageLeftSidebar" }, { key: "button" }],
      tokens: { interior: { childAlign: { horizontal: "start" } } },
    },
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
    wash: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "content-pink-soft" },
        { color: "content-violet-soft", position: "38%" },
        { color: "content-blue-soft", position: "72%" },
        { color: "content-mint-soft" },
      ],
    },
    hero: {
      type: "linear",
      angle: 135,
      stops: [{ color: "content-pink-soft" }, { color: "content-violet-soft", position: "50%" }, { color: "content-mint-soft" }],
    },
    primary: { type: "linear", angle: 180, stops: [{ color: "accent" }, { color: "primary" }] },
    "primary-hover": { type: "linear", angle: 180, stops: [{ color: "accent" }, { color: "secondary" }] },
    "primary-pressed": { type: "linear", angle: 0, stops: [{ color: "secondary" }, { color: "secondary" }] },
    progress: { type: "linear", angle: 90, stops: [{ color: "content-teal-soft" }, { color: "primary" }] },
    avatar: { type: "linear", angle: 135, stops: [{ color: "content-pink-soft" }, { color: "content-violet-soft" }] },
    selected: { type: "linear", angle: 0, stops: [{ color: "primary" }, { color: "primary" }] },
    "status-error": { type: "linear", angle: 0, stops: [{ color: "status-error" }, { color: "status-error" }] },
    "status-error-dark": { type: "linear", angle: 0, stops: [{ color: "status-error" }, { color: "status-error" }] },
    "status-success": { type: "linear", angle: 0, stops: [{ color: "status-success" }, { color: "status-success" }] },
    "status-success-dark": { type: "linear", angle: 0, stops: [{ color: "status-success" }, { color: "status-success" }] },
    "status-warning": { type: "linear", angle: 0, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    "status-warning-dark": { type: "linear", angle: 0, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    "status-info": { type: "linear", angle: 0, stops: [{ color: "status-info" }, { color: "status-info" }] },
    "status-info-dark": { type: "linear", angle: 0, stops: [{ color: "status-info" }, { color: "status-info" }] },
    "flat-brand-1-light": { type: "linear", angle: 0, stops: [{ color: "color-mix(in srgb, var(--color-brand-1) 20%, transparent)" }, { color: "color-mix(in srgb, var(--color-brand-1) 20%, transparent)" }] },
    "flat-background": { type: "linear", angle: 0, stops: [{ color: "background" }, { color: "background" }] },
    "flat-gray-200": { type: "linear", angle: 0, stops: [{ color: "gray-200" }, { color: "gray-200" }] },
    "flat-transparent": { type: "linear", angle: 0, stops: [{ color: "transparent" }, { color: "transparent" }] },
    "flat-gray-50": { type: "linear", angle: 0, stops: [{ color: "gray-50" }, { color: "gray-50" }] },
    "flat-gray-100": { type: "linear", angle: 0, stops: [{ color: "gray-100" }, { color: "gray-100" }] },
  },
};
