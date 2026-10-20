import type { MobileTheme } from "../../../types";
import { bounxTheme } from "../../bounx/v1/theme";

// Bounx mobile v1 — the theme of the Bounx mobile app, authored from the Bounx prototype's phone screens.
//
// Its primitives are the Bounx web theme's, taken by import (colours, type scale, spacing, radius,
// effects): the two apps start from the same values and each may leave them. The families and the
// regions are mobile's own: no hover, no cursor, no outline, and a screen's regions in place of a page's.
//
// The prototype, piece by piece → where it is here
//   .screen  warm ground                         layouts.screen / body: brand-3-gray-50 (the paper)
//   .appbar  title in Fraunces 21, no line       layouts.appBar · type heading2
//   .tabbar  white, a line above, 70 high        layouts.tabBar
//   .card    white, line, radius 22, pad 16      families.surfaceContainer + elements.card
//   .btn     green, white bold 15, radius 16     interactiveControl, emphasis primary (hero adds the glow)
//   .btn.ghost  white, line                      emphasis secondary
//   .btn.sm  pad 10/14, 13.5, radius 12          scale sm
//   .pill    soft green, deep green bold 11.5    elements.badge · .pill.gray is emphasis quiet
//   .kicker  11 / 800 uppercase, faint           elements.label
//   .avatar  round, white bold on a colour       elements.avatar
//   .pf-tabs white bar, the chosen tab in ink    elements.choiceGroup + toggle, state selected
//   .navrow  pad 15, a light line below          families.listContainer.row
//   .empty   white, dashed line, radius 18       elements.emptyState
//
// Colour, the rule: a surface is `background`, its text `foreground` — the two swap in dark. Text on a
// coloured fill is `smart-bw`. No surface names a fixed white.
//
// Open: the prototype's dark buttons (.btn.dark) are the coach's. That is a concept (L4), which the
// mobile engine does not emit yet. No disabled, focus or error state is drawn; those are this theme's.

const { fontSources: _webFontsByUrl, ...typography } = bounxTheme.typography;

export const bounxMobileTheme: MobileTheme = {
  id: "bounx-mobile",
  name: "Bounx mobile",
  version: 1,
  type: "high-fidelity",
  kind: "product",
  platform: "mobile",

  colors: bounxTheme.colors,
  typography,
  spacing: bounxTheme.spacing,
  radius: bounxTheme.radius,
  effects: bounxTheme.effects,
  transitions: bounxTheme.transitions,
  borderWidths: bounxTheme.borderWidths,
  icons: { set: "lucide", sizes: { xs: 14, sm: 16, md: 20, lg: 22, xl: 28 }, weight: 2 },
  modes: bounxTheme.modes,

  // what a touch shows beside the `active` state
  press: { opacityDim: 0.85, ripple: { color: "brand-3-gray-200", borderless: false } },

  layouts: {
    surface: { interior: { background: "brand-3-gray-50", foreground: "foreground" } },
    screen: { surface: { interior: { background: "brand-3-gray-50" } }, safeArea: ["top", "bottom"] },
    // the app bar sits on the ground, with no line: the title is the mark
    appBar: {
      height: "56px",
      surface: { interior: { background: "brand-3-gray-50", padding: { x: "md" }, gap: { all: "sm" } }, defaultTypography: { typographyType: "heading2" } },
      safeArea: ["top"],
    },
    body: { surface: { interior: { background: "brand-3-gray-50", padding: { x: "md", y: "sm" }, gap: { all: "md" } } } },
    actionBar: {
      height: "76px",
      surface: { interior: { background: "background", padding: { x: "md", y: "sm" } }, boundary: { border: { top: { width: "thin", style: "solid", color: "brand-3-gray-150" } } } },
    },
    tabBar: {
      height: "70px",
      surface: { interior: { background: "background", padding: { x: "sm", y: "xs" } }, boundary: { border: { top: { width: "thin", style: "solid", color: "brand-3-gray-150" } } } },
      safeArea: ["bottom"],
    },
    drawer: { width: "320px", surface: { interior: { background: "background" } }, safeArea: ["top", "bottom"] },
    sheet: { sm: { size: "320px" }, md: { size: "480px" }, lg: { size: "640px" } },
  },

  families: {
    // THE surface: white on the warm ground, a soft line, generously rounded
    surfaceContainer: {
      interior: { background: "background", foreground: "foreground", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "xl" } },
      defaultTypography: { typographyType: "body" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        // status on a surface: its soft fill, text in its colour
        { where: { status: "error" }, partialSurface: { interior: { background: "status-error-light", foreground: "status-error-dark" }, boundary: { border: { color: "status-error-light" } } } },
        { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error-light", foreground: "status-error-dark" }, boundary: { border: { color: "status-error-light" } } } },
        { where: { status: "success" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" }, boundary: { border: { color: "brand-1-light" } } } },
        { where: { status: "warning" }, partialSurface: { interior: { background: "status-warning-light", foreground: "status-warning-dark" }, boundary: { border: { color: "status-warning-light" } } } },
        { where: { status: "info" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" }, boundary: { border: { color: "brand-1-light" } } } },
        // hero: the ink surface
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "brand-2", foreground: "smart-bw" }, boundary: { border: { color: "brand-2" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "brand-3-gray-600" }, boundary: { border: { color: "transparent" } } } },
        // a surface that can be pressed (a card that opens something)
        { where: { state: "active" }, partialSurface: { interior: { background: "brand-3-gray-100" } } },
        { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1-light" }, boundary: { border: { color: "brand-1" } } } },
      ],
    },

    field: {
      sizes: {
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "sm" } }, boundary: { radius: { all: "sm" } }, defaultTypography: { typographyType: "body" } } },
        md: { partialSurface: { interior: { padding: { x: "md", y: "md" } }, defaultTypography: { typographyType: "bodyLarge" } } },
        lg: { partialSurface: { interior: { padding: { x: "md", y: "lg" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
      },
      surface: {
        interior: { background: "background", foreground: "foreground", padding: { x: "md", y: "md" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "md" } },
        defaultTypography: { typographyType: "bodyLarge" },
        combined: [
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "brand-1" } } } },
          { where: { status: "error" }, partialSurface: { boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { boundary: { border: { color: "status-warning" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { background: "brand-3-gray-100", opacity: 0.6 } } },
        ],
      },
      placeholderColor: "brand-3-gray-400",
      placeholderOpacity: 1,
      caretColor: "brand-1",
    },

    elevatedOverlay: {
      surface: { interior: { background: "background" }, boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "2xl" } } },
      overlay: { scrimColor: "brand-2", scrimOpacity: 0.45 },
    },

    listContainer: {
      surface: { interior: { background: "transparent", gap: { all: "none" }, padding: {} }, boundary: { border: { width: "none" } } },
      row: {
        interior: { padding: { x: "sm", y: "md" }, gap: { all: "md" } },
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "brand-3-gray-100" } } },
        combined: [
          { where: { state: "active" }, partialSurface: { interior: { background: "brand-3-gray-100" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1-light" } } },
        ],
      },
      separator: { height: "1px", surface: { interior: { background: "brand-3-gray-100" } } },
    },

    interactiveControlGroup: {
      surface: { interior: { background: "transparent", gap: { all: "none" }, padding: {} }, boundary: { border: { width: "none" } } },
    },

    interactiveControl: {
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, boundary: { radius: { all: "sm" } }, defaultTypography: { typographyType: "numbersSmall" } }, icon: { size: "xs" } },
        sm: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, boundary: { radius: { all: "sm" } }, defaultTypography: { typographyType: "numbers" } }, icon: { size: "sm" } },
        md: { partialSurface: { interior: { padding: { all: "md" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "md" } },
        lg: { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, boundary: { radius: { all: "lg" } }, defaultTypography: { typographyType: "link" } }, icon: { size: "lg" } },
      },
      surface: {
        // the plain control: white, a line
        interior: { background: "background", foreground: "foreground", padding: { all: "md" }, gap: { all: "sm" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "md" } },
        defaultTypography: { typographyType: "link" },
        combined: [
          // emphasis = the pattern; tint = the colour (status re-tints below)
          // hero: the screen's main action — the brand fill with its glow. primary: the same fill, flat.
          { where: { emphasis: "hero" }, partialSurface: { tint: "primary", interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" }, effect: "button" } } },
          { where: { emphasis: "primary" }, partialSurface: { tint: "primary", interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "secondary" }, partialSurface: { interior: { background: "background", foreground: "foreground" }, boundary: { border: { color: "brand-3-gray-150" } } } },
          { where: { emphasis: "tertiary" }, partialSurface: { interior: { background: "transparent", foreground: "brand-1-dark" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "brand-3-gray-600" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { foreground: "brand-1-dark" }, boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { foreground: "status-warning-dark" }, boundary: { border: { color: "status-warning" } } } },
          { where: { status: "info" }, partialSurface: { tint: "brand-1", interior: { foreground: "brand-1-dark" }, boundary: { border: { color: "brand-1" } } } },
          // filled + status: the fill takes the status colour
          ...(["hero", "primary"] as const).flatMap((emphasis) => (["error", "destructive", "success", "warning", "info"] as const).map((status) => (
            { where: { emphasis, status }, partialSurface: { interior: { background: "tint" as const, foreground: "smart-bw" as const }, boundary: { border: { color: "transparent" as const } } } }
          ))),
          // states — pressed is `active`; there is no hover
          { where: { state: "active" }, partialSurface: { interior: { background: "brand-3-gray-100" } } },
          { where: { emphasis: "hero", state: "active" }, partialSurface: { interior: { background: "brand-1-dark", foreground: "smart-bw" } } },
          { where: { emphasis: "primary", state: "active" }, partialSurface: { interior: { background: "brand-1-dark", foreground: "smart-bw" } } },
          { where: { emphasis: "tertiary", state: "active" }, partialSurface: { interior: { background: "brand-1-light" } } },
          { where: { emphasis: "quiet", state: "active" }, partialSurface: { interior: { background: "brand-3-gray-100", foreground: "foreground" } } },
          // selected: the ink fill, as the prototype's chosen tab; a signal already given
          { where: { state: "selected" }, partialSurface: { tint: "brand-2", interior: { background: "brand-2", foreground: "smart-bw" }, boundary: { border: { color: "brand-2" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "brand-1" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
          { where: { state: "loading" }, partialSurface: { interior: { opacity: 0.7 } } },
        ],
      },
    },

    shape: { surface: { interior: { foreground: "currentColor", background: "transparent", padding: {} }, boundary: { border: { width: "none" } } } },
    media: { surface: { interior: { background: "brand-3-gray-100", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "md" } } }, objectFit: "cover" },
  },

  elements: {
    // the label voice: the prototype's kicker — small, extra bold, tracked, uppercase, faint
    label: {
      surface: {
        interior: { background: "transparent", foreground: "brand-3-gray-400", padding: {} },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
      },
    },
    fieldDescription: { surface: { interior: { background: "transparent", foreground: "brand-3-gray-600", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "none" } }, defaultTypography: { typographyType: "bodyExtraSmall" } } },
    // the message under a field: its colour is its status, with no fill
    fieldMessage: {
      surface: {
        interior: { background: "transparent", foreground: "brand-3-gray-600", padding: {} },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodyExtraSmall" },
        combined: [
          { where: { status: "error" }, partialSurface: { interior: { background: "transparent", foreground: "status-error" } } },
          { where: { status: "success" }, partialSurface: { interior: { background: "transparent", foreground: "brand-1-dark" } } },
          { where: { status: "warning" }, partialSurface: { interior: { background: "transparent", foreground: "status-warning-dark" } } },
        ],
      },
    },

    card: { interior: { padding: { all: "md" }, gap: { all: "md" } }, boundary: { effect: "card" } },
    header: {
      interior: { background: "transparent", padding: { x: "md", y: "md" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "brand-3-gray-100" } }, radius: { all: "none" } },
      defaultTypography: { typographyType: "heading4" },
    },
    content: { interior: { background: "transparent", padding: { x: "md", y: "md" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } },
    footer: {
      interior: { background: "transparent", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "brand-3-gray-100" } }, radius: { all: "none" } },
    },
    group: { interior: { background: "transparent", padding: {}, gap: { all: "sm" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } },
    // nothing here: white, a dashed line, the text faint and centred
    emptyState: {
      interior: { background: "background", foreground: "brand-3-gray-600", padding: { x: "lg", y: "lg" }, gap: { all: "sm" }, childAlign: { horizontal: "center", vertical: "center" } },
      boundary: { border: { width: "thin", style: "dashed", color: "brand-3-gray-200" }, radius: { all: "lg" } },
      defaultTypography: { typographyType: "bodySmall" },
    },

    // the pill: soft green with deep green text; gray when quiet; a status takes its soft fill
    badge: {
      surface: {
        interior: { background: "brand-1-light", foreground: "brand-1-dark", padding: { x: "sm", y: "xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "numbersSmall" },
        combined: [
          { where: { emphasis: "hero" }, partialSurface: { interior: { background: "brand-1", foreground: "smart-bw" } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "brand-3-gray-150", foreground: "brand-3-gray-600" } } },
          { where: { status: "error" }, partialSurface: { interior: { background: "status-error-light", foreground: "status-error-dark" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { background: "status-error-light", foreground: "status-error-dark" } } },
          { where: { status: "success" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" } } },
          { where: { status: "warning" }, partialSurface: { interior: { background: "status-warning-light", foreground: "status-warning-dark" } } },
          { where: { status: "info" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" } } },
        ],
      },
    },
    // round, white bold initials on the brand
    avatar: {
      surface: {
        interior: { background: "brand-1", foreground: "smart-bw", padding: {}, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "numbers" },
      },
    },
    separator: { surface: { interior: { background: "brand-3-gray-150", padding: {} }, boundary: { border: { width: "none" }, radius: { all: "none" } } }, height: "1px" },

    // a set of choices: a white bar, the chosen one in ink
    choiceGroup: {
      surface: {
        interior: { background: "background", padding: { all: "xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "md" } },
      },
    },
    toggle: {
      surface: {
        interior: { background: "transparent", foreground: "brand-3-gray-600", padding: { x: "sm", y: "sm" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        defaultTypography: { typographyType: "numbers" },
      },
      sizes: {
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "numbersSmall" } } },
        md: { partialSurface: { interior: { padding: { x: "sm", y: "sm" } }, defaultTypography: { typographyType: "numbers" } } },
        lg: { partialSurface: { interior: { padding: { x: "md", y: "md" } }, defaultTypography: { typographyType: "link" } } },
      },
    },

    // a number with a minus and a plus: one white bar
    buttonGroup: {
      surface: {
        interior: { background: "background", padding: { all: "xs" }, gap: { all: "xs" } },
        boundary: { border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "md" } },
      },
    },
    buttonGroupText: {
      interior: { background: "transparent", foreground: "foreground", padding: { x: "md" } },
      boundary: { border: { width: "none" }, radius: { all: "none" } },
      defaultTypography: { typographyType: "link" },
    },
    phoneInput: {},

    // ── navigation ──
    // an item of the tab bar or of the drawer: faint until it is the current one
    navItem: {
      surface: {
        interior: { background: "transparent", foreground: "brand-3-gray-400", padding: { x: "xs", y: "xs" }, gap: { all: "3xs" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none" }, radius: { all: "sm" } },
        defaultTypography: { typographyType: "numbersSmall" },
        combined: [
          { where: { state: "selected" }, partialSurface: { tint: "brand-1", interior: { background: "transparent", foreground: "brand-1" } } },
          { where: { state: "active" }, partialSurface: { interior: { background: "brand-3-gray-100" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },

    // ── lists ──
    // a row: the prototype's nav row — generous, a light line below, nothing around
    list: { surface: { interior: { background: "transparent", gap: { all: "none" }, padding: { all: "none" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } } },
    listItem: {
      surface: {
        interior: { background: "transparent", foreground: "foreground", padding: { x: "sm", y: "md" }, gap: { all: "md" }, childAlign: { horizontal: "start", vertical: "center" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "brand-3-gray-100" } }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodyExtraLarge" },
        combined: [
          { where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } },
          { where: { state: "active" }, partialSurface: { interior: { background: "brand-3-gray-100" } } },
          { where: { state: "selected" }, partialSurface: { tint: "brand-1", interior: { background: "brand-1-light", foreground: "brand-1-dark" } } },
          { where: { status: "error" }, partialSurface: { interior: { foreground: "status-error" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },

    // ── on / off ──
    // the switch: a track that fills with the brand, a white thumb
    switch: {
      track: {
        interior: { background: "brand-3-gray-200", padding: { all: "3xs" } },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        dimensionPosition: { width: "48px", height: "28px" },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },
    switchInner: {
      interior: { background: "background", padding: { all: "none" } },
      boundary: { border: { width: "none" }, radius: { all: "full" }, effect: "card" },
      dimensionPosition: { width: "24px", height: "24px" },
    },
    checkbox: {
      surface: {
        interior: { background: "background", foreground: "smart-bw", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "default", style: "solid", color: "brand-3-gray-250" }, radius: { all: "2xs" } },
        dimensionPosition: { width: "24px", height: "24px" },
        combined: [
          { where: { state: "selected" }, partialSurface: { tint: "brand-1", interior: { background: "brand-1" }, boundary: { border: { color: "brand-1" } } } },
          { where: { status: "error" }, partialSurface: { boundary: { border: { color: "status-error" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },

    // ── the code field: one box per digit ──
    otp: { surface: { interior: { background: "transparent", padding: { all: "none" }, gap: { all: "sm" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } } },
    otpSlot: {
      surface: {
        interior: { background: "background", foreground: "foreground", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "brand-3-gray-150" }, radius: { all: "sm" } },
        dimensionPosition: { width: "48px", height: "56px" },
        defaultTypography: { typographyType: "numbersLarge" },
        combined: [
          { where: { state: "selected" }, partialSurface: { boundary: { border: { color: "brand-1" } } } },
          { where: { status: "error" }, partialSurface: { boundary: { border: { color: "status-error" } } } },
        ],
      },
    },

    // ── messages and overlays ──
    // an alert: the surface with its status fill (the family's), a little padding
    alert: { surface: { interior: { padding: { x: "md", y: "md" }, gap: { all: "sm" } }, boundary: { radius: { all: "md" } } } },
    // a dialog: a white panel in the middle, over the scrim
    dialog: { surface: { interior: { padding: { all: "lg" }, gap: { all: "md" } }, boundary: { radius: { all: "2xl" } } } },
    // a sheet: a panel from the bottom edge, rounded at the top only
    sheet: {
      surface: {
        interior: { padding: { x: "md", y: "md" }, gap: { all: "md" } },
        boundary: { border: { width: "none" }, radius: { all: "none", topLeft: "2xl", topRight: "2xl" }, effect: "sheet" },
      },
    },
  },
};
