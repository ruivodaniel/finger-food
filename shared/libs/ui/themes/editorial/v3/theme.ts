import type { WebTheme } from "../../../types";

// EDITORIAL v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/editorial.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Editorial — the gazette
//   serif display and serif body on warm paper, rules where others draw boxes: a card is a block of text under a
//   heavy top rule, with no side border and no shadow. Ink carries the actions; vermilion marks what is current.
//   interaction: hover underlines a link and fills an outlined button with ink; the current row is vermilion text
//   with a vermilion rule at its left; pressed goes to black; focus is an ink ring; nothing moves, nothing eases.
//
// L1 read of the mood
//   anchors     background #FBF9F4 paper · foreground #1A1A1A ink (grays mixed 8% towards the ink: warm)
//   brand       1 #1A1A1A ink (buttons, rules) · 2 #C8401F vermilion (links, the active tab, the current row) · 3 #E8C9BC
//               (the paper tint's line) · 4 #5A564E (quiet text)
//   status      success #2F6B3A bottle green · info #3B5B8A · warning #B8860B old gold · error #B8321F — a word in colour on
//               pale paper
//   fonts       Source Serif 4 body (primary) · Playfair Display headings and numerals (secondary) · Inter for UI, labels
//               and small numbers (quote: the type scale's "link" and "numbers*" use it)
//   rhythm      unit 0.875rem · radius 2px · borders 1px, rules 2px (thick) · shadows none but the modal
//
// What the engine cannot do: an input as a rule under the text keeps a box on selects and comboboxes (same family).

export const editorialTheme: WebTheme = {
  id: "editorial",
  name: "Editorial",
  version: 3,
  type: "high-fidelity",
  kind: "product",
  colors: {
    main: { white: "#FBF9F4", black: "#1A1A1A" },
    brand: { "1": "#1A1A1A", "2": "#C8401F", "3": "#E8C9BC", "4": "#5A564E" },
    status: { success: "#2F6B3A", info: "#3B5B8A", warning: "#B8860B", error: "#B8321F" },
    content: {
      tomato: { standard: "#A55746", soft: "#DEBAB2" },
      red: { standard: "#A55552", soft: "#DEB9B7" },
      ruby: { standard: "#A6545F", soft: "#DEB9BC" },
      crimson: { standard: "#A9526E", soft: "#E0B9C2" },
      pink: { standard: "#9C507C", soft: "#D9B7C9" },
      plum: { standard: "#7E4D85", soft: "#CBB5CE" },
      purple: { standard: "#6A4C89", soft: "#C1B4D0" },
      violet: { standard: "#564E8C", soft: "#B7B5D1" },
      iris: { standard: "#4C518F", soft: "#B2B7D3" },
      indigo: { standard: "#3E5594", soft: "#ADB9D5" },
      blue: { standard: "#457AB4", soft: "#B3C9E2" },
      sky: { standard: "#8FC1D0", soft: "#D2E6EC" },
      cyan: { standard: "#4A8497", soft: "#B6CCD5" },
      teal: { standard: "#4A837A", soft: "#B6CCC8" },
      jade: { standard: "#4D8170", soft: "#B6CBC3" },
      green: { standard: "#4E8264", soft: "#B7CCBE" },
      grass: { standard: "#56855C", soft: "#BACDBB" },
      mint: { standard: "#95C7BA", soft: "#D5E8E3" },
      lime: { standard: "#B0CC87", soft: "#DFEBCF" },
      yellow: { standard: "#D8CC7D", soft: "#EFEBCC" },
      amber: { standard: "#CFB174", soft: "#ECE0C8" },
      orange: { standard: "#B76E4C", soft: "#E5C4B6" },
      brown: { standard: "#856D59", soft: "#CDC2B9" },
      bronze: { standard: "#7E6C65", soft: "#CAC2BE" },
      gold: { standard: "#786D5D", soft: "#C7C2BB" },
    },
    semanticTokens: { primary: "#1A1A1A", secondary: "#C8401F", accent: "#E8C9BC", muted: "#5A564E" },
  },
  typography: {
    fonts: {
      primary: "Source Serif 4, Georgia, Times New Roman, serif",
      secondary: "Playfair Display, Georgia, Times New Roman, serif",
      quote: "Inter, Helvetica, Arial, sans-serif",
      monoPrimary: "Inter, Helvetica, Arial, sans-serif",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      "Source Serif 4": {
        type: "google",
        url: "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap",
      },
      "Playfair Display": { type: "google", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap" },
      Inter: { type: "google", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" },
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
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 500,
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
        fontSizeMobile: 15,
        fontSizeDesktop: 17,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      body: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
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
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
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
        fontSizeDesktop: 16,
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
        fontSizeMobile: 47,
        fontSizeDesktop: 52,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.01em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 36,
        fontSizeDesktop: 40,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
      },
      numbers: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 600,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 600,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 10,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0.14em",
      },
      link: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 500,
        lineHeight: 1.5,
      },
    },
  },
  spacing: { unit: 0.875 },
  radius: {
    none: "0px",
    "3xs": "2px",
    "2xs": "2px",
    xs: "2px",
    sm: "2px",
    md: "2px",
    lg: "2px",
    xl: "2px",
    "2xl": "2px",
    "3xl": "2px",
    full: "2px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 0, y: 24, blur: 48, spread: -16, color: "main-black", opacity: 0.35 }],
    drawer: [{ type: "drop-shadow", x: -24, y: 0, blur: 48, spread: 0, color: "main-black", opacity: 0.3 }],
    popover: [{ type: "drop-shadow", x: 0, y: 12, blur: 28, spread: -10, color: "main-black", opacity: 0.25 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "0ms", fast: "0ms", average: "0ms", slow: "0ms", extraSlow: "0ms" },
    timing: { ease: "linear", easeIn: "linear", easeOut: "linear", easeInOut: "linear", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "2px", extraThick: "3px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FBF9F4",
        foreground: "#1A1A1A",
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
      dark: {
        background: "#1A1A1A",
        foreground: "#FBF9F4",
        chroma: { saturationFactor: 0.75, gamma: 1.1 },
        derivation: {
          grayColorMixPercentage: "8%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.5 },
  layouts: {
    surface: { interior: { background: "background", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "background" } } },
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
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
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
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" },
      },
    },
    pageLeftSidebar: {
      width: "256px",
      sm: { width: "200px" },
      md: { width: "240px" },
      lg: { width: "300px" },
      surface: {
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
        interior: { background: "background" },
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
        interior: { background: "background" },
        boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "gray-100", foreground: "smart-fb" } } },
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
      boundary: {
        border: { width: "none", style: "solid", color: "gray-200", top: { width: "thick", style: "solid", color: "foreground" } },
        radius: { all: "none" },
        effect: "none",
      },
      defaultTypography: { typographyType: "body", textTransform: "none" },
      transition: { duration: "fast", timing: "linear" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
        {
          where: { status: "error" },
          partialSurface: {
            interior: { background: "background", foreground: "status-error" },
            boundary: { border: { color: "status-error" } },
            tint: "status-error",
          },
        },
        {
          where: { status: "success" },
          partialSurface: {
            interior: { background: "background", foreground: "status-success" },
            boundary: { border: { color: "status-success" } },
            tint: "status-success",
          },
        },
        {
          where: { status: "warning" },
          partialSurface: {
            interior: { background: "background", foreground: "status-warning" },
            boundary: { border: { color: "status-warning" } },
            tint: "status-warning",
          },
        },
        {
          where: { status: "info" },
          partialSurface: {
            interior: { background: "background", foreground: "status-info" },
            boundary: { border: { color: "status-info" } },
            tint: "status-info",
          },
        },
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
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
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "none", y: "sm" }, gap: { all: "sm" } },
        boundary: {
          border: {
            width: "none",
            style: "solid",
            color: "gray-300",
            bottom: { width: "thin", style: "solid", color: "foreground" },
          },
          radius: { all: "none" },
        },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "foreground" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "foreground" } } } },
          {
            where: { status: "error" },
            partialSurface: { interior: { background: "transparent" }, boundary: { border: { color: "status-error" } }, tint: "transparent" },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "transparent" },
              boundary: { border: { color: "status-success" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "transparent" },
              boundary: { border: { color: "status-warning" } },
              tint: "transparent",
            },
          },
          {
            where: { state: "disabled" },
            partialSurface: { interior: { background: "transparent", opacity: 0.5 }, cursor: "not-allowed" },
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
      overlay: { scrimColor: "foreground", scrimOpacity: 0.35, scrimBlur: "none" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "smart-fb" } } },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { foreground: "secondary" },
              boundary: { border: { left: { width: "thick", style: "solid", color: "secondary" } } },
            },
          },
        ],
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
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
          partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "bodySmall" } },
          icon: { size: "xs" },
        },
        md: {
          partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "link" } },
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
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "3xs" } },
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
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "secondary" },
              boundary: { border: { color: "transparent" } },
              defaultTypography: { textDecoration: "underline" },
            },
          },
          {
            where: { emphasis: "quiet" },
            partialSurface: { interior: { background: "transparent", foreground: "secondary" }, boundary: { border: { color: "transparent" } } },
          },
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "status-error" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-error" },
              boundary: { border: { color: "status-error" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-success" },
              boundary: { border: { color: "status-success" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-warning" },
              boundary: { border: { color: "status-warning" } },
              tint: "transparent",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "transparent", foreground: "status-info" },
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
            partialSurface: { interior: { background: "primary" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", emphasis: "hero" },
            partialSurface: {
              interior: { background: "primary", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", emphasis: "secondary" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "foreground" } } },
          },
          {
            where: { state: "hover", emphasis: "tertiary" },
            partialSurface: {
              interior: { background: "transparent", foreground: "secondary" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "hover", emphasis: "quiet" },
            partialSurface: {
              interior: { background: "transparent", foreground: "smart-fb" },
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
          { where: { state: "active" }, partialSurface: { interior: { background: "primary" } } },
          {
            where: { state: "active", emphasis: "primary" },
            partialSurface: {
              interior: { background: "foreground", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "active", emphasis: "hero" },
            partialSurface: {
              interior: { background: "foreground", foreground: "smart-fb" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { state: "active", emphasis: "secondary" },
            partialSurface: {
              interior: { background: "foreground", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
          {
            where: { state: "active", emphasis: "tertiary" },
            partialSurface: { interior: { background: "transparent", foreground: "secondary" } },
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
            partialSurface: { boundary: { outline: { width: "default", style: "solid", color: "foreground", offset: "2px" } } },
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
        interior: { background: "transparent", foreground: "muted", padding: {} },
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
      interior: { padding: { x: "none", y: "sm" }, foreground: "muted", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "foreground" } } },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" } }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { foreground: "smart-fb" } } },
        {
          where: { state: "selected" },
          partialSurface: {
            interior: { foreground: "secondary" },
            boundary: { border: { left: { width: "thick", style: "solid", color: "secondary" } } },
          },
        },
      ],
    },
    tableCell: {
      interior: { padding: { x: "none", y: "md" } },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "body", textTransform: "none" },
    },
    tableFooterCell: {
      interior: { padding: { x: "lg", y: "md" }, background: "transparent" },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "bodySmall" },
    },
    card: {
      interior: { padding: { x: "none", y: "md", childrenSmartBleed: true }, gap: { all: "md" } },
      boundary: { effect: "none" },
    },
    panel: { interior: { padding: { all: "lg", childrenSmartBleed: true }, gap: { all: "none" } } },
    header: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "none" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "none" } },
      boundary: { border: { width: "none" } },
    },
    footer: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "none" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-200" } } },
    },
    tile: {
      interior: {
        background: "transparent",
        foreground: "smart-fb",
        padding: { all: "md", x: "none", y: "md" },
        gap: { all: "xs" },
      },
      boundary: {
        border: { width: "none", style: "solid", color: "gray-200", top: { width: "thick", style: "solid", color: "foreground" } },
        radius: { all: "none" },
      },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
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
    badge: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "3xs" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          {
            where: { status: "error" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
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
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "destructive", emphasis: "primary" },
            partialSurface: { tint: "status-error",
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "success", emphasis: "primary" },
            partialSurface: { tint: "status-success",
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "warning", emphasis: "primary" },
            partialSurface: { tint: "status-warning",
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { color: "transparent" } },
            },
          },
          {
            where: { status: "info", emphasis: "primary" },
            partialSurface: { tint: "status-info",
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { color: "transparent" } },
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
        interior: { background: "content-pink-soft", foreground: "smart-fb", padding: { x: "sm", y: "2xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "accent" }, radius: { all: "3xs" } },
        defaultTypography: { typographyType: "numbersSmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "secondary" } } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
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
          background: "primary",
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
        interior: { background: "gray-200", padding: {} },
        boundary: { border: { width: "none" } },
        dimensionPosition: { height: "8px" },
      },
    },
    progressInner: { interior: { background: "primary" } },
    skeleton: { surface: { interior: { background: "gray-100" }, boundary: { border: { width: "none" } } } },
    spinner: {
      surface: {
        interior: { foreground: "primary", background: "transparent", padding: { all: "none" } },
        boundary: { border: { width: "none" } },
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
          { where: { emphasis: "tertiary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { emphasis: "quiet" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "primary" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "hero" }, partialSurface: { boundary: { effect: "none" } } },
          { where: { state: "active", emphasis: "secondary" }, partialSurface: { boundary: { effect: "none" } } },
        ],
      },
    },
    switch: {
      track: {
        dimensionPosition: { width: "36px", height: "20px" },
        interior: { background: "gray-300", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary" } } },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "gray-300", backgroundAlpha: 1, foreground: "smart-fb" },
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
        dimensionPosition: { width: "16px", height: "16px", translateX: "2px", translateY: "0px" },
        interior: { background: "background" },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
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
          background: "background",
          foreground: "smart-fb",
          padding: { all: "none" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "solid", color: "foreground" }, radius: { all: "3xs" } },
        dimensionPosition: { width: "16px", height: "16px" },
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
              boundary: { border: { color: "foreground" } },
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
    checkboxInner: {
      interior: { background: "transparent", foreground: "currentColor", padding: { all: "none" } },
      boundary: { border: { width: "none" }, radius: { all: "none" } },
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
        dimensionPosition: { width: "16px", height: "16px" },
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
      boundary: { border: { width: "none" }, radius: { all: "full" } },
    },
    tabBar: {
      surface: {
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "foreground" } } },
        interior: { gap: { all: "xl" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "muted", padding: { x: "none", y: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } } },
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
              interior: { background: "transparent", foreground: "secondary" },
              boundary: { border: { bottom: { color: "secondary" } } },
            },
          },
        ],
        defaultTypography: { typographyType: "body", textTransform: "none" },
      },
    },
    tabPanel: {
      interior: { background: "transparent", padding: { x: "none", y: "md" } },
      boundary: { border: { width: "none" }, radius: { all: "none" } },
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
        boundary: { border: { width: "none" } },
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
        interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" }, background: "background" },
        boundary: { border: { width: "none", left: { width: "extraThick", style: "solid", color: "foreground" } } },
        combined: [
          {
            where: { status: "error" },
            partialSurface: {
              interior: { background: "background", foreground: "status-error" },
              boundary: { border: { left: { color: "status-error" } } },
              tint: "status-error",
            },
          },
          {
            where: { status: "success" },
            partialSurface: {
              interior: { background: "background", foreground: "status-success" },
              boundary: { border: { left: { color: "status-success" } } },
              tint: "status-success",
            },
          },
          {
            where: { status: "warning" },
            partialSurface: {
              interior: { background: "background", foreground: "status-warning" },
              boundary: { border: { left: { color: "status-warning" } } },
              tint: "status-warning",
            },
          },
          {
            where: { status: "info" },
            partialSurface: {
              interior: { background: "background", foreground: "status-info" },
              boundary: { border: { left: { color: "status-info" } } },
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
        boundary: { border: { width: "none" } },
      },
    },
    sidebar: {
      widthExpanded: "240px",
      widthCollapsed: "64px",
      surface: {
        interior: { background: "background", padding: { y: "xl", x: "lg" }, gap: { all: "none" }, foreground: "muted" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "gray-200" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "muted",
          padding: { x: "none", y: "sm" },
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
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
            },
          },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { background: "transparent", foreground: "secondary" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              defaultTypography: { typographyType: "link", textTransform: "none" },
            },
          },
          {
            where: { emphasis: "primary" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "muted" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "none" },
              tint: "transparent",
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "transparent",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "transparent", backgroundAlpha: 1, foreground: "secondary" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "transparent",
              defaultTypography: { typographyType: "link", textTransform: "none" },
            },
          },
        ],
        dimensionPosition: { height: "37px" },
      },
    },
    list: { surface: { interior: { padding: { x: "lg", childrenSmartBleed: true }, gap: { all: "md" } } } },
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
        interior: { background: "transparent", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
        boundary: {
          border: { width: "none", style: "solid", color: "gray-200", bottom: { width: "thin", style: "solid", color: "gray-200" } },
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
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "smart-fb" } } },
          {
            where: { state: "selected" },
            partialSurface: {
              interior: { foreground: "secondary" },
              boundary: { border: { left: { width: "thick", style: "solid", color: "secondary" } } },
            },
          },
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
          { where: { state: "hover" }, partialSurface: { interior: { background: "transparent", foreground: "secondary" } } },
          { where: { state: "selected" }, partialSurface: { interior: { foreground: "secondary" } } },
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
          background: "transparent",
          foreground: "muted",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dashed", color: "gray-300" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-pink-soft" }, boundary: { border: { color: "secondary" } } },
          },
        ],
      },
    },
    otp: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
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
        boundary: { border: { width: "none" } },
      },
    },
    inputGroupAddon: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "xs", y: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
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
        boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "foreground" } },
        interior: { padding: { all: "sm" }, gap: { all: "sm" } },
      },
    },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
    tooltip: {
      surface: {
        interior: { background: "primary", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
        boundary: { border: { width: "none" }, effect: "none" },
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
        boundary: { border: { width: "thin", style: "dashed", color: "gray-300" } },
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
            partialSurface: { interior: { background: "background", foreground: "smart-fb" } },
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
      content: { interior: { padding: { all: "2xl" } } },
    },
    progressList: { progress: { dimensionPosition: { height: "8px" } } },
    keyValues: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "sm" } },
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
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "main-white" } } }] },
      card: { interior: { padding: { all: "none" }, foreground: "main-white" } },
      content: { interior: { padding: { all: "xl" } } },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "main-white", padding: { left: "xl", right: "none", y: "md" } },
        boundary: {
          border: {
            width: "none",
            left: { width: "thin", style: "solid", color: "gray-600" },
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
      card: { interior: { padding: { all: "none" } }, boundary: { border: { width: "none" } } },
      content: { interior: { padding: { x: "lg", y: "md" } } },
      button: {
        combined: [
          {
            where: { emphasis: "secondary" },
            partialSurface: {
              tint: "transparent",
              interior: { background: "transparent", foreground: "smart-fb" },
              boundary: { border: { color: "foreground" } },
            },
          },
        ],
      },
    },
  },
  // the document body: the colour the page stands on (as the page layout)
  body: {surface: {interior: {background: "background"}}},
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
        tint: "foreground",
        interior: { background: "foreground", foreground: "smart-fb", padding: { x: "sm", y: "3xs" } },
        boundary: { border: { color: "foreground" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
      },
    },
    {
      chain: [{ key: "paginationBar" }, { key: "button" }],
      tokens: {
        interior: { padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        dimensionPosition: { width: "36px", height: "36px" },
      },
    },
    {
      chain: [{ key: "pageLeftSidebar" }, { key: "button" }],
      tokens: { interior: { childAlign: { horizontal: "start" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "expanded" } }],
      tokens: {
        interior: { background: "background", foreground: "muted" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "gray-200" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "background", foreground: "muted" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "gray-200" } } },
      },
    },
  ],
};
