import type { WebTheme } from "../../../types";

// dAInta v1 — authored from "dAInta Core Screens v9.dc.html" (skills/new-theme).
//
// L1 read of the target
//   anchors     bg #faf9fc (canvas #eceaf1) · fg #1a1823
//   surfaces    card #ffffff · raised #faf9fc · tinted #f5f2fb · dark band #241a3d
//   brand       1 #4a2d8f (hover #2f1b63, dark #3c2a6b, light #c3aef0) · 2 #241a3d
//   status      error #a83232 · success #2f6d4f · warning #c99b2a · info = brand
//   text grays  #4a4658 body · #6b6779 muted · #8b8698 label · #b3aec0 faint
//   line grays  #efedf4 row rule · #e6e3ec · #e0dce8 · #d8d4e0 · #cfc7e2
//   fonts       IBM Plex Sans 400/450/500/600 · IBM Plex Mono 400/500 (the label voice)
//   scale       10 · 10.5 · 11 · 11.5 · 12 · 12.5 · 13 · 13.5 · 14 · 15 · 16 · 19 · 21 · 27 · 46
//   rhythm      7 / 14 / 22 (unit 0.875rem: sm 7 · md 14 · lg 21 · xl 28)
//   radius      none; full only on avatars and dots
//   borders     1px hairlines · 3px brand accent bar · 2px dashed drop zone
//   effects     card 0 1 2 @.05 · sheet 0 1 3 @.10 + 0 12 40 @.08 · drawer -20 0 44 @.16
//   open        focus rings, disabled, dark mode — not drawn in the target
//
// Colour, the rule: a surface is `background`, its text `foreground` — the two swap in dark. Text on a
// coloured fill is `smart-bw`: white or black, read from the fill. A fixed black is named only in the shadows.

export const daintaTheme: WebTheme = {
  id: "wireframe-stroke",
  name: "Wireframe Stroke",
  version: 1,
  type: "wireframe",
  kind: "seed",

  colors: {
    main: { white: "#ffffff", black: "#1a1823" },
    brand: { "1": "#4a2d8f", "2": "#241a3d", "3": "#a495c7", "4": "#6b6779" },
    status: { success: "#2f6d4f", info: "#4a2d8f", warning: "#c99b2a", error: "#a83232" },
    content: {
      tomato: { standard: "#B05A48", soft: "#F1CEC6" },
      red: { standard: "#B05855", soft: "#F1CDCA" },
      ruby: { standard: "#B05763", soft: "#F1CDCF" },
      crimson: { standard: "#B45474", soft: "#F2CCD6" },
      pink: { standard: "#A65283", soft: "#EDCBDC" },
      plum: { standard: "#86518F", soft: "#DFCBE2" },
      purple: { standard: "#715093", soft: "#D7CBE5" },
      violet: { standard: "#5C5297", soft: "#CDCCE7" },
      iris: { standard: "#50559B", soft: "#C9CDE9" },
      indigo: { standard: "#415A9F", soft: "#C4CFEB" },
      blue: { standard: "#4580C0", soft: "#C6DCF4" },
      sky: { standard: "#91C8D9", soft: "#DDF1F6" },
      cyan: { standard: "#4A8A9F", soft: "#C9DEE6" },
      teal: { standard: "#4B8A80", soft: "#C9DFDA" },
      jade: { standard: "#4E8875", soft: "#CADED6" },
      green: { standard: "#4F8968", soft: "#CADED1" },
      grass: { standard: "#588C5F", soft: "#CDDFCE" },
      mint: { standard: "#97CEC1", soft: "#DFF2ED" },
      lime: { standard: "#B5D388", soft: "#E9F4DA" },
      yellow: { standard: "#E0D37B", soft: "#F7F3D6" },
      amber: { standard: "#D8B773", soft: "#F6EBD4" },
      orange: { standard: "#C2714C", soft: "#F5D5C8" },
      brown: { standard: "#8D725C", soft: "#E0D5CD" },
      bronze: { standard: "#85726A", soft: "#DDD5D2" },
      gold: { standard: "#7E7362", soft: "#DAD6CF" },
    },
    semanticTokens: { primary: "#4a2d8f", secondary: "#241a3d", accent: "#a495c7", muted: "#6b6779" },
  },

  typography: {
    fonts: {
      primary: "IBM Plex Sans", secondary: "IBM Plex Sans", quote: "IBM Plex Sans",
      monoPrimary: "IBM Plex Mono", monoSecondary: "IBM Plex Mono",
    },
    fontSources: {
      "IBM Plex Sans": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap" },
      "IBM Plex Mono": { type: "google", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" },
    },
    types: {
      heading1: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 24, fontSizeDesktop: 27, fontWeight: 450, lineHeight: 1.35, letterSpacing: "-0.02em" },
      heading2: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 19, fontSizeDesktop: 21, fontWeight: 450, lineHeight: 1.35, letterSpacing: "-0.015em" },
      heading3: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 17, fontSizeDesktop: 19, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-0.01em" },
      heading4: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 15, fontSizeDesktop: 16, fontWeight: 600, lineHeight: 1.4 },
      bodyExtraLarge: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 15, fontSizeDesktop: 16, fontWeight: 400, lineHeight: 1.6 },
      bodyLarge: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 14, fontSizeDesktop: 15, fontWeight: 400, lineHeight: 1.55 },
      body: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 13, fontSizeDesktop: 13.5, fontWeight: 400, lineHeight: 1.5 },
      bodySmall: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 12, fontSizeDesktop: 12.5, fontWeight: 400, lineHeight: 1.45 },
      bodyExtraSmall: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 11, fontSizeDesktop: 11.5, fontWeight: 400, lineHeight: 1.4 },
      quoteLarge: { fontFamily: "quote", fontStyle: "normal", fontSizeMobile: 15, fontSizeDesktop: 16, fontWeight: 400, lineHeight: 1.6 },
      quote: { fontFamily: "quote", fontStyle: "normal", fontSizeMobile: 13, fontSizeDesktop: 13.5, fontWeight: 400, lineHeight: 1.55 },
      quoteSmall: { fontFamily: "quote", fontStyle: "normal", fontSizeMobile: 12, fontSizeDesktop: 12.5, fontWeight: 400, lineHeight: 1.5 },
      code: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 12, fontSizeDesktop: 12.5, fontWeight: 400, lineHeight: 1.5 },
      numbersExtraLarge: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 34, fontSizeDesktop: 46, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.035em" },
      numbersLarge: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 21, fontSizeDesktop: 27, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" },
      numbers: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 13, fontSizeDesktop: 13, fontWeight: 400, lineHeight: 1.5 },
      numbersSmall: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 11.5, fontSizeDesktop: 11.5, fontWeight: 400, lineHeight: 1.45 },
      // the label voice: mono, small, tracked, uppercase (transform is set where used)
      numbersExtraSmall: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 10.5, fontSizeDesktop: 10.5, fontWeight: 400, lineHeight: 1.4, letterSpacing: "0.1em" },
      link: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 13, fontSizeDesktop: 13.5, fontWeight: 500, lineHeight: 1.5 },
    },
  },

  spacing: { unit: 0.875 },
  radius: { none: "0px", "3xs": "0px", "2xs": "0px", xs: "0px", sm: "0px", md: "0px", lg: "0px", xl: "16px", "2xl": "0px", "3xl": "0px", full: "9999px" },
  effects: {
    card: [{ type: "drop-shadow", x: 0, y: 1, blur: 2, color: "main-black", opacity: 0.05 }],
    sheet: [
      { type: "drop-shadow", x: 0, y: 1, blur: 3, color: "main-black", opacity: 0.10 },
      { type: "drop-shadow", x: 0, y: 12, blur: 40, color: "main-black", opacity: 0.08 },
    ],
    drawer: [{ type: "drop-shadow", x: -20, y: 0, blur: 44, color: "main-black", opacity: 0.16 }],
    popover: [{ type: "drop-shadow", x: 0, y: 8, blur: 24, color: "main-black", opacity: 0.3 }],
  },
  transitions: {
    duration: { extraFast: "50ms", fast: "100ms", average: "160ms", slow: "300ms", extraSlow: "500ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.3px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px" },

  modes: {
    colorScheme: {
      light: {
        background: "#faf9fc",
        foreground: "#1a1823",
        // brand-1-light ≈ #f5f2fb (chip fill) · brand-1-dark ≈ #3c2a6b · status-x-light ≈ the pale status fills
        derivation: { grayColorMixPercentage: "6%" },
      },
      dark: {
        background: "#1a1823",
        foreground: "#faf9fc",
        chroma: { saturationFactor: 0.8, gamma: 1.1 },
        derivation: { grayColorMixPercentage: "6%" },
      },
      // dark, low contrast
      "dark-low-contrast": {
        background: "#676371",
        foreground: "#D2CFD9",
        chroma: { saturationFactor: 0.7, gamma: 1.1 },
        derivation: { grayColorMixPercentage: "6%" },
      },
      // light, warm, low contrast
      "light-warm-low-contrast": {
        background: "#CDC7BE",
        foreground: "#7D7670",
        chroma: { saturationFactor: 0.9, gamma: 1.1 },
        derivation: { grayColorMixPercentage: "6%" },
      },
    },
  },

  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.75 },

  layouts: {
    // regions are the canvas: no fill of their own; surfaces inside them are the white boxes
    surface: { interior: { background: "background", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    // the dark band: page header on brand-2, light text
    pageHeader: {
      height: "56px", sm: { height: "48px" }, md: { height: "56px" }, lg: { height: "72px" },
      surface: { interior: { background: "secondary", foreground: "smart-fb", padding: { x: "xl" } } },
    },
    secondPageHeader: {
      height: "56px", sm: { height: "48px" }, md: { height: "56px" }, lg: { height: "72px" },
      surface: { interior: { background: "secondary", foreground: "smart-fb", padding: { x: "xl" } } },
    },
    // a light toolbar strip under the page band — canvas, a thin rule below.
    // (Not a second dark band; a page that wants one sets emphasis="primary".)
    mainHeader: {
      height: "48px", sm: { height: "40px" }, md: { height: "48px" }, lg: { height: "64px" },
      surface: { boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" } } }, interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" } },
    },
    secondMainHeader: {
      height: "48px", sm: { height: "40px" }, md: { height: "48px" }, lg: { height: "64px" },
      surface: { boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" } } }, interior: { padding: { x: "lg" }, background: "background", foreground: "smart-fb" } },
    },
    pageLeftSidebar: {
      width: "240px", sm: { width: "200px" }, md: { width: "240px" }, lg: { width: "300px" },
      surface: { boundary: { border: { right: { width: "thin", style: "solid", color: "gray-200" } } } },
    },
    pageRightSidebar: {
      width: "320px", sm: { width: "280px" }, md: { width: "320px" }, lg: { width: "420px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" } } } },
    },
    mainRightSidebar: {
      width: "320px", sm: { width: "260px" }, md: { width: "320px" }, lg: { width: "420px" },
      surface: { interior: { background: "background" }, boundary: { border: { left: { width: "thin", style: "solid", color: "gray-200" } } } },
    },
    // emphasis — a region's shade in the layout, over its own base. default =
    // the region as defined (canvas, or the page band); primary = a strong
    // brand band with light text; secondary = a soft branded-gray panel. The
    // base rule still owns which edge the region's border sits on.
    emphasis: {
      primary: { surface: { interior: { background: "secondary", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "gray-100", foreground: "smart-fb" } } },
    },
    // xs is the auth container: the sign-in, registration and recovery card spans it
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1340px" } },
    dialog: { sm: { maxWidth: "480px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "320px" }, md: { size: "420px" }, lg: { size: "640px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    // the ground: a shade of gray so content surfaces (cards = `background`) read
    // as raised against it. Both are mode tokens, so the figure/ground survives dark.
    mainBody: { surface: { interior: { background: "gray-100", padding: { x: "xl", y: "lg" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-300", trackColor: "transparent", width: "8px" } },
  },

  families: {
    // THE surface: a white box, a hairline, no radius, a whisper of shadow
    surfaceContainer: {
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
      defaultTypography: { typographyType: "body" },
      transition: { duration: "fast", timing: "easeOut" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
        // status on a surface: a pale fill of its color, text in the color
        { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
        { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
        { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
        { where: { status: "info" }, partialSurface: { tint: "primary", interior: { background: "accent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
        // hero: the dark band
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "secondary" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
      ],
    },

    field: {
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { x: "2xs", y: "3xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } } },
        "2xs": { partialSurface: { interior: { padding: { x: "xs", y: "2xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } } },
        xs: { partialSurface: { interior: { padding: { x: "xs", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } } },
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } } },
        md: { partialSurface: { interior: { padding: { x: "sm", y: "sm" } }, defaultTypography: { typographyType: "body" } } },
        lg: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "bodyLarge" } } },
        xl: { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
        "2xl": { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
        "3xl": { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
      },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "sm", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "gray-500" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "primary" }, outline: { width: "thin", style: "solid", color: "primary", offset: "0px" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", boundary: { border: { color: "status-warning" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { background: "background", opacity: 0.6 }, cursor: "not-allowed" } },
        ],
      },
      placeholderColor: "gray-500",
      placeholderOpacity: 1,
      caretColor: "primary",
    },

    elevatedOverlay: {
      surface: { interior: { background: "background" }, boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "gray-200" } } },
      overlay: { scrimColor: "secondary", scrimOpacity: 0.45, scrimBlur: "xs" },
    },

    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "sm" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background" } } },
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background" } } },
        ],
      },
    },

    interactiveControlGroup: {
      surface: { interior: { background: "transparent", gap: { all: "none" }, padding: {} }, boundary: { border: { width: "none" } } },
    },

    interactiveControl: {
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { x: "2xs", y: "3xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } }, icon: { size: "3xs" } },
        "2xs": { partialSurface: { interior: { padding: { x: "xs", y: "2xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } }, icon: { size: "2xs" } },
        xs: { partialSurface: { interior: { padding: { x: "xs", y: "xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } }, icon: { size: "xs" } },
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } }, icon: { size: "xs" } },
        md: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "body" } }, icon: { size: "sm" } },
        lg: { partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "bodyLarge" } }, icon: { size: "md" } },
        xl: { partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } }, icon: { size: "lg" } },
        "2xl": { partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } }, icon: { size: "lg" } },
        "3xl": { partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } }, icon: { size: "lg" } },
      },
      surface: {
        // the plain control: white, hairline — the target's default button
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "body" },
        cursor: "pointer",
        combined: [
          // emphasis = the pattern; tint = the color (status re-tints below)
          { where: { emphasis: "hero" }, partialSurface: { tint: "secondary", interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary" }, partialSurface: { tint: "primary", interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "secondary" }, partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "gray-300" } } } },
          { where: { emphasis: "tertiary" }, partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { foreground: "status-success" }, boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { foreground: "status-warning" }, boundary: { border: { color: "status-warning" } } } },
          { where: { status: "info" }, partialSurface: { tint: "primary", interior: { foreground: "primary" }, boundary: { border: { color: "primary" } } } },
          // filled + status: the fill takes the status color
          { where: { emphasis: "primary", status: "error" }, partialSurface: { interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "destructive" }, partialSurface: { interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "success" }, partialSurface: { interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "warning" }, partialSurface: { interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "info" }, partialSurface: { interior: { background: "tint", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          // states
          { where: { state: "hover" }, partialSurface: { interior: { background: "background" }, boundary: { border: { color: "gray-500" } } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "hero", state: "hover" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "tertiary", state: "hover" }, partialSurface: { interior: { background: "accent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet", state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "accent", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          // selected + status: keep the status colour, don't fall back to the generic brand selection tint
          { where: { state: "selected", status: "error" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { state: "selected", status: "destructive" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { state: "selected", status: "success" }, partialSurface: { interior: { background: "status-success", foreground: "smart-fb" }, boundary: { border: { color: "status-success" } } } },
          { where: { state: "selected", status: "warning" }, partialSurface: { interior: { background: "status-warning", foreground: "smart-fb" }, boundary: { border: { color: "status-warning" } } } },
          { where: { state: "selected", status: "info" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { outline: { width: "thin", style: "solid", color: "primary", offset: "1px" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
          { where: { state: "loading" }, partialSurface: { cursor: "progress", interior: { opacity: 0.7 } } },
        ],
      },
    },

    shape: { surface: { interior: { foreground: "currentColor", background: "transparent", padding: {} }, boundary: { border: { width: "none" } } } },
    media: { surface: { interior: { background: "gray-100", padding: {} }}, objectFit: "cover" },
  },

  elements: {
    // ── the label voice: mono, small, tracked, uppercase, gray ──
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: {} },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
      },
    },
    fieldDescription: { surface: { interior: { background: "transparent", foreground: "gray-600", padding: {} }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "bodySmall" } } },
    fieldMessage: { surface: { interior: { background: "transparent", padding: {} }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "bodySmall" } } },
    tableHeaderCell: {
      interior: { padding: { x: "lg", y: "xs" }, foreground: "gray-500", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" } }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "background" } } },
        { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background" } } },
      ],
    },
    tableCell: { interior: { padding: { x: "lg", y: "sm" } }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "body" } },

    // ── containers: the padding is written here, once, and the parts bleed to the edges (childrenSmartBleed); the parts carry none ──
    card: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } }, boundary: { effect: "card" } },
    panel: { interior: { padding: { all: "lg", childrenSmartBleed: true }, gap: { all: "none" } } },
    // ── parts: the vertical padding of each band, written once; the sides are the container's, taken on the bled edges
    header: {
      interior: { foreground: "currentColor", padding: { y: "md" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      defaultTypography: { typographyType: "heading4" },
    },
    content: { interior: { background: "transparent", foreground: "currentColor", padding: { y: "md" } }, boundary: { border: { width: "none" } } },
    footer: {
      interior: { foreground: "currentColor", padding: { y: "sm" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-100" } } },
    },
    // ── tile: a white cell, hairline all round, no radius; hero = dark band, quiet = sinks into the ground ──
    tile: {
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
      combined: [
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "secondary" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "background" }, boundary: { border: { color: "transparent" } } } },
      ],
    },
    separator: { surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "none" } } }, height: "1px" },

    // ── badge: the mono data label; quiet by default, filled by status ──
    badge: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xs", y: "3xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
        defaultTypography: { typographyType: "numbersSmall" },
        combined: [
          { where: { status: "error" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "info" }, partialSurface: { tint: "primary", interior: { background: "accent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          // emphasis="primary" is the component default — without these, the
          // plain-emphasis rule above (unconditional) clobbers every status
          // colour on a badge that never opted into a different emphasis.
          { where: { emphasis: "primary", status: "error" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { emphasis: "primary", status: "destructive" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { emphasis: "primary", status: "success" }, partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "info" }, partialSurface: { tint: "primary", interior: { background: "accent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-500" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "8px", height: "8px" } } },
        "2xs": { partialSurface: { interior: { padding: { x: "2xs", y: "none" } }, defaultTypography: { typographyType: "numbersExtraSmall" } } },
        xs: { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } }, defaultTypography: { typographyType: "numbersExtraSmall" } } },
        sm: { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } }, defaultTypography: { typographyType: "numbersSmall" } } },
        md: { partialSurface: { interior: { padding: { x: "xs", y: "2xs" } }, defaultTypography: { typographyType: "numbersSmall" } } },
        lg: { partialSurface: { interior: { padding: { x: "sm", y: "2xs" } }, defaultTypography: { typographyType: "numbers" } } },
        xl: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbers" } } },
      },
    },
    // ── chip: the tinted tag ──
    chip: {
      surface: {
        interior: { background: "accent", foreground: "smart-fb", padding: { x: "xs", y: "3xs" }, gap: { all: "2xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "primary" } } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
        ],
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } } } },
        sm: { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } } } },
        md: { partialSurface: { interior: { padding: { x: "sm", y: "2xs" } } } },
        lg: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } } },
        xl: { partialSurface: { interior: { padding: { x: "md", y: "xs" } }, defaultTypography: { typographyType: "numbers" } } },
      },
    },
    // ── avatar: the one round thing ──
    // IMAGE — the media family's picture in a box: the frame and the fill are the family's; the box's size per scale, square; a loading one waits quietly
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
        interior: { background: "primary", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        defaultTypography: { typographyType: "numbersSmall" },
      },
      // A fixed square per scale; the initials step up with it.
      sizes: {
        "2xs": { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "20px", height: "20px" }, defaultTypography: { typographyType: "numbersExtraSmall" } } },
        xs: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "24px", height: "24px" }, defaultTypography: { typographyType: "numbersExtraSmall" } } },
        sm: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "32px", height: "32px" }, defaultTypography: { typographyType: "numbersSmall" } } },
        md: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "40px", height: "40px" }, defaultTypography: { typographyType: "numbersSmall" } } },
        lg: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "48px", height: "48px" }, defaultTypography: { typographyType: "numbers" } } },
        xl: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "64px", height: "64px" }, defaultTypography: { typographyType: "numbers" } } },
      },
    },
    icon: {},
    // ── progress: thin track, brand fill ──
    progress: { surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "none" } }, dimensionPosition: { height: "4px" } } },
    progressInner: { interior: { background: "primary" } },
    skeleton: { surface: { interior: { background: "gray-100" }, boundary: { border: { width: "none" } } } },
    spinner: { surface: { interior: { foreground: "primary", background: "transparent" }, boundary: { border: { width: "none" } } } },

    // ── controls ──
    button: { surface: { interior: { gap: { all: "sm" } }, defaultTypography: { typographyType: "body" } } },
    switch: {
      track: {
        dimensionPosition: { width: "30px", height: "17px" },
        interior: { background: "gray-300", padding: { all: "none" } },
        boundary: { radius: { all: "none" }, border: { width: "none" } },
        combined: [{ where: { state: "selected" }, partialSurface: { interior: { background: "primary" } } }],
      },
      thumb: {
        dimensionPosition: { width: "13px", height: "13px", translateX: "2px", translateY: "2px" },
        interior: { background: "background" },
        boundary: { radius: { all: "none" }, border: { width: "none" } },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "15px" } } }],
      },
    },
    checkbox: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-500" }, radius: { all: "none" } },
        dimensionPosition: { width: "15px", height: "15px" },
        combined: [{ where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } }],
      },
    },
    radio: {
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-500" }, radius: { all: "full" } },
        dimensionPosition: { width: "15px", height: "15px" },
        combined: [{ where: { state: "selected" }, partialSurface: { boundary: { border: { width: "extraThick", color: "primary" } } } }],
      },
    },
    // ── tabs: text, a 3px brand bar when selected ──
    tabBar: { surface: { boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } }, interior: { gap: { all: "lg" } } } },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "none", y: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "transparent" } } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { bottom: { color: "primary" } } } } },
        ],
      },
    },
    // ── sidebar: a white rail; the current item has a brand bar on its left ──
    sidebar: { widthExpanded: "240px", widthCollapsed: "56px", surface: {
       interior: { background: "background", padding: { y: "sm" }, gap: { all: "2xs" } }, 
      boundary: { border: { right: { width: "thin", style: "solid", color: "gray-200" } } }  
       } },
    sidebarItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "lg", y: "sm" }, gap: { all: "sm" }, childAlign: { horizontal: "start", vertical: "center" } },
        boundary: { border: { width: "none", left: { width: "thick", style: "solid", color: "transparent" } }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { left: { color: "primary" } } } } },
          // main nav (emphasis="primary") looks exactly like the section nav: the same quiet rows,
          // the same selected row — light ground and the brand bar. The entries exist only to
          // cancel the control family's primary fill (tint and alpha reset: the fill formula mixes --tint in).
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent", left: { color: "primary" } } } } },
        ],
      },
    },
    // ── lists and menus ──
    // the list: a gap between the rows, and a thin separator drawn in the gap (the list family's separator; the row keeps no border of its own)
    list: {
      surface: { interior: { padding: { x: "lg", childrenSmartBleed: true }, gap: { all: "md" } } },   // the list owns the x padding; the rows bleed to its edges
    },
    // ── list draggable: a to-do row is a hairline box; the drag shows a dashed ghost, a brand line, a brand outline ──
    listDraggable: { surface: { interior: { gap: { all: "xs" } } } },
    listDraggableGroup: { interior: { background: "transparent", padding: { left: "xl" }, gap: { all: "xs" } }, boundary: { border: { width: "none" } } },
    listDraggableRow: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "gray-300" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background" }, boundary: { border: { color: "primary" } } } },
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
    listDraggableGhost: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "none" } } },
    listDraggableOverlay: { surface: { interior: { background: "background" }, boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "primary" } } } },
    listDraggableDropLine: { surface: { interior: { background: "primary", padding: {} }, boundary: { border: { width: "none" } }, dimensionPosition: { height: "3px" } } },
    listDraggableDropInto: { surface: { interior: { background: "transparent", padding: {} }, boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "none" } } } },
    // ── list tree: ONE tree list — a row is plain until hovered or chosen; the connector lines are hairlines; the drag shows a dashed ghost, a brand line, a brand outline ──
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
    listTreeGhost: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "none" } } },
    listTreeOverlay: { surface: { interior: { background: "background" }, boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "primary" } } } },
    listTreeDropLine: { surface: { interior: { background: "primary", padding: {} }, boundary: { border: { width: "none" } }, dimensionPosition: { height: "3px" } } },
    listTreeDropInto: { surface: { interior: { background: "transparent", padding: {} }, boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "none" } } } },
    listItem: {
      surface: {
        interior: { background: "transparent", padding: { y: "sm" }, gap: { all: "sm" } },   // y is the row's own height; x is the list's
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background" }, boundary: { border: { color: "gray-100" } } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "accent", foreground: "smart-fb" }, boundary: { border: { color: "gray-100" } } } },
        ],
      },
    },
    menuItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "md", y: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "background", foreground: "smart-fb" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "accent", foreground: "smart-fb" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
        ],
      },
    },
    accordionTrigger: {
      surface: {
        interior: { background: "gray-50", padding: { x: "md", y: "sm" } },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "heading4" },
      },
    },
    // ── fields with a distinct look ──
    fileUpload: {
      surface: {
        interior: { background: "background", foreground: "gray-600", padding: { all: "xl" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "default", style: "dashed", color: "gray-300" } },
        cursor: "pointer",
        combined: [{ where: { state: "selected" }, partialSurface: { tint: "primary", boundary: { border: { color: "primary" } }, interior: { background: "background" } } }],
      },
    },
    select: { surface: { cursor: "pointer" } },
    // ── overlays ──
    dialog: { surface: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } } } },
    sheet: { surface: { boundary: { effect: "drawer", border: { width: "none" } }, interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } } } },
    popover: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "sm", childrenSmartBleed: true }, gap: { all: "none" } } } },
    tooltip: {
      surface: {
        interior: { background: "secondary", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
        boundary: { border: { width: "none" }, effect: "card" },
        defaultTypography: { typographyType: "bodySmall" },
      },
    },
    toast: { surface: { interior: { padding: { x: "md", y: "sm" } }, boundary: { effect: "sheet" } } },
  },

  // ── contextual: parent → child overrides ──
  contextual: {
    // an accordion is no padded container: its content wears the trigger's side padding itself (an explicit padding on a part, which wins)
    accordionItem: {
      content: { interior: { padding: { x: "md", y: "sm" } } },
    },
    sidebar: {
      header: { interior: { padding: { x: "md", y: "md" } } },
      content: { interior: { padding: { x: "sm", y: "sm" } } },
      // the sidebar's own footer belongs to the rail, not the page — inherit the
      // rail's fill instead of painting `background` (which reads as the main body).
      footer: { interior: { padding: { x: "md", y: "sm" }, background: "transparent" } },
      sidebarItem: { interior: { padding: { x: "md", y: "sm" }, gap: { all: "md" } } },
    },
  },

  // The persona previewer (concept on its wrapper): its card and its tiles have no padding and no gap, its card has a thick left border (the persona's colour is set on it by the previewer), and its tiles no border, so the band, the portrait and the content run to the edge.
  concepts: {
    // A document read in place (the docs viewer): its content reads at the largest body scale with room between lines; the text inside inherits it, no paragraph names its own scale
    document: {
      content: { interior: { padding: { x: "none", y: "md" }, gap: { all: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } },
    },
    "persona-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "extraThick", style: "solid", color: "gray-200" } } }, breakpoints: { narrow: "520px" } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "persona-previewer-stacked": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { top: { width: "extraThick", style: "solid", color: "gray-200" } } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "organization-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "extraThick", style: "solid", color: "gray-200" } } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "organization-previewer-stacked": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { top: { width: "extraThick", style: "solid", color: "gray-200" } } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "goal-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "accent", foreground: "smart-fb" }, boundary: { border: { width: "none" } } },
    },
    "goal-group-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "primary", foreground: "smart-fb" }, boundary: { border: { width: "none" } } },
    },
    "exploration-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" }, background: "status-success", foreground: "smart-fb" }, boundary: { border: { width: "none" } } },
    },
    "live-play-player": {
      button: { boundary: { radius: { all: "full" } } },
    },
    // The role picker trigger: a filled button whose label reads from the start, not centred
    "role-select": {
      button: { interior: { childAlign: { horizontal: "start" } } },
    },
    "erd-node-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } } },
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } },
    },
    "use-case-previewer": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { left: { width: "none" } } } },
      tile: { tint: "primary", interior: { padding: { all: "none" }, gap: { all: "none" }, background: "background", foreground: "smart-fb" }, boundary: { border: { width: "none" } } },
    },
  },

  // ── rules: tighten header/footer insets when the sidebar is collapsed ──
  rules: [
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }], tokens: { interior: { padding: { x: "sm" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }], tokens: { interior: { padding: { x: "sm" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }, { key: "sidebarItem" }], tokens: { interior: { padding: { x: "xs" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }, { key: "sidebarItem" }], tokens: { interior: { padding: { x: "xs" } } } },
  ],
};
