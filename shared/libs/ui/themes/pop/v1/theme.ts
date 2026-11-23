import type { WebTheme } from "../../../types";

// POP v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/pop.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Pop — retro colour blocks on cream
//   a cream ground and, instead of white cards, blocks of colour: pink, butter, sky and lilac, with ultramarine for every
//   action and every title (red is the error, never an action). A serif for titles, a round sans for the UI, pills and
//   24px blocks, no border anywhere. The rail is a blue tongue off the left edge.
//   interaction: hover darkens the blue and lifts 1px (the mood's 3% bounce has no scale in the engine); pressed sinks;
//   the current row is a pink block; focus is a blue ring on cream; 160ms.
//
// L1 read of the mood
//   anchors     background #FFFBF2 (the milk of the cards) · foreground #2B1E1E · the cream ground is content-orange-soft
//   brand       1 #2F3FD8 ultramarine · 2 #1B258A deep · 3 #B5BCF0 (the blue line) · 4 #6B5A58 (quiet text)
//   flat        pink #F6B8C3 · yellow #F8D96B butter · blue #BBD6EA sky · violet #C9C4F2 lilac · orange #FBF3E2 cream · mint #CFE8CB
//   status      success #5BA865 · info #3F7FB8 · warning #E8B931 · error #D7392E — a solid pastel block with dark ink
//   fonts       Sora body/UI · Fraunces (upright, 600) headings and numerals
//   rhythm      unit 0.75rem · radius md 16 lg 20 xl 24 · pills on controls · no border · a short soft shadow on what floats
//
// What the engine cannot do: the tongue's vertical centring (the rail is as tall as the page; its right corners are
// rounded and it keeps a margin); the hover bounce (no scale); the pastel KPI blocks (plain cards).

export const popTheme: WebTheme = {
  id: "pop",
  name: "Pop",
  version: 1,
  type: "high-fidelity",
  kind: "product",
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
  typography: {
    fonts: {
      primary: "Sora, Helvetica, Arial, sans-serif",
      secondary: "Fraunces, Georgia, Times New Roman, serif",
      quote: "Sora, Helvetica, Arial, sans-serif",
      monoPrimary: "Sora, Helvetica, Arial, sans-serif",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      Sora: { type: "google", url: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" },
      Fraunces: { type: "google", url: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 36,
        fontSizeDesktop: 40,
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 25,
        fontSizeDesktop: 28,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "0",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 20,
        fontSizeDesktop: 22,
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: "0",
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
        fontSizeMobile: 15,
        fontSizeDesktop: 17,
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
        fontSizeMobile: 15,
        fontSizeDesktop: 17,
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
        fontSizeMobile: 40,
        fontSizeDesktop: 44,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.01em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 31,
        fontSizeDesktop: 34,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 600,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 12,
        fontWeight: 600,
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
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
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
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
    "2xl": "28px",
    "3xl": "32px",
    full: "9999px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 0, y: 32, blur: 72, spread: -24, color: "muted", opacity: 0.4 }],
    drawer: [{ type: "drop-shadow", x: -24, y: 0, blur: 60, spread: 0, color: "muted", opacity: 0.3 }],
    popover: [{ type: "drop-shadow", x: 0, y: 12, blur: 24, spread: -10, color: "main-black", opacity: 0.3 }],
    "card-hover": [{ type: "drop-shadow", x: 0, y: 20, blur: 40, spread: -20, color: "muted", opacity: 0.3 }],
    glow: [{ type: "drop-shadow", x: 0, y: 6, blur: 16, spread: -8, color: "primary", opacity: 0.6 }],
    "glow-hover": [{ type: "drop-shadow", x: 0, y: 12, blur: 24, spread: -10, color: "primary", opacity: 0.6 }],
    rail: [{ type: "drop-shadow", x: 0, y: 24, blur: 48, spread: -24, color: "secondary", opacity: 0.5 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "60ms", fast: "120ms", average: "160ms", slow: "280ms", extraSlow: "400ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "1px", thin: "1.5px", default: "1.5px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFBF2",
        foreground: "#2B1E1E",
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
      dark: {
        background: "#2B1E1E",
        foreground: "#FBF3E2",
        chroma: { saturationFactor: 0.9, gamma: 0.9 },
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },
  layouts: {
    surface: { interior: { background: "content-orange-soft", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "transparent", foreground: "primary", padding: { x: "xl" } },
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
        interior: { background: "background" },
        boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "none" }, radius: { all: "xl" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } } },
    },
    container: { sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "content-orange-soft", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "accent", trackColor: "transparent", width: "8px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "xl" }, effect: "none" },
      defaultTypography: { typographyType: "body", textTransform: "none" },
      transition: { duration: "average", timing: "ease" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
        {
          where: { status: "error" },
          partialSurface: {
            interior: { background: "content-pink-soft", foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
            tint: "transparent",
          },
        },
        {
          where: { status: "success" },
          partialSurface: {
            interior: { background: "content-mint-soft", foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
            tint: "transparent",
          },
        },
        {
          where: { status: "warning" },
          partialSurface: {
            interior: { background: "content-yellow-standard", foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
            tint: "transparent",
          },
        },
        {
          where: { status: "info" },
          partialSurface: {
            interior: { background: "content-blue-soft", foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
            tint: "transparent",
          },
        },
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: { interior: { background: "transparent", foreground: "muted" }, boundary: { border: { color: "transparent" } } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "full" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "primary" } } } },
          {
            where: { state: "focus" },
            partialSurface: {
              boundary: { border: { color: "primary" }, outline: { width: "thin", style: "solid", color: "primary", offset: "0px" } },
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
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "2xl" } },
      },
      overlay: { scrimColor: "content-pink-soft", scrimOpacity: 0.5, scrimBlur: "none" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-100" }, width: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-orange-soft" } } },
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
        interior: { background: "background", foreground: "primary", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "full" } },
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
            partialSurface: { interior: { background: "background", foreground: "primary" }, boundary: { border: { color: "primary" } } },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "transparent", foreground: "muted" }, boundary: { border: { color: "transparent" } } },
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
              interior: { background: "primary" },
              boundary: { border: { color: "primary" } },
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
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "primary" } },
              dimensionPosition: { translateX: "0px", translateY: "-1px" },
            },
          },
          {
            where: { state: "hover", emphasis: "tertiary" },
            partialSurface: { tint: "primary",
              interior: { background: "background", foreground: "secondary" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", emphasis: "quiet" },
            partialSurface: { tint: "primary",
              interior: { background: "background", foreground: "primary" },
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
            partialSurface: { interior: { background: "primary" }, dimensionPosition: { translateX: "0px", translateY: "1px" } },
          },
          {
            where: { state: "active", emphasis: "primary" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "hero" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "secondary" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "content-pink-soft", foreground: "smart-fb" },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
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
            partialSurface: { boundary: { outline: { width: "thick", style: "solid", color: "primary", offset: "3px" } } },
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
        interior: { background: "content-blue-soft", padding: {} },
        boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
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
        interior: { background: "transparent", foreground: "muted", padding: {} },
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
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, radius: { all: "md" } },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "content-orange-soft" } } },
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
      interior: { background: "transparent", padding: { x: "lg", y: "md" }, gap: { all: "sm" }, foreground: "primary" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: { interior: { background: "transparent", padding: { x: "lg", y: "md" } }, boundary: { border: { width: "none" } } },
    footer: {
      interior: { background: "transparent", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-100" } } },
    },
    panel: { interior: { padding: { all: "lg" } } },
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
      combined: [
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "content-orange-soft" } } },
      ],
    },
    separator: {
      surface: { interior: { background: "transparent", padding: {} }, boundary: { border: { width: "none" } } },
      height: "0px",
    },
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "muted",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "accent" }, radius: { all: "xl" } },
      },
    },
    alert: {
      surface: {
        interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" }, background: "background" },
        boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "success" },
            partialSurface: { interior: { background: "content-mint-soft", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "warning" },
            partialSurface: { interior: { background: "content-yellow-standard", foreground: "smart-fb" }, tint: "transparent" },
          },
          {
            where: { status: "info" },
            partialSurface: { interior: { background: "content-blue-soft", foreground: "smart-fb" }, tint: "transparent" },
          },
        ],
      },
    },
    badge: {
      surface: {
        interior: { background: "content-orange-soft", foreground: "smart-fb", padding: { x: "xs", y: "3xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          { where: { status: "error" }, partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } } },
          {
            where: { status: "destructive" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } },
          },
          {
            where: { status: "success" },
            partialSurface: { interior: { background: "content-mint-soft", foreground: "smart-fb" } },
          },
          {
            where: { status: "warning" },
            partialSurface: { interior: { background: "content-yellow-standard", foreground: "smart-fb" } },
          },
          { where: { status: "info" }, partialSurface: { interior: { background: "content-blue-soft", foreground: "smart-fb" } } },
          { where: { emphasis: "primary" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { interior: { background: "content-mint-soft", foreground: "smart-fb" } },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { interior: { background: "content-yellow-standard", foreground: "smart-fb" } },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { interior: { background: "content-blue-soft", foreground: "smart-fb" } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "transparent", foreground: "muted" } },
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
        interior: { background: "content-pink-soft", foreground: "smart-fb", padding: { x: "sm", y: "2xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-violet-soft" } } },
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
          background: "content-yellow-standard",
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
        interior: { background: "content-orange-soft", padding: {} },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        dimensionPosition: { height: "8px" },
      },
    },
    progressInner: { interior: { background: "primary" }, boundary: { radius: { all: "full" } } },
    skeleton: {
      surface: { interior: { background: "content-orange-soft" }, boundary: { border: { width: "none" }, radius: { all: "md" } } },
    },
    spinner: {
      surface: { interior: { foreground: "primary", background: "transparent" }, boundary: { border: { width: "none" } } },
    },
    button: {
      surface: {
        interior: { gap: { all: "sm" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        combined: [
          { where: { emphasis: "hero" }, partialSurface: { boundary: { effect: "glow" } } },
          { where: { emphasis: "primary" }, partialSurface: { boundary: { effect: "glow" } } },
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "hover", emphasis: "primary" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "hover", emphasis: "hero" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "46px", height: "26px" },
        interior: { background: "content-orange-soft", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "thin", style: "solid", color: "primary" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "content-orange-soft", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "primary" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: { tint: "transparent", interior: { backgroundAlpha: 1, background: "primary" } },
          },
        ],
      },
      thumb: {
        dimensionPosition: { width: "18px", height: "18px", translateX: "4px", translateY: "0px" },
        interior: { background: "background" },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "8px", translateY: "0px" } } }],
      },
    },
    checkbox: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "2xs" } },
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
              boundary: { border: { color: "primary" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "full" } },
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
              boundary: { border: { color: "primary" } },
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
        interior: { gap: { all: "2xs" }, background: "background", padding: { all: "3xs" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "xs" } },
        boundary: {
          border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "full" },
        },
        combined: [
          { where: { state: "hover" }, partialSurface: { tint: "primary", interior: { background: "background", foreground: "primary" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
        ],
        defaultTypography: { typographyType: "link", textTransform: "none" },
      },
    },
    sidebar: {
      widthExpanded: "272px",
      widthCollapsed: "88px",
      surface: {
        interior: { background: "transparent", padding: { y: "lg", x: "md" }, gap: { all: "xs" }, foreground: "smart-fb" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "transparent" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "smart-fb",
          padding: { x: "md", y: "sm" },
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
            partialSurface: { tint: "primary",
              interior: { background: "background", foreground: "primary" },
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
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "none" },
              tint: "transparent",
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "secondary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "transparent",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "background", backgroundAlpha: 1, foreground: "primary" },
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
        interior: { background: "transparent", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, radius: { all: "md" } },
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
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-orange-soft" } } },
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
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "content-orange-soft", foreground: "smart-fb" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "content-pink-soft", foreground: "smart-fb" } } },
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
          foreground: "muted",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "accent" }, radius: { all: "xl" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-pink-soft" }, boundary: { border: { color: "primary" } } },
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
        interior: { background: "foreground", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" }, margin: { x: "xs" } },
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
        interior: { background: "primary", foreground: "smart-fb" },
        boundary: {
          border: { width: "none", right: { width: "thin", style: "solid", color: "transparent" } },
          radius: { topRight: "2xl", bottomRight: "2xl" },
          margin: { y: "2xl" },
          effect: "rail",
        },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "primary", foreground: "smart-fb" },
        boundary: {
          border: { width: "none", right: { width: "thin", style: "solid", color: "transparent" } },
          radius: { topRight: "2xl", bottomRight: "2xl" },
          margin: { y: "2xl" },
          effect: "rail",
        },
      },
    },
  ],
};
