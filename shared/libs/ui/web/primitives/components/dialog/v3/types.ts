import type * as React from "react";
import type * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ElementProps, ScaleOf } from "../../../../../types/elements";
import { defineProps } from "../../../../lib/define-props";
import { axesSchema } from "../../../../lib/axes-schema";
import type { AxisName } from "../../../../lib/axes";

/** Named alias kept for consumers; the values come from the dialog row. */
export type DialogScale = ScaleOf<"dialog">;

// overlay--dialog: the floating panel. Its axes come from the dialog row.
export interface DialogContentOwnProps extends ElementProps<"dialog"> {
}
export type DialogContentProps = DialogContentOwnProps & Omit<React.ComponentProps<typeof DialogPrimitive.Content>, keyof DialogContentOwnProps | AxisName>;

export const dialogContentSchema = defineProps<DialogContentOwnProps>("DialogContent", {
  ...axesSchema("dialog"),
});

// the close of a dialog: a small secondary icon button at the right of its header stands inside it
export const dialogCloseSchema = defineProps<{ asChild?: boolean }>("DialogClose", { asChild: { kind: "boolean", default: false, doc: "The child is the control that closes" } });
