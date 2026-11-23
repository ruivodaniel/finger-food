import type { WebTheme } from "../../../types";

// SKETCH v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/sketch.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Sketch — paper, mono and pastel
//   one monospace face for everything; white cards on warm paper; four pastels (blush, butter, sky, lavender) with
//   ink outlines and a short hard shadow on what matters. Ink carries the actions. The rail is dark.
//   interaction: hover draws the hard shadow under a button and fills a quiet row with butter; pressed drops the
//   shadow and moves the thing 2px down and right; the current row is blush; focus is the shadow in ink; nothing eases.
//
// L1 read of the mood
//   anchors     background #FFFFFF (the cards) · foreground #1E1E1E (the ink) · the paper #F3F1EB is brand-4, the ground
//   brand       1 #1E1E1E ink (actions, outlines) · 2 #2B2B2B the rail · 3 #F1D3CF blush (selection) · 4 #F3F1EB paper
//   flat        pink #F1D3CF blush · yellow #F7ECB5 butter · blue #D4E9F2 sky · violet #D8D6E6 lavender
//   status      success #A3C13A lime · warning #E0B93C mustard · error #E8604C coral · info #7FB7CF sky — a pastel fill
//               with an ink outline, the colour in the word
//   fonts       Space Mono 400/700 for everything
//   rhythm      unit 0.75rem · radius none (a drawn box) · borders 1px ink · shadows 3px 3px 0 ink (hard)
//
// What the engine cannot do: the pastel KPI cards (the first two KPIs blush and butter) — the app's KPIs are plain
// cards with no concept to address.

export const sketchTheme: WebTheme = {
  id: "sketch",
  name: "Sketch",
  version: 1,
  type: "high-fidelity",
  kind: "product",
  colors: {
    main: { white: "#FFFFFF", black: "#1E1E1E" },
    brand: { "1": "#1E1E1E", "2": "#2B2B2B", "3": "#F1D3CF", "4": "#F3F1EB" },
    status: { success: "#A3C13A", info: "#7FB7CF", warning: "#E0B93C", error: "#E8604C" },
    content: {
      tomato: { standard: "#C25D47", soft: "#FCD9D1" },
      red: { standard: "#C25A58", soft: "#FCD8D5" },
      ruby: { standard: "#C35968", soft: "#FCD7DA" },
      crimson: { standard: "#C6557C", soft: "#FDD7E0" },
      pink: { standard: "#B7548E", soft: "#F8D6E7" },
      plum: { standard: "#94549E", soft: "#EBD6EE" },
      purple: { standard: "#7D54A4", soft: "#E3D7F1" },
      violet: { standard: "#6458A9", soft: "#DAD8F4" },
      iris: { standard: "#575CAE", soft: "#D5DAF6" },
      indigo: { standard: "#4461B3", soft: "#D0DCF7" },
      blue: { standard: "#4189D4", soft: "#D0E6FE" },
      sky: { standard: "#91D4E7", soft: "#E4F7FC" },
      cyan: { standard: "#4695AE", soft: "#D3E8F0" },
      teal: { standard: "#489689", soft: "#D3E9E4" },
      jade: { standard: "#4C947D", soft: "#D4E8E0" },
      green: { standard: "#4F946D", soft: "#D4E9DC" },
      grass: { standard: "#599762", soft: "#D7E9D8" },
      mint: { standard: "#98DACA", soft: "#E5F8F3" },
      lime: { standard: "#BCDF85", soft: "#EEFADF" },
      yellow: { standard: "#ECDD72", soft: "#FCF8DB" },
      amber: { standard: "#E7BF6E", soft: "#FDF1DA" },
      orange: { standard: "#D47548", soft: "#FFDFD1" },
      brown: { standard: "#9A7A60", soft: "#EBE0D7" },
      bronze: { standard: "#917A70", soft: "#E8E0DD" },
      gold: { standard: "#897B67", soft: "#E5E0DA" },
    },
    semanticTokens: { primary: "#1E1E1E", secondary: "#2B2B2B", accent: "#F1D3CF", muted: "#F3F1EB" },
  },
  typography: {
    fonts: {
      primary: "Space Mono, ui-monospace, Menlo, monospace",
      secondary: "Space Mono, ui-monospace, Menlo, monospace",
      quote: "Space Mono, ui-monospace, Menlo, monospace",
      monoPrimary: "Space Mono, ui-monospace, Menlo, monospace",
      monoSecondary: "Space Mono, ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      "Space Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 27,
        fontSizeDesktop: 30,
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
        letterSpacing: "-0.02em",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: "-0.02em",
      },
      heading4: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 700,
        lineHeight: 1.35,
      },
      bodyExtraLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      bodyLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      body: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
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
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      quote: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
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
        fontSizeMobile: 32,
        fontSizeDesktop: 36,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.03em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 25,
        fontSizeDesktop: 28,
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: "-0.03em",
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 700,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 12,
        fontWeight: 700,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 700,
        lineHeight: 1.4,
        letterSpacing: "0.1em",
      },
      link: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 700,
        lineHeight: 1.5,
      },
    },
  },
  spacing: { unit: 0.75 },
  radius: {
    none: "0px",
    "3xs": "0px",
    "2xs": "0px",
    xs: "0px",
    sm: "0px",
    md: "0px",
    lg: "0px",
    xl: "0px",
    "2xl": "0px",
    "3xl": "0px",
    full: "9999px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 6, y: 6, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    drawer: [{ type: "drop-shadow", x: -6, y: 6, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    popover: [{ type: "drop-shadow", x: 4, y: 4, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    hard: [{ type: "drop-shadow", x: 3, y: 3, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    "hard-4": [{ type: "drop-shadow", x: 4, y: 4, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    "hard-6": [{ type: "drop-shadow", x: 6, y: 6, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "0ms", fast: "0ms", average: "0ms", slow: "0ms", extraSlow: "0ms" },
    timing: { ease: "linear", easeIn: "linear", easeOut: "linear", easeInOut: "linear", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#1E1E1E",
        derivation: {
          grayColorMixPercentage: "6%",
        },
      },
      dark: {
        background: "#1E1E1E",
        foreground: "#F3F1EB",
        chroma: { saturationFactor: 0.8, gamma: 1 },
        derivation: {
          grayColorMixPercentage: "6%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },
  layouts: {
    surface: { interior: { background: "muted", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "muted", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
    secondPageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "muted", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
    mainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "muted", foreground: "smart-fb" },
      },
    },
    secondMainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "muted", foreground: "smart-fb" },
      },
    },
    leftSidebar: {
      width: "256px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
        interior: { background: "muted" },
      },
    },
    rightSidebar: {
      width: "320px",
      sm: { width: "280px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "foreground" }, width: "none" } } },
    },
    contextPanel: {
      width: "320px",
      sm: { width: "260px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: {
        interior: { background: "muted" },
        boundary: { border: { left: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "secondary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "accent", foreground: "smart-fb" } } },
    },
    container: { sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "muted", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" }, effect: "none" },
      defaultTypography: { typographyType: "body", textTransform: "none" },
      transition: { duration: "fast", timing: "linear" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
        {
          where: { status: "error" },
          partialSurface: {
            interior: { background: "background", foreground: "smart-fb" },
            boundary: { border: { color: "status-error" } },
            tint: "status-error",
          },
        },
        {
          where: { status: "success" },
          partialSurface: {
            interior: { background: "background", foreground: "smart-fb" },
            boundary: { border: { color: "status-success" } },
            tint: "status-success",
          },
        },
        {
          where: { status: "warning" },
          partialSurface: {
            interior: { background: "background", foreground: "smart-fb" },
            boundary: { border: { color: "status-warning" } },
            tint: "status-warning",
          },
        },
        {
          where: { status: "info" },
          partialSurface: {
            interior: { background: "background", foreground: "smart-fb" },
            boundary: { border: { color: "status-info" } },
            tint: "status-info",
          },
        },
        {
          where: { emphasis: "hero" },
          partialSurface: {
            interior: { background: "accent", foreground: "smart-fb" },
            boundary: { border: { color: "foreground" }, effect: "hard-4" },
          },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: { interior: { background: "transparent", foreground: "gray-600" }, boundary: { border: { color: "transparent" } } },
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
        interior: { background: "background", foreground: "smart-fb", padding: { x: "sm", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "foreground" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "foreground" }, effect: "hard" } } },
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
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "foreground" } },
      },
      overlay: { scrimColor: "foreground", scrimOpacity: 0.3, scrimBlur: "none" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-yellow-soft" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "content-pink-soft" } } },
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
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" } },
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
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              defaultTypography: { textDecoration: "underline" },
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
            partialSurface: { interior: { background: "content-yellow-soft" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "hover", emphasis: "hero" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "hover", emphasis: "secondary" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "content-yellow-soft", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", emphasis: "quiet" },
            partialSurface: {
              interior: { background: "content-yellow-soft", foreground: "smart-fb" },
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
          {
            where: { state: "active" },
            partialSurface: { interior: { background: "content-yellow-soft" }, dimensionPosition: { translateX: "0px", translateY: "2px" } },
          },
          {
            where: { state: "active", emphasis: "primary" },
            partialSurface: {
              interior: { background: "foreground", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "2px" },
            },
          },
          {
            where: { state: "active", emphasis: "hero" },
            partialSurface: {
              interior: { background: "foreground", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "2px" },
            },
          },
          {
            where: { state: "active", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
              dimensionPosition: { translateX: "0px", translateY: "2px" },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              dimensionPosition: { translateX: "0px", translateY: "2px" },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
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
            partialSurface: { boundary: { outline: { width: "thick", style: "solid", color: "foreground", offset: "0px" } } },
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
        boundary: { border: { width: "thin", style: "solid", color: "foreground" } },
      },
      objectFit: "cover",
    },
  },
  elements: {
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: {} },
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
      interior: { padding: { x: "lg", y: "xs" }, foreground: "gray-600", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" } }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "content-yellow-soft" } } },
        { where: { state: "selected" }, partialSurface: { interior: { background: "content-pink-soft" } } },
      ],
    },
    tableCell: {
      interior: { padding: { x: "lg", y: "sm" } },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "body", textTransform: "none" },
    },
    card: { interior: { padding: { x: "lg", y: "lg" }, gap: { all: "md" } }, boundary: { effect: "none" } },
    header: {
      interior: { background: "transparent", padding: { x: "lg", y: "md" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: { interior: { background: "transparent", padding: { x: "lg", y: "md" } }, boundary: { border: { width: "none" } } },
    footer: {
      interior: { background: "transparent", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-200" } } },
    },
    panel: { interior: { padding: { all: "lg" } } },
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: {
            interior: { background: "content-pink-soft", foreground: "smart-fb" },
            boundary: { border: { color: "foreground" }, effect: "hard-4" },
          },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: { interior: { background: "transparent" }, boundary: { border: { color: "transparent" } } },
        },
      ],
    },
    separator: {
      surface: { interior: { background: "gray-200", padding: {} }, boundary: { border: { width: "none" } } },
      height: "1px",
    },
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "foreground" } },
      },
    },
    alert: {
      surface: {
        interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, effect: "hard" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              tint: "status-error",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              tint: "status-success",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              tint: "status-warning",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              tint: "status-info",
            },
          },
        ],
      },
    },
    badge: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xs", y: "3xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "info" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: {
              interior: { background: "transparent", foreground: "gray-600" },
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
        interior: { background: "content-violet-soft", foreground: "smart-fb", padding: { x: "sm", y: "2xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-yellow-soft" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
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
          background: "content-pink-soft",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { radius: { all: "full" }, border: { width: "thin", style: "solid", color: "foreground" } },
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
        interior: { background: "content-blue-soft", padding: {} },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" } },
        dimensionPosition: { height: "8px" },
      },
    },
    progressInner: { interior: { background: "primary" } },
    skeleton: { surface: { interior: { background: "gray-100" }, boundary: { border: { width: "none" } } } },
    spinner: {
      surface: { interior: { foreground: "primary", background: "transparent" }, boundary: { border: { width: "none" } } },
    },
    button: {
      surface: {
        interior: { gap: { all: "sm" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        combined: [
          { where: { emphasis: "hero" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "primary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "hover", emphasis: "primary" }, partialSurface: { boundary: { effect: "hard" } } },
          { where: { state: "hover", emphasis: "hero" }, partialSurface: { boundary: { effect: "hard" } } },
          { where: { state: "hover", emphasis: "secondary" }, partialSurface: { boundary: { effect: "hard" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "40px", height: "22px" },
        interior: { background: "content-blue-soft", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "thin", style: "solid", color: "foreground" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "content-blue-soft", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: { tint: "transparent", interior: { backgroundAlpha: 1, background: "primary" } },
          },
        ],
      },
      thumb: {
        dimensionPosition: { width: "16px", height: "16px", translateX: "3px", translateY: "0px" },
        interior: { background: "background" },
        boundary: { radius: { all: "full" }, border: { width: "thin", style: "solid", color: "foreground" } },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "7px", translateY: "0px" } } }],
      },
    },
    checkbox: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" } },
        dimensionPosition: { width: "18px", height: "18px" },
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: {
              tint: "transparent",
              boundary: { border: { color: "foreground" } },
              interior: { backgroundAlpha: 1, background: "primary", foreground: "smart-fb" },
            },
          },
        ],
      },
    },
    radio: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "full" } },
        dimensionPosition: { width: "18px", height: "18px" },
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
              boundary: { border: { color: "foreground" } },
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
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
        interior: { gap: { all: "lg" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "none", y: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "content-yellow-soft", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { bottom: { color: "foreground" } } },
            },
          },
        ],
        defaultTypography: { typographyType: "link", textTransform: "none" },
      },
    },
    sidebar: {
      widthExpanded: "240px",
      widthCollapsed: "72px",
      surface: {
        interior: { background: "muted", padding: { y: "sm" }, gap: { all: "2xs" }, foreground: "smart-fb" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "smart-fb",
          padding: { x: "lg", y: "sm" },
          gap: { all: "sm" },
          childAlign: { horizontal: "start", vertical: "center" },
        },
        boundary: {
          border: { width: "none", left: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "none" },
        },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "content-yellow-soft", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "content-pink-soft", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "foreground" } } },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-400" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "none" },
              tint: "transparent",
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "transparent",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "main-white" },
              boundary: { border: { color: "transparent", left: { color: "background" } } },
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
        interior: { background: "transparent", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } }, radius: { all: "none" } },
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
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-yellow-soft" } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } },
          },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    menuItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "md", y: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "content-yellow-soft", foreground: "smart-fb" } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } },
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
        },
        boundary: { border: { width: "thin", style: "dashed", color: "foreground" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-pink-soft" }, boundary: { border: { color: "foreground" } } },
          },
        ],
      },
    },
    select: { surface: { cursor: "pointer" } },
    dialog: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    sheet: { surface: { boundary: { effect: "drawer", border: { width: "none" } }, interior: { padding: { all: "none" } } } },
    popover: {
      surface: {
        boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "foreground" } },
        interior: { padding: { all: "sm" } },
      },
    },
    tooltip: {
      surface: {
        interior: { background: "primary", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
        boundary: { border: { width: "none" }, effect: "popover" },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    toast: {
      surface: {
        interior: { padding: { x: "md", y: "sm" } },
        boundary: { effect: "hard-4", border: { width: "thin", style: "solid", color: "foreground" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" }, margin: { x: "xs" } },
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
    textarea: { surface: { boundary: { radius: { all: "none" } } } },
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
        interior: { background: "secondary", foreground: "smart-fb" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "secondary", foreground: "smart-fb" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
  ],
};
