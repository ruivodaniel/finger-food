import type { WebTheme } from "../../../types";

// BORRO v2 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/borro.css (moods/v2/build-themes.py).
// v1 is Daniel's hand-written theme on the scaffold of 30 Oct; v2 regenerates from the mood on the scaffold of today, so the
// concepts the pages use (summary, product, figures, timeline, hero, stats, progressList, keyValues, rows, dot) reach it.
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Borro — soft glow, cool UI
//   slate ink and teal on white, a sheet on a warm grey ground; the primary is a teal gradient pill with a ring glow.
//   haze blue = progress and info, sage = done and the chosen product, gold = warning, coral = counters and alerts.
//   interaction: hover lifts a control 1px and widens the ring; pressed sinks 1px; the current row is the haze tint;
//   the active nav item is a white card with a hairline; focus is a soft teal ring; everything eases over 180ms.
//
// L1 read of the mood
//   anchors     background #FFFFFF · foreground #2F4A54 (grays mixed 4% towards the slate: warm)
//   brand       1 #4C7386 teal-mid (the fill's start, the halo, the tint) · 2 #2F505E deep slate (the fill's end, the
//               tooltip, the dark pill) · 3 #9CC3E9 haze blue · 4 #8B8B86 muted; flat teal #3B5D6B is the ink of actions
//   status      success #8FA83F sage · info #5E93C4 · warning #E4B34A gold · error #D75A4A
//   fonts       Helvetica body/UI · Hanken Grotesk headings and numerals (700/800) · ui-monospace labels
//   rhythm      unit 0.75rem · radius 2xs 6 xs 8 sm 10 md 12 lg 14 xl 18 2xl 20 · pills on controls
//   effects     the primary's ring glow · a lifted card's haze ring with a sage and a slate shadow · modal 24/64

export const borroTheme: WebTheme = {
  id: "borro",
  name: "Borro",
  version: 2,
  type: "high-fidelity",
  kind: "product",
  colors: {
    main: { white: "#FFFFFF", black: "#2F4A54" },
    brand: { "1": "#4C7386", "2": "#2F505E", "3": "#9CC3E9", "4": "#8B8B86" },
    status: { success: "#8FA83F", info: "#5E93C4", warning: "#E4B34A", error: "#D75A4A" },
    content: {
      tomato: { standard: "#B35D4B", soft: "#E4BDB4" },
      red: { standard: "#B35B58", soft: "#E4BCB9" },
      ruby: { standard: "#B45A66", soft: "#E5BCBF" },
      crimson: { standard: "#B75777", soft: "#E6BBC6" },
      pink: { standard: "#A95586", soft: "#DFBACD" },
      plum: { standard: "#895392", soft: "#D0B8D3" },
      purple: { standard: "#745396", soft: "#C5B8D5" },
      violet: { standard: "#5F559A", soft: "#BBB9D7" },
      iris: { standard: "#53589E", soft: "#B5BAD9" },
      indigo: { standard: "#445DA2", soft: "#B0BDDB" },
      blue: { standard: "#4883C3", soft: "#B5CDE8" },
      sky: { standard: "#94CCDC", soft: "#D5EAF1" },
      cyan: { standard: "#4D8DA3", soft: "#B8D1DA" },
      teal: { standard: "#4E8D83", soft: "#B8D1CC" },
      jade: { standard: "#518B78", soft: "#B9D0C7" },
      green: { standard: "#528C6B", soft: "#B9D0C1" },
      grass: { standard: "#5B8F62", soft: "#BCD1BE" },
      mint: { standard: "#9AD1C4", soft: "#D7EDE7" },
      lime: { standard: "#B9D68B", soft: "#E2EFD1" },
      yellow: { standard: "#E3D67E", soft: "#F3EFCD" },
      amber: { standard: "#DCBA76", soft: "#F1E4C9" },
      orange: { standard: "#C5744F", soft: "#EBC7B8" },
      brown: { standard: "#90755F", soft: "#D2C6BC" },
      bronze: { standard: "#88756D", soft: "#CEC5C2" },
      gold: { standard: "#817664", soft: "#CBC6BE" },
    },
    custom: {
      teal: "#3B5D6B",
      sage: "#EFF4CF",
      peach: "#FBDDBE",
    },
    semanticTokens: { primary: "#4C7386", secondary: "#2F505E", accent: "#9CC3E9", muted: "#8B8B86" },
  },
  typography: {
    fonts: {
      primary: "Helvetica, Arial, sans-serif",
      secondary: "Hanken Grotesk, Helvetica, Arial, sans-serif",
      quote: "Hanken Grotesk, Helvetica, Arial, sans-serif",
      monoPrimary: "ui-monospace, SFMono-Regular, Menlo, monospace",
      monoSecondary: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      "Hanken Grotesk": { type: "google", url: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;700;800&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 29,
        fontSizeDesktop: 32,
        fontWeight: 800,
        lineHeight: 1.15,
        letterSpacing: "-0.03em",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 18,
        fontSizeDesktop: 20,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 700,
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
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.03em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 27,
        fontSizeDesktop: 30,
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
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: "0.14em",
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
    lg: "14px",
    xl: "18px",
    "2xl": "20px",
    "3xl": "24px",
    full: "9999px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 0, y: 24, blur: 64, spread: -16, color: "secondary", opacity: 0.3 }],
    drawer: [{ type: "drop-shadow", x: -20, y: 0, blur: 44, spread: 0, color: "secondary", opacity: 0.16 }],
    popover: [{ type: "drop-shadow", x: 0, y: 10, blur: 24, spread: -8, color: "secondary", opacity: 0.4 }],
    "card-hover": [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 5, color: "accent", opacity: 0.16 },
      { type: "drop-shadow", x: 0, y: 10, blur: 24, spread: -8, color: "content-lime-standard", opacity: 0.35 },
      { type: "drop-shadow", x: 0, y: 26, blur: 54, spread: -18, color: "custom-teal", opacity: 0.4 },
    ],
    glow: [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.14 },
      { type: "drop-shadow", x: 0, y: 16, blur: 34, spread: -12, color: "secondary", opacity: 0.55 },
    ],
    "glow-hover": [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 5, color: "primary", opacity: 0.22 },
      { type: "drop-shadow", x: 0, y: 18, blur: 38, spread: -12, color: "secondary", opacity: 0.6 },
    ],
    "glow-pressed": [{ type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 3, color: "primary", opacity: 0.2 }],
    secondary: [],
    check: [{ type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.14 }],
    page: [{ type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.14 }],
    segment: [{ type: "drop-shadow", x: 0, y: 2, blur: 8, spread: 0, color: "secondary", opacity: 0.14 }],
    summary: [{ type: "drop-shadow", x: 0, y: 10, blur: 26, spread: -14, color: "secondary", opacity: 0.28 }],
    product: [],
    none: [],
  },
  transitions: {
    duration: { extraFast: "60ms", fast: "120ms", average: "180ms", slow: "300ms", extraSlow: "500ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "2px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#2F4A54",
        derivation: {
          grayColorMixPercentage: "4%",
        },
      },
      dark: {
        background: "#2F4A54",
        foreground: "#F5F5F2",
        chroma: { saturationFactor: 0.8, gamma: 1 },
        derivation: {
          grayColorMixPercentage: "4%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.5 },
  layouts: {
    surface: { interior: { background: "gray-100", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "gray-100" } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "2xl" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    secondPageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "2xl" } },
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
      width: "236px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-150" }, width: "none" } },
        interior: { background: "gray-50" },
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
      primary: { surface: { interior: { background: "gradient-primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "custom-sage", foreground: "smart-fb" } } },
    },
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "background", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "xl" }, effect: "card" },
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
            boundary: { border: { color: "gray-200" } },
            tint: "transparent",
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
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "md" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "md" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "accent" } } } },
          {
            where: { state: "focus" },
            partialSurface: { tint: "primary",
              boundary: {
                border: { color: "custom-teal" },
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
            partialSurface: { interior: { background: "gray-100", opacity: 0.6 }, cursor: "not-allowed" },
          },
        ],
      },
      placeholderColor: "gray-400",
      placeholderOpacity: 1,
      caretColor: "custom-teal",
    },
    elevatedOverlay: {
      surface: {
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "xl" } },
      },
      overlay: { scrimColor: "secondary", scrimOpacity: 0.3, scrimBlur: "sm" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
          {
            where: { state: "selected" },
            partialSurface: { tint: "accent",
              interior: { background: "background" },
              boundary: { border: { left: { width: "thick", style: "solid", color: "custom-teal" } } },
            },
          },
        ],
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
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
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xl", y: "md" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "full" } },
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
            partialSurface: { interior: { background: "background", foreground: "custom-teal" }, boundary: { border: { color: "gray-300" } } },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "custom-teal" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: {
              interior: { background: "transparent", foreground: "custom-teal" },
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
              interior: { background: "gray-50" },
              boundary: { border: { color: "primary" } },
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
            partialSurface: {
              interior: { background: "gray-100", foreground: "secondary" },
              boundary: { border: { color: "secondary" } },
              dimensionPosition: { translateX: "0px", translateY: "1px" },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: { tint: "accent",
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
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
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" }, effect: "none" }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: {
        border: {
          width: "none",
          bottom: { width: "thin", style: "solid", color: "gray-150" },
          left: { width: "thick", style: "solid", color: "transparent" },
        },
        effect: "none",
      },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
        {
          where: { state: "selected" },
          partialSurface: { tint: "accent",
            interior: { background: "background" },
            boundary: { border: { left: { width: "thick", style: "solid", color: "custom-teal" } } },
          },
        },
      ],
    },
    tableCell: {
      interior: { padding: { x: "lg", y: "lg" } },
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
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, effect: "none" },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" } },
      boundary: { border: { width: "none" }, effect: "none" },
    },
    footer: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-150" } }, effect: "none" },
    },
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "custom-sage", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
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
        boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-150" } }, effect: "none" },
      },
      height: "1px",
    },
    badge: {
      surface: {
        interior: { background: "gray-100", foreground: "gray-700", padding: { x: "md", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "full" }, effect: "none" },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "status-success" } },
            },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "status-warning" } },
            },
          },
          {
            where: { status: "info" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "status-info" } },
            },
          },
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "secondary" } },
              tint: "secondary",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "secondary" } },
              tint: "secondary",
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: { tint: "accent", interior: { background: "background", foreground: "secondary" }, boundary: { border: { color: "accent" } } },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "status-success" } },
            },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "status-warning" } },
            },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "status-info" } },
            },
          },
          {
            where: { status: "error", emphasis: "primary" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "secondary" } },
              tint: "secondary",
            },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "secondary" } },
              tint: "secondary",
            },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: {
              interior: { background: "transparent", foreground: "gray-500" },
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
          background: "gradient-flat-flat-sage",
          foreground: "smart-fb",
          padding: { x: "md", y: "xs" },
          gap: { all: "xs" },
        },
        boundary: { border: { width: "thin", style: "solid", color: "content-lime-standard" }, radius: { all: "full" } },
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
        interior: { background: "gray-150", padding: {} },
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
        interior: { foreground: "custom-teal", background: "transparent", padding: { all: "none" } },
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
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "hover", emphasis: "primary" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "hover", emphasis: "hero" }, partialSurface: { boundary: { effect: "glow-hover" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "glow-pressed" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "glow-pressed" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "44px", height: "24px" },
        interior: { background: "gradient-flat-gray-300", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gradient-flat-gray-300", backgroundAlpha: 1, foreground: "smart-fb" },
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
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "segment" },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "2xs" } },
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
            partialSurface: { boundary: { border: { width: "extraThick", color: "custom-teal" } } },
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
              boundary: { border: { width: "extraThick", color: "custom-teal" } },
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
        interior: { background: "gradient-flat-transparent", foreground: "smart-fb", padding: { x: "none", y: "md" } },
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
              boundary: { border: { bottom: { color: "custom-teal" } } },
              defaultTypography: { typographyType: "link", textTransform: "none" },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
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
      widthExpanded: "236px",
      widthCollapsed: "64px",
      surface: {
        interior: { background: "gray-50", padding: { y: "2xl", x: "lg" }, gap: { all: "xs" }, foreground: "gray-600" },
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
        boundary: { border: { width: "none", left: { width: "thick", style: "solid", color: "transparent" } }, radius: { all: "sm" } },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "gradient-flat-gray-100", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "gradient-flat-background", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "segment" },
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
              interior: { background: "gradient-flat-gray-100", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "gray-100",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "gradient-flat-background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "segment" },
              tint: "background",
              defaultTypography: { typographyType: "link", textTransform: "none" },
            },
          },
        ],
        dimensionPosition: { height: "40px" },
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
        interior: { background: "gradient-flat-transparent", padding: { y: "md", x: "lg" }, gap: { all: "md" } },
        boundary: {
          border: { width: "none", style: "solid", color: "gray-200", bottom: { width: "thin", style: "solid", color: "gray-150" } },
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
            partialSurface: { interior: { background: "gradient-flat-brand-3-light", foreground: "smart-fb" } },
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
            partialSurface: { interior: { background: "gradient-flat-brand-3-light", foreground: "smart-fb" } },
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
        boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "xl" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { tint: "accent", interior: { background: "background" }, boundary: { border: { color: "custom-teal" } } },
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
        boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
        interior: { padding: { all: "sm" }, gap: { all: "sm" } },
      },
    },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
    tooltip: {
      surface: {
        interior: { background: "secondary", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
        boundary: { border: { width: "none" }, effect: "popover", radius: { all: "sm" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    toast: {
      surface: {
        interior: { padding: { x: "md", y: "sm" } },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
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
        boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "xl" } },
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
        boundary: {
          effect: "summary",
          radius: { all: "none" },
          border: {
            width: "none",
            top: { width: "thin", style: "solid", color: "gray-200" },
            bottom: { width: "thin", style: "solid", color: "gray-200" },
          },
        },
      },
      content: { interior: { padding: { x: "lg", y: "md" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "lg", y: "none" }, gap: { all: "2xs" } },
        boundary: {
          border: { width: "none", left: { width: "thin", style: "solid", color: "gray-200" } },
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
        boundary: { effect: "product", radius: { all: "xl" }, border: { width: "thin", style: "solid", color: "gray-200" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "accent" }, effect: "card-hover" } } },
        ],
      },
      content: { interior: { padding: { all: "none" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "xl", y: "xl" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, effect: "none", radius: { all: "none" } },
      },
      badge: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "md", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "sm" } },
        defaultTypography: { typographyType: "bodyExtraSmall", textTransform: "none" },
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: { boundary: { radius: { all: "full" } }, defaultTypography: { typographyType: "numbersSmall" } },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "gray-100" }, boundary: { border: { color: "gray-200" } } },
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
        interior: { background: "transparent", padding: { all: "xl" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: {
          border: { width: "none", left: { width: "thin", style: "solid", color: "gray-100" } },
          effect: "none",
          radius: { all: "none" },
        },
        dimensionPosition: { height: "100%" },
      },
      button: {
        dimensionPosition: { width: "100%" },
        interior: { childAlign: { horizontal: "center" } },
        defaultTypography: { typographyType: "link" },
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
        interior: { background: "background", padding: { x: "lg", y: "md" }, gap: { all: "xs" } },
        boundary: {
          border: { width: "none", left: { width: "thin", style: "solid", color: "gray-100" } },
          effect: "none",
          radius: { all: "none" },
        },
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: { tint: "accent", interior: { background: "background" }, boundary: { border: { left: { width: "none" } } } },
          },
        ],
      },
      label: { combined: [{ where: { emphasis: "secondary" }, partialSurface: { interior: { foreground: "custom-teal" } } }] },
    },
    wordmark: { avatar: { boundary: { radius: { all: "xs" } } } },
    sort: { tabBar: { boundary: { border: { width: "none" } }, interior: { gap: { all: "xl" } } } },
    group: {
      separator: {
        interior: { background: "gray-300" },
        boundary: { border: { top: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    timeline: {
      separator: {
        interior: { background: "gray-200" },
        boundary: { border: { top: { width: "none" }, left: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    hero: {
      label: { interior: { foreground: "gray-500" } },
      button: {
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: { interior: { background: "background", foreground: "custom-teal" }, boundary: { border: { color: "gray-300" } } },
          },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "custom-teal" } } },
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
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, radius: { all: "none" } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
      },
    },
    rows: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "md" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, radius: { all: "none" } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
      },
    },
    chosen: {
      label: { interior: { foreground: "status-success" } },
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "status-success" } } }] },
      card: {
        tint: "transparent",
        interior: { background: "gradient-sage", foreground: "smart-fb" },
        boundary: { border: { color: "transparent" } },
      },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { left: "xl", right: "none", y: "md" } },
        boundary: {
          border: {
            width: "none",
            left: { width: "thin", style: "solid", color: "gray-200" },
            bottom: { width: "thin", style: "solid", color: "gray-150" },
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
              interior: { background: "background", foreground: "custom-teal" },
              boundary: { border: { color: "gray-300" } },
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
        tint: "content-orange-standard",
        interior: { background: "content-orange-standard", foreground: "smart-fb", padding: { x: "sm", y: "3xs" } },
        boundary: { border: { color: "transparent" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
      },
    },
    {
      chain: [{ key: "paginationBar" }, { key: "button" }],
      tokens: {
        interior: { padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { radius: { all: "full" } },
        dimensionPosition: { width: "38px", height: "38px" },
      },
    },
    {
      chain: [{ key: "badge" }, { key: "badge", concept: "dot" }],
      tokens: {
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "transparent", interior: { background: "content-pink-soft" } } },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "transparent", interior: { background: "content-pink-soft" } },
          },
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
        interior: { background: "gray-50", foreground: "gray-600" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "gray-50", foreground: "gray-600" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "gray-150" } } },
      },
    },
  ],
  gradients: {
    primary: { type: "linear", angle: 135, stops: [{ color: "primary" }, { color: "secondary" }] },
    "primary-hover": { type: "linear", angle: 135, stops: [{ color: "primary" }, { color: "secondary" }] },
    "primary-pressed": { type: "linear", angle: 135, stops: [{ color: "secondary" }, { color: "secondary" }] },
    hero: {
      type: "radial",
      shape: "circle",
      position: "calc(100% - 160px) 10px",
      stops: [
        { color: "content-lime-standard", position: "0px" },
        { color: "content-blue-soft", position: "120px" },
        { color: "custom-peach", position: "230px" },
        { color: "background", position: "360px" },
      ],
    },
    progress: { type: "linear", angle: 90, stops: [{ color: "accent" }, { color: "status-info" }] },
    selected: { type: "linear", angle: 135, stops: [{ color: "primary" }, { color: "secondary" }] },
    avatar: { type: "linear", angle: 135, stops: [{ color: "primary" }, { color: "secondary" }] },
    sage: { type: "linear", angle: 0, stops: [{ color: "custom-sage" }, { color: "custom-sage" }] },
    "status-error": { type: "linear", angle: 0, stops: [{ color: "status-error" }, { color: "status-error" }] },
    "status-error-dark": { type: "linear", angle: 0, stops: [{ color: "status-error" }, { color: "status-error" }] },
    "status-success": { type: "linear", angle: 0, stops: [{ color: "status-success" }, { color: "status-success" }] },
    "status-success-dark": { type: "linear", angle: 0, stops: [{ color: "status-success" }, { color: "status-success" }] },
    "status-warning": { type: "linear", angle: 0, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    "status-warning-dark": { type: "linear", angle: 0, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    "status-info": { type: "linear", angle: 0, stops: [{ color: "status-info" }, { color: "status-info" }] },
    "status-info-dark": { type: "linear", angle: 0, stops: [{ color: "status-info" }, { color: "status-info" }] },
    "flat-flat-sage": { type: "linear", angle: 0, stops: [{ color: "custom-sage" }, { color: "custom-sage" }] },
    "flat-background": { type: "linear", angle: 0, stops: [{ color: "background" }, { color: "background" }] },
    "flat-gray-300": { type: "linear", angle: 0, stops: [{ color: "gray-300" }, { color: "gray-300" }] },
    "flat-transparent": { type: "linear", angle: 0, stops: [{ color: "transparent" }, { color: "transparent" }] },
    "flat-gray-100": { type: "linear", angle: 0, stops: [{ color: "gray-100" }, { color: "gray-100" }] },
    "flat-gray-50": { type: "linear", angle: 0, stops: [{ color: "gray-50" }, { color: "gray-50" }] },
    "flat-brand-3-light": { type: "linear", angle: 0, stops: [{ color: "color-mix(in srgb, var(--color-brand-3) 20%, transparent)" }, { color: "color-mix(in srgb, var(--color-brand-3) 20%, transparent)" }] },
    "flat-brand-1-light": { type: "linear", angle: 0, stops: [{ color: "color-mix(in srgb, var(--color-brand-1) 20%, transparent)" }, { color: "color-mix(in srgb, var(--color-brand-1) 20%, transparent)" }] },
  },
};
