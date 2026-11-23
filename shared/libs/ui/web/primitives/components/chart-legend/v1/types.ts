import type { Emphasis } from "../../../../../types/axes";
import { EMPHASIS } from "../../../../../types/axes";
import { defineProps } from "../../../../lib/define-props";

export type ChartLegendLayout = "row" | "column" | "grid";
export type ChartLegendValues = "none" | "last";

/** ChartLegend — a list of a chart's series: swatch and name, a value if asked; a click toggles the series on the chart it is bound to. Placed by the pattern, never by the chart. */
export interface ChartLegendProps {
  /** the chart's id */
  for: string;
  layout?: ChartLegendLayout;
  /** a data-number beside each name: the series' last value */
  values?: ChartLegendValues;
  /** click toggles, hover highlights (default true) */
  interactive?: boolean;
  scale?: "sm" | "md";
  emphasis?: Emphasis;
  concept?: string;
}

export const chartLegendSchema = defineProps<ChartLegendProps>("ChartLegend", {
  for: { kind: "string", required: true, doc: "the chart's id" },
  layout: { kind: "enum", values: ["row", "column", "grid"], default: "row" },
  values: { kind: "enum", values: ["none", "last"], default: "none" },
  interactive: { kind: "boolean", default: true },
  scale: { kind: "enum", values: ["sm", "md"], default: "md" },
  emphasis: { kind: "enum", values: EMPHASIS },
  concept: { kind: "string" },
});
