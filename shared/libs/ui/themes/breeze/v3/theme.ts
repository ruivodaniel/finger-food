import type { WebTheme } from "../../../types";

// BREEZE v1 — written on the wireframe-stroke scaffold from the mood moods/v2/tokens/breeze.css (moods/v2/build-themes.py).
// Every value below is the mood's own declaration; what the mood does not declare stays wireframe.
//
// Breeze — ice blue and air
//   white cards with 28px corners on an ice-blue ground, no outline; black pills for what is active; colour only in
//   the data and the status fills; every rule a soft dotted line; a rail of round pills.
//   interaction: hover whitens and lifts a card 2px under a soft shadow and darkens a pill; pressed presses the pill in;
//   the current row is the sky tint; focus is a sky ring; everything eases over 200ms.
//
// L1 read of the mood
//   anchors     background #FFFFFF (the cards) · foreground #16191D · the ice ground is brand-2-gray-100 (sky mixed into the gray)
//   brand       1 #16191D ink (the action, the active pill) · 2 #3B9DF2 sky (links, focus, information) · 3 #CFE6FF (the sky tint)
//               · 4 #6B7280 muted
//   status      success #1CB85C leaf · info #3B9DF2 · warning #FFB020 amber · error #FF5A5F — a pastel fill, no line
//   flat        violet #7B2FD6 and purple #9B5CF0 (the progress gradient) · pink #FFE1B8 (the avatar)
//   fonts       Plus Jakarta Sans 400/500/600/700
//   rhythm      unit 0.75rem · radius xs 10 sm 14 md 18 lg 22 xl 28 2xl 32 · pills on controls · no border, no shadow at rest
//   lines       1.5px dotted at 9–14% ink on tables, lists, dividers
//
// What the engine cannot do: the status chips' saturated dot (a composition); the rail's round-disc closed state is
// the collapsed rail's square pill.

export const breezeTheme: WebTheme = {
  id: "breeze",
  name: "Breeze",
  version: 3,
  type: "high-fidelity",
  kind: "product",
  colors: {
    main: { white: "#FFFFFF", black: "#16191D" },
    brand: { "1": "#16191D", "2": "#3B9DF2", "3": "#CFE6FF", "4": "#6B7280" },
    status: { success: "#1CB85C", info: "#3B9DF2", warning: "#FFB020", error: "#FF5A5F" },
    content: {
      tomato: { standard: "#D95B41", soft: "#FFDED6" },
      red: { standard: "#D95757", soft: "#FFDDDA" },
      ruby: { standard: "#D9556B", soft: "#FFDDDF" },
      crimson: { standard: "#DD5083", soft: "#FFDCE5" },
      pink: { standard: "#CC509B", soft: "#FFD9ED" },
      plum: { standard: "#A454B1", soft: "#F3D9F7" },
      purple: { standard: "#8A56BA", soft: "#E9DAFB" },
      violet: { standard: "#6D5CC1", soft: "#DFDDFE" },
      iris: { standard: "#5D60C7", soft: "#D9DEFF" },
      indigo: { standard: "#4567CD", soft: "#D4E1FF" },
      blue: { standard: "#3391EF", soft: "#D8EAFF" },
      sky: { standard: "#8CE0F7", soft: "#E8FAFF" },
      cyan: { standard: "#38A0BF", soft: "#D3EEF8" },
      teal: { standard: "#3BA293", soft: "#D4EFE9" },
      jade: { standard: "#44A084", soft: "#D5EEE5" },
      green: { standard: "#47A171", soft: "#D6EFDF" },
      grass: { standard: "#56A462", soft: "#D8EFDA" },
      mint: { standard: "#95E7D4", soft: "#E5FCF6" },
      lime: { standard: "#C1EB7A", soft: "#F0FEDD" },
      yellow: { standard: "#FBE65C", soft: "#FFFBDD" },
      amber: { standard: "#F8C75F", soft: "#FFF4DF" },
      orange: { standard: "#EB753A", soft: "#FFE4D9" },
      brown: { standard: "#A88160", soft: "#F1E4DA" },
      bronze: { standard: "#9D8175", soft: "#EEE4E0" },
      gold: { standard: "#95846A", soft: "#EBE5DD" },
    },
    custom: {
      lavender: "#E7D9FF",
      ice: "#EEF3FA",
      sky: "#145FA6",
    },
    semanticTokens: { primary: "#16191D", secondary: "#3B9DF2", accent: "#CFE6FF", muted: "#6B7280" },
  },
  typography: {
    fonts: {
      primary: "Plus Jakarta Sans, Inter, Helvetica, Arial, sans-serif",
      secondary: "Plus Jakarta Sans, Inter, Helvetica, Arial, sans-serif",
      quote: "Plus Jakarta Sans, Inter, Helvetica, Arial, sans-serif",
      monoPrimary: "Plus Jakarta Sans, Inter, Helvetica, Arial, sans-serif",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
      "Plus Jakarta Sans": {
        type: "google",
        url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 36,
        fontSizeDesktop: 40,
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: "-0.03em",
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 22,
        fontSizeDesktop: 24,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "-0.015em",
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 18,
        fontSizeDesktop: 20,
        fontWeight: 600,
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
        fontSizeMobile: 40,
        fontSizeDesktop: 44,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.03em",
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 31,
        fontSizeDesktop: 34,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: "-0.03em",
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 600,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
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
    lg: "22px",
    xl: "28px",
    "2xl": "32px",
    "3xl": "36px",
    full: "9999px",
  },
  effects: {
    card: [],
    sheet: [{ type: "drop-shadow", x: 0, y: 32, blur: 80, spread: -24, color: "main-black", opacity: 0.3 }],
    drawer: [{ type: "drop-shadow", x: -24, y: 0, blur: 60, spread: 0, color: "main-black", opacity: 0.2 }],
    popover: [{ type: "drop-shadow", x: 0, y: 12, blur: 28, spread: -10, color: "main-black", opacity: 0.3 }],
    "card-hover": [{ type: "drop-shadow", x: 0, y: 16, blur: 40, spread: -16, color: "main-black", opacity: 0.18 }],
    pressed: [{ type: "inner-shadow", x: 0, y: 2, blur: 4, spread: 0, color: "main-black", opacity: 0.25 }],
    none: [],
  },
  transitions: {
    duration: { extraFast: "80ms", fast: "140ms", average: "200ms", slow: "320ms", extraSlow: "500ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "1px", thin: "1.5px", default: "1.5px", thick: "3px", extraThick: "4px" },
  modes: {
    colorScheme: {
      light: {
        background: "#FFFFFF",
        foreground: "#16191D",
        derivation: {
          grayColorMixPercentage: "6%",
        },
      },
      dark: {
        background: "#16191D",
        foreground: "#EEF3FA",
        chroma: { saturationFactor: 0.85, gamma: 1 },
        derivation: {
          grayColorMixPercentage: "6%",
        },
      },
    },
  },
  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },
  layouts: {
    surface: { interior: { background: "custom-ice", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "custom-ice" } } },
    pageHeader: {
      height: "56px",
      sm: { height: "48px" },
      md: { height: "56px" },
      lg: { height: "72px" },
      surface: {
        interior: { background: "custom-ice", foreground: "smart-fb", padding: { x: "xl" } },
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
        interior: { background: "background" },
        boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" }, width: "none" }, radius: { all: "xl" } },
      },
    },
    emphasis: {
      primary: { surface: { interior: { background: "primary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "background", foreground: "smart-fb" } } },
    },
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    mainBody: { surface: { interior: { background: "custom-ice", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
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
        interior: { background: "background", foreground: "smart-fb", padding: { x: "lg", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "full" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "primary" } } } },
          {
            where: { state: "focus" },
            partialSurface: {
              boundary: { border: { color: "secondary" }, outline: { width: "thin", style: "solid", color: "accent", offset: "0px" } },
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
      placeholderColor: "gray-500",
      placeholderOpacity: 1,
      caretColor: "secondary",
    },
    elevatedOverlay: {
      surface: {
        interior: { background: "background" },
        boundary: { effect: "sheet", border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "xl" } },
      },
      overlay: { scrimColor: "secondary", scrimOpacity: 0.25, scrimBlur: "sm" },
    },
    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "content-blue-soft" } } },
        ],
        boundary: { border: { width: "none", bottom: { width: "thin", style: "dotted", color: "gray-150" } } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "full" } },
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
            partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "gray-200" } } },
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
            partialSurface: { interior: { background: "background" }, boundary: { border: { color: "primary" } } },
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
            partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
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
            partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } },
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
      surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "lg" } } },
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
      boundary: { border: { width: "none", bottom: { width: "thin", style: "dotted", color: "gray-200" } } },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" } }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "dotted", color: "gray-150" } } },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
        { where: { state: "selected" }, partialSurface: { interior: { background: "content-blue-soft" } } },
      ],
    },
    tableCell: {
      interior: { padding: { x: "lg", y: "md" } },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "body", textTransform: "none" },
    },
    tableFooterCell: {
      interior: { padding: { x: "lg", y: "md" }, background: "transparent" },
      boundary: { border: { width: "none" } },
      defaultTypography: { typographyType: "bodySmall" },
    },
    card: {
      interior: { padding: { x: "xl", y: "xl", childrenSmartBleed: true }, gap: { all: "md" } },
      boundary: { effect: "none" },
    },
    panel: { interior: { padding: { all: "lg", childrenSmartBleed: true }, gap: { all: "none" } } },
    header: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "dotted", color: "gray-150" } } },
      defaultTypography: { typographyType: "heading4", textTransform: "none" },
    },
    content: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md", x: "lg" } },
      boundary: { border: { width: "none" } },
    },
    footer: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm", x: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "dotted", color: "gray-150" } } },
    },
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "none", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
      combined: [
        {
          where: { emphasis: "hero" },
          partialSurface: { interior: { background: "gradient-hero", foreground: "smart-fb" } },
        },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "brand-2-gray-100" } } },
      ],
    },
    separator: {
      surface: {
        interior: { background: "transparent", padding: {} },
        boundary: { border: { width: "none", top: { width: "thin", style: "dotted", color: "gray-200" } } },
      },
      height: "1px",
    },
    badge: {
      surface: {
        interior: { background: "gray-100", foreground: "gray-700", padding: { x: "md", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "none", style: "solid", color: "gray-300" }, radius: { all: "full" } },
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
          { where: { emphasis: "primary" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
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
        interior: { background: "background", foreground: "smart-fb", padding: { x: "sm", y: "2xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "dotted", color: "gray-200" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "primary" } } } },
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
          background: "content-pink-soft",
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
    skeleton: { surface: { interior: { background: "gray-100" }, boundary: { border: { width: "none" }, radius: { all: "sm" } } } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "2xs" } },
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
              boundary: { border: { color: "gray-300" } },
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "full" } },
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
      boundary: { border: { width: "none" }, radius: { all: "full" } },
    },
    tabBar: {
      surface: {
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } }, radius: { all: "full" } },
        interior: { gap: { all: "sm" }, background: "background", padding: { all: "xs" } },
      },
    },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "lg", y: "sm" } },
        boundary: {
          border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } },
          radius: { all: "full" },
        },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" } } },
        ],
        defaultTypography: { typographyType: "link", textTransform: "none" },
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
        boundary: { border: { width: "none" }, radius: { all: "lg" } },
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
      widthExpanded: "264px",
      widthCollapsed: "80px",
      surface: {
        interior: { background: "transparent", padding: { y: "xl", x: "xl" }, gap: { all: "md" }, foreground: "gray-700" },
        boundary: { border: { right: { width: "thin", style: "solid", color: "transparent" }, width: "none" } },
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "gray-700",
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
              interior: { background: "background", backgroundAlpha: 1, foreground: "gray-700" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } }, effect: "none" },
              tint: "background",
            },
          },
          {
            where: { state: "hover", emphasis: "primary" },
            partialSurface: {
              interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "background",
            },
          },
          {
            where: { state: "selected", emphasis: "primary" },
            partialSurface: {
              interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" },
              boundary: { border: { color: "transparent", left: { color: "transparent" } } },
              tint: "primary",
            },
          },
        ],
        dimensionPosition: { height: "52px" },
        defaultTypography: { typographyType: "link", textTransform: "none" },
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
          border: { width: "none", style: "solid", color: "gray-200", bottom: { width: "thin", style: "dotted", color: "gray-150" } },
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
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-blue-soft", foreground: "smart-fb" } },
          },
        ],
        dimensionPosition: { width: "100%" },
      },
    },
    dropdownMenu: { surface: { interior: { padding: { all: "sm" }, gap: { all: "none" } } } },
    menuItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "md", y: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50", foreground: "smart-fb" } } },
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-blue-soft", foreground: "smart-fb" } },
          },
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
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dotted", color: "gray-200" }, radius: { all: "xl" } },
        cursor: "pointer",
        combined: [
          {
            where: { state: "selected" },
            partialSurface: { interior: { background: "content-blue-soft" }, boundary: { border: { color: "secondary" } } },
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
        boundary: { effect: "popover", border: { width: "none" }, radius: { all: "lg" } },
        interior: { padding: { all: "sm" }, gap: { all: "sm" } },
      },
    },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
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
    emptyState: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "gray-600",
          padding: { all: "xl" },
          childAlign: { horizontal: "center", vertical: "center" },
        },
        boundary: { border: { width: "thin", style: "dotted", color: "gray-200" }, radius: { all: "xl" } },
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
    timeline: {
      separator: {
        interior: { background: "gray-200" },
        boundary: { border: { top: { width: "none" }, left: { width: "thin", style: "dotted", color: "gray-400" } } },
      },
    },
    hero: {
      label: { interior: { foreground: "custom-sky" } },
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
      label: { interior: { foreground: "currentColor" } },
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "currentColor" } } }] },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "currentColor", padding: { left: "xl", right: "none", y: "md" } },
        boundary: {
          border: {
            width: "none",
            left: { width: "thin", style: "dotted", color: "gray-300" },
            bottom: { width: "thin", style: "dotted", color: "gray-200" },
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
      content: { interior: { padding: { x: "lg", y: "lg" } } },
    },
  },
  // the document body: the colour the page stands on (as the page layout)
  body: {surface: {interior: {background: "custom-ice"}}},
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
      chain: [{ key: "badge", concept: "dot" }],
      tokens: {
        combined: [
          { where: { status: "error" }, partialSurface: { interior: { background: "status-error" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error" } } },
          { where: { status: "success" }, partialSurface: { interior: { background: "status-success" } } },
          { where: { status: "warning" }, partialSurface: { interior: { background: "status-warning" } } },
          { where: { status: "info" }, partialSurface: { interior: { background: "status-info" } } },
        ],
      },
    },
    {
      chain: [{ key: "badge" }, { key: "badge", concept: "dot" }],
      tokens: {
        dimensionPosition: { width: "7px", height: "7px" },
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { background: "status-error" } } },
          {
            where: { status: "destructive" },
            partialSurface: { tint: "status-error", interior: { background: "status-error" } },
          },
          {
            where: { status: "success" },
            partialSurface: { tint: "status-success", interior: { background: "status-success" } },
          },
          {
            where: { status: "warning" },
            partialSurface: { tint: "status-warning", interior: { background: "status-warning" } },
          },
          { where: { status: "info" }, partialSurface: { tint: "status-info", interior: { background: "status-info" } } },
        ],
      },
    },
    {
      chain: [{ key: "sidebar" }, { key: "badge" }],
      tokens: {
        interior: { background: "content-red-standard", foreground: "smart-fb", padding: { x: "sm", y: "3xs" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" },
      },
    },
    {
      chain: [{ key: "pageLeftSidebar" }, { key: "button" }],
      tokens: { interior: { childAlign: { horizontal: "start" } } },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "expanded" } }],
      tokens: {
        interior: { background: "custom-ice", foreground: "smart-fb" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "transparent" } } },
      },
    },
    {
      chain: [{ key: "sidebar", where: { flag: "collapsed" } }],
      tokens: {
        interior: { background: "custom-ice", foreground: "smart-fb" },
        boundary: { border: { width: "none", right: { width: "thin", style: "solid", color: "transparent" } } },
      },
    },
  ],
  gradients: {
    progress: { type: "linear", angle: 90, stops: [{ color: "content-purple-standard" }, { color: "content-violet-standard" }] },
    hero: { type: "linear", angle: 135, stops: [{ color: "accent" }, { color: "custom-lavender" }] },
  },
};
