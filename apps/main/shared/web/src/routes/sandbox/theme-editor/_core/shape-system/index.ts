// =============================================================================
// Shape system barrel — single import point for the property panel.
// =============================================================================

export type { ShapeId, ShapeEditor, ShapeEditorProps } from "./ShapeId";
export {
  selectionToPath,
  resolveShape,
  resolveInheritedPath,
  readPath,
} from "./resolve";
export { lookupEditor } from "./registry";
export { UnsupportedShape } from "./UnsupportedShape";
