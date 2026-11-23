// The exploration card: a node of a diagram, readable zoomed out. Brought from entity-previewers/canvas/types.ts (CanvasCard).
import type { IconName } from "@libs/web-components";
/** the ten theme colours a card may take; the theme gives each its value (--color-<name>) */
export const CANVAS_COLORS = ["brand-1", "brand-2", "brand-3", "brand-4", "content-blue-standard", "content-green-standard", "content-orange-standard", "content-purple-standard", "content-red-standard", "content-yellow-standard"] as const;
export type CanvasColor = (typeof CANVAS_COLORS)[number];
export type CanvasCard = { id: string; title: string; description?: string; /** a longer note, shown only on hover or in the expanded layout */ note?: string; icon?: IconName; image?: string; color?: CanvasColor };
