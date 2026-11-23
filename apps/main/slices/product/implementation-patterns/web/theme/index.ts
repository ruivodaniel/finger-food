// The implementation patterns slice's part of the theme: the concepts only this slice uses, one entry per thing it draws. No theme carries
// them; the theme engine adds them to the theme it builds, when shared/configs/theme lists this file (THEME_ADDONS.slices).
// Every concept starts with `implementation-patterns-`. A concept says how an element looks in the theme's own colours and sizes.
// Written as plain data: the concept type (ConceptOverrides, shared/libs/ui/types/cascade.ts) is not exported by a package a slice may import. The theme engine checks it when it builds.

export const SLICE_CONCEPTS = {
  // a cell of the minesweeper is a Tile. Hidden: a filled square, to click
  "implementation-patterns-mine-cell": { self: { interior: { background: "gray-300", padding: { all: "none" }, gap: { all: "none" } }, boundary: { border: { width: "thin", style: "solid", color: "background" }, radius: { all: "none" }, effect: "none" }, cursor: "pointer" } },
  // revealed: flat, on the page's background, nothing left to click
  "implementation-patterns-mine-cell-revealed": { self: { interior: { background: "background" }, boundary: { border: { width: "thin", style: "solid", color: "gray-150" } }, cursor: "default" } },
  // a mine that exploded
  "implementation-patterns-mine-cell-exploded": { self: { interior: { background: "status-error" }, cursor: "default" } },
  // a flag the person put
  "implementation-patterns-mine-cell-flagged": { self: { interior: { background: "status-warning" } } },
};
