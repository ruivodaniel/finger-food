import type * as React from "react";
import type { Emphasis } from "../../../../../types/axes";
import { EMPHASIS } from "../../../../../types/axes";
import { defineProps } from "../../../../lib/define-props";

/** a preset window: a label and the percentage range it sets on the chart's zoom ([95, 100] is the last 5 %) */
export type ChartToolbarPreset = { label: string; window: [number, number] };

/**
 * ChartToolbar — the controls of a chart, ours: presets that set the zoom window, a reset, an export, and whatever the product puts in `children`.
 * Bound to one chart (or a linked group) by id; placed by the pattern.
 */
export interface ChartToolbarProps {
  /** the chart's id, or several */
  for: string | string[];
  presets?: ChartToolbarPreset[];
  /** the preset selected at first (its label) */
  defaultPreset?: string;
  /** a reset button: the whole range */
  reset?: boolean;
  /** an export button: the chart as a PNG (canvas) or SVG, downloaded */
  export?: boolean;
  /** the product's own controls */
  children?: React.ReactNode;
  onWindow?: (window: [number, number]) => void;
  scale?: "sm" | "md";
  emphasis?: Emphasis;
  concept?: string;
}

export const chartToolbarSchema = defineProps<Omit<ChartToolbarProps, "children" | "onWindow" | "presets" | "for">>("ChartToolbar", {
  defaultPreset: { kind: "string" },
  reset: { kind: "boolean", default: true },
  export: { kind: "boolean", default: false },
  scale: { kind: "enum", values: ["sm", "md"], default: "md" },
  emphasis: { kind: "enum", values: EMPHASIS },
  concept: { kind: "string" },
});
