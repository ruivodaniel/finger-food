import type { WebTheme } from "../../../types";

// BRUTALIST v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/brutalist.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Brutalist — raw black and white with one acid accent
//   zero radius, 2px lines, hard offset shadows, mono labels in caps, a full grid on tables. The acid yellow is the
//   hover, the focus and the selection: never a button at rest. Large type, tight spacing.
//   interaction: hover floods the thing with acid; pressed snaps the hard shadow shut and drops the thing into its place;
//   the current row is black with white text; focus is a 3px acid ring; nothing eases.
//
// L1 read of the mood
//   anchors     background #FFFFFF · foreground #000000 (pure grays)
//   brand       1 #000000 ink (actions, lines) · 2 #D9FF00 acid (hover, focus, selection) · 3 #F4FFB0 acid tint · 4 #3A3A3A
//   status      success #00C853 · info #2979FF · warning #FFB300 · error #FF3B30 — loud fills (35% light) with black ink in a black box
//   fonts       Archivo body/UI (uppercase, tracked) · Archivo Black headings and numerals · Space Mono labels
//   rhythm      unit 0.75rem · radius none · borders 2px (thin) · shadows hard: 4px 4px 0 black on controls, 6px 6px 0 on cards
//
// What the engine cannot do: the pressed "snap" moves the control 4px down and right (translate) but the shadow it drops
// does not animate (transitions are off anyway).

export const brutalistTheme: WebTheme = {
  id: "brutalist",
  name: "Brutalist",
  version: 3,
  type: "high-fidelity",
  kind: "product",
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
  typography: {
    fonts: {
      primary: "Archivo, Helvetica, Arial, sans-serif",
      secondary: "Archivo Black, Archivo, Impact, sans-serif",
      quote: "Archivo, Helvetica, Arial, sans-serif",
      monoPrimary: "Space Mono, ui-monospace, Menlo, monospace",
      monoSecondary: "Space Mono, ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      Archivo: { type: "google", url: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&display=swap" },
      "Archivo Black": { type: "google", url: "https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" },
      "Space Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 43,
        fontSizeDesktop: 48,
        fontWeight: 400,
        lineHeight: 1.15,
        letterSpacing: "0",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 22,
        fontSizeDesktop: 24,
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: "0",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 19,
        fontSizeDesktop: 21,
        fontWeight: 400,
        lineHeight: 1.25,
        letterSpacing: "0",
      },
      heading4: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 17,
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
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
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
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      quoteSmall: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      code: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
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
        letterSpacing: "0",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 32,
        fontSizeDesktop: 36,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "0",
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
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 700,
        lineHeight: 1.4,
        letterSpacing: "0.12em",
      },
      link: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "0.06em",
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
    full: "0px",
  },
  effects: {
    card: [{ type: "drop-shadow", x: 6, y: 6, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    sheet: [{ type: "drop-shadow", x: 12, y: 12, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    drawer: [{ type: "drop-shadow", x: -12, y: 12, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    popover: [{ type: "drop-shadow", x: 4, y: 4, blur: 0, spread: 0, color: "secondary", opacity: 1 }],
    hero: [{ type: "drop-shadow", x: 8, y: 8, blur: 0, spread: 0, color: "secondary", opacity: 1 }],
    "hard-white": [{ type: "drop-shadow", x: 4, y: 4, blur: 0, spread: 0, color: "main-white", opacity: 1 }],
    "page-acid": [{ type: "drop-shadow", x: 3, y: 3, blur: 0, spread: 0, color: "secondary", opacity: 1 }],
    "card-acid": [{ type: "drop-shadow", x: 6, y: 6, blur: 0, spread: 0, color: "secondary", opacity: 1 }],
    hard: [{ type: "drop-shadow", x: 4, y: 4, blur: 0, spread: 0, color: "main-black", opacity: 1 }],
    "hard-acid": [{ type: "drop-shadow", x: 4, y: 4, blur: 0, spread: 0, color: "secondary", opacity: 1 }],
    page: [{ type: "drop-shadow", x: 3, y: 3, blur: 0, spread: 0, color: "secondary", opacity: 1 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "0ms", fast: "0ms", average: "0ms", slow: "0ms", extraSlow: "0ms" },
    timing: { ease: "linear", easeIn: "linear", easeOut: "linear", easeInOut: "linear", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "1px", thin: "2px", default: "2px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#000000",
        derivation: {
          grayColorMixPercentage: "0%",
        },
      },
      dark: {
        background: "#000000",
        foreground: "#FFFFFF",
        chroma: { saturationFactor: 1.0, gamma: 1.0 },
        derivation: {
          grayColorMixPercentage: "0%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 2 },
  layouts: {
    surface: { interior: { background: "gray-100", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "gray-100" } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xl" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
    secondPageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xl" } },
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
        interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" },
      },
    },
    secondMainHeader: {
      height: "48px",
      sm: { height: "40px" },
      md: { height: "48px" },
      lg: { height: "64px" },
      surface: {
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" },
      },
    },
    pageLeftSidebar: {
      width: "256px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
        interior: { background: "background" },
      },
    },
    pageRightSidebar: {
      width: "320px",
      sm: { width: "280px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "foreground" }, width: "none" } } },
    },
    mainRightSidebar: {
      width: "320px",
      sm: { width: "260px" },
      md: { width: "320px" },
      lg: { width: "420px" },
      surface: {
        interior: { background: "background" },
        boundary: { border: { left: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "accent", foreground: "smart-fb" } } },
    },
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "gray-100", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "foreground", trackColor: "transparent", width: "10px" } },
  },
  families: {
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "sm" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" }, effect: "card" },
      defaultTypography: { typographyType: "body", textTransform: "none" },
      transition: { duration: "fast", timing: "linear" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
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
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
        },
        {
          where: { emphasis: "quiet" },
          partialSurface: {
            interior: { background: "transparent", foreground: "muted" },
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
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "foreground" } } } },
          {
            where: { state: "focus" },
            partialSurface: {
              boundary: { border: { color: "foreground" }, outline: { width: "thin", style: "solid", color: "secondary", offset: "0px" } },
            },
          },
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "background" },
              boundary: {
                border: { color: "status-error" },
                outline: { width: "thin", style: "solid", color: "status-error", offset: "0px" },
              },
              tint: "background",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "background" },
              boundary: {
                border: { color: "status-success" },
                outline: { width: "thin", style: "solid", color: "status-success", offset: "0px" },
              },
              tint: "background",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "background" },
              boundary: {
                border: { color: "status-warning" },
                outline: { width: "thin", style: "solid", color: "status-warning", offset: "0px" },
              },
              tint: "background",
            },
          },
          {
            where: { state: "disabled" },
            partialSurface: { interior: { background: "gray-100", opacity: 0.6 }, cursor: "not-allowed" },
          },
        ],
      },
      placeholderColor: "muted",
      placeholderOpacity: 1,
      caretColor: "primary",
    },
    elevatedOverlay: {
      surface: {
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "foreground" } },
      },
      overlay: { scrimColor: "foreground", scrimOpacity: 0.4, scrimBlur: "none" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "accent" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
        ],
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
      },
      separator: { height: "2px", surface: { interior: { background: "transparent" } } },
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
          partialSurface: {
            interior: { padding: { x: "lg", y: "sm" } },
            defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
          },
          icon: { size: "xs" },
        },
        md: {
          partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "numbersSmall" } },
          icon: { size: "sm" },
        },
        lg: {
          partialSurface: { interior: { padding: { x: "2xl", y: "lg" } }, defaultTypography: { typographyType: "numbersSmall" } },
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
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
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
              interior: { background: "transparent", foreground: "smart-fb" },
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
            partialSurface: { interior: { background: "secondary" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "hero" },
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "secondary" },
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "tertiary" },
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "hover", emphasis: "quiet" },
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } },
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
            partialSurface: { interior: { background: "secondary" }, dimensionPosition: { translateX: "0px", translateY: "4px" } },
          },
          {
            where: { state: "active", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
              dimensionPosition: { translateX: "0px", translateY: "4px" },
            },
          },
          {
            where: { state: "active", emphasis: "hero" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
              dimensionPosition: { translateX: "0px", translateY: "4px" },
            },
          },
          {
            where: { state: "active", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
              dimensionPosition: { translateX: "0px", translateY: "4px" },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              dimensionPosition: { translateX: "0px", translateY: "4px" },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
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
            partialSurface: { boundary: { outline: { width: "thick", style: "solid", color: "secondary", offset: "0px" } } },
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
        interior: { background: "transparent", foreground: "smart-fb", padding: {} },
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
        interior: { background: "transparent", foreground: "muted", padding: {} },
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
      interior: { padding: { x: "md", y: "sm" }, foreground: "smart-fb", background: "transparent" },
      boundary: {
        border: {
          width: "none",
          bottom: { width: "thick", style: "solid", color: "foreground" },
          right: { width: "extraThin", style: "solid", color: "foreground" },
        },
        effect: "none",
      },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" }, effect: "none" }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } }, effect: "none" },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "accent" } } },
        { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
      ],
    },
    tableCell: {
      interior: { padding: { x: "md", y: "md" } },
      boundary: { border: { width: "none", right: { width: "extraThin", style: "solid", color: "foreground" } }, effect: "none" },
      defaultTypography: { typographyType: "body", textTransform: "none" },
    },
    tableFooterCell: {
      interior: { padding: { x: "lg", y: "md" }, background: "transparent" },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "bodySmall" },
    },
    card: {
      interior: { padding: { x: "lg", y: "lg", childrenSmartBleed: true }, gap: { all: "sm" } },
      boundary: { effect: "card" },
    },
    panel: { interior: { padding: { all: "lg", childrenSmartBleed: true }, gap: { all: "none" } } },
    header: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } }, effect: "none" },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" } },
      boundary: { border: { width: "none" }, effect: "none" },
    },
    footer: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "foreground" } }, effect: "none" },
    },
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" }, effect: "none" },
      combined: [
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
        {
          where: { emphasis: "quiet" },
          partialSurface: { interior: { background: "gray-100" }, boundary: { border: { color: "transparent" } } },
        },
      ],
    },
    separator: {
      surface: { interior: { background: "foreground", padding: {} }, boundary: { border: { width: "none" }, effect: "none" } },
      height: "2px",
    },
    badge: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, effect: "none" },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "uppercase" },
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
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
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
            partialSurface: { interior: { background: "transparent", foreground: "muted" }, boundary: { border: { color: "transparent" } } },
          },
        ],
      },
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "8px", height: "8px" } } },
        "2xs": {
          partialSurface: { interior: { padding: { x: "2xs", y: "none" } }, defaultTypography: { typographyType: "numbersExtraSmall" } },
        },
        xs: {
          partialSurface: {
            interior: { padding: { x: "md", y: "xs" } },
            defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
          },
        },
        sm: {
          partialSurface: {
            interior: { padding: { x: "md", y: "xs" } },
            defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
          },
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
        interior: { background: "accent", foreground: "smart-fb", padding: { x: "sm", y: "2xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "uppercase" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "secondary" } } },
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
          background: "primary",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { radius: { all: "none" }, border: { width: "thin", style: "solid", color: "foreground" }, effect: "none" },
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
        interior: { background: "background", padding: {} },
        boundary: { border: { width: "none" }, effect: "none" },
        dimensionPosition: { height: "8px" },
      },
    },
    progressInner: { interior: { background: "primary" }, boundary: { effect: "none" } },
    skeleton: { surface: { interior: { background: "gray-200" }, boundary: { border: { width: "none" }, effect: "none" } } },
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
        defaultTypography: { typographyType: "link", textTransform: "uppercase" },
        boundary: { effect: "hard" },
        combined: [
          { where: { emphasis: "hero" }, partialSurface: { boundary: { effect: "hard" } } },
          { where: { emphasis: "primary" }, partialSurface: { boundary: { effect: "hard" } } },
          { where: { emphasis: "secondary" }, partialSurface: { boundary: { effect: "hard" } } },
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
        dimensionPosition: { width: "44px", height: "24px" },
        interior: { background: "background", padding: { all: "none" } },
        boundary: { radius: { all: "none" }, border: { width: "thin", style: "solid", color: "foreground" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "secondary" } } },
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
            partialSurface: { tint: "transparent", interior: { backgroundAlpha: 1, background: "secondary" } },
          },
        ],
      },
      thumb: {
        dimensionPosition: { width: "16px", height: "16px", translateX: "4px", translateY: "0px" },
        interior: { background: "primary" },
        boundary: { radius: { all: "none" }, border: { width: "none" } },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "10px", translateY: "0px" } } }],
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
          background: "background",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "none" } },
        dimensionPosition: { width: "20px", height: "20px" },
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
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "full" } },
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
    choiceGroup: {
      surface: { interior: { background: "transparent", gap: { all: "sm" }, padding: {} }, boundary: { border: { width: "none" } } },
    },
    radioInner: {
      interior: { background: "transparent", foreground: "primary", padding: { all: "none" } },
      boundary: { border: { width: "none" }, radius: { all: "full" }, effect: "none" },
    },
    tabBar: {
      surface: {
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
        interior: { gap: { all: "none" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "muted", padding: { x: "lg", y: "sm" } },
        boundary: {
          border: {
            width: "thin",
            bottom: { width: "thick", style: "solid", color: "transparent" },
            style: "solid",
            color: "transparent",
          },
        },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
        ],
        defaultTypography: { typographyType: "body", textTransform: "none" },
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
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "xs", y: "2xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "gray-100" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              tint: "primary",
              interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" },
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
    breadcrumb: {
      surface: { interior: { background: "transparent", padding: {}, gap: { all: "xs" } }, boundary: { border: { width: "none" } } },
    },
    breadcrumbItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "xs", y: "2xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-600" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover" },
            partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" },
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
      widthExpanded: "240px",
      widthCollapsed: "64px",
      surface: {
        interior: { background: "background", padding: { y: "lg", x: "md" }, gap: { all: "none" }, foreground: "smart-fb" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "foreground" }, width: "none" } },
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
          radius: { all: "none" },
        },
        combined: [
          {
            where: { state: "hover" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              defaultTypography: { typographyType: "numbersSmall", textTransform: "uppercase" },
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
              tint: "secondary",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "primary",
              defaultTypography: { typographyType: "numbersSmall", textTransform: "uppercase" },
            },
          },
        ],
        defaultTypography: { typographyType: "bodySmall", textTransform: "uppercase" },
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
    listTreeLine: {
      surface: { interior: { background: "gray-300", padding: {} }, boundary: { border: { width: "none" }, effect: "none" } },
    },
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
        interior: { background: "transparent", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
        boundary: {
          border: {
            width: "none",
            style: "solid",
            color: "gray-200",
            bottom: { width: "thin", style: "solid", color: "foreground" },
          },
          radius: { all: "none" },
        },
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
          { where: { state: "hover" }, partialSurface: { interior: { background: "accent" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    dropdownMenu: { surface: { interior: { padding: { all: "sm" }, gap: { all: "none" } } } },
    menuItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "md", y: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "secondary", foreground: "smart-fb" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    accordionTrigger: {
      surface: {
        interior: { background: "gray-50", padding: { x: "md", y: "sm" } },
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
        boundary: { border: { width: "thin", style: "dashed", color: "foreground" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "accent" }, boundary: { border: { color: "foreground" } } },
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
        boundary: { effect: "hard", border: { width: "thin", style: "solid", color: "foreground" } },
        interior: { padding: { all: "sm" }, gap: { all: "sm" } },
      },
    },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
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
        boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "foreground" } },
      },
    },
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "muted",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "foreground" }, effect: "none" },
      },
    },
    textarea: { surface: { boundary: { radius: { all: "none" } } } },
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
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "secondary", foreground: "smart-fb" },
              boundary: { border: { color: "secondary" }, effect: "hard-white" },
            },
          },
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "main-white" },
              boundary: { border: { color: "background" }, effect: "hard-white" },
            },
          },
        ],
      },
      card: {
        interior: { padding: { all: "none" }, background: "primary", foreground: "smart-fb" },
        boundary: { border: { width: "none" }, effect: "hero" },
      },
      content: { interior: { padding: { all: "2xl" } } },
    },
    progressList: { progress: { dimensionPosition: { height: "8px" } } },
    keyValues: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "md" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
        defaultTypography: { typographyType: "body", textTransform: "none" },
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
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "main-white" } } }] },
      card: { interior: { padding: { all: "none" }, background: "primary", foreground: "smart-fb" } },
      content: { interior: { padding: { all: "lg" } } },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "main-white", padding: { left: "xl", right: "none", y: "md" } },
        boundary: {
          border: {
            width: "none",
            left: { width: "thick", style: "solid", color: "background" },
            bottom: { width: "thin", style: "solid", color: "gray-600" },
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
      card: { interior: { padding: { all: "none" } } },
      content: { interior: { padding: { x: "lg", y: "md" } } },
      button: {
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              tint: "background",
              interior: { background: "background", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" }, effect: "card" },
            },
          },
        ],
      },
    },
  },
  // the document body: the colour the page stands on (as the page layout)
  body: {surface: {interior: {background: "gray-100"}}},
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
      tokens: {
        tint: "secondary",
        interior: { background: "secondary", foreground: "smart-fb", padding: { x: "sm", y: "3xs" } },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
      },
    },
    {
      chain: [{ key: "paginationBar" }, { key: "button" }],
      tokens: {
        interior: { padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { effect: "none" },
        dimensionPosition: { width: "36px", height: "36px" },
        combined: [{ where: { state: "selected" }, partialSurface: { boundary: { effect: "page-acid" } } }],
      },
    },
    {
      chain: [{ key: "pageLeftSidebar" }, { key: "button" }],
      tokens: { interior: { childAlign: { horizontal: "start" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "expanded" } }],
      tokens: {
        interior: { background: "background", foreground: "smart-fb" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "background", foreground: "smart-fb" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "foreground" } } },
      },
    },
  ],
};
