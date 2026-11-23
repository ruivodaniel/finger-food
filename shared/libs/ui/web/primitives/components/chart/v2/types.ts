import type * as React from "react";
import type { EChartsOption } from "echarts";
import type { NumberConfig } from "@libs/data-processor";
import type { Emphasis, Status } from "../../../../../types/axes";
import { EMPHASIS, STATUS } from "../../../../../types/axes";
import { defineProps } from "../../../../lib/define-props";

export const CHART_KINDS = ["line", "area", "bar", "column", "scatter", "bubble", "boxplot", "pie", "donut", "treemap", "radar", "heatmap", "candlestick", "events"] as const;
export type ChartKind = (typeof CHART_KINDS)[number];
export type ChartScale = "sm" | "md" | "lg";
export type ChartRenderer = "canvas" | "svg";
export type ChartZoom = "none" | "inside" | "slider";
export type ChartAxes = "both" | "x" | "y" | "none";
export type ChartStack = "none" | "normal" | "percent";

/** one series: its data, its name, and optionally a status that gives it that colour instead of the palette's */
/** one event on a timeline lane: at a category index (or a time), with whatever the product attaches (a news item, a report) */
export type ChartEvent = { at: number | string; payload?: unknown };

export interface ChartSeries {
  key: string;
  name: string;
  /** values by category, or [x, y] / [x, y, size] points for scatter and bubble, or [open, close, low, high] for candlestick; for events, the lane's events */
  data: (number | null)[] | (number | null)[][] | { name: string; value: number; children?: unknown[] }[] | ChartEvent[];
  status?: Status;
  /** a kind of its own, for a mixed chart (bars with a line) */
  kind?: ChartKind;
  /** a second y axis (right) */
  yAxis?: 0 | 1;
}

/** one hovered point, handed to the tooltip render and to onHover */
export type ChartPoint = { seriesKey: string; seriesName: string; color: string; category: string | number; value: number | (number | null)[]; dataIndex: number; /** events: the events under the hovered marker */ events?: ChartEvent[] };

/**
 * Chart — the plot only, drawn by Apache ECharts. Series, axes, grid, zoom and brush; no legend and no toolbar inside it:
 * ChartLegend and ChartToolbar are their own components, bound to this one by its `id`. The instance decides what is drawn;
 * the theme decides how it looks: the component reads the theme's chart variables and builds the engine theme from them.
 */
export interface ChartProps {
  /** names the chart: a legend, a toolbar or another chart binds to it */
  id?: string;
  // ── data
  kind: ChartKind;
  series: ChartSeries[];
  /** the x axis values: categories or times. Not needed for scatter, pie, treemap, radar */
  categories?: (string | number)[];
  /** the x axis is time: the categories are ISO strings or timestamps */
  time?: boolean;
  /** a fixed width for the left label gutter, so charts stacked in a pattern line up their x axes (default: as wide as the labels) */
  gutter?: number;
  /** events: the lane height in px (default 28); the plot height follows the number of lanes */
  laneHeight?: number;
  /** a scatter whose x is a group index (0, 1, 2…): these name the groups on the x axis; the points keep their jitter */
  xLabels?: string[];
  stack?: ChartStack;
  // ── parts
  axes?: ChartAxes;
  grid?: boolean;
  /** our tooltip (default): a data-tooltip at the axis pointer with one data-number per series. false: none. "engine": ECharts' own, themed. A render: the content, from the hovered points */
  tooltip?: boolean | "engine" | ((points: ChartPoint[]) => React.ReactNode);
  /** how the values are formatted, in the axis labels and the tooltip (the processor formats, not the engine) */
  format?: NumberConfig;
  /** the format of the second y axis, when a series uses it */
  format2?: NumberConfig;
  symbol?: string;
  // ── behaviour
  renderer?: ChartRenderer;
  zoom?: ChartZoom;
  /** the window shown at first: [from, to] as percentages 0..100 (Alix's "last 5 %": [95, 100]) */
  window?: [number, number];
  brush?: boolean;
  /** the id (or group name) of a chart to share zoom and axis pointer with (ECharts connect) */
  linked?: string;
  onRange?: (from: number, to: number) => void;
  onHover?: (points: ChartPoint[] | null) => void;
  onClick?: (point: ChartPoint) => void;
  /** anchors: a click on a point pins it; the tooltip then shows every hovered value with its delta to each anchor (absolute, relative). The number is how many may be pinned (max 3). Line, area, bar, column only. Default off */
  anchors?: false | 1 | 2 | 3;
  /** a partial ECharts option merged last: anything the props do not cover. The door, not the road */
  option?: EChartsOption;
  /** the plot's height (default 280); width follows the box */
  height?: number | string;
  // ── look: the axes, on the root
  scale?: ChartScale;
  emphasis?: Emphasis;
  status?: Status;
  concept?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const chartSchema = defineProps<Omit<ChartProps, "series" | "categories" | "xLabels" | "tooltip" | "format" | "format2" | "option" | "onRange" | "onHover" | "onClick" | "className" | "style" | "window">>("Chart", {
  id: { kind: "string", doc: "names the chart; a legend, a toolbar or another chart binds to it" },
  kind: { kind: "enum", values: CHART_KINDS, required: true },
  time: { kind: "boolean", default: false, doc: "the x axis is time" },
  stack: { kind: "enum", values: ["none", "normal", "percent"], default: "none" },
  axes: { kind: "enum", values: ["both", "x", "y", "none"], default: "both" },
  grid: { kind: "boolean", default: true },
  symbol: { kind: "string", doc: "what the values count, shown in the tooltip's numbers" },
  renderer: { kind: "enum", values: ["canvas", "svg"], default: "canvas" },
  zoom: { kind: "enum", values: ["none", "inside", "slider"], default: "none" },
  brush: { kind: "boolean", default: false },
  anchors: { kind: "other", doc: "false | 1 | 2 | 3: points a click may pin; the tooltip shows the delta to each" },
  laneHeight: { kind: "number", doc: "events: the height of one lane in px (default 28)" },
  gutter: { kind: "number", doc: "a fixed left label gutter in px, so stacked charts align" },
  linked: { kind: "string", doc: "the id of a chart to share zoom and axis pointer with" },
  height: { kind: "other", doc: "px or a CSS length (default 280)" },
  scale: { kind: "enum", values: ["sm", "md", "lg"], default: "md" },
  emphasis: { kind: "enum", values: EMPHASIS },
  status: { kind: "enum", values: STATUS },
  concept: { kind: "string" },
});
