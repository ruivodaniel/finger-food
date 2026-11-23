import type { NumberConfig } from "@libs/data-processor";
import type { Emphasis, Status } from "../../../../../types/axes";
import { EMPHASIS, STATUS } from "../../../../../types/axes";
import { defineProps } from "../../../../lib/define-props";

export const MICRO_CHART_KINDS = ["sparkline", "bars", "bullet", "win-loss"] as const;
export type MicroChartKind = (typeof MICRO_CHART_KINDS)[number];
export type MicroChartScale = "xs" | "sm" | "md" | "lg";

/**
 * MicroChart — a word-sized chart, SVG, from @microcharts/react: a sparkline, bars, a bullet, a win/loss strip. Nothing around it: no axes, no legend.
 * Sized by the text: the height follows the scale, the width is the instance's. Hundreds fit in a table.
 * The theme gives the colours (the chart variables); status colours the series; emphasis is the stroke weight and whether the area fills.
 */
export interface MicroChartProps {
  kind: MicroChartKind;
  /** the series (sparkline, bars, win-loss: the sign is the result) */
  data?: (number | null)[];
  /** bullet: the value against a target */
  value?: number;
  target?: number;
  /** bullet: the qualitative bands, ascending */
  bands?: number[];
  /** pins the scale, so a column of sparklines shares one */
  range?: [number, number];
  /** dots on the line: the last point, the extremes, none */
  marker?: "last" | "min-max" | "none";
  /** a flat line at this value: a target, zero */
  baseline?: number;
  /** anchors: a click pins a point; the tooltip then shows the hovered value with its delta to each anchor. How many may be pinned (max 3). Sparkline and bars only. Default off */
  anchors?: false | 1 | 2 | 3;
  /** on hover, a data-tooltip with the point as a data-number (default true) */
  tooltip?: boolean;
  format?: NumberConfig;
  symbol?: string;
  /** px (default 96) */
  width?: number;
  scale?: MicroChartScale;
  emphasis?: Emphasis;
  status?: Status;
  concept?: string;
}

export const microChartSchema = defineProps<Omit<MicroChartProps, "data" | "bands" | "range" | "format">>("MicroChart", {
  kind: { kind: "enum", values: MICRO_CHART_KINDS, required: true },
  value: { kind: "number", doc: "bullet: the value" },
  target: { kind: "number", doc: "bullet: the target" },
  marker: { kind: "enum", values: ["last", "min-max", "none"], default: "last" },
  baseline: { kind: "number" },
  tooltip: { kind: "boolean", default: true },
  anchors: { kind: "other", doc: "false | 1 | 2 | 3: points a click may pin; the tooltip shows the delta to each" },
  symbol: { kind: "string" },
  width: { kind: "number", default: 96 },
  scale: { kind: "enum", values: ["xs", "sm", "md", "lg"], default: "md" },
  emphasis: { kind: "enum", values: EMPHASIS },
  status: { kind: "enum", values: STATUS },
  concept: { kind: "string" },
});
