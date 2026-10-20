import type * as React from "react";

import type { ElementProps } from "../../../../../types/elements";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { defineProps } from "../../lib/define-props";
import type { AxisName } from "../../lib/axes";
import { axesSchema } from "../../lib/axes-schema";

// ── Dropdown-menu-specific vocabulary ───────────────────────────────────────

export const DROPDOWN_MENU_ITEM_VARIANTS = ["default", "destructive"] as const;
export type DropdownMenuItemVariant = (typeof DROPDOWN_MENU_ITEM_VARIANTS)[number];

// ── DropdownMenuContent ─────────────────────────────────────────────────────

export interface DropdownMenuContentOwnProps extends ElementProps<"dropdownMenu"> {
  /** Offset from the trigger in pixels (default: 4) */
  sideOffset?: number;
}

export type DropdownMenuContentProps = DropdownMenuContentOwnProps & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Content>, keyof DropdownMenuContentOwnProps | AxisName>;

export const dropdownMenuContentSchema = defineProps<DropdownMenuContentOwnProps>("DropdownMenuContent", {
  ...axesSchema("dropdownMenu"),
  sideOffset: { kind: "number", default: 4, doc: "Offset from the trigger in pixels" },
});

// ── DropdownMenuItem ────────────────────────────────────────────────────────

export interface DropdownMenuItemOwnProps extends ElementProps<"menuItem"> {
  /** Whether the item is inset (extra left padding for alignment) */
  inset?: boolean;
  /** Semantic variant — destructive items get status="destructive" (default: "default") */
  variant?: DropdownMenuItemVariant;
}

export type DropdownMenuItemProps = DropdownMenuItemOwnProps & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Item>, keyof DropdownMenuItemOwnProps | AxisName>;

export const dropdownMenuItemSchema = defineProps<DropdownMenuItemOwnProps>("DropdownMenuItem", {
  ...axesSchema("menuItem"),
  inset: { kind: "boolean", default: false, doc: "Extra left padding for alignment" },
  variant: { kind: "enum", values: DROPDOWN_MENU_ITEM_VARIANTS, default: "default", doc: "Destructive items get status=destructive" },
});

// ── The other items and the sub content: elements like the ones above ───────
export interface DropdownMenuCheckboxItemOwnProps extends ElementProps<"menuItem"> {}
export type DropdownMenuCheckboxItemProps = DropdownMenuCheckboxItemOwnProps & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>, keyof DropdownMenuCheckboxItemOwnProps | AxisName>;
export interface DropdownMenuRadioItemOwnProps extends ElementProps<"menuItem"> {}
export type DropdownMenuRadioItemProps = DropdownMenuRadioItemOwnProps & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>, keyof DropdownMenuRadioItemOwnProps | AxisName>;
export interface DropdownMenuSubTriggerOwnProps extends ElementProps<"menuItem"> {
  /** Whether the trigger is inset (extra left padding for alignment) */
  inset?: boolean;
}
export type DropdownMenuSubTriggerProps = DropdownMenuSubTriggerOwnProps & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>, keyof DropdownMenuSubTriggerOwnProps | AxisName>;
export interface DropdownMenuSubContentOwnProps extends ElementProps<"dropdownMenu"> {}
export type DropdownMenuSubContentProps = DropdownMenuSubContentOwnProps & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>, keyof DropdownMenuSubContentOwnProps | AxisName>;


export const dropdownMenuCheckboxItemSchema = defineProps<DropdownMenuCheckboxItemOwnProps>("DropdownMenuCheckboxItem", axesSchema("menuItem"));
export const dropdownMenuRadioItemSchema = defineProps<DropdownMenuRadioItemOwnProps>("DropdownMenuRadioItem", axesSchema("menuItem"));
export const dropdownMenuSubTriggerSchema = defineProps<DropdownMenuSubTriggerOwnProps>("DropdownMenuSubTrigger", { ...axesSchema("menuItem"), inset: { kind: "boolean", default: false, doc: "Extra left padding for alignment" } });
export const dropdownMenuSubContentSchema = defineProps<DropdownMenuSubContentOwnProps>("DropdownMenuSubContent", axesSchema("dropdownMenu"));
