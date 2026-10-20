import type * as React from "react";
import type * as SheetPrimitive from "@radix-ui/react-dialog";
import type { ElementProps, ScaleOf } from "../../../../../types/elements";
import { defineProps } from "../../lib/define-props";
import { axesSchema } from "../../lib/axes-schema";
import type { AxisName } from "../../lib/axes";

export const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;
export type SheetSide = (typeof SHEET_SIDES)[number];

/** Named alias kept for consumers; the values come from the sheet row. */
export type SheetScale = ScaleOf<"sheet">;

// overlay--sheet: the drawer. Its axes come from the sheet row.
export interface SheetContentOwnProps extends ElementProps<"sheet"> {
  /** Which edge the drawer slides from (default: "right") */
  side?: SheetSide;
  /** Whether clicking outside or pressing Escape closes the sheet (default: true) */
  dismissible?: boolean;
}
export type SheetContentProps = SheetContentOwnProps & Omit<React.ComponentProps<typeof SheetPrimitive.Content>, keyof SheetContentOwnProps | AxisName>;

export const sheetContentSchema = defineProps<SheetContentOwnProps>("SheetContent", {
  ...axesSchema("sheet"),
  side: { kind: "enum", values: SHEET_SIDES, default: "right", doc: "Edge the drawer slides from" },
  dismissible: { kind: "boolean", default: true, doc: "Outside click or Escape closes it" },
});
