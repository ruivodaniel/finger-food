// canvas v2 — the current canvas host (no library components yet; v3 is the swap). Keep this entry in step with hosts/canvas/index.ts.
export * from "./canvas-registration";
export * from "./template";
export * from "./document";
export * from "./properties/handles";
export * from "./properties/size";
export * from "./properties/highlight";
export { Canvas, type CanvasProps } from "./Canvas";
export { canvasOwnKinds } from "./nodes";
export * from "./templates";
export type { Selection } from "./tools/rules";
export { DEFAULT_SECTIONS, SOFT_SECTION, type CanvasColors, type PaletteKey } from "./style/palette";
