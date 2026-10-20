import type { MobileTheme } from "../../../types";
import { daintaTheme as webTheme } from "../../wireframe-stroke/v1/theme";

// Wireframe Stroke mobile v1 — the mobile twin of the Wireframe Stroke theme.
//
// Its primitives are Wireframe Stroke's, taken by import (colours, type scale, spacing, radius,
// effects): the same white boxes, hairlines and square corners, on a phone. The families and the
// regions are mobile's own: no hover, no cursor, no outline, and a screen's regions in place of a page's.
//
// Colour, the rule: a surface is `background`, its text `foreground` — the two swap in dark. Text on a
// coloured fill is `smart-bw`: white or black, read from the fill. No surface names a fixed white.

const { fontSources: _webFontsByUrl, ...typography } = webTheme.typography;

export const wireframeStrokeMobileTheme: MobileTheme = {
  id: "wireframe-stroke-mobile",
  name: "Wireframe Stroke mobile",
  version: 1,
  type: "wireframe",
  kind: "seed",
  platform: "mobile",

  colors: webTheme.colors,
  typography,
  spacing: webTheme.spacing,
  radius: webTheme.radius,
  effects: webTheme.effects,
  transitions: webTheme.transitions,
  borderWidths: webTheme.borderWidths,
  icons: { set: "lucide", sizes: { xs: 14, sm: 16, md: 20, lg: 24, xl: 28 }, weight: 1.75 },
  modes: webTheme.modes,

  // what a touch shows beside the `active` state
  press: { opacityDim: 0.7, ripple: { color: "gray-300", borderless: false } },

  layouts: {
    surface: { interior: { background: "background", foreground: "foreground" } },
    screen: { surface: { interior: { background: "gray-100" } }, safeArea: ["top", "bottom"] },
    appBar: {
      height: "56px",
      surface: { interior: { background: "background", padding: { x: "md" }, gap: { all: "sm" } }, boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-200" } } } },
      safeArea: ["top"],
    },
    body: { surface: { interior: { background: "gray-100", padding: { x: "md", y: "md" }, gap: { all: "md" } } } },
    actionBar: {
      height: "64px",
      surface: { interior: { background: "background", padding: { x: "md", y: "sm" } }, boundary: { border: { top: { width: "thin", style: "solid", color: "gray-200" } } } },
    },
    tabBar: {
      height: "64px",
      surface: { interior: { background: "background", padding: { x: "xs" } }, boundary: { border: { top: { width: "thin", style: "solid", color: "gray-200" } } } },
      safeArea: ["bottom"],
    },
    drawer: { width: "320px", surface: { interior: { background: "background" } }, safeArea: ["top", "bottom"] },
    sheet: { sm: { size: "320px" }, md: { size: "480px" }, lg: { size: "640px" } },
  },

  families: {
    // THE surface: a white box, a hairline, no radius
    surfaceContainer: {
      interior: { background: "background", foreground: "foreground", gap: { all: "md" }, padding: {} },
      boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } },
      defaultTypography: { typographyType: "body" },
      combined: [
        { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        // status on a surface: a pale fill of its colour, text in the colour
        { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { background: "status-error-light", foreground: "status-error" }, boundary: { border: { color: "status-error-light" } } } },
        { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { background: "status-success-light", foreground: "status-success" }, boundary: { border: { color: "status-success-light" } } } },
        { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { background: "status-warning-light", foreground: "status-warning-dark" }, boundary: { border: { color: "status-warning-light" } } } },
        { where: { status: "info" }, partialSurface: { tint: "brand-1", interior: { background: "brand-1-light", foreground: "brand-1-dark" }, boundary: { border: { color: "brand-1-light" } } } },
        { where: { emphasis: "hero" }, partialSurface: { interior: { background: "brand-2", foreground: "smart-bw" }, boundary: { border: { color: "brand-2" } } } },
        { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
        // a surface that can be pressed (a card that opens something)
        { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
        { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1-light" }, boundary: { border: { color: "brand-1" } } } },
      ],
    },

    field: {
      sizes: {
        sm: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } } },
        md: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "bodyLarge" } } },
        lg: { partialSurface: { interior: { padding: { x: "md", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } } },
      },
      surface: {
        interior: { background: "background", foreground: "foreground", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
        defaultTypography: { typographyType: "bodyLarge" },
        combined: [
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "brand-1" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", boundary: { border: { color: "status-warning" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.6 } } },
        ],
      },
      placeholderColor: "gray-500",
      placeholderOpacity: 1,
      caretColor: "brand-1",
    },

    elevatedOverlay: {
      surface: { interior: { background: "background" }, boundary: { effect: "sheet", border: { width: "thin", style: "solid", color: "gray-200" } } },
      overlay: { scrimColor: "brand-2", scrimOpacity: 0.45 },
    },

    listContainer: {
      surface: { interior: { gap: { all: "none" }, padding: {} } },
      row: {
        interior: { padding: { x: "md", y: "md" } },
        boundary: { border: { bottom: { width: "thin", style: "solid", color: "gray-100" } } },
        combined: [
          { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1-light" } } },
        ],
      },
      separator: { height: "1px", surface: { interior: { background: "gray-100" } } },
    },

    interactiveControlGroup: {
      surface: { interior: { background: "transparent", gap: { all: "none" }, padding: {} }, boundary: { border: { width: "none" } } },
    },

    interactiveControl: {
      // a control on a phone is taller than on the web: a finger, not a pointer
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: "sm", y: "xs" } }, defaultTypography: { typographyType: "bodySmall" } }, icon: { size: "xs" } },
        sm: { partialSurface: { interior: { padding: { x: "md", y: "sm" } }, defaultTypography: { typographyType: "body" } }, icon: { size: "sm" } },
        md: { partialSurface: { interior: { padding: { x: "lg", y: "md" } }, defaultTypography: { typographyType: "bodyLarge" } }, icon: { size: "md" } },
        lg: { partialSurface: { interior: { padding: { x: "xl", y: "md" } }, defaultTypography: { typographyType: "bodyExtraLarge" } }, icon: { size: "lg" } },
      },
      surface: {
        interior: { background: "background", foreground: "foreground", padding: { x: "lg", y: "md" }, gap: { all: "sm" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodyLarge" },
        combined: [
          // emphasis = the pattern; tint = the colour (status re-tints below)
          { where: { emphasis: "hero" }, partialSurface: { tint: "brand-2", interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary" }, partialSurface: { tint: "primary", interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "secondary" }, partialSurface: { interior: { background: "background", foreground: "foreground" }, boundary: { border: { color: "gray-300" } } } },
          { where: { emphasis: "tertiary" }, partialSurface: { interior: { background: "transparent", foreground: "brand-1" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "quiet" }, partialSurface: { interior: { background: "transparent", foreground: "gray-600" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "error" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "destructive" }, partialSurface: { tint: "status-error", interior: { foreground: "status-error" }, boundary: { border: { color: "status-error" } } } },
          { where: { status: "success" }, partialSurface: { tint: "status-success", interior: { foreground: "status-success" }, boundary: { border: { color: "status-success" } } } },
          { where: { status: "warning" }, partialSurface: { tint: "status-warning", interior: { foreground: "status-warning-dark" }, boundary: { border: { color: "status-warning" } } } },
          { where: { status: "info" }, partialSurface: { tint: "brand-1", interior: { foreground: "brand-1-dark" }, boundary: { border: { color: "brand-1" } } } },
          // filled + status: the fill takes the status colour
          { where: { emphasis: "primary", status: "error" }, partialSurface: { interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "destructive" }, partialSurface: { interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "success" }, partialSurface: { interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "warning" }, partialSurface: { interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          { where: { emphasis: "primary", status: "info" }, partialSurface: { interior: { background: "tint", foreground: "smart-bw" }, boundary: { border: { color: "transparent" } } } },
          // states — pressed is `active`; there is no hover
          { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { emphasis: "primary", state: "active" }, partialSurface: { interior: { background: "brand-1-dark", foreground: "smart-bw" } } },
          { where: { emphasis: "hero", state: "active" }, partialSurface: { interior: { background: "brand-1", foreground: "smart-bw" } } },
          { where: { emphasis: "tertiary", state: "active" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" } } },
          { where: { emphasis: "quiet", state: "active" }, partialSurface: { interior: { background: "gray-100", foreground: "foreground" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" }, boundary: { border: { color: "brand-1" } } } },
          { where: { state: "focus" }, partialSurface: { boundary: { border: { color: "brand-1" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
          { where: { state: "loading" }, partialSurface: { interior: { opacity: 0.7 } } },
        ],
      },
    },

    shape: { surface: { interior: { foreground: "currentColor", background: "transparent", padding: {} }, boundary: { border: { width: "none" } } } },
    media: { surface: { interior: { background: "gray-100", padding: {} }, boundary: { border: { width: "thin", style: "solid", color: "gray-200" } } }, objectFit: "cover" },
  },

  elements: {
    // the label voice: mono, small, tracked, uppercase, gray
    label: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: {} },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall", textTransform: "uppercase" },
      },
    },
    fieldDescription: { surface: { interior: { background: "transparent", foreground: "gray-600", padding: {} }, boundary: { border: { width: "none" } }, defaultTypography: { typographyType: "bodySmall" } } },
    // the message under a field: its colour is its status, with no fill
    fieldMessage: {
      surface: {
        interior: { background: "transparent", foreground: "gray-600", padding: {} },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "bodySmall" },
        combined: [
          { where: { status: "error" }, partialSurface: { interior: { background: "transparent", foreground: "status-error" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "success" }, partialSurface: { interior: { background: "transparent", foreground: "status-success" }, boundary: { border: { color: "transparent" } } } },
          { where: { status: "warning" }, partialSurface: { interior: { background: "transparent", foreground: "status-warning-dark" }, boundary: { border: { color: "transparent" } } } },
        ],
      },
    },
    // a set of choices: joined square cells, the chosen one filled
    choiceGroup: { surface: { interior: { background: "transparent", padding: {}, gap: { all: "none" } }, boundary: { border: { width: "none" } } } },
    toggle: {
      surface: {
        interior: { padding: { x: "md", y: "sm" } },
        defaultTypography: { typographyType: "body" },
        combined: [{ where: { state: "selected" }, partialSurface: { interior: { background: "brand-1", foreground: "smart-bw" }, boundary: { border: { color: "brand-1" } } } }],
      },
    },
    // a number with a minus and a plus: joined square cells
    buttonGroup: { surface: { interior: { background: "transparent", padding: {}, gap: { all: "none" } }, boundary: { border: { width: "none" } } } },
    buttonGroupText: {
      interior: { background: "background", foreground: "foreground", padding: { x: "md" } },
      boundary: { border: { width: "thin", style: "solid", color: "gray-300" } },
      defaultTypography: { typographyType: "bodyLarge" },
    },

    card: { interior: { padding: { x: "md", y: "md" }, gap: { all: "md" } }, boundary: { effect: "card" } },
    header: {
      interior: { background: "transparent", padding: { x: "md", y: "md" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } } },
      defaultTypography: { typographyType: "heading4" },
    },
    content: { interior: { background: "transparent", padding: { x: "md", y: "md" } }, boundary: { border: { width: "none" } } },
    footer: {
      interior: { background: "background", padding: { x: "md", y: "sm" }, gap: { all: "sm" } },
      boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-100" } } },
    },
    group: { interior: { background: "transparent", padding: {}, gap: { all: "sm" } }, boundary: { border: { width: "none" } } },
    emptyState: { interior: { background: "transparent", padding: { x: "lg", y: "xl" }, gap: { all: "sm" }, childAlign: { horizontal: "center", vertical: "center" } }, boundary: { border: { width: "none" } } },

    // a badge: a small filled chip of text
    badge: {
      surface: {
        interior: { background: "brand-2", foreground: "smart-bw", padding: { x: "xs", y: "3xs" } },
        boundary: { border: { width: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall" },
      },
    },
    avatar: {
      surface: {
        interior: { background: "brand-1-light", foreground: "brand-1-dark", padding: {}, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none" }, radius: { all: "full" } },
        defaultTypography: { typographyType: "bodySmall" },
      },
    },
    separator: { surface: { interior: { background: "gray-200", padding: {} }, boundary: { border: { width: "none" } } }, height: "1px" },
    // an item of the tab bar: gray until it is the current one
    navItem: {
      surface: {
        interior: { background: "transparent", foreground: "gray-500", padding: { x: "xs", y: "xs" }, gap: { all: "3xs" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        defaultTypography: { typographyType: "numbersExtraSmall" },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "transparent", foreground: "brand-1" } } },
          { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },

    // a list: a white box of rows, a hairline between them
    list: { surface: { interior: { background: "background", gap: { all: "none" }, padding: { all: "none" } }, boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "none" } } } },
    listItem: {
      surface: {
        interior: { background: "transparent", foreground: "foreground", padding: { x: "md", y: "md" }, gap: { all: "md" }, childAlign: { horizontal: "start", vertical: "center" } },
        boundary: { border: { width: "none", bottom: { width: "thin", style: "solid", color: "gray-100" } }, radius: { all: "none" } },
        defaultTypography: { typographyType: "bodyLarge" },
        combined: [
          { where: { position: "last" }, partialSurface: { boundary: { border: { bottom: { width: "none" } } } } },
          { where: { state: "active" }, partialSurface: { interior: { background: "gray-100" } } },
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1-light", foreground: "brand-1-dark" } } },
          { where: { status: "error" }, partialSurface: { interior: { foreground: "status-error" } } },
          { where: { status: "destructive" }, partialSurface: { interior: { foreground: "status-error" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },

    // the switch: a square track that fills with the brand, a white square thumb
    switch: {
      track: {
        interior: { background: "gray-300", padding: { all: "3xs" } },
        boundary: { border: { width: "none" }, radius: { all: "none" } },
        dimensionPosition: { width: "48px", height: "28px" },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1" } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },
    switchInner: {
      interior: { background: "background", padding: { all: "none" } },
      boundary: { border: { width: "none" }, radius: { all: "none" } },
      dimensionPosition: { width: "24px", height: "24px" },
    },
    checkbox: {
      surface: {
        interior: { background: "background", foreground: "smart-bw", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-400" }, radius: { all: "none" } },
        dimensionPosition: { width: "24px", height: "24px" },
        combined: [
          { where: { state: "selected" }, partialSurface: { interior: { background: "brand-1" }, boundary: { border: { color: "brand-1" } } } },
          { where: { status: "error" }, partialSurface: { boundary: { border: { color: "status-error" } } } },
          { where: { state: "disabled" }, partialSurface: { interior: { opacity: 0.45 } } },
        ],
      },
    },

    // the code field: one square box per digit
    otp: { surface: { interior: { background: "transparent", padding: { all: "none" }, gap: { all: "sm" } }, boundary: { border: { width: "none" }, radius: { all: "none" } } } },
    otpSlot: {
      surface: {
        interior: { background: "background", foreground: "foreground", padding: { all: "none" }, childAlign: { horizontal: "center", vertical: "center" } },
        boundary: { border: { width: "thin", style: "solid", color: "gray-300" }, radius: { all: "none" } },
        dimensionPosition: { width: "44px", height: "52px" },
        defaultTypography: { typographyType: "numbersLarge" },
        combined: [{ where: { state: "selected" }, partialSurface: { boundary: { border: { color: "brand-1" } } } }],
      },
    },

    // messages and overlays: the surface with its status fill (the family's), padded
    alert: { surface: { interior: { padding: { x: "md", y: "md" }, gap: { all: "sm" } } } },
    dialog: { surface: { interior: { padding: { all: "lg" }, gap: { all: "md" } } } },
    sheet: { surface: { interior: { padding: { x: "md", y: "md" }, gap: { all: "md" } }, boundary: { border: { width: "none", top: { width: "thin", style: "solid", color: "gray-200" } } } } },
  },
};
