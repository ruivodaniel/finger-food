"use client";
import * as React from "react";
import * as echarts from "echarts/core";
import { BarChart, BoxplotChart, CandlestickChart, HeatmapChart, LineChart, PieChart, RadarChart, ScatterChart, TreemapChart } from "echarts/charts";
import { AxisPointerComponent, BrushComponent, DataZoomComponent, GraphicComponent, GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, RadarComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import type { EChartsType } from "echarts/core";
import type { NumberConfig } from "@libs/data-processor";
import { axisAttrs } from "../../../../lib/axes";
import { useChartTheme } from "../../../../lib/chart-theme";
import { DataNumber } from "../../data-number/v2/data-number";
import { DataTooltipSurface } from "../../data-tooltip/v1/data-tooltip";
import { Stack } from "../../stack/v1/stack";
import { Text } from "../../text/v1/text";
import { buildOption, fmt, seriesColor, type Anchor } from "./option";
import { Button } from "../../button/v1/button";
import { chartRegistry } from "./registry";
import type { ChartEvent, ChartPoint, ChartProps, ChartSeries } from "./types";

if (typeof window !== "undefined") (window as unknown as { __charts?: unknown }).__charts = chartRegistry;
echarts.use([LineChart, BarChart, ScatterChart, BoxplotChart, PieChart, TreemapChart, RadarChart, HeatmapChart, CandlestickChart, GridComponent, GraphicComponent, MarkPointComponent, MarkLineComponent, TooltipComponent, AxisPointerComponent, DataZoomComponent, BrushComponent, LegendComponent, RadarComponent, VisualMapComponent, CanvasRenderer, SVGRenderer]);

type Param = { seriesId?: string; seriesName?: string; color?: unknown; name?: string; axisValue?: string | number; value: unknown; dataIndex: number; data?: { events?: ChartEvent[]; value?: unknown } };
const toPoints = (params: Param | Param[]): ChartPoint[] => (Array.isArray(params) ? params : [params]).map((q) => ({ seriesKey: String(q.seriesId ?? q.seriesName), seriesName: String(q.seriesName ?? ""), color: typeof q.color === "string" ? q.color : "", category: q.axisValue ?? q.name ?? "", value: q.value as number, dataIndex: q.dataIndex, ...(q.data?.events ? { events: q.data.events } : {}) }));

const valueAt = (s: ChartSeries, i: number): number | null => { const d = s.data as unknown[]; const v = d[i]; if (v === null || v === undefined) return null; if (Array.isArray(v)) return (v[v.length - 1] as number) ?? null; if (typeof v === "object") return (v as { value: number }).value ?? null; return v as number; };
const REL: NumberConfig = { mode: { kind: "fixedScale", scale: "unit", n: 1 }, representation: { kind: "percentage", input: "points" } };

/** our tooltip body: the category, then one data-number per series; with anchors, under each value the delta to every anchor (absolute, relative) */
function DefaultTip({ points, p, anchors }: { points: ChartPoint[]; p: ChartProps; anchors: Anchor[] }) {
  if (p.kind === "events") {
    const pt = points[0]; const evs = pt?.events ?? []; const x = Array.isArray(pt?.value) ? (pt.value as number[])[0] : undefined;
    return <DataTooltipSurface header={<Text type="body-small">{pt?.seriesName}</Text>} content={<Text type="body-small" emphasis="quiet">{`${evs.length} ${evs.length === 1 ? "event" : "events"}${x !== undefined ? ` · ${String(p.categories?.[x] ?? x)}` : ""}`}</Text>} />;
  }
  const label = points[0]?.category;
  const sign = (d: number): "success" | "error" | "neutral" => (d > 0 ? "success" : d < 0 ? "error" : "neutral");
  return (
    <DataTooltipSurface header={label !== undefined && label !== "" ? <Text type="body-small">{String(label)}</Text> : undefined} content={
      <Stack dir="col" gap={6}>
        {points.map((pt, i) => {
          const v = Array.isArray(pt.value) ? pt.value[pt.value.length - 1] : pt.value;
          const series = p.series.find((s) => s.key === pt.seriesKey);
          return (
            <Stack key={`${pt.seriesKey}:${pt.dataIndex}:${i}`} dir="col" gap={2}>
              <Stack dir="row" gap={12} justify="between" align="baseline">
                <Stack dir="row" gap={6} align="center"><span style={{ width: 8, height: 8, borderRadius: 2, background: pt.color, display: "inline-block" }} /><Text type="body-small" emphasis="quiet">{pt.seriesName}</Text></Stack>
                <DataNumber value={v as number} config={p.format} symbol={p.symbol} scale="sm" tooltip={false} />
              </Stack>
              {series && anchors.map((a, n) => {
                const base = valueAt(series, a.dataIndex); const cur = v as number | null;
                if (base === null || cur === null || a.dataIndex === pt.dataIndex) return null;
                const abs = cur - base; const rel = base === 0 ? null : (abs / Math.abs(base)) * 100;
                return (
                  <Stack key={n} dir="row" gap={12} justify="between" align="baseline" style={{ paddingLeft: 14 }}>
                    <Text type="body-extra-small" emphasis="quiet">{`vs ${n + 1} · ${String(a.category)}`}</Text>
                    <Stack dir="row" gap={8} align="baseline">
                      <DataNumber value={abs} config={p.format} scale="xs" status={sign(abs)} trend={abs > 0 ? "arrowUp" : abs < 0 ? "arrowDown" : undefined} tooltip={false} />
                      {rel !== null ? <DataNumber value={rel} config={REL} scale="xs" status={sign(abs)} tooltip={false} /> : null}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </Stack>
    } />
  );
}

function Chart(p: ChartProps) {
  const { id, renderer = "canvas", linked, tooltip = true, onRange, onHover, onClick, scale = "md", emphasis, status, concept, className, style } = p;
  const height = p.height ?? (p.kind === "events" ? p.series.length * (p.laneHeight ?? 28) + 40 + (p.zoom === "slider" ? 84 : 0) : 280);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<EChartsType | null>(null);
  const theme = useChartTheme(rootRef);
  const [hidden, setHidden] = React.useState<Set<string>>(() => new Set());
  const [tip, setTip] = React.useState<{ points: ChartPoint[]; x: number; y: number } | null>(null);
  /** events: the marker clicked, whose content (the consumer's render) stays open until the pointer leaves or another click */
  const [pinned, setPinned] = React.useState<{ points: ChartPoint[]; x: number; y: number } | null>(null);
  const [alive, setAlive] = React.useState(0);
  const maxAnchors = p.anchors ? p.anchors : 0;
  const [anchors, setAnchors] = React.useState<Anchor[]>([]);
  const anchorsRef = React.useRef(anchors); anchorsRef.current = anchors;
  const catsRef = React.useRef(p.categories); catsRef.current = p.categories;
  const uid = React.useId();
  const chartId = id ?? uid;

  // init once per renderer; dispose on unmount
  React.useLayoutEffect(() => {
    const el = boxRef.current; if (!el) return;
    const c = echarts.init(el, undefined, { renderer });
    chartRef.current = c;
    setAlive((n) => n + 1);
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el);
    return () => { ro.disconnect(); c.dispose(); chartRef.current = null; chartRegistry.delete(chartId); };
  }, [renderer, chartId]);

  // the option: from the props and the theme; our tooltip rides the engine's formatter (called on every move with the hovered points)
  React.useEffect(() => {
    const c = chartRef.current; if (!c || c.isDisposed() || !theme) return;
    const base = buildOption(p, theme, hidden, anchors) as Record<string, unknown>;
    const tip = base.tooltip as Record<string, unknown>;
    if (tooltip && tooltip !== "engine") {
      base.tooltip = { ...tip, formatter: (params: Param | Param[]) => {
          const pts = toPoints(params);
          // a tip pushed from a linked chart (showTip) has no pointer position: place it at the point's pixel
          let at: [number, number] | null = null;
          try { const q = (Array.isArray(params) ? params[0] : params) as Param & { value?: unknown }; const px = c.convertToPixel({ seriesIndex: 0 }, Array.isArray(q.value) ? (q.value as number[]) : [q.dataIndex, q.value as number]) as number[]; if (px && Number.isFinite(px[0])) at = [px[0], px[1]]; } catch { /* a kind with no cartesian pixel */ }
          setTip((t) => ({ points: pts, x: t?.x ?? at?.[0] ?? 0, y: t?.y ?? at?.[1] ?? 0 })); onHover?.(pts);
          // an events chart: the marker's x goes to the linked charts as their axis tooltip (the engine's connect does not forward an item hover)
          if (p.kind === "events" && linked) { const q = (Array.isArray(params) ? params[0] : params) as Param; const x = Array.isArray(q.value) ? (q.value as number[])[0] : undefined; if (x !== undefined) for (const [, e] of chartRegistry.all()) if (e.chart !== c && e.chart.group === linked && !e.chart.isDisposed()) e.chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: x }); }
          return ""; },
        // the engine's position callback runs on every move, on this chart and on the linked ones: the box follows it
        position: (pt: [number, number]) => { setTip((t) => (t ? { ...t, x: pt[0], y: pt[1] } : t)); return pt; } };
    } else if (tooltip === "engine") {
      base.tooltip = { ...tip, formatter: undefined, backgroundColor: theme.bg === "transparent" ? "#fff" : theme.bg, borderWidth: 1, borderColor: theme.inkSoft, padding: [6, 10], textStyle: { color: theme.label, fontFamily: theme.font, fontSize: theme.fontSize }, extraCssText: "box-shadow:none;", valueFormatter: (v: unknown) => fmt(v, p.format) };
    } else base.tooltip = { show: false };
    c.setOption(base, { notMerge: true });
    // linked charts: the group must be set after every setOption (notMerge resets it) and connect re-run, so a chart mounted later joins the ones before it
    if (linked) { c.group = linked; echarts.connect(linked); }
    chartRegistry.set(chartId, { chart: c, series: p.series, colors: Object.fromEntries(p.series.map((s, i) => [s.key, seriesColor(s, i, theme)])), hidden, format: p.format, symbol: p.symbol });
  }, [p, theme, hidden, chartId, tooltip, onHover, alive, linked, anchors]);   // eslint-disable-line react-hooks/exhaustive-deps

  // the legend toggles a series through the registry: listen to our own entry
  React.useEffect(() => chartRegistry.subscribe(chartId, () => { const e = chartRegistry.get(chartId); if (e && e.hidden !== hidden) setHidden(e.hidden); }), [chartId, hidden]);

  // events
  React.useEffect(() => {
    const c = chartRef.current; if (!c || c.isDisposed()) return;
    const onZoom = () => { const o = c.getOption() as { dataZoom?: { start?: number; end?: number }[] } | undefined; const z = o?.dataZoom?.[0]; if (z && onRange) onRange(z.start ?? 0, z.end ?? 100); };
    const onLeave = () => { setTip(null); onHover?.(null); };
    const onClk = (params: unknown) => {
      const pt = toPoints(params as Param)[0]; if (pt) onClick?.(pt);
      if (p.kind === "events" && pt?.events) { const q = params as Param & { event?: { offsetX: number; offsetY: number } }; setPinned({ points: [pt], x: q.event?.offsetX ?? 0, y: q.event?.offsetY ?? 0 }); }
    };
    // anchors pin from a click anywhere on the plot: the index under the pointer, from the x axis
    const onZrClick = (e: { offsetX: number; offsetY: number; target?: unknown }) => {
      if (p.kind === "events" && !e.target) setPinned(null);
      if (!maxAnchors || !c.containPixel("grid", [e.offsetX, e.offsetY])) return;
      const x = c.convertFromPixel({ xAxisIndex: 0 }, e.offsetX) as number;
      const idx = Math.round(x); if (!Number.isFinite(idx)) return;
      const cats = catsRef.current ?? [];
      const cur = anchorsRef.current; const at = cur.findIndex((a) => a.dataIndex === idx);
      if (at >= 0) setAnchors(cur.filter((_, i) => i !== at));
      else if (cur.length < maxAnchors) setAnchors([...cur, { dataIndex: idx, category: cats[idx] ?? idx }]);
    };
    const zr = c.getZr(); zr?.on("click", onZrClick);
    // an events chart leaving: the linked charts' tooltips go with it
    const onOut = () => { if (p.kind !== "events" || !linked) return; for (const [, e] of chartRegistry.all()) { if (e.chart !== c && e.chart.group === linked && !e.chart.isDisposed()) e.chart.dispatchAction({ type: "hideTip" }); } };
    c.on("mouseout", onOut);
    c.on("datazoom", onZoom); c.on("globalout", onLeave); c.on("hidetip", onLeave); c.on("click", onClk);
    return () => { c.off("mouseout", onOut); c.off("datazoom", onZoom); c.off("globalout", onLeave); c.off("hidetip", onLeave); c.off("click", onClk); if (!c.isDisposed()) c.getZr()?.off("click", onZrClick); };
  }, [onRange, onHover, onClick, alive, maxAnchors, p.kind, linked]);
  // Esc clears the anchors
  React.useEffect(() => { if (!anchors.length) return; const h = (e: KeyboardEvent) => { if (e.key === "Escape") setAnchors([]); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [anchors.length]);


  return (
    <div ref={rootRef} className={className} onPointerLeave={() => setPinned(null)} style={{ position: "relative", width: "100%", ...style }} {...(axisAttrs({ scale, emphasis, status, concept: ["chart", concept].filter(Boolean).join(" ") }) as object)} data-chart-id={chartId}>
      <div ref={boxRef} style={{ width: "100%", height }} onPointerLeave={() => setTip(null)} />
      {pinned && typeof tooltip === "function" ? (
        <div element="overlay--hover-card" concept="data-tooltip" style={{ position: "absolute", left: pinned.x + 14, top: pinned.y + 14, zIndex: 6, width: "max-content" }}>{tooltip(pinned.points)}</div>
      ) : null}
      {anchors.length ? <div concept="chart-anchors" style={{ position: "absolute", top: 4, right: 8, zIndex: 4 }}><Button emphasis="quiet" scale="sm" onClick={() => setAnchors([])}>{`Clear ${anchors.length === 1 ? "anchor" : `${anchors.length} anchors`}`}</Button></div> : null}
      {tip && tooltip && tooltip !== "engine" && tip.points.length ? (
        <div element="overlay--hover-card" concept="data-tooltip" style={{ position: "absolute", left: tip.x + 14, top: tip.y + 14, pointerEvents: "none", zIndex: 5, width: "max-content" }}>
          {typeof tooltip === "function" && p.kind !== "events" ? tooltip(tip.points) : <DefaultTip points={tip.points} p={p} anchors={anchors} />}
        </div>
      ) : null}
    </div>
  );
}

export { Chart };
