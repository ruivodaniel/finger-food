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
  version: 4,
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
        derivation: { grayColorMixPercentage: "6%", },
      },
      dark: {
        background: "#1a1823",
        foreground: "#faf9fc",
        chroma: { saturationFactor: 0.8, gamma: 1.1 },
        derivation: { grayColorMixPercentage: "6%", },
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

  // the peek panel of the collapsed sidebar grows out of the rail (clipped to the collapsed width, 3.5rem) and folds back into it; the shadow may spill on every side
  keyframes: {
    "sidebar-peek-in": { from: { clipPath: "inset(0 calc(100% - 3.5rem) 0 0)" }, to: { clipPath: "inset(-60px -60px -60px -60px)" } },
    "sidebar-peek-out": { from: { clipPath: "inset(-60px -60px -60px -60px)" }, to: { clipPath: "inset(0 calc(100% - 3.5rem) 0 0)" } },
  },

  // density, a spike: multipliers, the theme's. The theme starts at 1; the user picks a mode (data-density on the root); an element and a concept can carry their own
  density: {
    modes: { compact: { all: 0.85, font: 0.95, icon: 0.9 }, regular: 1, spacious: { all: 1.2, font: 1.05, icon: 1.1 } },
    concepts: { "dense-table": { all: 0.7, font: 0.9, icon: 0.85 } },
  },

  // the ground every screen stands on: the document body
  body: { surface: { interior: { background: "brand-1-gray-100" } } },

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
    // a shell with a side nav stands in a column on a phone: the nav is a bar over the page
    shellSideNav: { breakpoints: { stack: "767px" } },
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
    // the ground is the body's; the main body keeps its padding
    mainBody: { surface: { interior: { padding: { x: "xl", y: "lg" } } } },
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
          { where: { emphasis: "hero" }, partialSurface: { tint: "secondary", interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary" }, partialSurface: { tint: "primary", interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "secondary" }, partialSurface: { interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "gray-300" } } } },
          { where: { emphasis: "tertiary" }, partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { foreground: "status-success" }, boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { foreground: "status-warning" }, boundary: { border: { color: "status-warning" } } } },
          { where: { status: "info" }, partialSurface: { tint: "primary", interior: { foreground: "primary" }, boundary: { border: { color: "primary" } } } },
          // filled + status: the fill takes the status color
          { where: { emphasis: "primary", status: "error" }, partialSurface: { interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "destructive" }, partialSurface: { interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "success" }, partialSurface: { interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "warning" }, partialSurface: { interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "info" }, partialSurface: { interior: { background: "tint", foreground: "main-white" }, boundary: { border: { color: "transparent" } } } },
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
    // the footer's cell (a count, a total): the same inset as a cell, a little more above, and no line of its own
    tableFooterCell: { interior: { padding: { x: "lg", y: "md" }, background: "transparent" }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "bodySmall" } },

    // ── containers: the padding is written here, once, and the parts bleed to the edges (childrenSmartBleed); the parts carry none ──
    card: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } }, boundary: { effect: "card" } },
    panel: { interior: { padding: { all: "lg", childrenSmartBleed: true }, gap: { all: "none" } } },
    // ── parts: the vertical padding of each band, written once; the sides are the container's, taken on the bled edges
    header: {
      // no fill of its own: a card with a status paints the whole box, header included
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "md" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      defaultTypography: { typographyType: "heading4" },
    },
    content: { interior: { background: "transparent", foreground: "currentColor", padding: { y: "md" } }, boundary: { border: { width: "none" } } },
    footer: {
      interior: { background: "transparent", foreground: "currentColor", padding: { y: "sm" }, gap: { all: "sm" } },
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
    // the separator (v2) is a 1px box in the flow: its fill is the line
    separator: { surface: { interior: { background: "gray-200", padding: {} }, boundary: { border: { width: "none" } } }, height: "1px" },

    // ── badge: the mono data label; quiet by default, filled by status ──
    badge: {
      surface: {
        // the gap between an icon and the text: 2xs is 1px here, too tight to read as two things
        interior: { background: "background", foreground: "smart-fb", padding: { x: "xs", y: "3xs" }, gap: { all: "xs" } },
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
        interior: { background: "accent", foreground: "smart-fb", padding: { x: "xs", y: "3xs" }, gap: { all: "xs" } },
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
    // the spinner: a ring in brand, or in its status colour; never the family's status fill behind it
    spinner: {
      surface: {
        interior: { foreground: "primary", background: "transparent", padding: { all: "none" } },
        boundary: { border: { width: "none" } },
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "success" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "info" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "primary" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
    },

    // ── controls ──
    button: { surface: { interior: { gap: { all: "sm" } }, defaultTypography: { typographyType: "body" } } },
    // ── switch: a gray track, brand when on; a white square thumb that slides. The component defaults to
    // emphasis="primary" (the control family's brand fill): the primary entries cancel it so the track reads its
    // own gray. The component centres the thumb vertically and slides it when on (its width minus 2px, with the
    // `translate` property); the theme writes no slide of its own, only the 3px margin that makes 3 + 13 + 11 + 3 = 30.
    switch: {
      track: {
        dimensionPosition: { width: "30px", height: "17px" },
        interior: { background: "gray-300", padding: { all: "none" } },
        boundary: { radius: { all: "none" }, border: { width: "none" } },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "gray-300", backgroundAlpha: 1 }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { tint: "transparent", interior: { background: "gray-400", backgroundAlpha: 1 }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary" } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "primary", backgroundAlpha: 1 }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", state: "disabled" }, partialSurface: { tint: "transparent", interior: { background: "gray-300", backgroundAlpha: 1, opacity: 0.45 }, boundary: { border: { color: "transparent" } } } },
        ],
      },
      thumb: {
        dimensionPosition: { width: "13px", height: "13px", translateX: "3px", translateY: "0px" },
        interior: { background: "background" },
        boundary: { radius: { all: "none" }, border: { width: "none" } },
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "3px", translateY: "0px" } } }],
      },
    },
    // ── checkbox: a white square with a gray hairline; checked, a brand square with a white tick. The component defaults to
    // emphasis="primary" (the control family's brand fill): the primary entries cancel it. The box grows with the scale. ──
    checkbox: {
      sizes: {
        xs: { partialSurface: { dimensionPosition: { width: "12px", height: "12px" } }, icon: { size: "xs" } },
        sm: { partialSurface: { dimensionPosition: { width: "14px", height: "14px" } }, icon: { size: "xs" } },
        md: { partialSurface: { dimensionPosition: { width: "16px", height: "16px" } }, icon: { size: "sm" } },
        lg: { partialSurface: { dimensionPosition: { width: "20px", height: "20px" } }, icon: { size: "md" } },
        xl: { partialSurface: { dimensionPosition: { width: "24px", height: "24px" } }, icon: { size: "lg" } },
      },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-500" }, radius: { all: "none" } },
        dimensionPosition: { width: "16px", height: "16px" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "gray-500" } } } },
          { where: { state: "hover" }, partialSurface: { interior: { background: "background" }, boundary: { border: { color: "primary" } } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1 }, boundary: { border: { color: "primary" } } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
        ],
      },
    },
    // the tick's box: no surface of its own (the family would draw a white hairline square over the brand fill)
    checkboxInner: { interior: { background: "transparent", foreground: "currentColor", padding: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } },
    // ── radio: a white ring with a gray hairline; the dot (the inner) is brand. The component defaults to
    // emphasis="primary", which in the control family is the filled brand button: the primary entries cancel
    // that fill (tint and alpha reset, as the sidebar item does) so a radio is never a purple disc.
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
        boundary: { border: { width: "thin", style: "solid", color: "gray-500" }, radius: { all: "full" } },
        dimensionPosition: { width: "16px", height: "16px" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "gray-500" } } } },
          { where: { state: "hover" }, partialSurface: { interior: { background: "background" }, boundary: { border: { color: "primary" } } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          // chosen: the thin ring turns brand and the dot (the inner's foreground) appears in the middle
          { where: { state: "selected" }, partialSurface: { boundary: { border: { width: "thin", color: "primary" } } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "primary" }, boundary: { border: { width: "thin", color: "primary" } } } },
        ],
      },
    },
    // ── choice group (radios, a segmented choice): the control-group family closes the gap; the options need air between them ──
    choiceGroup: { surface: { interior: { background: "transparent", gap: { all: "sm" }, padding: {} }, boundary: { border: { width: "none" } } } },
    // the dot: no box of its own (the surface family would draw a white hairline square); the component paints it with the inner's foreground
    radioInner: { interior: { background: "transparent", foreground: "primary", padding: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "full" } } },
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
    // the panel under the bar: text on the ground, no box of its own (the surface family would draw a hairline square)
    tabPanel: { interior: { background: "transparent", padding: { x: "none", y: "md" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } },
    // ── tree view: rows are words with a chevron, no boxes; the chosen row sits on the ground ──
    treeView: { surface: { interior: { background: "transparent", padding: {}, gap: { all: "none" } }, boundary: { border: { width: "none" } } } },
    treeViewGroup: { surface: { interior: { background: "transparent", padding: { left: "md" }, gap: { all: "none" } }, boundary: { border: { width: "none" } } } },
    treeViewItem: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "xs", y: "2xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
    },
    // ── calendar: no box of its own (the popover is the box); the days are the boxes ──
    calendar: { surface: { interior: { background: "transparent", padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" } } },
    // ── group (a dropdown's or a command's section): no box, no inset; its rows stack flush ──
    group: { surface: { interior: { background: "transparent", padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" } } },
    // ── alert: a band with an inset; the icon and the text a small gap apart; its status fill is the family's ──
    alert: { surface: { interior: { padding: { x: "md", y: "sm" }, gap: { all: "sm" } } } },
    // ── breadcrumb: a trail of words, no boxes; the current page in ink, the rest gray, a chevron between ──
    breadcrumb: { surface: { interior: { background: "transparent", padding: {}, gap: { all: "xs" } }, boundary: { border: { width: "none" } } } },
    breadcrumbItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: { x: "xs", y: "2xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "hover" }, partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
    },
    breadcrumbSeparator: { surface: { interior: { background: "transparent", foreground: "gray-400", padding: {} }, boundary: { border: { width: "none" } } } },
    // ── sidebar: a white rail; the current item has a brand bar on its left ──
    sidebar: { widthExpanded: "240px", widthCollapsed: "56px", surface: {
       transition: { property: "width", duration: "slow", timing: "easeInOut" },
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
    // ── dropdown: the box carries a small inset, the rows a little height. (The check of a chosen row is an absolute span
    // with no offset of its own: it lands at the row's content edge, under the text, whatever the padding — the component's.) ──
    dropdownMenu: { surface: { interior: { padding: { all: "sm", childrenSmartBleed: true }, gap: { all: "none" } } } },   // the box owns the inset once; its separators and header blocks bleed to its edges
    menuItem: {
      surface: {
        interior: { background: "transparent", padding: { x: "md", y: "sm" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        combined: [
          // a row under the pointer or the keyboard: a gray fill, never the control family's focus ring
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" } } },
          { where: { state: "focus" }, partialSurface: { interior: { background: "gray-100" }, boundary: { outline: { width: "none", style: "none" } } } },
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
    // ── otp: a row of fixed cells, the digit centred; the field family would size each cell by its content. The row is no box ──
    otp: { surface: { interior: { background: "transparent", padding: { all: "none" }, gap: { all: "xs" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } } },
    otpSlot: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "none" } },
        dimensionPosition: { width: "36px", height: "40px" },
        defaultTypography: { typographyType: "numbers", textAlign: "center" },
        combined: [
          { where: { state: "selected" }, partialSurface: { boundary: { border: { color: "primary" }, outline: { width: "thin", style: "solid", color: "primary", offset: "0px" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "primary" } } } },
        ],
      },
    },
    otpSeparator: { surface: { interior: { background: "transparent", foreground: "gray-400", padding: { x: "xs" } }, boundary: { border: { width: "none" } } } },
    // ── input group addon (a prefix, a suffix): plain text beside the input, no box of its own ──
    inputGroupAddon: { surface: { interior: { background: "transparent", foreground: "gray-600", padding: { x: "xs", y: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" } }, defaultTypography: { typographyType: "bodySmall" } } },
    select: { surface: { cursor: "pointer" } },
    // ── overlays ──
    dialog: { surface: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } } } },
    // the alert dialog is its own element (overlay--alert-dialog): the same box as the dialog, its parts bleeding to the edges
    alertDialog: { surface: { interior: { padding: { x: "lg", y: "md", childrenSmartBleed: true }, gap: { all: "none" } } } },
    // the sheet carries its own inset (no children bleed): what sits in it loose, a button, a form, lines up with its header
    sheet: { surface: { boundary: { effect: "drawer", border: { width: "none" } }, interior: { padding: { x: "lg", y: "md" }, gap: { all: "md" } } } },
    // the popover carries its own inset: what opens in one (a picker, a calendar, a menu) is a plain box, not header/content/footer parts, so no children bleed here
    popover: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "sm" }, gap: { all: "sm" } } } },
    hoverCard: { surface: { boundary: { effect: "popover" }, interior: { padding: { all: "md" }, gap: { all: "none" } } } },
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
    // in a dialog the actions sit at the end of the footer, the confirming one last
    dialog: {
      footer: { interior: { childAlign: { horizontal: "end" } } },
    },
    alertDialog: {
      footer: { interior: { childAlign: { horizontal: "end" } } },
    },
    // an accordion is no padded container: its content wears the trigger's side padding itself (an explicit padding on a part, which wins)
    accordionItem: {
      content: { interior: { padding: { x: "md", y: "sm" } } },
    },
    // inside a sheet the box carries the inset: its regions wear none on the sides
    sheet: {
      header: { interior: { padding: { x: "none", y: "sm" } } },
      content: { interior: { padding: { x: "none", y: "sm" } } },
      footer: { interior: { padding: { x: "none", y: "sm" } } },
    },
    // in a menu: the heading is bold ink with the rows' inset; the box itself holds a small inset
    menu: {
      label: { interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "xs" } }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "heading4", textTransform: "none" } },
      separator: { interior: { background: "gray-200" } },
    },
    // the rail's header and footer wear the same side inset as its content, so the avatars line up with the rows' icons
    sidebar: {
      header: { interior: { padding: { x: "sm", y: "md" }, gap: { all: "xs" } } },
      content: { interior: { padding: { x: "sm", y: "sm" } } },
      // the sidebar's own footer belongs to the rail, not the page — inherit the
      // rail's fill instead of painting `background` (which reads as the main body).
      footer: { interior: { padding: { x: "sm", y: "sm" }, background: "transparent" } },
      sidebarItem: { interior: { padding: { x: "md", y: "sm" }, gap: { all: "md" } } },
    },
  },

  // The persona previewer (concept on its wrapper): its card and its tiles have no padding and no gap, its card has a thick left border (the persona's colour is set on it by the previewer), and its tiles no border, so the band, the portrait and the content run to the edge.
  concepts: {
    // ── data-tooltip: the data surface, a light card with a hairline instead of the dark bubble; a header and a footer set off by a hairline, the body free ──
    // ── charts: the palette and the ink every chart reads (lib/chart-theme.ts). Eight series colours from the content ramp, in a hue order that keeps neighbours apart ──
    chart: { self: { vars: {
      "--chart-series-1": "brand-1", "--chart-series-2": "content-teal-standard", "--chart-series-3": "content-amber-standard", "--chart-series-4": "content-crimson-standard",
      "--chart-series-5": "content-indigo-standard", "--chart-series-6": "content-grass-standard", "--chart-series-7": "content-orange-standard", "--chart-series-8": "content-plum-standard",
      "--chart-ink": "gray-400", "--chart-ink-soft": "gray-200", "--chart-label": "gray-600", "--chart-bg": "transparent", "--chart-stroke": "2",
    } } },
    "micro-chart": { self: { vars: { "--chart-series-1": "brand-1", "--chart-ink": "gray-400", "--chart-ink-soft": "gray-200", "--chart-label": "gray-600", "--chart-stroke": "1.5" } } },
    "data-tooltip": {
      self: {
        interior: { background: "background", foreground: "smart-fb", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, effect: "none" },
        defaultTypography: { typographyType: "bodySmall" },
      },
    },
    "data-tooltip-header": {
      self: {
        interior: { foreground: "foreground", padding: { bottom: "xs" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
        defaultTypography: { typographyType: "bodySmall" },
      },
    },
    "data-tooltip-footer": {
      self: {
        interior: { foreground: "gray-600", padding: { top: "xs" } },
        boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-200" } } },
        defaultTypography: { typographyType: "bodyExtraSmall" },
      },
    },
    // ── the results page (patterns/page/offers): a summary bar of tiles, product cards with an action column, figure tiles.
    // A concept of L4 reaches descendants only: the pattern puts each on a Stack around what it dresses. In this theme the
    // boxes are hairlines and square corners; nothing inside a card draws a box of its own. ──
    summary: {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { effect: "none" } },
      content: { interior: { padding: { x: "lg", y: "md" } } },
      tile: {
        interior: { background: "transparent", padding: { x: "lg", y: "none" }, gap: { all: "2xs" } },
        boundary: { border: { width: "none", left: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
        combined: [{ where: { emphasis: "secondary" }, partialSurface: { interior: { padding: { left: "none" } }, boundary: { border: { left: { width: "none" } } } } }],
      },
    },
    product: {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { effect: "card" } },
      content: { interior: { padding: { all: "none" } } },
      // the card's two columns: bare tiles with the inset
      tile: { interior: { background: "transparent", padding: { x: "xl", y: "lg" }, gap: { all: "none" } }, boundary: { border: { width: "none" }, effect: "none" } },
      // a criterion: an outlined chip in the body voice; the match chip keeps its soft status fill
      badge: {
        interior: { background: "background", foreground: "gray-600", padding: { x: "sm", y: "2xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
        defaultTypography: { typographyType: "bodySmall", textTransform: "none" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { boundary: { border: { color: "transparent" } }, defaultTypography: { typographyType: "numbersSmall" } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "gray-100" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
      icon: { combined: [
        { where: { status: "success" }, partialSurface: { interior: { foreground: "status-success" } } },
        { where: { status: "warning" }, partialSurface: { interior: { foreground: "status-warning" } } },
        { where: { status: "error" }, partialSurface: { interior: { foreground: "status-error" } } },
      ] },
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
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, effect: "none" } },
      content: { interior: { padding: { all: "none" } } },
      tile: {
        interior: { background: "background", padding: { x: "lg", y: "md" }, gap: { all: "xs" } },
        boundary: { border: { width: "none", left: { width: "thin", style: "solid", color: "gray-200" } }, effect: "none" },
        combined: [{ where: { emphasis: "secondary" }, partialSurface: { interior: { background: "gray-50" }, boundary: { border: { left: { width: "none" } } } } }],
      },
    },
    wordmark: { avatar: { boundary: { radius: { all: "none" } } } },
    // an organization's logo: square, as the wordmark
    "organization-logo": { self: { boundary: { radius: { all: "none" } } } },
    // the product's logo in a navigation: its wide form and its square form
    // the label column of a pattern page's rows of examples: every row's label takes the same width, so what follows lines up
    "example-label": { self: { dimensionPosition: { width: "6rem" } } },
    "logo-wide": { self: { dimensionPosition: { width: "132px", height: "32px" } } },
    "logo-square": { self: { dimensionPosition: { width: "32px", height: "32px" } } },
    // the side navigation's fixed rows: one height whatever the sidebar's shape, so nothing under them moves when it expands or collapses
    "sidebar-row": { self: { dimensionPosition: { height: "36px" } } },
    // a group's heading wears the entries' side inset, so its label stands over their icons
    // the block at the head of a menu (the user's picture and name): its own inset inside the menu box
    "menu-header": { self: { interior: { padding: { all: "md" } } } },
    // the side navigation's three shapes: the zone it stands in has padding (the sidebar floats on it, or stands shorter than the page), the sidebar wears the matching look
    "sidebar-zone-floating": { self: { interior: { padding: { x: "md" } } } },
    "sidebar-zone-compressed": { self: { interior: { padding: { y: "md" } } } },
    "sidebar-zone-floating-compressed": { self: { interior: { padding: { x: "md", y: "md" } } } },
    "sidebar-floating": { self: { boundary: { radius: { all: "lg" }, border: { width: "thin", style: "solid", color: "gray-200" }, effect: "card" } } },
    "sidebar-compressed": { self: { boundary: { radius: { topRight: "lg", bottomRight: "lg" }, border: { width: "thin", style: "solid", color: "gray-200" }, effect: "card" } } },
    "sidebar-floating-compressed": { self: { boundary: { radius: { all: "lg" }, border: { width: "thin", style: "solid", color: "gray-200" }, effect: "card" } } },
    // a group of the side navigation starts with a hairline across the sidebar, its label beneath; the heading keeps its height, the line is inside it
    "sidebar-group-heading": { self: { dimensionPosition: { height: "28px" }, interior: { padding: { x: "md" }, foreground: "gray-400" }, boundary: { border: { top: { width: "thin", style: "solid", color: "gray-200" } } } } },
    // collapsed: the group's divider is a short line, centred in the same height
    // the phone's navigation bar: the logo and the menu button, over the page, a hairline below
    "sidebar-topbar": { self: { dimensionPosition: { height: "56px" }, interior: { background: "background", padding: { x: "md" } }, boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" } } } } },
    "sidebar-group-divider": { self: { dimensionPosition: { height: "28px" }, interior: { padding: { x: "md" } } } },
    sort: { tabBar: { boundary: { border: { width: "none" } }, interior: { gap: { all: "lg" } } } },
    group: { separator: { interior: { background: "gray-300" } } },
    // the activity timeline (patterns/component/activity): the thread between the dots is the hairline; the dots are the dot rule below
    timeline: { separator: { interior: { background: "gray-200" } } },
    // the hero with figures (patterns/component/hero-with-figures): on the dark band the label and the secondary button read in white; the figures are bare tiles with a rule between them and a rule on the left
    // currentColor, not main-white: a mood whose hero is light (sketch, breeze, liquid, honey) keeps its ink on the band
    hero: {
      label: { interior: { foreground: "currentColor" } },
      button: { combined: [
        { where: { emphasis: "secondary" }, partialSurface: { interior: { background: "transparent", foreground: "currentColor" }, boundary: { border: { color: "currentColor" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "currentColor" } } },
      ] },
    },
    // the progress list (patterns/component/progress-list): a thicker track than the inline one
    progressList: { progress: { dimensionPosition: { height: "8px" } } },
    // key · value rows (patterns/component/tabbed-key-values): the list has no inset or gap, each item is a bare row with a rule under it, none under the last
    keyValues: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
      },
    },
    // rows with an avatar and a chip (patterns/component/avatar-list): the same bare rows
    rows: {
      list: { interior: { padding: { x: "none" }, gap: { all: "none" } } },
      listItem: {
        interior: { padding: { x: "none", y: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
      },
    },
    // the chosen product (the emphasis card of dashboard-2): the dark band; the label and the quiet button read in white
    chosen: {
      label: { interior: { foreground: "currentColor" } },
      button: { combined: [{ where: { emphasis: "quiet" }, partialSurface: { interior: { foreground: "currentColor" } } }] },
    },
    stats: {
      tile: {
        interior: { background: "transparent", foreground: "currentColor", padding: { left: "xl", right: "none", y: "sm" } },
        boundary: { border: { width: "none", left: { width: "thin", style: "solid", color: "primary" }, bottom: { width: "thin", style: "solid", color: "primary" } }, effect: "none" },
        combined: [{ where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } }],
      },
    },
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
    "canvas-card": {
      card: { interior: { padding: { all: "none" }, gap: { all: "none" } } },
    },
    "canvas-note": {
      tile: { interior: { padding: { all: "none" }, gap: { all: "none" } } },
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
    // ── stack ────────────────────────────────────────────────────────────────
    // A Stack says how close its children stand with a word (`scale`); the measure is here.
    ...(["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const).map((scale) => ({ chain: [{ key: "stack", where: { scale } }] as const, tokens: { interior: { gap: { all: scale } } } })),
    // ── data-number ──────────────────────────────────────────────────────────────────────────────────────────────────────────
    // One concept, "data-number", on the root, with the axes; each slot has its own identifier (data-number-value / -unit / -symbol / -exponent / -placeholder / -trend).
    // Status is the colour (neutral grey; success, warning, error, info, destructive their own). Emphasis is the form that colour takes:
    //   hero      a solid fill of the status colour, every slot white
    //   primary   an outlined surface tinted with the status colour, every slot in that colour
    //   secondary an underline of the status colour
    //   tertiary  the value in the status colour, no surface
    //   quiet     the value in grey
    //   (no emphasis) the value in the status colour, no surface
    // the unit, the symbol and the exponent speak quieter than the value and one type step below it; the placeholder quieter still
    { when: { concept: "data-number" }, self: { interior: { padding: { all: "none" }, gap: { all: "xs" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } }, children: {
      "data-number-unit": { interior: { foreground: "gray-600" } },
      // the symbol is a word (USD, kg): quieter and apart from the unit's single letter, so "M USD" never reads as one token
      "data-number-symbol": { interior: { foreground: "gray-500", padding: { left: "2xs" } } },
      "data-number-exponent": { interior: { foreground: "gray-600" } },
      "data-number-placeholder": { interior: { foreground: "gray-500" } },
    } },
    { when: { concept: "data-number", where: { scale: "xl" } }, children: { "data-number-unit": { defaultTypography: { typographyType: "numbersLarge" } }, "data-number-symbol": { defaultTypography: { typographyType: "numbersLarge" } }, "data-number-exponent": { defaultTypography: { typographyType: "numbersLarge" } } } },
    { when: { concept: "data-number", where: { scale: "lg" } }, children: { "data-number-unit": { defaultTypography: { typographyType: "numbers" } }, "data-number-symbol": { defaultTypography: { typographyType: "numbers" } }, "data-number-exponent": { defaultTypography: { typographyType: "numbers" } } } },
    { when: { concept: "data-number", where: { scale: "md" } }, children: { "data-number-unit": { defaultTypography: { typographyType: "numbersSmall" } }, "data-number-symbol": { defaultTypography: { typographyType: "numbersSmall" } }, "data-number-exponent": { defaultTypography: { typographyType: "numbersSmall" } } } },
    { when: { concept: "data-number", where: { scale: "sm" } }, children: { "data-number-unit": { defaultTypography: { typographyType: "numbersExtraSmall" } }, "data-number-symbol": { defaultTypography: { typographyType: "numbersExtraSmall" } }, "data-number-exponent": { defaultTypography: { typographyType: "numbersExtraSmall" } } } },
    { when: { concept: "data-number", where: { scale: "xs" } }, children: { "data-number-unit": { defaultTypography: { typographyType: "numbersExtraSmall" } }, "data-number-symbol": { defaultTypography: { typographyType: "numbersExtraSmall" } }, "data-number-exponent": { defaultTypography: { typographyType: "numbersExtraSmall" } } } },
    // the status colours the value and the trend, at every emphasis (the forms below add their surface on top)
    { when: { concept: "data-number", where: { status: "info" } }, children: { "data-number-value": { interior: { foreground: "status-info" } }, "data-number-trend": { interior: { foreground: "status-info" } } } },
    { when: { concept: "data-number", where: { status: "success" } }, children: { "data-number-value": { interior: { foreground: "status-success" } }, "data-number-trend": { interior: { foreground: "status-success" } } } },
    { when: { concept: "data-number", where: { status: "warning" } }, children: { "data-number-value": { interior: { foreground: "status-warning" } }, "data-number-trend": { interior: { foreground: "status-warning" } } } },
    { when: { concept: "data-number", where: { status: "error" } }, children: { "data-number-value": { interior: { foreground: "status-error" } }, "data-number-trend": { interior: { foreground: "status-error" } } } },
    { when: { concept: "data-number", where: { status: "destructive" } }, children: { "data-number-value": { interior: { foreground: "status-error" } }, "data-number-trend": { interior: { foreground: "status-error" } } } },
    // hero: a solid fill of the status colour, every slot white
    { when: { concept: "data-number", where: { emphasis: "hero" } }, self: { interior: { background: "gray-500", padding: { x: "sm", y: "2xs" } }, boundary: { border: { width: "thin", style: "solid", color: "gray-500" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    { when: { concept: "data-number", where: { emphasis: "hero", status: "neutral" } }, self: { interior: { background: "gray-500" }, boundary: { border: { color: "gray-500" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    { when: { concept: "data-number", where: { emphasis: "hero", status: "info" } }, self: { interior: { background: "status-info" }, boundary: { border: { color: "status-info" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    { when: { concept: "data-number", where: { emphasis: "hero", status: "success" } }, self: { interior: { background: "status-success" }, boundary: { border: { color: "status-success" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    { when: { concept: "data-number", where: { emphasis: "hero", status: "warning" } }, self: { interior: { background: "status-warning" }, boundary: { border: { color: "status-warning" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    { when: { concept: "data-number", where: { emphasis: "hero", status: "error" } }, self: { interior: { background: "status-error" }, boundary: { border: { color: "status-error" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    { when: { concept: "data-number", where: { emphasis: "hero", status: "destructive" } }, self: { interior: { background: "status-error" }, boundary: { border: { color: "status-error" } } }, children: { "data-number-value": { interior: { foreground: "main-white" } }, "data-number-unit": { interior: { foreground: "main-white" } }, "data-number-symbol": { interior: { foreground: "main-white" } }, "data-number-exponent": { interior: { foreground: "main-white" } }, "data-number-trend": { interior: { foreground: "main-white" } } } },
    // primary: an outlined surface tinted with the status colour; the value, the unit, the symbol and the trend in that colour
    { when: { concept: "data-number", where: { emphasis: "primary" } }, self: { tint: "gray-500", interior: { background: "background", padding: { x: "sm", y: "2xs" } }, boundary: { border: { width: "thin", style: "solid", color: "gray-400" } } } },
    { when: { concept: "data-number", where: { emphasis: "primary", status: "neutral" } }, self: { tint: "gray-500", interior: { background: "background" }, boundary: { border: { color: "gray-500" } } }, children: { "data-number-value": { interior: { foreground: "gray-500" } }, "data-number-unit": { interior: { foreground: "gray-500" } }, "data-number-symbol": { interior: { foreground: "gray-500" } }, "data-number-exponent": { interior: { foreground: "gray-500" } }, "data-number-trend": { interior: { foreground: "gray-500" } } } },
    { when: { concept: "data-number", where: { emphasis: "primary", status: "info" } }, self: { tint: "status-info", interior: { background: "background" }, boundary: { border: { color: "status-info" } } }, children: { "data-number-value": { interior: { foreground: "status-info" } }, "data-number-unit": { interior: { foreground: "status-info" } }, "data-number-symbol": { interior: { foreground: "status-info" } }, "data-number-exponent": { interior: { foreground: "status-info" } }, "data-number-trend": { interior: { foreground: "status-info" } } } },
    { when: { concept: "data-number", where: { emphasis: "primary", status: "success" } }, self: { tint: "status-success", interior: { background: "background" }, boundary: { border: { color: "status-success" } } }, children: { "data-number-value": { interior: { foreground: "status-success" } }, "data-number-unit": { interior: { foreground: "status-success" } }, "data-number-symbol": { interior: { foreground: "status-success" } }, "data-number-exponent": { interior: { foreground: "status-success" } }, "data-number-trend": { interior: { foreground: "status-success" } } } },
    { when: { concept: "data-number", where: { emphasis: "primary", status: "warning" } }, self: { tint: "status-warning", interior: { background: "background" }, boundary: { border: { color: "status-warning" } } }, children: { "data-number-value": { interior: { foreground: "status-warning" } }, "data-number-unit": { interior: { foreground: "status-warning" } }, "data-number-symbol": { interior: { foreground: "status-warning" } }, "data-number-exponent": { interior: { foreground: "status-warning" } }, "data-number-trend": { interior: { foreground: "status-warning" } } } },
    { when: { concept: "data-number", where: { emphasis: "primary", status: "error" } }, self: { tint: "status-error", interior: { background: "background" }, boundary: { border: { color: "status-error" } } }, children: { "data-number-value": { interior: { foreground: "status-error" } }, "data-number-unit": { interior: { foreground: "status-error" } }, "data-number-symbol": { interior: { foreground: "status-error" } }, "data-number-exponent": { interior: { foreground: "status-error" } }, "data-number-trend": { interior: { foreground: "status-error" } } } },
    { when: { concept: "data-number", where: { emphasis: "primary", status: "destructive" } }, self: { tint: "status-error", interior: { background: "background" }, boundary: { border: { color: "status-error" } } }, children: { "data-number-value": { interior: { foreground: "status-error" } }, "data-number-unit": { interior: { foreground: "status-error" } }, "data-number-symbol": { interior: { foreground: "status-error" } }, "data-number-exponent": { interior: { foreground: "status-error" } }, "data-number-trend": { interior: { foreground: "status-error" } } } },
    // secondary: an underline
    { when: { concept: "data-number", where: { emphasis: "secondary" } }, self: { interior: { padding: { bottom: "3xs" } }, boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-400" } } } } },
    { when: { concept: "data-number", where: { emphasis: "secondary", status: "neutral" } }, self: { boundary: { border: { bottom: { color: "gray-500" } } } } },
    { when: { concept: "data-number", where: { emphasis: "secondary", status: "info" } }, self: { boundary: { border: { bottom: { color: "status-info" } } } } },
    { when: { concept: "data-number", where: { emphasis: "secondary", status: "success" } }, self: { boundary: { border: { bottom: { color: "status-success" } } } } },
    { when: { concept: "data-number", where: { emphasis: "secondary", status: "warning" } }, self: { boundary: { border: { bottom: { color: "status-warning" } } } } },
    { when: { concept: "data-number", where: { emphasis: "secondary", status: "error" } }, self: { boundary: { border: { bottom: { color: "status-error" } } } } },
    { when: { concept: "data-number", where: { emphasis: "secondary", status: "destructive" } }, self: { boundary: { border: { bottom: { color: "status-error" } } } } },
    // tertiary: the value in the status colour
    { when: { concept: "data-number", where: { emphasis: "tertiary", status: "neutral" } }, children: { "data-number-value": { interior: { foreground: "gray-500" } } } },
    { when: { concept: "data-number", where: { emphasis: "tertiary", status: "info" } }, children: { "data-number-value": { interior: { foreground: "status-info" } } } },
    { when: { concept: "data-number", where: { emphasis: "tertiary", status: "success" } }, children: { "data-number-value": { interior: { foreground: "status-success" } } } },
    { when: { concept: "data-number", where: { emphasis: "tertiary", status: "warning" } }, children: { "data-number-value": { interior: { foreground: "status-warning" } } } },
    { when: { concept: "data-number", where: { emphasis: "tertiary", status: "error" } }, children: { "data-number-value": { interior: { foreground: "status-error" } } } },
    { when: { concept: "data-number", where: { emphasis: "tertiary", status: "destructive" } }, children: { "data-number-value": { interior: { foreground: "status-error" } } } },
    // quiet: the value in grey
    { when: { concept: "data-number", where: { emphasis: "quiet" } }, children: { "data-number-value": { interior: { foreground: "gray-500" } }, "data-number-unit": { interior: { foreground: "gray-400" } }, "data-number-symbol": { interior: { foreground: "gray-400" } } } },
    // a status dot (a 3xs badge carrying concept="dot"): a solid disc of its colour, whatever the badge's own fill or inset
    { chain: [{ key: "badge", concept: "dot" }], tokens: {
      interior: { padding: { all: "none" }, background: "gray-300" }, boundary: { border: { width: "none" }, radius: { all: "full" } },
      combined: [
        { where: { status: "success" }, partialSurface: { interior: { background: "status-success" } } },
        { where: { status: "warning" }, partialSurface: { interior: { background: "status-warning" } } },
        { where: { status: "error" }, partialSurface: { interior: { background: "status-error" } } },
        { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error" } } },
        { where: { status: "info" }, partialSurface: { interior: { background: "primary" } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "gray-300" } } },
      ],
    } },
    // the dot inside a badge: smaller than the 8px it has on its own, so it sits with the small text
    // inside an error or destructive badge the chip is solid red, so the dot is white (a chain segment cannot carry a status: this also reaches the quiet, tinted one)
    { chain: [{ key: "badge" }, { key: "badge", concept: "dot" }], tokens: {
      dimensionPosition: { width: "6px", height: "6px" },
      combined: [
        // the tint is the fill itself: the status family would mix 20% red into the white, and a "transparent" tint leaves the fill at 80% alpha
        { where: { status: "error" }, partialSurface: { tint: "background", interior: { background: "background" } } },
        { where: { status: "destructive" }, partialSurface: { tint: "background", interior: { background: "background" } } },
      ],
    } },
    // the collapsed rail: no side inset anywhere, every row centres what it holds (an icon, an avatar); the brand bar stays on the left edge
    // the side navigation: an entry and the footer keep one height, expanded and collapsed
    { chain: [{ key: "sidebar" }, { key: "content" }, { key: "sidebarItem" }], tokens: { dimensionPosition: { height: "36px" } } },
    { chain: [{ key: "sidebar" }, { key: "header" }, { key: "sidebarItem" }], tokens: { dimensionPosition: { height: "36px" } } },
    { chain: [{ key: "sidebar" }, { key: "footer" }, { key: "sidebarItem" }], tokens: { dimensionPosition: { height: "36px" } } },
    // the product's logo is an image box at a fixed height, its width following the picture (fit height), never cropped: the box's size for its scale (md by default) would beat the concept, so the concept says its height for that scale too
    { when: { concept: "logo-wide", where: { scale: "md" } }, self: { dimensionPosition: { width: "auto", height: "32px" } } },
    // the navigation as a sheet on a phone: the sidebar is the whole sheet, so the sheet adds no inset or gap of its own and is as wide as the sidebar (the sheet's own scale rule would beat the concept, so the rule says the scale too)
    { when: { concept: "sidebar-sheet", where: { scale: "md" } }, self: { dimensionPosition: { width: "240px" }, interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    // the sidebar's provider is the box the sidebar stands in: it is as tall as its zone
    { when: { concept: "sidebar-provider" }, self: { dimensionPosition: { height: "100%" } } },
    // the peek panel: as tall as the rail it grows out of, no inset, no radius; its flag says whether it opens or folds back (the popover's own scale rule would beat the concept, so the rule says the scale too)
    { when: { concept: "sidebar", where: { scale: "md", flag: "peek-open" } }, self: { dimensionPosition: { height: "var(--radix-popover-trigger-height)" }, interior: { padding: { all: "none" } }, boundary: { radius: { all: "none" } }, animation: { name: "sidebar-peek-in", duration: "220ms", timing: "ease-in-out", fillMode: "both" } } },
    { when: { concept: "sidebar", where: { scale: "md", flag: "peek-closed" } }, self: { dimensionPosition: { height: "var(--radix-popover-trigger-height)" }, interior: { padding: { all: "none" } }, boundary: { radius: { all: "none" } }, animation: { name: "sidebar-peek-out", duration: "220ms", timing: "ease-in-out", fillMode: "both" } } },
    { when: { concept: "logo-square", where: { scale: "md" } }, self: { dimensionPosition: { width: "auto", height: "32px" } } },
    { chain: [{ key: "sidebar" }, { key: "footer" }], tokens: { dimensionPosition: { height: "60px" } } },
    // a footer that holds the notifications entry above the user menu is as tall as both
    { chain: [{ key: "sidebar" }, { key: "footer", concept: "sidebar-footer-two-rows" }], tokens: { dimensionPosition: { height: "auto" } } },
    // "120/500": the total after the slash is dimmer than the number it follows
    { when: { concept: "count-of" }, self: { interior: { foreground: "gray-400" } } },
    // the collapsed rail marks an entry with a dot tucked against its icon's top corner
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "sidebarItem" }, { key: "badge", concept: "dot" }], tokens: { dimensionPosition: { translateX: "-9px", translateY: "-9px" } } },
    // the same dot on the collapsed bell, in the header
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }, { key: "badge", concept: "dot" }], tokens: { dimensionPosition: { translateX: "-9px", translateY: "-9px" } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }], tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } } },
    // the content has no side inset in any shape: an entry carries its own, so the brand bar of the active entry touches the sidebar's edge expanded as collapsed
    { chain: [{ key: "sidebar" }, { key: "content" }], tokens: { interior: { padding: { x: "none" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }], tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "sidebarItem" }], tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } } },
  ],
};
