import type { Baseline } from "../../../../theme-engine/web/v2";

// BASELINE base v1 — what is not theme-sensitive: the structure of the shell and the sidebar, in terms of the levers (every measure is a token density reaches).
// Written for engine 2. A theme extends it by name (`extends: ["base", 1]`) and writes only its own look. Extracted from wireframe stroke v4.

export const baseline: Baseline = {
  // the peek panel of the collapsed sidebar grows out of the rail (clipped to the collapsed width, 3.5rem) and folds back into it; the shadow may spill on every side
  keyframes: {
    "sidebar-peek-in": { from: { clipPath: "inset(0 calc(100% - 3.5rem) 0 0)" }, to: { clipPath: "inset(-60px -60px -60px -60px)" } },
    "sidebar-peek-out": { from: { clipPath: "inset(-60px -60px -60px -60px)" }, to: { clipPath: "inset(0 calc(100% - 3.5rem) 0 0)" } },
  },

  layouts: {
    // a shell with a side nav stands in a column on a phone: the nav is a bar over the page
    shellSideNav: { breakpoints: { stack: "767px" } },
  },

  rules: [
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
    { when: { concept: "sidebar", where: { scale: "md", flag: "peek-open" } }, self: { dimensionPosition: { width: "240px", height: "var(--radix-popover-trigger-height)" }, interior: { padding: { all: "none" } }, boundary: { radius: { all: "none" } }, animation: { name: "sidebar-peek-in", duration: "220ms", timing: "ease-in-out", fillMode: "both" } } },
    { when: { concept: "sidebar", where: { scale: "md", flag: "peek-closed" } }, self: { dimensionPosition: { width: "240px", height: "var(--radix-popover-trigger-height)" }, interior: { padding: { all: "none" } }, boundary: { radius: { all: "none" } }, animation: { name: "sidebar-peek-out", duration: "220ms", timing: "ease-in-out", fillMode: "both" } } },
    { when: { concept: "logo-square", where: { scale: "md" } }, self: { dimensionPosition: { width: "auto", height: "32px" } } },
    { chain: [{ key: "sidebar" }, { key: "footer" }], tokens: { dimensionPosition: { height: "60px" } } },
    // a footer that holds the notifications entry above the user menu is as tall as both
    { chain: [{ key: "sidebar" }, { key: "footer", concept: "sidebar-footer-two-rows" }], tokens: { dimensionPosition: { height: "auto" } } },
    // the collapsed rail marks an entry with a dot tucked against its icon's top corner
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "sidebarItem" }, { key: "badge", concept: "dot" }], tokens: { dimensionPosition: { translateX: "-9px", translateY: "-9px" } } },
    // the same dot on the collapsed bell, in the header
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }, { key: "badge", concept: "dot" }], tokens: { dimensionPosition: { translateX: "-9px", translateY: "-9px" } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "header" }], tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } } },
    // the content has no side inset in any shape: an entry carries its own, so the brand bar of the active entry touches the sidebar's edge expanded as collapsed
    { chain: [{ key: "sidebar" }, { key: "content" }], tokens: { interior: { padding: { x: "none" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "footer" }], tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }, { key: "sidebarItem" }], tokens: { interior: { padding: { x: "none" }, childAlign: { horizontal: "center" } } } },
    // the rail's width is a token (and so scales with density): the class of the library stays as the fallback for a theme without it
    { chain: [{ key: "sidebar", where: { flag: "expanded" } }], tokens: { dimensionPosition: { width: "240px" } } },
    { chain: [{ key: "sidebar", where: { flag: "collapsed" } }], tokens: { dimensionPosition: { width: "56px" } } },
  ],
};
