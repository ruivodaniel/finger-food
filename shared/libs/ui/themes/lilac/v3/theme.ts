import type { WebTheme } from "../../../types";

// LILAC v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/lilac.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Lilac — playful AI SaaS
//   violet carries interaction, focus and AI moments; mint = progress/done, peach = warnings, soft red = error.
//   the primary is the violet gradient with a coloured glow; everything pressed is a pill; cards have 20px corners.
//   interaction: hover lifts a control 1px and deepens the glow; pressed sinks 1px; the current row is the violet tint
//   with a violet bar; focus is a soft violet ring; everything eases over 180ms.
//
// L1 read of the mood
//   anchors     background #FFFFFF · foreground #1A1823 (grays mixed 8% towards the ink: cool)
//   brand       1 #6C4FE0 violet · 2 #5A3FE0 deep (hover, the tint's ink) · 3 #9B8AFB soft (the gradient's start, the
//               lavender ground) · 4 #9A96A8 muted
//   status      success #2BD4BD mint · info #6C4FE0 · warning #F59E4C peach · error #E5484D
//   fonts       DM Sans body/UI · Plus Jakarta Sans headings and numerals (700/800)
//   rhythm      unit 0.75rem · radius xs 8 sm 10 md 12 lg 16 xl 20 2xl 24 · pills on controls
//   effects     the primary's violet glow · a lifted card's violet shadow · modal 24/64
//
// Gradients: the engine prefers a gradient to a fill, so a gradient-filled control carries flat gradients through
// its status states (gradient-status-*).

export const lilacTheme: WebTheme = {
  id: "lilac",
  name: "Lilac",
  version: 3,
  type: "high-fidelity",
  kind: "product",
  colors: {
    main: { white: "#FFFFFF", black: "#1A1823" },
    brand: { "1": "#6C4FE0", "2": "#5A3FE0", "3": "#9B8AFB", "4": "#9A96A8" },
    status: { success: "#2BD4BD", info: "#6C4FE0", warning: "#F59E4C", error: "#E5484D" },
    content: {
      tomato: { standard: "#DA4223", soft: "#FFC5B7" },
      red: { standard: "#DA3D44", soft: "#FFC3BF" },
      ruby: { standard: "#DA3B5D", soft: "#FFC3C8" },
      crimson: { standard: "#DE3179", soft: "#FFC2D2" },
      pink: { standard: "#CB3596", soft: "#FDBEDF" },
      plum: { standard: "#A140B0", soft: "#E7C0ED" },
      purple: { standard: "#8545BC", soft: "#D9C1F4" },
      violet: { standard: "#664DC5", soft: "#C9C5F9" },
      iris: { standard: "#5352CC", soft: "#C0C8FC" },
      indigo: { standard: "#3659D3", soft: "#B6CBFF" },
      blue: { standard: "#0087F0", soft: "#BADAFF" },
      sky: { standard: "#72D8F4", soft: "#D1F4FF" },
      cyan: { standard: "#0098BB", soft: "#B7E0EE" },
      teal: { standard: "#009B8B", soft: "#B8E1D9" },
      jade: { standard: "#199A7A", soft: "#B9E1D2" },
      green: { standard: "#229B63", soft: "#BAE1C9" },
      grass: { standard: "#3C9E4F", soft: "#BEE2C1" },
      mint: { standard: "#7CE0CA", soft: "#D3F7EE" },
      lime: { standard: "#B3E458", soft: "#E4F9C6" },
      yellow: { standard: "#F5DC0C", soft: "#FDF5BC" },
      amber: { standard: "#F5BB2F", soft: "#FFEAC1" },
      orange: { standard: "#EB6200", soft: "#FFCFBA" },
      brown: { standard: "#A4764F", soft: "#E5D1C1" },
      bronze: { standard: "#987769", soft: "#E0D1CB" },
      gold: { standard: "#8E7A5C", soft: "#DBD3C6" },
    },
    custom: {
      lavender: "#E4DDFF",
    },
    semanticTokens: { primary: "#6C4FE0", secondary: "#5A3FE0", accent: "#9B8AFB", muted: "#9A96A8" },
  },
  typography: {
    fonts: {
      primary: "DM Sans, Helvetica, Arial, sans-serif",
      secondary: "Plus Jakarta Sans, DM Sans, sans-serif",
      quote: "DM Sans, Helvetica, Arial, sans-serif",
      monoPrimary: "DM Sans, Helvetica, Arial, sans-serif",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      "DM Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" },
      "Plus Jakarta Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 29,
        fontSizeDesktop: 32,
        fontWeight: 800,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 18,
        fontSizeDesktop: 20,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 800,
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
      },
      heading4: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
        fontWeight: 700,
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
        fontSizeMobile: 32,
        fontSizeDesktop: 36,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 27,
        fontSizeDesktop: 30,
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 800,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 12,
        fontWeight: 800,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 700,
        lineHeight: 1.4,
        letterSpacing: "0.08em",
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
    "3xs": "4px",
    "2xs": "6px",
    xs: "8px",
    sm: "10px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "28px",
    full: "9999px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 0, y: 24, blur: 64, spread: -16, color: "main-black", opacity: 0.3 }],
    drawer: [{ type: "drop-shadow", x: -20, y: 0, blur: 44, spread: 0, color: "main-black", opacity: 0.16 }],
    popover: [{ type: "drop-shadow", x: 0, y: 10, blur: 24, spread: -8, color: "main-black", opacity: 0.4 }],
    "card-hover": [
      { type: "drop-shadow", x: 0, y: 8, blur: 16, spread: -4, color: "main-black", opacity: 0.08 },
      { type: "drop-shadow", x: 0, y: 24, blur: 48, spread: -16, color: "primary", opacity: 0.25 },
    ],
    glow: [{ type: "drop-shadow", x: 0, y: 8, blur: 20, spread: -8, color: "primary", opacity: 0.5 }],
    "glow-hover": [{ type: "drop-shadow", x: 0, y: 12, blur: 28, spread: -8, color: "primary", opacity: 0.6 }],
    "glow-pressed": [{ type: "drop-shadow", x: 0, y: 2, blur: 6, spread: -2, color: "primary", opacity: 0.5 }],
    secondary: [{ type: "drop-shadow", x: 0, y: 2, blur: 6, spread: 0, color: "main-black", opacity: 0.06 }],
    check: [{ type: "drop-shadow", x: 0, y: 2, blur: 6, spread: 0, color: "primary", opacity: 0.4 }],
    page: [{ type: "drop-shadow", x: 0, y: 6, blur: 14, spread: -6, color: "primary", opacity: 0.45 }],
    summary: [{ type: "drop-shadow", x: 0, y: 8, blur: 24, spread: -12, color: "secondary", opacity: 0.18 }],
    product: [{ type: "drop-shadow", x: 0, y: 1, blur: 2, spread: 0, color: "main-black", opacity: 0.04 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "60ms", fast: "120ms", average: "180ms", slow: "300ms", extraSlow: "500ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#1A1823",
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
      dark: {
        background: "#1A1823",
        foreground: "#F8F7FC",
        chroma: { saturationFactor: 0.95, gamma: 1 },
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },
  layouts: {
    surface: { interior: { background: "brand-1-gray-50", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "gray-50" } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    secondPageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    mainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" },
      },
    },
    secondMainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" },
      },
    },
    pageLeftSidebar: {
      width: "256px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } },
        interior: { background: "background" },
      },
    },
    pageRightSidebar: {
      width: "320px",
      sm: { width: "280px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } } },
    },
    mainRightSidebar: {
      width: "320px",
      sm: { width: "260px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: {
        interior: { background: "background" },
        boundary: { border: { left: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "gradient-hero", foreground: "smart-fb" } } },
      secondary: { surface: { tint: "primary", interior: { background: "background", foreground: "smart-fb" } } },
    },
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "gray-50", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "xl" }, effect: "card" },
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
            interior: { background: "gradient-hero", foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
          },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: {
            interior: { background: "transparent", foreground: "gray-600" },
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
        interior: { background: "background", foreground: "smart-fb", padding: { x: "sm", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "md" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "accent" } } } },
          {
            where: { state: "focus" },
            partialSurface: { tint: "primary",
              boundary: {
                border: { color: "primary" },
                outline: { width: "thin", style: "solid", color: "transparent", offset: "0px" },
              },
            },
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
            partialSurface: { interior: { background: "gray-50", opacity: 0.6 }, cursor: "not-allowed" },
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
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "xl" } },
      },
      overlay: { scrimColor: "accent", scrimOpacity: 0.4, scrimBlur: "sm" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
          {
            where: { state: "selected" },
            partialSurface: { tint: "primary",
              interior: { background: "background" },
              boundary: { border: { left: { width: "thick", style: "solid", color: "primary" } } },
            },
          },
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
          partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "link" } },
          icon: { size: "xs" },
        },
        md: {
          partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "link" } },
          icon: { size: "sm" },
        },
        lg: {
          partialSurface: { interior: { padding: { x: "2xl", y: "md" } }, defaultTypography: { typographyType: "link" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "link", textTransform: "none" },
        cursor: "pointer",
        combined: [
          {
            where: { emphasis: "hero" },
            partialSurface: {
              interior: { background: "gradient-hero", foreground: "smart-fb" },
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
            partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "gray-200" } } },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } },
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
              interior: { background: "gray-50" },
              boundary: { border: { color: "accent" } },
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
              interior: { background: "gray-50", foreground: "secondary" },
              boundary: { border: { color: "accent" } },
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
            partialSurface: { interior: { background: "gray-100", foreground: "secondary" }, boundary: { border: { color: "transparent" } } },
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
            partialSurface: { interior: { background: "gray-50" }, dimensionPosition: { translateX: "0px", translateY: "1px" } },
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
            partialSurface: { tint: "primary",
              interior: { background: "background", foreground: "secondary" },
              boundary: { border: { color: "accent" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "accent", foreground: "smart-fb" },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "lg" } },
      },
      objectFit: "cover",
    },
  },
  elements: {
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: {} },
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
      interior: { padding: { x: "lg", y: "sm" }, foreground: "gray-500", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, effect: "none" },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" }, effect: "none" }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, effect: "none" },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
        {
          where: { state: "selected" },
          partialSurface: { tint: "primary",
            interior: { background: "background" },
            boundary: { border: { left: { width: "thick", style: "solid", color: "primary" } } },
          },
        },
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
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, effect: "none" },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" } },
      boundary: { border: { width: "none" }, effect: "none" },
    },
    footer: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-100" } }, effect: "none" },
    },
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "lg" } },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: {
            interior: { background: "gradient-hero", foreground: "smart-fb" },
            boundary: { border: { color: "transparent" } },
          },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: { interior: { background: "gray-50" }, boundary: { border: { color: "transparent" } } },
        },
      ],
    },
    separator: {
      surface: {
        interior: { background: "transparent", padding: {} },
        boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
      },
      height: "1px",
    },
    badge: {
      surface: {
        interior: { background: "gray-100", foreground: "gray-700", padding: { x: "md", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" }, effect: "none" },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" } },
          },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" } },
          },
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" } },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" } },
          },
          {
            where: { status: "info" },
            partialSurface: { tint: "status-info", interior: { background: "background", foreground: "status-info" } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: { tint: "primary", interior: { background: "background", foreground: "secondary" } },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" } },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" } },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" } },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" } },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { tint: "status-info", interior: { background: "background", foreground: "status-info" } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "transparent", foreground: "gray-500" } },
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
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gradient-flat-brand-3" } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "gradient-selected", foreground: "smart-fb" } },
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
      surface: { tint: "primary",
        interior: {
          background: "background",
          foreground: "secondary",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "none" },
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
        interior: { background: "gray-100" },
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
        combined: [
          { where: { emphasis: "hero" }, partialSurface: { boundary: { effect: "glow" } } },
          { where: { emphasis: "primary" }, partialSurface: { boundary: { effect: "glow" } } },
          { where: { emphasis: "secondary" }, partialSurface: { boundary: { effect: "secondary" } } },
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "hover", emphasis: "primary" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "hover", emphasis: "hero" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "hover", emphasis: "secondary" }, partialSurface: { boundary: { effect: "secondary" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "glow-pressed" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "glow-pressed" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "44px", height: "24px" },
        interior: { background: "gradient-flat-gray-200", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-gray-200", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: { tint: "transparent", interior: { backgroundAlpha: 1, background: "gradient-primary" } },
          },
        ],
      },
      thumb: {
        dimensionPosition: { width: "20px", height: "20px", translateX: "2px", translateY: "0px" },
        interior: { background: "gradient-flat-background" },
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "secondary" },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "4px", translateY: "0px" } } }],
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "xs" } },
        dimensionPosition: { width: "18px", height: "18px" },
        combined: [
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" }, effect: "check" },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "gray-300" } },
            },
          },
          {
            where: { emphasis: "primary", state: "selected" },
            partialSurface: {
              tint: "transparent",
              boundary: { border: { color: "transparent" }, effect: "check" },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "full" } },
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
              interior: { background: "gradient-flat-background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "gray-300" } },
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
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
        interior: { gap: { all: "xl" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "gradient-flat-transparent", foreground: "smart-fb", padding: { x: "none", y: "sm" } },
        boundary: {
          border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "none" },
        },
        combined: [
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
              interior: { background: "gradient-flat-transparent", foreground: "smart-fb" },
              boundary: { border: { bottom: { color: "primary" } } },
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
        interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "lg" } },
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
      widthExpanded: "256px",
      widthCollapsed: "64px",
      surface: {
        interior: { background: "background", padding: { y: "xl", x: "lg" }, gap: { all: "xs" }, foreground: "gray-600" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "gradient-flat-transparent",
          foreground: "smart-fb",
          padding: { x: "md", y: "sm" },
          gap: { all: "sm" },
          childAlign: { horizontal: "start", vertical: "center" },
        },
        boundary: { border: { width: "none", left: { width: "thick", style: "solid", color: "transparent" } }, radius: { all: "md" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "gradient-flat-gray-50", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-flat-brand-1-light", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
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
              interior: { background: "gradient-flat-gray-50", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "gray-50",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-flat-brand-1-light", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "primary",
            },
          },
        ],
        dimensionPosition: { height: "42px" },
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
        interior: { background: "gradient-flat-transparent", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
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
          { where: { state: "hover" }, partialSurface: { interior: { background: "gradient-flat-gray-50" } } },
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
        interior: { background: "gradient-flat-transparent", padding: { x: "md", y: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "gradient-flat-gray-50", foreground: "smart-fb" } },
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
        },
        boundary: { border: { width: "thin", style: "dashed", color: "gray-200" }, radius: { all: "xl" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { tint: "primary", interior: { background: "background" }, boundary: { border: { color: "primary" } } },
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
        boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "lg" } },
        interior: { padding: { all: "sm" }, gap: { all: "sm" } },
      },
    },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
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
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "lg" } },
      },
    },
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "gray-200" }, radius: { all: "xl" } },
      },
    },
    textarea: { surface: { boundary: { radius: { all: "md" } } } },
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
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { effect: "summary", radius: { all: "xl" }, border: { width: "thin", style: "solid", color: "gray-100" } },
      },
      content: { interior: { padding: { x: "xl", y: "lg" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "xl", y: "none" }, gap: { all: "xs" } },
        boundary: {
          border: { width: "none", left: { width: "thin", style: "solid", color: "gray-100" } },
          effect: "none",
          radius: { all: "none" },
        },
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: { interior: { padding: { left: "none" } }, boundary: { border: { left: { width: "none" } } } },
          },
        ],
      },
    },
    product: {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { effect: "product", radius: { all: "xl" }, border: { width: "thin", style: "solid", color: "gray-100" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "accent" }, effect: "card-hover" } } },
        ],
      },
      content: { interior: { padding: { all: "none" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "2xl", y: "2xl" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, effect: "none", radius: { all: "none" } },
      },
      badge: {
        interior: { background: "background", foreground: "gray-600", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" } },
        defaultTypography: { typographyType: "bodyExtraSmall", textTransform: "none" },
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
          { where: { status: "error" }, partialSurface: { interior: { foreground: "status-error" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
          { where: { status: "success" }, partialSurface: { interior: { foreground: "status-success" } } },
          { where: { status: "warning" }, partialSurface: { interior: { foreground: "status-warning" } } },
          { where: { status: "info" }, partialSurface: { interior: { foreground: "status-info" } } },
        ],
      },
    },
    aside: {
      tile: {
        interior: { background: "transparent", padding: { all: "2xl" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: {
          border: { width: "none", left: { width: "thin", style: "solid", color: "gray-100" } },
          effect: "none",
          radius: { all: "none" },
        },
        dimensionPosition: { height: "100%" },
      },
      button: {
        dimensionPosition: { width: "260px" },
        interior: { childAlign: { horizontal: "center" } },
        defaultTypography: { typographyType: "link" },
        combined: [{ where: { emphasis: "primary" }, partialSurface: { interior: { padding: { x: "xl", y: "md" } } } }],
      },
    },
    figures: {
      card: {
        interior: { padding: { all: "none" }, gap: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-100" }, effect: "none", radius: { all: "lg" } },
        combined: [{ where: { state: "hover" }, partialSurface: { boundary: { border: { color: "gray-100" }, effect: "none" } } }],
      },
      content: { interior: { padding: { all: "none" } } },
      tile: {
        interior: { background: "background", padding: { x: "xl", y: "xl" }, gap: { all: "sm" } },
        boundary: {
          border: { width: "none", left: { width: "thin", style: "solid", color: "gray-100" } },
          effect: "none",
          radius: { all: "none" },
        },
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: { interior: { background: "gray-50" }, boundary: { border: { left: { width: "none" } } } },
          },
        ],
      },
    },
    wordmark: { avatar: { boundary: { radius: { all: "xs" } }, interior: { background: "primary", foreground: "smart-fb" } } },
    sort: { tabBar: { boundary: { border: { width: "none" } }, interior: { gap: { all: "xl" } } } },
    group: {
      separator: {
        interior: { background: "gray-300" },
        boundary: { border: { top: { width: "thin", style: "solid", color: "gray-300" } } },
      },
    },
    timeline: { separator: { interior: { background: "gray-200" } } },
    hero: {
      label: { interior: { foreground: "custom-lavender" } },
      button: {
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: { interior: { background: "gradient-white", foreground: "smart-fb" }, boundary: { effect: "secondary" } },
          },
          {
            where: { emphasis: "primary", state: "hover" },
            partialSurface: { interior: { background: "gradient-white", foreground: "smart-fb" } },
          },
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "main-white" },
              boundary: { border: { color: "background" } },
            },
          },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "main-white" } } },
        ],
      },
      card: { interior: { padding: { all: "none" }, foreground: "main-white" } },
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
      label: { interior: { foreground: "custom-lavender" } },
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "main-white" } } }] },
      card: { interior: { foreground: "main-white" } },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "main-white", padding: { left: "xl", right: "none", y: "md" } },
        boundary: {
          border: {
            width: "none",
            left: { width: "thin", style: "solid", color: "accent" },
            bottom: { width: "thin", style: "solid", color: "accent" },
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
      card: { interior: { padding: { all: "none" } }, boundary: { radius: { all: "lg" } } },
      content: { interior: { padding: { x: "xl", y: "lg" } } },
      button: {
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              tint: "background",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "gray-200" } },
            },
          },
        ],
      },
    },
  },
  // the document body: the colour the page stands on (as the page layout)
  body: {surface: {interior: {background: "gray-50"}}},
  rules: [
    // a Stack's scale word gives its gap: the theme gives each word its measure
    {chain: [{key: "stack", where: {scale: "3xs"}}], tokens: {interior: {gap: {all: "3xs"}}}},
    {chain: [{key: "stack", where: {scale: "2xs"}}], tokens: {interior: {gap: {all: "2xs"}}}},
    {chain: [{key: "stack", where: {scale: "xs"}}], tokens: {interior: {gap: {all: "xs"}}}},
    {chain: [{key: "stack", where: {scale: "sm"}}], tokens: {interior: {gap: {all: "sm"}}}},
    {chain: [{key: "stack", where: {scale: "md"}}], tokens: {interior: {gap: {all: "md"}}}},
    {chain: [{key: "stack", where: {scale: "lg"}}], tokens: {interior: {gap: {all: "lg"}}}},
    {chain: [{key: "stack", where: {scale: "xl"}}], tokens: {interior: {gap: {all: "xl"}}}},
    {chain: [{key: "stack", where: {scale: "2xl"}}], tokens: {interior: {gap: {all: "2xl"}}}},
    {chain: [{key: "stack", where: {scale: "3xl"}}], tokens: {interior: {gap: {all: "3xl"}}}},
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
      tokens: { tint: "primary",
        interior: { background: "background", foreground: "secondary", padding: { x: "sm", y: "3xs" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
      },
    },
    {
      chain: [{ key: "badge", concept: "dot" }],
      tokens: {
        interior: { padding: { all: "none" }, background: "gray-300" },
        boundary: { border: { width: "none" } },
        combined: [
          { where: { status: "error" }, partialSurface: { interior: { background: "status-error" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error" } } },
          { where: { status: "success" }, partialSurface: { interior: { background: "status-success" } } },
          { where: { status: "warning" }, partialSurface: { interior: { background: "status-warning" } } },
          { where: { status: "info" }, partialSurface: { interior: { background: "status-info" } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "gray-300" } } },
        ],
      },
    },
    {
      chain: [{ key: "pageLeftSidebar" }, { key: "button" }],
      tokens: { interior: { childAlign: { horizontal: "start" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "expanded" } }],
      tokens: {
        interior: { background: "background", foreground: "gray-600" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "background", foreground: "gray-600" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
  ],
  gradients: {
    primary: { type: "linear", angle: 135, stops: [{ color: "accent" }, { color: "primary" }] },
    "primary-hover": { type: "linear", angle: 135, stops: [{ color: "accent" }, { color: "secondary" }] },
    "primary-pressed": { type: "linear", angle: 0, stops: [{ color: "secondary" }, { color: "secondary" }] },
    hero: { type: "linear", angle: 160, stops: [{ color: "accent" }, { color: "primary" }] },
    progress: { type: "linear", angle: 90, stops: [{ color: "accent" }, { color: "primary" }] },
    selected: { type: "linear", angle: 0, stops: [{ color: "primary" }, { color: "primary" }] },
    white: { type: "linear", angle: 0, stops: [{ color: "background" }, { color: "background" }] },
    "status-error": { type: "linear", angle: 0, stops: [{ color: "status-error" }, { color: "status-error" }] },
    "status-error-dark": { type: "linear", angle: 0, stops: [{ color: "status-error" }, { color: "status-error" }] },
    "status-success": { type: "linear", angle: 0, stops: [{ color: "status-success" }, { color: "status-success" }] },
    "status-success-dark": { type: "linear", angle: 0, stops: [{ color: "status-success" }, { color: "status-success" }] },
    "status-warning": { type: "linear", angle: 0, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    "status-warning-dark": { type: "linear", angle: 0, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    "status-info": { type: "linear", angle: 0, stops: [{ color: "status-info" }, { color: "status-info" }] },
    "status-info-dark": { type: "linear", angle: 0, stops: [{ color: "status-info" }, { color: "status-info" }] },
    "flat-brand-1-light": { type: "linear", angle: 0, stops: [{ color: "color-mix(in srgb, var(--color-brand-1) 20%, transparent)" }, { color: "color-mix(in srgb, var(--color-brand-1) 20%, transparent)" }] },
    "flat-brand-3": { type: "linear", angle: 0, stops: [{ color: "accent" }, { color: "accent" }] },
    "flat-background": { type: "linear", angle: 0, stops: [{ color: "background" }, { color: "background" }] },
    "flat-gray-200": { type: "linear", angle: 0, stops: [{ color: "gray-200" }, { color: "gray-200" }] },
    "flat-transparent": { type: "linear", angle: 0, stops: [{ color: "transparent" }, { color: "transparent" }] },
    "flat-gray-50": { type: "linear", angle: 0, stops: [{ color: "gray-50" }, { color: "gray-50" }] },
    "flat-gray-100": { type: "linear", angle: 0, stops: [{ color: "gray-100" }, { color: "gray-100" }] },
  },
};
