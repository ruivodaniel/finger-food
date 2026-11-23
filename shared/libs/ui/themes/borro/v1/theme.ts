import type { WebTheme } from "../../../types";

// BORRO v1 — authored with skills/new-theme from ".meta/DS/DS.html" (BORRO · Soft Glow — Cool UI, V1 October 2026,
// ref. Soft Glow Moodboard v3) and the final screens in ".meta/BORRO_29Jul_final" (assets/css/*.css, 1-assessment →
// 5b-dashboard-sidebar). The scaffold was wireframe-stroke v1.
//
// L1 read of the target
//   anchors     surface #FFFFFF · ink #2F4A54 — the canvas around the white frame is #ECECEA, the sidebar rail #FBFBF9
//   teal        #4C7386 teal-mid (the fill start, the halo, the tint) · #3B5D6B Slate Teal (the ink of actions:
//               outline buttons, links, focus borders, the chosen segment) · #2F505E Deep Slate (the fill end, dark
//               panels, tooltips, the inverse card, hover text)
//   haze        #9CC3E9 Haze Blue — glows, data fills, the progress bar (→ #5E93C4), the raised card's halo
//   sage        #D4E381 Soft Sage — positive accents, the chips (fill #EFF4CF, ink #5C6B3A, dot #8AA43C)
//   coral       #F4784A Vivid Coral — brand and editorial only, never on interactive UI; its hot end #FF4D10
//   status      success #8AA43C · info #5E93C4 · warning #C2A14A · error #C0564A (a brick red, far from the coral)
//               each with a pale fill (#F7FAE4 · #EFF5FB · #FBF6E4 · #FAEBE9), a tinted line and a dark ink
//   text grays  #4A6672 soft · #5C7078 muted · #8B8B86 gray · #B5B5B0 light · #9AA6AB placeholder
//   line grays  #F0F0EC row rule · #EDEDE9 line · #E7E7E3 hairline · #DEDEDA input · #C9C9C4 control · #ECECEA canvas
//   fonts       Hanken Grotesk 500/700/800 (the display face; a stand-in for Founders Grotesk) · Helvetica / Arial
//               400/600/700 (body and UI) · ui-monospace (overlines, field labels, keys)
//   scale       10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 21 · 22 · 26 · 28 · 32 · 36 · 52 · 56
//   rhythm      base 4 on paper; in use 13 × 26 (buttons), 13 × 16 (fields), 28–32 (cards), 48–64 (gutters)
//               → unit 0.8125rem: xs 3.25 · sm 6.5 · md 13 · lg 19.5 · xl 26 · 2xl 39 · 3xl 52
//   radius      6 checks · 9–10 chips and nav rows · 12 inputs · 14 alerts, kpi cells · 18 cards and modals · pills
//   borders     1px lines · 1.5px icon strokes · 2px option rules · 6px radio ring
//   effects     halo 0 0 0 4 teal@.14 + 0 16 34 -10 deep@.55 · raised card 0 2 6 haze@.18 + 0 12 28 -16 slate@.22
//               focus 0 0 0 4 teal@.16 + 0 14 30 -10 deep@.45 · modal 0 30 80 -20 deep@.5 + 0 0 0 6 haze@.14
//               tooltip 0 10 24 -8 deep@.5 · popover 0 24 60 -18 deep@.45 · glow 0 0 18 haze@.45
//   gradients   primary 135° teal-mid → deep · progress 90° haze → #5E93C4 · avatar 135° haze → teal-mid
//   open        dark mode, the focus ring of a button, a drawer's shadow — not drawn in the target; the status
//               pills' lines are a ~40% tint of their colour, the engine has one light amount (the fill's 12%)
//
// How the target maps onto the mode's colours (light: background = the white surface, foreground = the ink)
//   surface = background · text = foreground — the two that swap in dark
//   brand-1 = teal-mid; brand-1-dark (50% on the ink) ≈ #3D5E6D, the Slate Teal of actions; brand-1-light (10%) ≈ the
//   ghost hover · brand-2 = Deep Slate · brand-3 = Haze · brand-4 = the muted gray · the coral and the sage are flat
//   the grays derive from the slate ink, so they are 2–4 points cooler than the target's (#9AA6AB placeholder is exact)
//   text on a solid fill = smart-bw; on a gradient = main-white, because a gradient has no --bg to read and its colours
//   never swap. A fixed black is named only in the thumb's shadow.

export const borroTheme: WebTheme = {
  id: "borro",
  name: "BORRO",
  version: 1,
  type: "high-fidelity",
  kind: "product",

  colors: {
    main: { white: "#FFFFFF", black: "#2F4A54" },
    brand: { "1": "#4C7386", "2": "#2F505E", "3": "#9CC3E9", "4": "#8B8B86" },
    status: { success: "#8AA43C", info: "#5E93C4", warning: "#C2A14A", error: "#C0564A" },
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
    semanticTokens: { primary: "#4C7386", secondary: "#2F505E", accent: "#9CC3E9", muted: "#8B8B86" },
  },

  // the slate fill, the haze data fill, the avatar
  gradients: {
    primary: { type: "linear", angle: 135, stops: [{ color: "primary", position: "0%" }, { color: "secondary", position: "100%" }] },
    primaryHover: { type: "linear", angle: 135, stops: [{ color: "primary", position: "0%" }, { color: "secondary", position: "100%" }] },
    // a filled control re-tinted by a status keeps the fill's shape: the status to its dark
    error: { type: "linear", angle: 135, stops: [{ color: "status-error" }, { color: "status-error" }] },
    success: { type: "linear", angle: 135, stops: [{ color: "status-success" }, { color: "status-success" }] },
    warning: { type: "linear", angle: 135, stops: [{ color: "status-warning" }, { color: "status-warning" }] },
    info: { type: "linear", angle: 135, stops: [{ color: "status-info" }, { color: "status-info" }] },
    progress: { type: "linear", angle: 90, stops: [{ color: "accent" }, { color: "status-info" }] },
    avatar: { type: "linear", angle: 135, stops: [{ color: "accent" }, { color: "primary" }] },
    // flat "gradients": one colour twice. The engine paints a gradient over any plain fill (--bg-gradient wins over
    // --bg), so a control that must NOT wear the family's primary gradient — a sidebar row, a chip — cancels it
    // with one of these. Each is a mode token, so it swaps in dark.
    none: { type: "linear", angle: 0, stops: [{ color: "transparent" }, { color: "transparent" }] },
    surface: { type: "linear", angle: 0, stops: [{ color: "background" }, { color: "background" }] },
    ground: { type: "linear", angle: 0, stops: [{ color: "gray-100" }, { color: "gray-100" }] },
    sage: { type: "linear", angle: 0, stops: [{ color: "color-mix(in srgb, var(--color-status-success) 20%, transparent)" }, { color: "color-mix(in srgb, var(--color-status-success) 20%, transparent)" }] },
    slate: { type: "linear", angle: 0, stops: [{ color: "primary" }, { color: "primary" }] },
    deep: { type: "linear", angle: 0, stops: [{ color: "secondary" }, { color: "secondary" }] },
    track: { type: "linear", angle: 0, stops: [{ color: "gray-250" }, { color: "gray-250" }] },
  },

  typography: {
    fonts: {
      primary: "Helvetica, Arial, sans-serif", secondary: "Hanken Grotesk", quote: "Hanken Grotesk",
      monoPrimary: "ui-monospace, SFMono-Regular, Menlo, monospace", monoSecondary: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    fontSources: {
      "Hanken Grotesk": { type: "google", url: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400..800&display=swap" },
    },
    types: {
      // titles: the display face, bold, tight
      heading1: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 28, fontSizeDesktop: 32, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" },
      heading2: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 24, fontSizeDesktop: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" },
      heading3: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 20, fontSizeDesktop: 21, fontWeight: 700, lineHeight: 1.2, letterSpacing: "0em" },
      heading4: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 16, fontSizeDesktop: 17, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" },
      bodyExtraLarge: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 15, fontSizeDesktop: 16, fontWeight: 400, lineHeight: 1.6 },
      bodyLarge: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 14, fontSizeDesktop: 15, fontWeight: 400, lineHeight: 1.5 },
      body: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 14, fontSizeDesktop: 14, fontWeight: 400, lineHeight: 1.55 },
      bodySmall: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 13, fontSizeDesktop: 13, fontWeight: 400, lineHeight: 1.45 },
      bodyExtraSmall: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 12, fontSizeDesktop: 12, fontWeight: 400, lineHeight: 1.4 },
      // the display face at a medium weight: an option, an entity, an answer
      quoteLarge: { fontFamily: "quote", fontStyle: "normal", fontSizeMobile: 22, fontSizeDesktop: 26, fontWeight: 500, lineHeight: 1.3 },
      quote: { fontFamily: "quote", fontStyle: "normal", fontSizeMobile: 19, fontSizeDesktop: 22, fontWeight: 500, lineHeight: 1.3 },
      quoteSmall: { fontFamily: "quote", fontStyle: "normal", fontSizeMobile: 16, fontSizeDesktop: 17, fontWeight: 500, lineHeight: 1.4 },
      code: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 12, fontSizeDesktop: 12, fontWeight: 400, lineHeight: 1.5 },
      // the figures: the display face — a readiness count, a card's rate, a kpi
      numbersExtraLarge: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 40, fontSizeDesktop: 52, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" },
      numbersLarge: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 28, fontSizeDesktop: 36, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" },
      numbers: { fontFamily: "secondary", fontStyle: "normal", fontSizeMobile: 20, fontSizeDesktop: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" },
      // the pill voice: small, bold
      numbersSmall: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 12, fontSizeDesktop: 12, fontWeight: 700, lineHeight: 1.3 },
      // the overline: mono, tracked, uppercase (transform is set where used)
      numbersExtraSmall: { fontFamily: "monoPrimary", fontStyle: "normal", fontSizeMobile: 10, fontSizeDesktop: 10, fontWeight: 400, lineHeight: 1.4, letterSpacing: "0.1em" },
      // an action's text: a button, a link, the chosen tab
      link: { fontFamily: "primary", fontStyle: "normal", fontSizeMobile: 14, fontSizeDesktop: 14, fontWeight: 700, lineHeight: 1.3 },
    },
  },

  spacing: { unit: 0.8125 },
  radius: { none: "0px", "3xs": "4px", "2xs": "6px", xs: "8px", sm: "10px", md: "12px", lg: "14px", xl: "18px", "2xl": "20px", "3xl": "22px", full: "9999px" },
  effects: {
    // the soft glow: a raised card
    card: [
      { type: "drop-shadow", x: 0, y: 2, blur: 6, color: "accent", opacity: 0.18 },
      { type: "drop-shadow", x: 0, y: 12, blur: 28, spread: -16, color: "secondary", opacity: 0.22 },
    ],
    // the main action: a cool halo and a long shadow; the small ring is the flat version
    halo: [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.14 },
      { type: "drop-shadow", x: 0, y: 16, blur: 34, spread: -10, color: "secondary", opacity: 0.55 },
    ],
    haloHover: [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 5, color: "primary", opacity: 0.24 },
      { type: "drop-shadow", x: 0, y: 18, blur: 38, spread: -10, color: "secondary", opacity: 0.65 },
    ],
    ring: [{ type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.14 }],
    focus: [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.16 },
      { type: "drop-shadow", x: 0, y: 14, blur: 30, spread: -10, color: "secondary", opacity: 0.45 },
    ],
    focusError: [{ type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "status-error", opacity: 0.12 }],
    // a switch on: the soft glow of the fill, no ring
    glowControl: [{ type: "drop-shadow", x: 0, y: 0, blur: 14, color: "primary", opacity: 0.5 }],
    // a chosen dot (1-assessment's option): the ring and the glow of the fill
    glowDot: [
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 4, color: "primary", opacity: 0.16 },
      { type: "drop-shadow", x: 0, y: 0, blur: 18, color: "primary", opacity: 0.5 },
    ],
    glow: [{ type: "drop-shadow", x: 0, y: 0, blur: 18, color: "accent", opacity: 0.45 }],
    check: [{ type: "drop-shadow", x: 0, y: 4, blur: 12, color: "secondary", opacity: 0.4 }],
    raised: [{ type: "drop-shadow", x: 0, y: 2, blur: 8, color: "secondary", opacity: 0.14 }],
    thumb: [{ type: "drop-shadow", x: 0, y: 1, blur: 3, color: "main-black", opacity: 0.15 }],
    sheet: [
      { type: "drop-shadow", x: 0, y: 30, blur: 80, spread: -20, color: "secondary", opacity: 0.5 },
      { type: "drop-shadow", x: 0, y: 0, blur: 0, spread: 6, color: "accent", opacity: 0.14 },
    ],
    // the glass card's shadow; a drawer is not drawn in the target
    drawer: [{ type: "drop-shadow", x: 0, y: 30, blur: 60, spread: -24, color: "secondary", opacity: 0.35 }],
    popover: [{ type: "drop-shadow", x: 0, y: 24, blur: 60, spread: -18, color: "secondary", opacity: 0.45 }],
    tooltip: [{ type: "drop-shadow", x: 0, y: 10, blur: 24, spread: -8, color: "secondary", opacity: 0.5 }],
  },
  transitions: {
    duration: { extraFast: "80ms", fast: "150ms", average: "180ms", slow: "400ms", extraSlow: "600ms" },
    timing: { ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear" },
  },
  borderWidths: { none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "2px", extraThick: "6px" },

  modes: {
    colorScheme: {
      light: {
        background: "main-white",
        foreground: "main-black",
        // brand-1-light ≈ the ghost hover · brand-1-dark ≈ Slate Teal · status-x-light ≈ the pale status fills
        derivation: { grayColorMixPercentage: "8%" },
      },
      // not drawn in the target
      dark: {
        background: "#1A262C",
        foreground: "#ECECEA",
        chroma: { saturationFactor: 0.8, gamma: 1 },
        derivation: { grayColorMixPercentage: "8%" },
      },
    },
  },

  icons: { set: "lucide", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22 }, weight: 1.5 },

  layouts: {
    // the frame is white: regions have no fill of their own; the cards are white boxes with a hairline
    surface: { interior: { background: "background", padding: {}, gap: {} } },
    page: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    // the top bar: white, a line under it
    pageHeader: {
      height: "72px", sm: { height: "56px" }, md: { height: "72px" }, lg: { height: "88px" },
      surface: { interior: { background: "background", foreground: "smart-fb", padding: { x: "2xl" } }, boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" } } } },
    },
    secondPageHeader: {
      height: "72px", sm: { height: "56px" }, md: { height: "72px" }, lg: { height: "88px" },
      surface: { interior: { background: "background", foreground: "smart-fb", padding: { x: "2xl" } }, boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" } } } },
    },
    // a toolbar strip: white, a thin rule below
    mainHeader: {
      height: "56px", sm: { height: "48px" }, md: { height: "56px" }, lg: { height: "64px" },
      surface: { boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" } } }, interior: { padding: { x: "xl" }, background: "background", foreground: "smart-fb" } },
    },
    secondMainHeader: {
      height: "56px", sm: { height: "48px" }, md: { height: "56px" }, lg: { height: "64px" },
      surface: { boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" } } }, interior: { padding: { x: "xl" }, background: "background", foreground: "smart-fb" } },
    },
    // the rail: an off-white column with a line on its right
    pageLeftSidebar: {
      width: "236px", sm: { width: "200px" }, md: { width: "236px" }, lg: { width: "280px" },
      surface: { interior: { background: "gray-50" }, boundary: { border: { right: { width: "thin", style: "solid", color: "gray-150" } } } },
    },
    pageRightSidebar: {
      width: "380px", sm: { width: "300px" }, md: { width: "380px" }, lg: { width: "440px" },
      surface: { boundary: { border: { left: { width: "thin", style: "solid", color: "gray-150" } } } },
    },
    mainRightSidebar: {
      width: "380px", sm: { width: "300px" }, md: { width: "380px" }, lg: { width: "440px" },
      surface: { interior: { background: "background" }, boundary: { border: { left: { width: "thin", style: "solid", color: "gray-150" } } } },
    },
    // emphasis — a region's shade. BORRO draws no brand band: primary = the off-white rail (the shell's nav),
    // secondary = the light panel.
    emphasis: {
      primary: { surface: { interior: { background: "gray-50", foreground: "smart-fb" } } },
      secondary: { surface: { interior: { background: "gray-100", foreground: "smart-fb" } } },
    },
    // xs is the auth container: the sign-in, registration and recovery card spans it
    mainContainer: { xs: { maxWidth: "448px" }, sm: { maxWidth: "640px" }, md: { maxWidth: "940px" }, lg: { maxWidth: "1440px" } },
    dialog: { sm: { maxWidth: "460px" }, md: { maxWidth: "640px" }, lg: { maxWidth: "940px" } },
    sheet: { sm: { size: "360px" }, md: { size: "460px" }, lg: { size: "560px" } },
    section: { surface: { interior: { gap: { all: "lg" } } } },
    // the body is the white frame; the gutter is 48
    mainBody: { surface: { interior: { background: "background", padding: { x: "2xl", y: "xl" } } } },
    scrollArea: { scrollbar: { thumbColor: "gray-200", trackColor: "transparent", width: "6px" } },
  },

  families: {
    // THE surface: a white box, a hairline, radius 18, no shadow until raised
    surfaceContainer: {
      // a surface's scale steps its text; md is the surface as defined. The family's size rule is emitted with
      // `:where()`, so it ranks like an element's base rule and cannot move an inset the element sets itself: the
      // surfaces that carry an inset (card, tile, panel, alert, empty state) step it in their own `sizes` below.
      sizes: {
        xs: { partialSurface: { interior: { gap: { all: "xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } } },
        sm: { partialSurface: { interior: { gap: { all: "sm" } }, defaultTypography: { typographyType: "bodySmall" } } },
        lg: { partialSurface: { interior: { gap: { all: "lg" } }, defaultTypography: { typographyType: "bodyLarge" } } },
        xl: { partialSurface: { interior: { gap: { all: "xl" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
      },
      interior: { background: "background", foreground: "smart-fb", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "xl" } },
      defaultTypography: { typographyType: "body" },
      transition: { duration: "fast", timing: "easeOut" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 }, cursor: "not-allowed" } },
        // status on a surface: the pale fill (12%), its line, the dark ink of the colour. The tint is the fill itself:
        // the fill formula mixes 20% of the tint into the background, and a tint of the colour would darken the fill.
        { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
        { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
        { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
        { where: { status: "info" }, partialSurface: { tint: "status-info", interior: { background: "background", foreground: "status-info" }, boundary: { border: { color: "transparent" } } } },
        // hero: the inverse card, deep slate
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "secondary" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-700" }, boundary: { border: { color: "transparent" } } } },
      ],
    },

    field: {
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } } },
        "2xs": { partialSurface: { interior: { padding: { x: "sm", y: "2xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } } },
        xs: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } } },
        sm: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "body" } } },
        md: { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "body" } } },
        lg: { partialSurface: { interior: { padding: { x: "lg", y: "lg" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
        xl: { partialSurface: { interior: { padding: { x: "xl", y: "lg" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
        "2xl": { partialSurface: { interior: { padding: { x: "xl", y: "lg" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
        "3xl": { partialSurface: { interior: { padding: { x: "xl", y: "lg" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
      },
      surface: {
        // white, the input line, radius 12; focus turns the line slate and lights the ring. A status colours the line
        // and the ring, not the fill (no tint: the target's error field stays white).
        interior: { background: "background", foreground: "smart-fb", padding: { x: "lg", y: "md" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-250" }, radius: { all: "md" }, outline: { width: "none", style: "none" } },
        cursor: "text",
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "gray-400" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "primary" }, effect: "focus", outline: { width: "none", style: "none" } } } },
          { where: { status: "error" }, partialSurface: { tint: "background", boundary: { border: { color: "status-error" }, effect: "focusError" } } },
          { where: { status: "success" }, partialSurface: { tint: "background", boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "background", boundary: { border: { color: "status-warning" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { background: "gray-100", foreground: "gray-400", opacity: 1 }, boundary: { border: { color: "gray-200" } }, cursor: "not-allowed" } },
        ],
      },
      placeholderColor: "gray-500",
      placeholderOpacity: 1,
      caretColor: "primary",
    },

    elevatedOverlay: {
      surface: { interior: { background: "background" }, boundary: { effect: "sheet", border: { width: "none" }, radius: { all: "xl" } } },
      // scrim: slate at 40% with an 8px blur
      overlay: { scrimColor: "secondary", scrimOpacity: 0.4, scrimBlur: "xs" },
    },

    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { y: "md" } },
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-150" } } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
          { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background" } } },
        ],
      },
      // no `cell`: it compiles to `[list] > * > *` — every grandchild of a list — and in a
      // menu (list--menu > menu-item > icon · label · badge) it padded the icon to zero
      // width and pushed the label. Row padding is the item's; part spacing is its gap.
      // `separator` compiles to a fill on `li:not(:last-child)` — every row but the last. It is written transparent:
      // the row's own bottom rule is the separator, and the tool's bundled theme would otherwise paint the rows gray.
      // That rule outranks a row's own hover, so the rows' hover and selection live in `contextual.list` below.
      separator: { surface: { interior: { background: "transparent" } } },
    },

    interactiveControlGroup: {
      surface: { interior: { background: "transparent", gap: { all: "xs" }, padding: {} }, boundary: { border: { width: "none" } } },
    },

    interactiveControl: {
      sizes: {
        "3xs": { partialSurface: { interior: { padding: { x: "xs", y: "3xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } }, icon: { size: "3xs" } },
        "2xs": { partialSurface: { interior: { padding: { x: "sm", y: "2xs" } }, defaultTypography: { typographyType: "bodyExtraSmall" } }, icon: { size: "2xs" } },
        xs: { partialSurface: { interior: { padding: { x: "md", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } }, icon: { size: "xs" } },
        // small 13 / 9×18 · default 14 / 13×20 (the target's 13×26 clips a label in a narrow card) · large 15 / 16×34
        sm: { partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } }, icon: { size: "xs" } },
        md: { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "sm" } },
        lg: { partialSurface: { interior: { padding: { x: "2xl", y: "lg" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "md" } },
        xl: { partialSurface: { interior: { padding: { x: "2xl", y: "lg" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "lg" } },
        "2xl": { partialSurface: { interior: { padding: { x: "2xl", y: "lg" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "lg" } },
        "3xl": { partialSurface: { interior: { padding: { x: "2xl", y: "lg" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "lg" } },
      },
      surface: {
        // the plain control: a white pill, the input line, slate text — the target's "Keep property"
        interior: { background: "background", foreground: "primary", padding: { x: "lg", y: "md" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-250" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "link" },
        cursor: "pointer",
        combined: [
          // emphasis = the pattern; tint = the colour (status re-tints below). A status tints with its PALE colour:
          // the fill formula mixes 20% of the tint into the fill, and the full colour would turn an outline button pink.
          // hero: the screen's one main action — the slate gradient with its halo. primary: the same fill, the small ring.
          { where: { emphasis: "hero" }, partialSurface: { tint: "primary", interior: { background: "gradient-primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "halo" } } },
          { where: { emphasis: "primary" }, partialSurface: { tint: "primary", interior: { background: "gradient-primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "ring" } } },
          // secondary: outline on white
          { where: { emphasis: "secondary" }, partialSurface: { interior: { background: "background", foreground: "primary" }, boundary: { border: { color: "primary" } } } },
          // tertiary: ghost, slate text · quiet: ghost, gray text
          { where: { emphasis: "tertiary" }, partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-500" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { foreground: "status-success" }, boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { foreground: "status-warning" }, boundary: { border: { color: "status-warning" } } } },
          { where: { status: "info" }, partialSurface: { tint: "status-info", interior: { foreground: "status-info" }, boundary: { border: { color: "status-info" } } } },
          // filled + status: the fill takes the status colour (a gradient has to be replaced by a gradient)
          { where: { emphasis: "primary", status: "error" }, partialSurface: { interior: { background: "gradient-error", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "destructive" }, partialSurface: { interior: { background: "gradient-error", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "success" }, partialSurface: { interior: { background: "gradient-success", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "warning" }, partialSurface: { interior: { background: "gradient-warning", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "info" }, partialSurface: { interior: { background: "gradient-info", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "hero", status: "error" }, partialSurface: { interior: { background: "gradient-error", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "hero", status: "destructive" }, partialSurface: { interior: { background: "gradient-error", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          // states
          { where: { state: "hover" }, partialSurface: { interior: { background: "background" }, boundary: { border: { color: "primary" } } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { interior: { background: "gradient-primaryHover", foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "ring" } } },
          { where: { emphasis: "hero", state: "hover" }, partialSurface: { interior: { background: "gradient-primaryHover", foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "haloHover" } } },
          { where: { emphasis: "secondary", state: "hover" }, partialSurface: { interior: { background: "background", foreground: "secondary" }, boundary: { border: { color: "secondary" }, effect: "ring" } } },
          { where: { emphasis: "tertiary", state: "hover" }, partialSurface: { tint: "primary", interior: { background: "background", foreground: "secondary" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet", state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
          // selected: the chosen segment — Slate Teal, white text
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "primary", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          // selected + status: keep the status colour, don't fall back to the generic selection tint
          { where: { state: "selected", status: "error" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { state: "selected", status: "destructive" }, partialSurface: { interior: { background: "status-error", foreground: "smart-fb" }, boundary: { border: { color: "status-error" } } } },
          { where: { state: "selected", status: "success" }, partialSurface: { interior: { background: "status-success", foreground: "smart-fb" }, boundary: { border: { color: "status-success" } } } },
          { where: { state: "selected", status: "warning" }, partialSurface: { interior: { background: "status-warning", foreground: "smart-fb" }, boundary: { border: { color: "status-warning" } } } },
          { where: { state: "selected", status: "info" }, partialSurface: { interior: { background: "status-info", foreground: "smart-fb" }, boundary: { border: { color: "status-info" } } } },
          // a focus ring is not drawn in the target: the field's ring, offset
          { where: { state: "focus" }, partialSurface: { boundary: { outline: { width: "thick", style: "solid", color: "accent", offset: "2px" } } } },
          // disabled: a flat gray pill, no shadow
          { where: { state: "disabled" }, partialSurface: { interior: { background: "gray-100", foreground: "gray-400", opacity: 1 }, boundary: { border: { color: "transparent" }, effect: "none" }, cursor: "not-allowed" } },
          { where: { state: "loading" }, partialSurface: { cursor: "progress", interior: { opacity: 0.7 } } },
        ],
      },
    },

    shape: { surface: { interior: { foreground: "currentColor", background: "transparent", padding: {} }, boundary: { border: { width: "none" } } } },
    media: { surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } } }, objectFit: "cover" },
  },

  elements: {
    // ── the overline voice: mono, small, tracked, uppercase, gray ──
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: {} },
        // The air under a label (the target's label-to-field gap is 6) is a 13px bottom margin with the text slid
        // 6.5px down into it: above a field that reads as 6.5px of air; in a row that centres its items (a checkbox and
        // its label, a label and an "Optional" note) the slide puts the text back on the row's centre line, which a
        // plain margin would pull it off.
        boundary: { border: { width: "none" }, margin: { bottom: "md" } },
        dimensionPosition: { translateY: "6.5px" },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
      },
    },
    fieldDescription: { surface: { interior: { background: "transparent", foreground: "gray-500", padding: {} }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "bodySmall" } } },
    // a field's message is a line of text in the status ink — never the status surface's pale fill — with a little
    // air above it
    fieldMessage: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: { all: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none", margin: { top: "sm" } },
        defaultTypography: { typographyType: "bodyExtraSmall" },
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "transparent", interior: { background: "transparent", foreground: "status-error" }, boundary: { border: { width: "none" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "transparent", interior: { background: "transparent", foreground: "status-error" }, boundary: { border: { width: "none" } } } },
          { where: { status: "success" }, partialSurface: { tint: "transparent", interior: { background: "transparent", foreground: "status-success" }, boundary: { border: { width: "none" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "transparent", interior: { background: "transparent", foreground: "status-warning" }, boundary: { border: { width: "none" } } } },
          { where: { status: "info" }, partialSurface: { tint: "transparent", interior: { background: "transparent", foreground: "status-info" }, boundary: { border: { width: "none" } } } },
        ],
      },
    },
    // ── table: mono overline headers, a hairline under them, row rules; zebra is optional in the target ──
    tableHeaderCell: {
      interior: { padding: { x: "md", y: "sm" }, foreground: "gray-500", background: "transparent" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } } },
      defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left" },
    },
    tableRoot: { boundary: { border: { width: "none" }, radius: { all: "none" } }, interior: { background: "transparent", padding: {} } },
    tableRow: {
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
      interior: { background: "transparent" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
        { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background" } } },
      ],
    },
    tableCell: { interior: { padding: { x: "md", y: "md" } }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "body" } },
    // the footer's cell ("Showing 3 of 3"): support text, with air above the last row's rule
    tableFooterCell: { interior: { padding: { x: "md", top: "md", bottom: "sm" }, foreground: "gray-500", background: "transparent" }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "bodySmall" } },

    // ── plain containers: the card is THE surface; content regions are transparent inside it ──
    // a card is flat; hovered it lifts: the haze halo, the line cools to haze blue
    card: {
      sizes: {
        xs: { partialSurface: { interior: { padding: { all: "sm" } }, boundary: { radius: { all: "sm" } } } },
        sm: { partialSurface: { interior: { padding: { all: "md" } }, boundary: { radius: { all: "lg" } } } },
        lg: { partialSurface: { interior: { padding: { all: "2xl" } } } },
        xl: { partialSurface: { interior: { padding: { all: "3xl" } }, boundary: { radius: { all: "3xl" } } } },
      },
      interior: { padding: { all: "xl" }, gap: { all: "md" } },
      boundary: { effect: "none" },
      combined: [
        { where: { state: "hover" }, partialSurface: { boundary: { effect: "card", border: { color: "accent" } } } },
      ],
    },
    header: {
      interior: { background: "transparent", padding: { x: "xl", y: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } } },
      defaultTypography: { typographyType: "heading3" },
    },
    content: { interior: { background: "transparent", padding: { x: "xl", y: "lg" } }, boundary: { border: { width: "none" } } },
    footer: {
      interior: { background: "transparent", padding: { x: "xl", y: "lg" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-150" } } },
    },
    panel: {
      sizes: {
        sm: { partialSurface: { interior: { padding: { all: "md" } } } },
        lg: { partialSurface: { interior: { padding: { all: "2xl" } } } },
      },
      interior: { padding: { all: "xl" } },
    },
    // ═══════════════════════════════════════════════════════════════════════
    // TILE — the cell of a Stack of tiles (pattern: card-with-tiles)
    // BORRO: a kpi cell — white, a soft line, radius 14, mono key over a display figure.
    // hero = the deep slate inverse · quiet = the off-white, no line.
    // ═══════════════════════════════════════════════════════════════════════
    tile: {
      sizes: {
        sm: { partialSurface: { interior: { padding: { all: "sm" } } } },
        lg: { partialSurface: { interior: { padding: { all: "lg" } } } },
      },
      interior: { background: "background", foreground: "smart-fb", padding: { all: "md" }, gap: { all: "xs" } },
      boundary: { border: { width: "thin", style: "solid", color: "gray-150" }, radius: { all: "lg" } },
      combined: [
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "secondary" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "gray-50" }, boundary: { border: { color: "transparent" } } } },
      ],
    },
    // the separator: the engine never emits the element's `height`, so a filled box is 0px tall and invisible. The
    // line is a border instead: the top edge draws a horizontal separator (its width is its parent's), the left edge
    // a vertical one when its row stretches it. In a row that centres its items, a vertical separator still has no
    // height — that needs the engine to emit `height`/`width`.
    separator: {
      surface: {
        interior: { background: "transparent", padding: {} },
        boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-150" }, left: { width: "thin", style: "solid", color: "gray-150" } }, radius: { all: "none" } },
      },
      height: "1px",
    },
    emptyState: {
      sizes: {
        sm: { partialSurface: { interior: { padding: { all: "lg" } } } },
        lg: { partialSurface: { interior: { padding: { all: "3xl" } } } },
      },
      surface: {
        interior: { background: "transparent", foreground: "gray-700", padding: { all: "2xl" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "dashed", color: "gray-300" } },
      },
    },
    // an alert: the status surface at radius 14, an icon and two lines
    alert: {
      sizes: {
        sm: { partialSurface: { interior: { padding: { all: "md" }, gap: { all: "sm" } } } },
        lg: { partialSurface: { interior: { padding: { all: "xl" }, gap: { all: "lg" } } } },
      },
      surface: { interior: { padding: { x: "lg", y: "lg" }, gap: { all: "md" } }, boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } } },
    },

    // ── badge: the status pill — outline when quiet metadata, the pale fill by status, deep slate when hero ──
    badge: {
      surface: {
        interior: { background: "transparent", foreground: "gray-700", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-250" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "numbersSmall" },
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "info" }, partialSurface: { tint: "status-info", interior: { background: "background", foreground: "status-info" }, boundary: { border: { color: "transparent" } } } },
          // hero: the "missing" pill — deep slate, white text
          { where: { emphasis: "hero" }, partialSurface: { interior: { background: "secondary", foreground: "smart-fb" }, boundary: { border: { color: "secondary" } } } },
          // emphasis="primary" is the component default — the outline; a status on it still shows its colour
          { where: { emphasis: "primary" }, partialSurface: { interior: { background: "transparent", foreground: "gray-700" }, boundary: { border: { color: "gray-250" } } } },
          { where: { emphasis: "primary", status: "error" }, partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "destructive" }, partialSurface: { tint: "status-error", interior: { background: "background", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "success" }, partialSurface: { tint: "status-success", interior: { background: "background", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "background", foreground: "status-warning" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "info" }, partialSurface: { tint: "status-info", interior: { background: "background", foreground: "status-info" }, boundary: { border: { color: "transparent" } } } },
          // quiet: the "+N" counter — the light fill
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "gray-100", foreground: "gray-700" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
      sizes: {
        // the dot: a disc of the badge's own ink (the status ink, or gray), no line
        "3xs": { partialSurface: { interior: { padding: { all: "none" }, background: "currentColor" }, boundary: { border: { width: "none" } }, dimensionPosition: { width: "8px", height: "8px" } } },
        "2xs": { partialSurface: { interior: { padding: { x: "xs", y: "none" } }, defaultTypography: { typographyType: "numbersExtraSmall" } } },
        xs: { partialSurface: { interior: { padding: { x: "sm", y: "3xs" } }, defaultTypography: { typographyType: "numbersExtraSmall" } } },
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } } },
        md: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } } },
        lg: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "link" } } },
        xl: { partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "link" } } },
      },
    },
    // ── chip: the applied filter — sage fill, the sage line, radius full ──
    chip: {
      surface: { tint: "status-success",
        interior: { background: "background", foreground: "status-success", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "content-lime-standard" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "bodyExtraSmall", textTransform: "none" },
        combined: [
          // emphasis="primary" is the component default: the applied filter, sage. The entries cancel the control
          // family's fills (tint and alpha reset). secondary = the outline tag · tertiary = the condition chip, radius 9
          // · quiet = the "+N" counter, the light fill.
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "gradient-sage", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "content-lime-standard" }, effect: "none" } } },
          { where: { emphasis: "hero" }, partialSurface: { tint: "transparent", interior: { background: "gradient-deep", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "secondary" }, effect: "none" } } },
          { where: { emphasis: "secondary" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-700" }, boundary: { border: { color: "gray-250" } } } },
          { where: { emphasis: "tertiary" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "gray-700" }, boundary: { border: { color: "gray-200" }, radius: { all: "xs" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { tint: "transparent", interior: { background: "gray-100", backgroundAlpha: 1, foreground: "gray-500" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "primary" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "primary", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { interior: { background: "gradient-slate", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
          { where: { emphasis: "hero", state: "selected" }, partialSurface: { interior: { background: "gradient-slate", foreground: "smart-fb" }, boundary: { border: { color: "primary" } } } },
        ],
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } } } },
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } } } },
        md: { partialSurface: { interior: { padding: { x: "md", y: "sm" } } } },
        lg: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "bodySmall" } } },
        xl: { partialSurface: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "body" } } },
      },
    },
    // ── avatar: round, the haze-to-teal gradient, initials in the display face ──
    avatar: {
      surface: {
        interior: { background: "gradient-avatar", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { radius: { all: "full" }, border: { width: "none" } },
        defaultTypography: { typographyType: "heading4" },
      },
      // A fixed square per scale; the initials step up with it.
      sizes: {
        "2xs": { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "20px", height: "20px" }, defaultTypography: { typographyType: "numbersSmall" } } },
        xs: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "24px", height: "24px" }, defaultTypography: { typographyType: "numbersSmall" } } },
        sm: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "34px", height: "34px" }, defaultTypography: { typographyType: "link" } } },
        md: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "40px", height: "40px" }, defaultTypography: { typographyType: "heading4" } } },
        lg: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "48px", height: "48px" }, defaultTypography: { typographyType: "heading3" } } },
        xl: { partialSurface: { interior: { padding: { all: "none" } }, dimensionPosition: { width: "64px", height: "64px" }, defaultTypography: { typographyType: "heading2" } } },
      },
    },
    icon: {},
    // ── progress: a pill track, the haze fill with its glow ──
    progress: { surface: { interior: { background: "gray-150", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "full" } }, dimensionPosition: { height: "6px" } } },
    progressInner: { interior: { background: "gradient-progress" }, boundary: { radius: { all: "full" }, effect: "glow" } },
    skeleton: { surface: { interior: { background: "gray-100" }, boundary: { border: { width: "none" }, radius: { all: "xs" } } } },
    spinner: { surface: { interior: { foreground: "primary", background: "transparent" }, boundary: { border: { width: "none" } } } },

    // ── controls ──
    // a button centres its content, so one stretched to its column keeps the label in the middle (only the button:
    // an accordion trigger, a menu row, a tab keep their own layout)
    button: { surface: { interior: { gap: { all: "sm" }, childAlign: { horizontal: "center", vertical: "center" } }, defaultTypography: { typographyType: "link" } } },
    // The checkbox, the radio and the switch come with emphasis="primary" (the component default), so the control
    // family paints them with the primary gradient and its ring. Their entries below cancel that (a flat gradient,
    // no effect) and draw the target's own: a white box until chosen.
    // the toggle: 45 × 26, a gray pill off, the slate gradient with its glow on; a white 20px thumb inset 3px, which
    // the component slides by its width − 2px (45 = 3 + 20 + 18 + 4)
    switch: {
      track: {
        dimensionPosition: { width: "45px", height: "26px" },
        interior: { background: "gradient-track", padding: { all: "xs" } },
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "none" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "gradient-track", backgroundAlpha: 1 }, boundary: { border: { color: "transparent" }, effect: "none" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-primary" }, boundary: { effect: "glowControl" } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "gradient-primary", backgroundAlpha: 1 }, boundary: { border: { color: "transparent" }, effect: "glowControl" } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { interior: { background: "gradient-track" }, boundary: { border: { color: "transparent" }, effect: "none" } } },
          { where: { emphasis: "primary", state: "disabled" }, partialSurface: { interior: { background: "gradient-track", opacity: 0.45 }, boundary: { effect: "none" } } },
        ],
      },
      thumb: {
        dimensionPosition: { width: "20px", height: "20px", translateX: "0px", translateY: "0px" },
        interior: { background: "background", padding: { all: "none" } },
        boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "thumb" },
        // no offset of its own when on either: the slide is the component's
        combined: [{ where: { state: "selected" }, partialSurface: { dimensionPosition: { translateX: "0px", translateY: "0px" } } }],
      },
    },
    switchInner: { interior: { background: "background", padding: { all: "none" } }, boundary: { radius: { all: "full" }, border: { width: "none" }, effect: "thumb" } },
    // the check: 20px, radius 6; checked it takes the gradient and a short shadow
    checkbox: {
      sizes: {
        xs: { partialSurface: { dimensionPosition: { width: "14px", height: "14px" }, boundary: { radius: { all: "3xs" } } } },
        sm: { partialSurface: { dimensionPosition: { width: "16px", height: "16px" }, boundary: { radius: { all: "3xs" } } } },
        md: { partialSurface: { dimensionPosition: { width: "20px", height: "20px" } } },
        lg: { partialSurface: { dimensionPosition: { width: "24px", height: "24px" } } },
        xl: { partialSurface: { dimensionPosition: { width: "28px", height: "28px" }, boundary: { radius: { all: "xs" } } } },
      },
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "2xs" }, effect: "none" },
        dimensionPosition: { width: "20px", height: "20px" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "gradient-surface", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "gray-300" }, effect: "none" } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { interior: { background: "gradient-surface" }, boundary: { border: { color: "primary" }, effect: "none" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "check" } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "gradient-primary", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "check" } } },
          { where: { emphasis: "primary", state: "disabled" }, partialSurface: { interior: { background: "gradient-ground", foreground: "smart-fb", opacity: 1 }, boundary: { border: { color: "gray-200" }, effect: "none" } } },
        ],
      },
    },
    // the check mark: no box of its own
    checkboxInner: { interior: { background: "transparent", foreground: "inherit", padding: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" } },
    // the radio: 1-assessment's option dot — a 22px circle with a thin line; chosen, the gradient disc with its ring
    // and glow. Inside a group the item never carries state="selected" (the component reads `checked`), so there the
    // mark is the small slate dot the component paints with the inner's foreground.
    radio: {
      sizes: {
        xs: { partialSurface: { dimensionPosition: { width: "16px", height: "16px" } } },
        sm: { partialSurface: { dimensionPosition: { width: "18px", height: "18px" } } },
        md: { partialSurface: { dimensionPosition: { width: "22px", height: "22px" } } },
        lg: { partialSurface: { dimensionPosition: { width: "26px", height: "26px" } } },
        xl: { partialSurface: { dimensionPosition: { width: "30px", height: "30px" } } },
      },
      surface: {
        interior: { background: "background", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-250" }, radius: { all: "full" }, effect: "none" },
        dimensionPosition: { width: "22px", height: "22px" },
        combined: [
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "gradient-surface", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "gray-250" }, effect: "none" } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { interior: { background: "gradient-surface" }, boundary: { border: { color: "primary" }, effect: "none" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "gradient-primary", foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "glowDot" } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "gradient-primary", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "glowDot" } } },
          { where: { emphasis: "primary", state: "disabled" }, partialSurface: { interior: { background: "gradient-ground", opacity: 1 }, boundary: { border: { color: "gray-200" }, effect: "none" } } },
        ],
      },
    },
    radioInner: { interior: { background: "transparent", foreground: "primary", padding: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "full" }, effect: "none" } },
    // ── choice group (a row of toggles, a segmented choice): a little more air between the options than a button group ──
    choiceGroup: { surface: { interior: { background: "transparent", gap: { all: "sm" }, padding: {} }, boundary: { border: { width: "none" } } } },
    // ── grid cells: a swatch, an icon tile, a calendar day. The component sizes the box; the control family's padding
    // and line would squeeze the glyph or draw a circle round it. Quiet until hovered; chosen, the slate fill. ──
    swatch: {
      surface: {
        interior: { background: "transparent", padding: { all: "none" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "xs" }, effect: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "primary" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1 }, boundary: { border: { width: "thick", color: "primary" }, effect: "ring" } } },
        ],
      },
    },
    iconTile: {
      surface: {
        interior: { background: "transparent", foreground: "gray-700", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" }, effect: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "gradient-primary", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "none" } } },
        ],
      },
    },
    calendar: { interior: { padding: { all: "md" }, gap: { all: "sm" } }, boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" } },
    calendarDay: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" }, effect: "none" },
        dimensionPosition: { width: "36px", height: "36px" },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "gradient-primary", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "none" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { background: "transparent", foreground: "gray-400", opacity: 1 }, boundary: { border: { color: "transparent" } } } },
        ],
      },
    },
    // ── breadcrumb: plain text — gray crumbs, the current one bold ink, a faint separator ──
    breadcrumbItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: { all: "none" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "transparent", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "none" }, defaultTypography: { typographyType: "link" } } },
        ],
      },
    },
    breadcrumbSeparator: { surface: { interior: { background: "transparent", foreground: "gray-300", padding: { x: "xs" } }, boundary: { border: { width: "none" } } } },
    // ── tree view: quiet rows at radius 10; the current one takes the haze tint. The list family's row rule gives
    // every `li` a bottom rule and a vertical inset — in a tree the rows nest, so that drew two lines under a group's
    // last row and spread the rows out; the tree's own `row` cancels it. ──
    treeView: {
      surface: { interior: { gap: { all: "none" }, padding: {} }, boundary: { border: { width: "none" } } },
      row: { interior: { padding: { all: "none" } }, boundary: { border: { width: "none", bottom: { width: "none", style: "none", color: "transparent" } } } },
    },
    treeViewItem: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "sm", y: "xs" }, gap: { all: "sm" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" }, effect: "none" },
        // one size: the elements table gives `treeViewItem` no scale, and a row reads the control family's text
        // (link, bold) rather than the tree's — so the tree's own scale could not reach it either
        defaultTypography: { typographyType: "body" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background", backgroundAlpha: 1, foreground: "primary" }, boundary: { border: { color: "transparent" }, effect: "none" } } },
        ],
      },
    },
    treeViewGroup: { interior: { background: "transparent", padding: { left: "md" }, gap: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } },
    // ── tabs: a pill track; the chosen tab is white and raised; the panel breathes under it ──
    tabPanel: { interior: { background: "transparent", padding: { x: "none", y: "md" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } },
    tabBar: { surface: { interior: { background: "gray-100", padding: { all: "xs" }, gap: { all: "xs" } }, boundary: { border: { width: "none", bottom: { width: "none", style: "none", color: "transparent" } }, radius: { all: "full" } } } },
    tabTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: { x: "lg", y: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "none", style: "none", color: "transparent" } }, radius: { all: "full" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "background", foreground: "smart-fb" }, boundary: { border: { color: "transparent", bottom: { color: "transparent" } }, effect: "raised" } } },
        ],
      },
    },
    // ═══════════════════════════════════════════════════════════════════════
    // SIDEBAR — the rail (control-group--sidebar) and its items (control--sidebar-item)
    // BORRO's sidebar variant: an off-white rail; calm rows at radius 10; the current
    // row is a white card with a hairline, in bold. Main nav (emphasis="primary") looks
    // the same: the entries exist only to cancel the control family's primary fill.
    // ═══════════════════════════════════════════════════════════════════════
    sidebar: { widthExpanded: "236px", widthCollapsed: "64px", surface: {
      interior: { background: "gray-50", padding: { y: "xl" }, gap: { all: "xs" } },
      boundary: { border: { right: { width: "thin", style: "solid", color: "gray-150" } }, radius: { all: "none" } },
    } },
    sidebarItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-700", padding: { x: "md", y: "sm" }, gap: { all: "sm" }, childAlign: { horizontal: "start", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "transparent", left: { width: "thin", style: "solid", color: "transparent" } }, radius: { all: "sm" } },
        defaultTypography: { typographyType: "body" },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "background", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "gray-200", left: { color: "gray-200" } }, effect: "none" }, defaultTypography: { typographyType: "link" } } },
          // the family's primary is a gradient: only the flat gradients cancel it
          { where: { emphasis: "primary" }, partialSurface: { tint: "transparent", interior: { background: "gradient-none", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "none" } } },
          { where: { emphasis: "primary", state: "hover" }, partialSurface: { tint: "transparent", interior: { background: "gradient-ground", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "transparent" }, effect: "none" } } },
          { where: { emphasis: "primary", state: "selected" }, partialSurface: { tint: "transparent", interior: { background: "gradient-surface", backgroundAlpha: 1, foreground: "smart-fb" }, boundary: { border: { color: "gray-200", left: { color: "gray-200" } }, effect: "none" }, defaultTypography: { typographyType: "link" } } },
        ],
      },
    },
    // ── lists and menus ──
    list: { surface: { interior: { gap: { all: "none" } } } },
    // ── list draggable: a row is a soft box at radius 14; the drag shows a dashed ghost, a slate line, a slate outline ──
    listDraggable: { surface: { interior: { gap: { all: "sm" } } } },
    listDraggableGroup: { interior: { background: "transparent", padding: { left: "xl" }, gap: { all: "sm" } }, boundary: { border: { width: "none" } } },
    listDraggableRow: {
      surface: {
        interior: { background: "gray-50", foreground: "smart-fb", padding: { x: "lg", y: "lg" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "accent" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background" }, boundary: { border: { color: "primary" } } } },
        ],
      },
    },
    listDraggableHandle: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "xs" } },
        cursor: "grab",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "active" }, partialSurface: { interior: { foreground: "primary" }, cursor: "grabbing" } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listDraggableGhost: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "lg" } } },
    listDraggableOverlay: { surface: { interior: { background: "background" }, boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "lg" } } } },
    listDraggableDropLine: { surface: { interior: { background: "primary", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "full" } }, dimensionPosition: { height: "3px" } } },
    listDraggableDropInto: { surface: { interior: { background: "transparent", padding: {} }, boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "lg" } } } },
    // ── list tree: a row is plain until hovered or chosen; the connector lines are hairlines ──
    listTree: { surface: { interior: { gap: { all: "none" } } } },
    listTreeRow: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "sm", y: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "xs" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background" } } },
        ],
      },
    },
    listTreeToggle: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "xs" } },
        cursor: "pointer",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listTreeLine: { surface: { interior: { background: "gray-250", padding: {} }, boundary: { border: { width: "none" } } } },
    listTreeHandle: {
      surface: {
        interior: { background: "transparent", foreground: "gray-400", padding: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "xs" } },
        cursor: "grab",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { foreground: "gray-700" } } },
          { where: { state: "active" }, partialSurface: { interior: { foreground: "primary" }, cursor: "grabbing" } },
          { where: { state: "focus" }, partialSurface: { interior: { foreground: "primary" } } },
        ],
      },
    },
    listTreeGhost: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "thin", style: "dashed", color: "gray-300" }, radius: { all: "sm" } } },
    listTreeOverlay: { surface: { interior: { background: "background" }, boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "sm" } } } },
    listTreeDropLine: { surface: { interior: { background: "primary", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "full" } }, dimensionPosition: { height: "3px" } } },
    listTreeDropInto: { surface: { interior: { background: "transparent", padding: {} }, boundary: { border: { width: "thin", style: "solid", color: "primary" }, radius: { all: "sm" } } } },
    // a row: a rule under it; hovered it warms to the off-white; chosen it takes the haze tint. A row with a status
    // stays quiet — the badge or the icon inside carries the colour; a whole tinted row would shout.
    listItem: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "md" }, gap: { all: "md" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, radius: { all: "none" } },
        combined: [
          { where: { status: "error" }, partialSurface: { tint: "background", interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "gray-150" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "background", interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "gray-150" } } } },
          { where: { status: "success" }, partialSurface: { tint: "background", interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "gray-150" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "background", interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "gray-150" } } } },
          { where: { status: "info" }, partialSurface: { tint: "background", interior: { background: "transparent", foreground: "smart-fb" }, boundary: { border: { color: "gray-150" } } } },
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" }, boundary: { border: { color: "gray-150" } } } },
          { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background", foreground: "primary" }, boundary: { border: { color: "gray-150" } } } },
        ],
      },
    },
    // ── menu (the command palette, a dropdown's rows): a quiet column. The group headings carry no element, so they
    // inherit the menu's own text: small and gray; a row restates its ink. A row is full width, so rows stack. ──
    menu: {
      surface: {
        interior: { background: "background", foreground: "gray-500", padding: { all: "sm" }, gap: { all: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
      },
    },
    menuItem: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        // 6.5px above and below each row: the group headings carry no element, so this is the only air the theme can
        // put around them (the row before gives them their top, the row after their bottom)
        boundary: { border: { width: "none" }, radius: { all: "sm" }, effect: "none", margin: { y: "sm" } },
        dimensionPosition: { width: "100%" },
        defaultTypography: { typographyType: "body", textTransform: "none" },
        cursor: "pointer",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-100", foreground: "smart-fb" } } },
          { where: { state: "selected" }, partialSurface: { tint: "primary", interior: { background: "background", foreground: "secondary" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
        ],
      },
    },
    // ── accordion: no boxes — a rule above the list and one under each section; the title has room to breathe ──
    accordion: { surface: { interior: { gap: { all: "none" }, padding: {} }, boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-200" } }, radius: { all: "none" }, effect: "none" }, dimensionPosition: { width: "100%" } } },
    accordionItem: {
      interior: { background: "transparent", padding: { all: "none" }, gap: { all: "none" } },
      dimensionPosition: { width: "100%" },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-200" } }, radius: { all: "none" }, effect: "none" },
      combined: [
        { where: { state: "hover" }, partialSurface: { interior: { background: "transparent" }, boundary: { border: { color: "transparent", bottom: { color: "gray-200" } } } } },
      ],
    },
    accordionTrigger: {
      surface: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "md" }, gap: { all: "md" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
        defaultTypography: { typographyType: "heading4" },
        cursor: "pointer",
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "transparent", foreground: "primary" }, boundary: { border: { color: "transparent" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { outline: { width: "none", style: "none" } } } },
        ],
      },
    },
    // ── fields with a distinct look ──
    fileUpload: {
      surface: {
        interior: { background: "gray-50", foreground: "gray-700", padding: { all: "2xl" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "default", style: "dashed", color: "gray-300" }, radius: { all: "xl" } },
        cursor: "pointer",
        combined: [{ where: { state: "selected" }, partialSurface: { tint: "primary", boundary: { border: { color: "primary" } }, interior: { background: "background" } } }],
      },
    },
    select: { surface: { cursor: "pointer" } },
    // ── input group: ONE box. The addons are plain gray text inside it; the input inside wears no box of its own
    // (contextual.inputGroup below). ──
    inputGroup: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    inputGroupAddon: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: { x: "md", y: "none" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" },
        defaultTypography: { typographyType: "bodySmall" },
      },
    },
    // ── otp: a row of fixed cells, 44 × 48, the digit centred in the display face, a little air between them ──
    otp: { surface: { interior: { background: "transparent", padding: { all: "none" }, gap: { all: "sm" } }, boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none" } } },
    otpSlot: {
      surface: {
        interior: { background: "background", foreground: "smart-fb", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-250" }, radius: { all: "md" }, effect: "none", margin: { x: "xs" } },
        dimensionPosition: { width: "44px", height: "48px" },
        defaultTypography: { typographyType: "numbers", textAlign: "center" },
      },
    },
    otpSeparator: { surface: { interior: { background: "transparent", foreground: "gray-400", padding: { x: "xs" } }, boundary: { border: { width: "none" } } } },
    // ── overlays ──
    // the modal: white, radius 18, the deep shadow with its haze ring; its regions carry the padding
    dialog: { surface: { interior: { padding: { all: "none" }, gap: { all: "none" } } } },
    // the alert dialog has no header, content or footer regions of its own: the box carries the inset
    alertDialog: { surface: { interior: { padding: { all: "xl" }, gap: { all: "md" } } } },
    // the sheet: a side panel with a 26px inset and the glass card's shadow; its header and footer carry no inset of
    // their own (contextual.sheet), and its buttons are small
    sheet: { surface: { boundary: { effect: "drawer", border: { width: "none" }, radius: { all: "none" } }, interior: { padding: { all: "xl" }, gap: { all: "lg" } } } },
    // the popover: a white card at radius 14 with a 13px inset and the deep shadow (the target's kpi-pop, a little
    // tighter: a popover often holds a menu, which brings its own rows)
    popover: { surface: { boundary: { effect: "popover", border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "lg" } }, interior: { padding: { all: "md" }, gap: { all: "sm" } } } },
    // the tooltip: deep slate, radius 10, 12px text
    tooltip: {
      surface: {
        interior: { background: "secondary", foreground: "smart-fb", padding: { x: "md", y: "sm" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" }, effect: "tooltip" },
        defaultTypography: { typographyType: "bodyExtraSmall" },
      },
    },
    toast: { surface: { interior: { padding: { x: "lg", y: "md" } }, boundary: { effect: "popover", radius: { all: "lg" } } } },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXTUAL — parent → child (L5). Inside the sidebar the header, content and
  // footer regions and the items wear the rail's paddings, not a card's. This —
  // with widthExpanded/widthCollapsed on `sidebar` above — is the whole collapse.
  // ═══════════════════════════════════════════════════════════════════════════
  concepts: {
    // The role picker trigger: a filled button whose label reads from the start, not centred
    "role-select": {
      button: { interior: { childAlign: { horizontal: "start" } } },
    },
  },

  contextual: {
    // inside a card the card carries the 26px inset: its regions keep only a little vertical air, so the inset is not
    // doubled (a card without regions still gets its 26px all round)
    card: {
      header: { interior: { padding: { x: "none", top: "none", bottom: "md" } }, boundary: { radius: { all: "sm" } } },
      content: { interior: { padding: { x: "none", y: "sm" } }, boundary: { radius: { all: "none" } } },
      footer: { interior: { padding: { x: "none", top: "md", bottom: "none" } }, boundary: { radius: { all: "sm" } } },
      // a card inside a card: a step tighter
      card: { interior: { padding: { all: "lg" } } },
    },
    // inside an alert every button is the small size, whatever scale it was given: the actions of an alert sit level
    alert: {
      button: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } },
    },
    // inside a tile a badge is a compact delta chip beside a big figure: the tile's width is its column's, not its own
    tile: {
      badge: { interior: { padding: { x: "sm", y: "3xs" } }, defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "none" } },
    },
    // inside a popover the menu wears no inset of its own: the popover's is enough
    popover: {
      menu: { interior: { padding: { all: "none" } } },
    },
    // inside a sheet the box carries the inset: its regions wear none, and a button is the small size
    sheet: {
      header: { interior: { padding: { all: "none" }, gap: { all: "xs" } }, boundary: { border: { width: "none" } } },
      content: { interior: { padding: { all: "none" } } },
      footer: { interior: { padding: { x: "none", top: "md", bottom: "none" }, gap: { all: "sm" } } },
      button: { interior: { padding: { x: "lg", y: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } },
    },
    // the pagination's items sit in a plain list the group's gap cannot reach: each takes a little margin (≈ 3px)
    paginationBar: {
      button: { boundary: { margin: { x: "2xs" } } },
    },
    // inside an input group the input is bare: the group is the box
    inputGroup: {
      input: {
        interior: { background: "transparent", padding: { x: "md", y: "md" } },
        boundary: { border: { width: "none" }, radius: { all: "none" }, effect: "none", outline: { width: "none", style: "none" } },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { width: "none" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { width: "none" }, effect: "none", outline: { width: "none", style: "none" } } } },
          // a status on the inner input: an underline in its colour, since the box is the group's
          { where: { status: "error" }, partialSurface: { tint: "background", boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "status-error" } }, effect: "none" } } },
          { where: { status: "warning" }, partialSurface: { tint: "background", boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "status-warning" } }, effect: "none" } } },
          { where: { status: "success" }, partialSurface: { tint: "background", boundary: { border: { width: "none", bottom: { width: "thick", style: "solid", color: "status-success" } }, effect: "none" } } },
        ],
      },
    },
    // a list's rows: hover and selection, at a rank above the list family's row rules
    list: {
      listItem: {
        combined: [
          { where: { state: "hover" }, partialSurface: { interior: { background: "gray-50" } } },
          { where: { state: "selected" }, partialSurface: { tint: "accent", interior: { background: "background", foreground: "primary" } } },
        ],
      },
    },
    accordionItem: {
      content: { interior: { padding: { x: "md", top: "none", bottom: "md" }, background: "transparent" }, boundary: { border: { width: "none" } } },
    },
    // (a contextual child is written as bare surface tokens: the engine reads them straight, not through `surface`)
    menu: {
      input: {
        interior: { background: "transparent", foreground: "smart-fb", padding: { x: "md", y: "md" }, gap: { all: "sm" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-150" } }, radius: { all: "none" }, effect: "none", outline: { width: "none", style: "none" } },
        defaultTypography: { typographyType: "body", textTransform: "none" },
        combined: [
          { where: { state: "hover" }, partialSurface: { boundary: { border: { color: "transparent", bottom: { color: "gray-150" } } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "transparent", bottom: { color: "primary" } }, effect: "none", outline: { width: "none", style: "none" } } } },
        ],
      },
      separator: { interior: { background: "gray-150", padding: {} }, boundary: { border: { width: "none" } } },
    },
    sidebar: {
      header: { interior: { padding: { x: "lg", y: "md" } } },
      content: { interior: { padding: { x: "md", y: "sm" } } },
      // the rail's own footer: the user card above a rule, on the rail's fill
      footer: { interior: { padding: { x: "lg", y: "md" }, background: "transparent" } },
      sidebarItem: { interior: { padding: { x: "md", y: "sm" }, gap: { all: "md" } } },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RULES — the collapsed rail: the header's and footer's items lead with an
  // avatar, which the expanded insets push half out of the rail — tighten them.
  // ═══════════════════════════════════════════════════════════════════════════
  rules: [
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }], tokens: { interior: { padding: { x: "sm" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }], tokens: { interior: { padding: { x: "sm" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }, { key: "sidebarItem" }], tokens: { interior: { padding: { x: "xs" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }, { key: "sidebarItem" }], tokens: { interior: { padding: { x: "xs" } } } },
  ],
};
