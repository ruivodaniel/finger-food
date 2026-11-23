// The knowledge add-on of a theme: the concepts of the knowledge artifacts, one leaf each. A theme carries none of this itself; the theme engine adds the leaves that
// configs/theme turns on (THEME_ADDONS). Every concept starts with `knowledge-`. Kept minimal: what the theme must decide for an artifact, nothing else.
import type { z } from "zod";
import type { cascade } from "../../ui/types/schema/v2/theme";
/** the concepts of a theme, in the theme language v2: a size is a surface's `dimensions`, a place its `position` */
type ConceptOverrides = z.infer<typeof cascade.ConceptOverrides>;
import type { ThemeEffects } from "../../ui/types/primitives";

export type KnowledgeLeaf = "canvas" | "codeBlock" | "table" | "noteSticker" | "explorationCard" | "explorationLink" | "erdNode" | "kanban" | "editing" | "screenPreviewer" | "todoTree";

/** the concepts of each leaf; a leaf with none styles nothing through the theme */
export const KNOWLEDGE_LEAVES: Record<KnowledgeLeaf, ConceptOverrides> = {
  // the canvas: the sizes of its menus, panels and tips
  canvas: {
    "knowledge-canvas-edge-label": { self: { dimensions: { maxWidth: { md: "320px" } } } },
    "knowledge-canvas-settings": { self: { dimensions: { width: { md: "240px" } } } },
    "knowledge-canvas-menu": { self: { dimensions: { minWidth: { md: "200px" } } } },
    "knowledge-canvas-menu-heading": { self: { dimensions: { minWidth: { md: "220px" } }, interior: { padding: { top: "sm", x: "xs", bottom: "3xs" } } } },
    "knowledge-canvas-menu-heading-narrow": { self: { dimensions: { minWidth: { md: "180px" } }, interior: { padding: { top: "sm", x: "xs", bottom: "3xs" } } } },
    "knowledge-canvas-icon-grid": { self: { dimensions: { width: { md: "268px" } } } },
    "knowledge-canvas-tool-tip": { self: { dimensions: { maxWidth: { md: "260px" } } } },
    "knowledge-canvas-entity-pick": { self: { dimensions: { width: { md: "560px" } }, interior: { background: "background", padding: { all: "sm" } }, boundary: { border: { width: "thin", style: "solid", color: "gray-200" }, radius: { all: "md" }, effect: "sm" } } },
  },
  // the code block keeps its look in line
  codeBlock: {},
  table: {},
  // the sticker is a Tile with no gap of its own (the note lays out its text itself); its padding is the Tile's
  // and it lifts off the board with its own shadow (effect `knowledge-note`, below)
  noteSticker: { "knowledge-note-body": { self: { dimensions: { height: { md: "100%" } } } }, "knowledge-note-sticker": { tile: { interior: { gap: { all: "none" } }, boundary: { effect: "knowledge-note", border: { width: "none" } } } } },
  // the card is leaving for the slice; its concept moves with it
  explorationCard: { "knowledge-exploration-card-tip": { self: { dimensions: { maxWidth: { md: "340px" } } } }, "knowledge-exploration-card-face": { self: { interior: { padding: { all: "sm" } } } }, "knowledge-exploration-card-foot": { self: { interior: { padding: { y: "2xs", x: "md" } } } }, "knowledge-exploration-card": { card: { interior: { padding: { all: "none" }, gap: { all: "none" } } } } },
  explorationLink: {},
  erdNode: {
    // the node: its frame, and the colour of the kind of table it is (designed, generated, or none when the colour is off)
    "knowledge-erd-node": { self: { interior: { background: "gray-100" }, boundary: { border: { width: "thick", style: "solid", color: "gray-300" }, radius: { all: "md" } } } },
    "knowledge-erd-node-designed": { self: { boundary: { border: { color: "status-warning" } } } },
    "knowledge-erd-node-generated": { self: { boundary: { border: { color: "status-info" } } } },
    "knowledge-erd-node-none": { self: { boundary: { border: { color: "gray-300" } } } },
    "knowledge-erd-node-compact": { self: { dimensions: { minWidth: { md: "220px" } } } },
    "knowledge-erd-header-designed": { self: { interior: { background: "status-warning", backgroundAlpha: 0.14, foreground: "status-warning" } } },
    "knowledge-erd-header-generated": { self: { interior: { background: "status-info", backgroundAlpha: 0.14, foreground: "status-info" } } },
    "knowledge-erd-header-none": { self: { interior: { background: "gray-200", foreground: "gray-800" } } },
    // what points to another table
    "knowledge-erd-link": { self: { interior: { foreground: "status-success" } } },
    "knowledge-erd-marker": { self: { dimensions: { width: { md: "20px" } } } },
    "knowledge-erd-label": { self: { dimensions: { maxWidth: { md: "180px" } }, interior: { padding: { y: "sm", x: "md" } }, defaultTypography: { textAlign: "center" } } },
    // the room inside the node: a band (header, description, checks, points to) and a column's row
    "knowledge-erd-band": { self: { interior: { padding: { y: "sm", x: "md" } } } },
    "knowledge-erd-row": { self: { interior: { padding: { y: "xs", x: "md" } } } },
  },
  kanban: { "knowledge-kanban-menu": { self: { dimensions: { maxHeight: { md: "55vh" } } } } },
  editing: {
    // the edit button: pinned on the top right corner of what it edits
    "knowledge-edit-button": { self: { position: { absolute: { top: "sm", right: "sm" } } } },
    // the band that says a thing is being edited live
    "knowledge-edit-warning": { self: { interior: { background: "status-warning", backgroundAlpha: 0.14 }, boundary: { border: { top: { width: "thin", style: "solid", color: "status-warning" } } } } },
    "knowledge-field": { self: { dimensions: { minWidth: { md: "0px" } } } },
  },
  // the line that shows where a dragged to-do will land
  todoTree: { "knowledge-todo-drop-line": { self: { interior: { background: "primary" } } } },
  // a text that stands on the dark scrim of a previewer
  screenPreviewer: { "knowledge-previewer-on-dark": { self: { interior: { foreground: "main-white", padding: { all: "md" } } } } },
};

/** the effects the leaves use, added to the theme's own: Miro's sticky note, a tight dark line under the bottom edge fading over about 30px, a faint one on the sides */
export const KNOWLEDGE_EFFECTS: Partial<Record<KnowledgeLeaf, ThemeEffects>> = {
  noteSticker: { "knowledge-note": [
    { type: "drop-shadow", x: 0, y: 1, blur: 2, color: "main-black", opacity: 0.12 },
    { type: "drop-shadow", x: 0, y: 3, blur: 4, spread: -1, color: "main-black", opacity: 0.10 },
    { type: "drop-shadow", x: 0, y: 14, blur: 14, spread: -8, color: "main-black", opacity: 0.16 },
  ] },
};
