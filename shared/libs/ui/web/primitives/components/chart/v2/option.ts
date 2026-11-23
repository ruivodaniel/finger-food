// From the props and the theme to an ECharts option. One place: every look decision here reads the theme, never a literal.
import type { EChartsOption, SeriesOption } from "echarts";
import { processNumber, type NumberConfig } from "@libs/data-processor";
import type { ChartTheme } from "../../../../lib/chart-theme";
import type { ChartEvent, ChartKind, ChartProps, ChartSeries } from "./types";

const FULL: NumberConfig = { mode: { kind: "compactMax", n: 3 } };
export const fmt = (v: unknown, config?: NumberConfig) => {
  if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) return "";
  const o = processNumber({ value: v as number }, config ?? FULL);
  return `${o.value}${o.unit ? ` ${o.unit}` : ""}`;
};

/** the colour of a series: its status, else its place in the palette */
export const seriesColor = (s: ChartSeries, i: number, t: ChartTheme) => (s.status && s.status !== "neutral" ? t.status[s.status as keyof ChartTheme["status"]] : t.series[i % t.series.length]);

const CARTESIAN: ChartKind[] = ["line", "area", "bar", "column", "scatter", "bubble", "boxplot", "heatmap", "candlestick", "events"];
const echartsType = (k: ChartKind): string => ({ line: "line", area: "line", bar: "bar", column: "bar", scatter: "scatter", bubble: "scatter", boxplot: "boxplot", pie: "pie", donut: "pie", treemap: "treemap", radar: "radar", heatmap: "heatmap", candlestick: "candlestick", events: "scatter" }[k]);

export type Anchor = { dataIndex: number; category: string | number };
export function buildOption(p: ChartProps, t: ChartTheme, hidden: Set<string>, anchors: Anchor[] = []): EChartsOption {
  const { kind, series, categories, time, xLabels, stack = "none", axes = "both", grid = true, zoom = "none", window: win, brush, format, format2, option } = p;
  const cartesian = CARTESIAN.includes(kind);
  const horizontal = kind === "bar";
  const label = { color: t.label, fontFamily: t.font, fontSize: t.fontSize };
  const axisLine = { lineStyle: { color: t.ink } };
  const splitLine = { show: grid, lineStyle: { color: t.inkSoft } };
  const categoryAxis = { type: time ? "time" : "category", data: time ? undefined : categories, axisLine, axisTick: { lineStyle: { color: t.ink } }, axisLabel: label, splitLine: { show: false }, boundaryGap: kind === "column" || kind === "bar" || kind === "candlestick" || kind === "boxplot" };
  const valueAxis = (f?: NumberConfig) => ({ type: "value", scale: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...label, formatter: (v: number) => fmt(v, f) }, splitLine });
  // a scatter or bubble: x is a value; with xLabels, ticks at the integers named by them (a population grouped by category)
  const pointX = kind === "scatter" || kind === "bubble";
  const isEvents = kind === "events";
  // events: each lane is a scatter at y = its index; several events at one x merge into one marker, sized by the count
  const laneData = (s: ChartSeries, lane: number) => {
    const by = new Map<number, ChartEvent[]>();
    for (const e of (s.data as ChartEvent[])) { const x = typeof e.at === "number" ? e.at : (categories ?? []).indexOf(e.at); if (x < 0) continue; (by.get(x) ?? by.set(x, []).get(x)!).push(e); }
    return [...by.entries()].map(([x, evs]) => ({ value: [x, s.name], events: evs, symbolSize: 6 + Math.min(evs.length - 1, 4) * 3 }));
  };
  const groupAxis = xLabels ? { type: "value", min: -0.5, max: xLabels.length - 0.5, interval: 1, axisLine, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { ...label, formatter: (v: number) => xLabels[Math.round(v)] ?? "" } } : { ...valueAxis(), splitLine: { show: false } };
  const twoY = series.some((s) => s.yAxis === 1);

  const built: SeriesOption[] = series.map((s, i) => {
    const color = seriesColor(s, i, t);
    const k = s.kind ?? kind;
    // the hover focus (the rest fades) only where a series is a part of a whole: stacked areas, pie, treemap, radar. On a plain line or a bar it reads as an error
    const focus = stack !== "none" || k === "pie" || k === "donut" || k === "treemap" || k === "radar" ? { focus: "series" } : { focus: "none" };
    const base: Record<string, unknown> = { id: s.key, name: s.name, type: echartsType(k), data: s.data, color, itemStyle: { color }, emphasis: focus };
    if (s.yAxis === 1) base.yAxisIndex = 1;
    if (k === "line" || k === "area") Object.assign(base, { showSymbol: false, symbol: "circle", symbolSize: 6, lineStyle: { width: t.stroke, color }, smooth: false, ...(k === "area" ? { areaStyle: { color, opacity: 0.18 } } : {}) });
    if (k === "bar" || k === "column") Object.assign(base, { barMaxWidth: 28 });
    if (k === "bubble") Object.assign(base, { symbolSize: (d: number[]) => Math.sqrt(Math.abs(d[2] ?? 10)) * 4 });
    if (k === "scatter") Object.assign(base, { symbolSize: 8 });
    if (k === "events") Object.assign(base, { data: laneData(s, i), symbol: "rect", symbolSize: (_: unknown, q: { data: { symbolSize: number } }) => q.data.symbolSize, emphasis: { scale: 1.6, focus: "none" }, cursor: "pointer", z: 3,
      // every lane's line, drawn once (on the first series): through its markers, under them; the axis pointer's line crosses them
      ...(i === 0 ? { markLine: { symbol: "none", silent: true, animation: false, lineStyle: { color: t.inkSoft, width: 1, type: "solid" }, label: { show: false }, data: series.map((x) => ({ yAxis: x.name })), z: 1 } } : {}) });
    if (k === "pie" || k === "donut") Object.assign(base, { radius: k === "donut" ? ["42%", "62%"] : "58%", center: ["50%", "50%"], label: { ...label, formatter: "{b}", overflow: "none" }, labelLine: { lineStyle: { color: t.ink }, length: 12, length2: 10 }, color: undefined, itemStyle: undefined });
    if (k === "treemap") Object.assign(base, { roam: false, nodeClick: "zoomToNode", leafDepth: 1, breadcrumb: { show: true, bottom: 4, left: 4, itemStyle: { color: t.inkSoft, textStyle: { color: t.label, fontFamily: t.font, fontSize: t.fontSize } } }, label: { ...label, color: "#fff", fontSize: t.fontSize, formatter: "{b}" }, upperLabel: { show: false }, itemStyle: { borderColor: t.bg === "transparent" ? "#fff" : t.bg, borderWidth: 2, gapWidth: 2 }, levels: [{ itemStyle: { gapWidth: 3 } }, { colorSaturation: [0.35, 0.6], itemStyle: { gapWidth: 1 } }], color: t.series, width: "100%", height: "100%", top: 0, left: 0, right: 0, bottom: 28 });
    if (k === "radar") Object.assign(base, { areaStyle: { opacity: 0.15 }, lineStyle: { width: t.stroke } });
    if (k === "candlestick") Object.assign(base, { itemStyle: { color: t.status.success, color0: t.status.error, borderColor: t.status.success, borderColor0: t.status.error } });
    if (stack !== "none" && (k === "line" || k === "area" || k === "bar" || k === "column")) base.stack = "total";
    // the anchors: a ring on every series at the pinned index, numbered
    if (anchors.length && (k === "line" || k === "area" || k === "bar" || k === "column") && Array.isArray(s.data)) {
      base.markPoint = { symbol: "circle", symbolSize: 14, itemStyle: { color: t.bg === "transparent" ? "#fff" : t.bg, borderColor: color, borderWidth: 2 }, label: { show: true, color, fontFamily: t.font, fontSize: 9, fontWeight: 700, formatter: (q: { data: { n: number } }) => String(q.data.n) }, emphasis: { disabled: true }, silent: true,
        data: anchors.map((a, n) => ({ n: n + 1, coord: [a.dataIndex, (s.data as (number | null)[])[a.dataIndex]] })) };
      base.markLine = { symbol: "none", silent: true, lineStyle: { color: t.ink, type: "dashed", width: 1, opacity: 0.6 }, label: { show: false }, data: anchors.map((a) => ({ xAxis: a.dataIndex })) };
    }
    return base as SeriesOption;
  });

  const o: EChartsOption = {
    backgroundColor: t.bg,
    animation: true,
    animationDuration: 300,
    color: t.series,
    textStyle: { fontFamily: t.font, color: t.label },
    legend: { show: false },
    // the tooltip is ours by default: the engine's is hidden and the axis pointer kept, so hover still shows the cross
    tooltip: { show: true, trigger: cartesian && !isEvents ? "axis" : "item", triggerOn: "mousemove", showDelay: 0, hideDelay: 50, axisPointer: { type: isEvents ? "line" : kind === "column" || kind === "bar" ? "shadow" : "cross", axis: isEvents ? "x" : "auto", show: true, label: { backgroundColor: t.ink, color: "#fff", fontFamily: t.font, fontSize: t.fontSize } }, formatter: () => "", backgroundColor: "transparent", borderWidth: 0, padding: 0, extraCssText: "box-shadow:none;pointer-events:none;" },
    // the grid keeps the axis labels inside the box (ECharts 6's form of containLabel)
    grid: cartesian ? (p.gutter ? { left: p.gutter, right: twoY ? 12 : 24, top: isEvents ? 8 : 16, bottom: zoom === "slider" ? 92 : 12, containLabel: false } : { left: 12, right: twoY ? 12 : 24, top: isEvents ? 8 : 16, bottom: zoom === "slider" ? 92 : 12, containLabel: true }) : undefined,
    xAxis: cartesian ? (horizontal ? valueAxis(format) : pointX ? groupAxis : isEvents ? { ...categoryAxis, type: "value", min: 0, max: Math.max(0, (categories?.length ?? 1) - 1), axisLabel: { ...label, formatter: (v: number) => String(categories?.[Math.round(v)] ?? "") }, splitLine: { show: false }, data: undefined, axisPointer: { show: true, type: "line", label: { show: false } } } : categoryAxis) : undefined,
    yAxis: cartesian ? (horizontal ? categoryAxis : isEvents ? { type: "category", data: series.map((x) => x.name), inverse: true, boundaryGap: true, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { ...label } } : (twoY ? [valueAxis(format), { ...valueAxis(format2 ?? format), splitLine: { show: false } }] : valueAxis(format))) : undefined,
    radar: kind === "radar" ? { indicator: (categories ?? []).map((c) => ({ name: String(c) })), axisName: label, splitLine: { lineStyle: { color: t.inkSoft } }, splitArea: { show: false }, axisLine: { lineStyle: { color: t.inkSoft } } } : undefined,
    // a linked chart carries both zooms with the same ids as its peers (connect forwards a zoom only to a zoom of the same id); the slider is shown only where asked
    dataZoom: cartesian && (zoom !== "none" || p.linked) ? [
      { id: "zoom-inside", type: "inside", start: win?.[0] ?? 0, end: win?.[1] ?? 100, filterMode: "none", disabled: zoom === "none" },
      ...(zoom === "slider" || p.linked ? [{ id: "zoom-slider", type: "slider" as const, show: zoom === "slider", start: win?.[0] ?? 0, end: win?.[1] ?? 100, height: 36, bottom: 24, borderColor: t.inkSoft, fillerColor: t.inkSoft, handleSize: "100%", handleStyle: { color: t.ink, borderColor: t.ink }, moveHandleSize: 0, showDetail: false, textStyle: label, brushSelect: true, dataBackground: { lineStyle: { color: t.ink, width: 1 }, areaStyle: { color: t.inkSoft } }, selectedDataBackground: { lineStyle: { color: t.ink, width: 1 }, areaStyle: { color: t.ink, opacity: 0.2 } } }] : []),
    ] : undefined,
    brush: brush ? { toolbox: ["rect", "clear"], xAxisIndex: 0, brushStyle: { color: t.inkSoft, borderColor: t.ink } } : undefined,
    // under the slider: the whole range as a thin axis of its own, labelled by the coarse part of the category (the year in "W12 2015")
    ...(cartesian && zoom === "slider" && !horizontal && categories ? { graphic: sliderAxis(categories, t) } : {}),
    series: built,
    ...(axes === "none" || axes === "y" ? { xAxis: cartesian ? { ...(horizontal ? valueAxis(format) : categoryAxis), show: false } : undefined } : {}),
    ...(axes === "none" || axes === "x" ? { yAxis: cartesian ? { ...(horizontal ? categoryAxis : valueAxis(format)), show: false } : undefined } : {}),
  } as EChartsOption;
  const merged = option ? deepMerge(o as Record<string, unknown>, option as Record<string, unknown>) : o;
  // hidden series: the legend's doing, applied as the engine's legend selection
  (merged as Record<string, unknown>).legend = { show: false, selected: Object.fromEntries(series.map((s) => [s.name, !hidden.has(s.key)])) };
  return merged as EChartsOption;
}

/** the coarse labels of the whole range (the last word of each category, de-duplicated: the years), spread under the slider */
function sliderAxis(categories: (string | number)[], t: ChartTheme) {
  const coarse = categories.map((c) => String(c).split(" ").pop() ?? String(c));
  const marks: { at: number; text: string }[] = [];
  coarse.forEach((y, i) => { if (i === 0 || y !== coarse[i - 1]) marks.push({ at: i / Math.max(1, categories.length - 1), text: y }); });
  const n = categories.length;
  return { elements: marks.map((m, i) => ({ type: "text", left: `${(8 + m.at * 84).toFixed(2)}%`, bottom: 6, style: { text: m.text, fill: t.label, font: `${t.fontSize}px ${t.font}` }, silent: true, z: 100, id: `slider-axis-${i}-${n}` })) };
}

function deepMerge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && cur && typeof cur === "object" && !Array.isArray(cur) ? deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
}
