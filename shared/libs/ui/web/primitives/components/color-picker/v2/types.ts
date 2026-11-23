import type * as React from "react";
// Types for the PickerMenu — one component, sections and features switched on/off by props.

/** one colour to offer: a CSS colour and the name people see */
export interface PaletteColor { value: string; name?: string }

/** a named group of colours in the body; may be `addable` (a `+` opens the hex picker), may carry a slashed "No color" first slot, and may own its own onAdd/onRemove */
export interface Section {
  id: string;
  label: string;
  colors: PaletteColor[];
  /** show a slashed "No color" swatch as the first slot; clicking it sets the value to null */
  allowTransparent?: boolean;
  /** show the `+` at the end of the grid; clicking it opens the hex picker and iterates a pending colour for this section */
  addable?: boolean;
  onAdd?: (hex: string) => void;
  onRemove?: (hex: string) => void;
}

/** the trigger's look: two independent properties — an optional icon (any registry name) and an optional text (the value's name/hex or the hex alone) */
export interface TriggerLook {
  icon?: string;
  /** draw the icon as a solid shape (filled with the colour) instead of an outline; for a fill colour: a solid circle */
  solid?: boolean;
  text?: "none" | "name-or-hex" | "hex";
  /** icon stroke-width (default 2.5) */
  iconThickness?: number;
  /** icon pixel size (default 20) */
  iconSize?: number;
}

/** colour-only value: a CSS string or null (null = no colour set; the consumer decides what that means) */
export type ColorValue = string | null;
export type ColorValueMulti = string[];

/** stroke value: colour + pattern + width (used when the menu has `stroke` on) */
export type StrokePattern = "solid" | "dashed" | "dotted";
export interface StrokeValue { color: string | null; pattern: StrokePattern; width: number }

/** a named set of colours (the shape the theme's palettes use) */
export interface ColorPalette { id: string; name: string; colors: PaletteColor[] }

/** HexColorPicker — a standalone popover: SV square, hue slider, hex field */
export interface HexColorPickerProps {
  /** the trigger the consumer supplies; the popover anchors to it */
  children: React.ReactNode;
  /** the starting hex; when it changes the picker follows it */
  value?: string | null;
  /** every change while picking */
  onChange?: (hex: string) => void;
  /** confirmed (pointer up / hex field blur) */
  onCommit?: (hex: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

// ── the props schemas: what a UI document may say of each (the libraries are the registry of what a node may name) ──
import { defineProps } from "../../../../lib/define-props";
import type { PickerMenuProps } from "./picker-menu";

export const pickerMenuSchema = defineProps<PickerMenuProps>("PickerMenu", {
  trigger: { kind: "other", doc: "{ icon?, solid?, text?: none | name-or-hex | hex, iconThickness?, iconSize? }: the trigger's look" },
  sections: { kind: "other", doc: "Section[]: the colour groups, each { id, label, colors: { value, name? }[], allowTransparent?, addable? }" },
  opacity: { kind: "boolean", default: false, doc: "The opacity row" },
  stroke: { kind: "boolean", default: false, doc: "The pattern and thickness rows; the value becomes { color, pattern, width }" },
  widths: { kind: "other", doc: "[min, max] of the thickness slider (stroke only); default [0, 24]" },
  multiple: { kind: "boolean", default: false, doc: "Several colours at once (not with stroke)" },
  max: { kind: "number", doc: "The most colours (multiple only)" },
  value: { kind: "other", doc: "string | null, or string[] (multiple), or { color, pattern, width } (stroke)" },
  defaultValue: { kind: "other", doc: "As value, when the picker keeps its own" },
  onChange: { kind: "function", doc: "(value) — the chosen value" },
  placeholder: { kind: "string", default: "Pick a colour" },
  disabled: { kind: "boolean", default: false },
  footer: { kind: "node", doc: "Rows the consumer adds at the bottom of the menu" },
  label: { kind: "string", doc: "The accessible label of the trigger" },
  onAddColor: { kind: "function", doc: "({ section, hex }) — a colour was added to an addable section" },
  onRemoveColor: { kind: "function", doc: "({ section, hex }) — a colour was taken out of an addable section" },
  contentClassName: { kind: "string" },
});

export const hexColorPickerSchema = defineProps<HexColorPickerProps>("HexColorPicker", {
  children: { kind: "node", required: true, doc: "The trigger; the popover anchors to it" },
  value: { kind: "string", doc: "The starting hex" },
  onChange: { kind: "function", doc: "(hex) — every change while picking" },
  onCommit: { kind: "function", doc: "(hex) — confirmed" },
  open: { kind: "boolean" },
  onOpenChange: { kind: "function" },
  side: { kind: "enum", values: ["top", "right", "bottom", "left"] },
  align: { kind: "enum", values: ["start", "center", "end"] },
});
