"use client";
import * as React from "react";
import "@microcharts/react/styles.css";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { Marker, Threshold } from "@microcharts/react/annotations";
import { axisAttrs } from "../../../../lib/axes";
import { useChartTheme } from "../../../../lib/chart-theme";
import { DataNumber } from "../../data-number";
import { DataTooltipSurface } from "../../data-tooltip";
import { Text } from "../../text";
import { Stack } from "../../stack";
import type { MicroChartProps, MicroChartScale } from "./types";
import type { NumberConfig } from "@libs/data-processor";

/** the height of the chart, in px, by scale: it follows the numbers' line */
const HEIGHT: Record<MicroChartScale, number> = { xs: 14, sm: 18, md: 24, lg: 36 };
type Active = { index: number; value: number | null; label?: string };

const REL: NumberConfig = { mode: { kind: "fixedScale", scale: "unit", n: 1 }, representation: { kind: "percentage", input: "points" } };

function MicroChart({ kind, data = [], value, target, bands, range, marker = "last", baseline, tooltip = true, anchors: maxAnchors = false, format, symbol, width = 96, scale = "md", emphasis, status, concept }: MicroChartProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const t = useChartTheme(ref);
  const h = HEIGHT[scale];
  const color = t ? (status && status !== "neutral" ? t.status[status as keyof typeof t.status] : t.series[0]) : undefined;
  const stroke = emphasis === "hero" || emphasis === "primary" ? 2.5 : emphasis === "quiet" ? 1 : 1.5;
  const fill = emphasis === "hero";
  // the engine takes its tokens from CSS variables on an ancestor: set them on the root, from the theme.
  // the bullet's bands are grey steps (soft ink), its value the series colour, its target the ink
  const vars = t ? ({ "--mc-stroke": color, "--mc-accent": color, "--mc-neutral": t.ink, "--mc-band": t.inkSoft, "--mc-positive": t.status.success, "--mc-negative": t.status.error, "--mc-stroke-width": stroke, "--mc-font": t.font, "--mc-label-size": `${t.fontSize}px` } as React.CSSProperties) : undefined;

  // one hover for every kind: the engine picks the point (onActive), our data-tooltip follows the cursor with it
  const [active, setActive] = React.useState<Active | null>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const onMove = (e: React.PointerEvent) => { const r = ref.current?.getBoundingClientRect(); if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); };
  const [anchors, setAnchors] = React.useState<number[]>([]);
  const canAnchor = !!maxAnchors && (kind === "sparkline" || kind === "bars");
  const onSelect = (d: Active | null) => { if (!canAnchor || !d) return; setAnchors((cur) => (cur.includes(d.index) ? cur.filter((i) => i !== d.index) : cur.length < (maxAnchors as number) ? [...cur, d.index] : cur)); };
  const pick = { readout: false, ...(tooltip ? { onActive: (d: Active | null) => setActive(d) } : {}), ...(canAnchor ? { onSelect, selectedIndex: null } : {}) };
  React.useEffect(() => { if (!anchors.length) return; const h = (e: KeyboardEvent) => { if (e.key === "Escape") setAnchors([]); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [anchors.length]);

  const chart = (() => {
    switch (kind) {
      case "sparkline": return <Sparkline data={data} width={width} height={h} domain={range} dots={marker === "min-max" ? "minmax" : marker === "none" ? "none" : "auto"} fill={fill} color={color} summary={false} {...pick}>{baseline !== undefined ? <Threshold y={baseline} /> : null}{anchors.map((i, n) => <Marker key={i} x={i} label={String(n + 1)} />)}</Sparkline>;
      case "bars": return <MiniBar data={data.map((v, i) => ({ label: String(i + 1), value: v }))} width={width} height={h} domain={range} orientation="vertical" positive="up" color={color} summary={false} {...pick} />;
      case "win-loss": return <MiniBar data={data.map((v, i) => ({ label: String(i + 1), value: v === null ? null : Math.sign(v) }))} width={width} height={h} domain={[-1, 1]} orientation="vertical" positive="up" summary={false} {...pick} />;
      case "bullet": return <Bullet value={value ?? 0} target={target} bands={bands} domain={range} width={width} height={h} color={color} label="none" summary={false} {...pick} />;
    }
  })();

  // what the tooltip says: the point's value; win-loss says the result; the bullet says value and target
  const body = (() => {
    if (!active) return null;
    if (kind === "win-loss") { const v = data[active.index]; return <Text type="body-small">{v === null || v === undefined ? "–" : v > 0 ? "Win" : v < 0 ? "Loss" : "Draw"}</Text>; }
    if (kind === "bullet") return (
      <>
        <DataNumber value={value ?? null} config={format} symbol={symbol} scale="sm" tooltip={false} />
        {target !== undefined ? <Text type="body-extra-small" emphasis="quiet">target <DataNumber value={target} config={format} symbol={symbol} scale="xs" tooltip={false} /></Text> : null}
      </>
    );
    const cur = (kind === "sparkline" ? data[active.index] : active.value) ?? null;
    const sign = (d: number): "success" | "error" | "neutral" => (d > 0 ? "success" : d < 0 ? "error" : "neutral");
    return (
      <>
        <DataNumber value={cur} config={format} symbol={symbol} scale="sm" tooltip={false} />
        {canAnchor && cur !== null && anchors.map((i, n) => { const base = data[i]; if (base === null || base === undefined || i === active.index) return null; const abs = cur - base; const rel = base === 0 ? null : (abs / Math.abs(base)) * 100; return (
          <Stack key={i} dir="row" scale="sm" align="baseline" justify="between"><Text type="body-extra-small" emphasis="quiet">{`vs ${n + 1}`}</Text><Stack dir="row" scale="xs" align="baseline"><DataNumber value={abs} config={format} scale="xs" status={sign(abs)} trend={abs > 0 ? "arrowUp" : abs < 0 ? "arrowDown" : undefined} tooltip={false} />{rel !== null ? <DataNumber value={rel} config={REL} scale="xs" status={sign(abs)} tooltip={false} /> : null}</Stack></Stack>
        ); })}
      </>
    );
  })();
  const header = active && kind !== "bullet" && kind !== "win-loss" && data.length > 1 ? <Text type="body-extra-small" emphasis="quiet">{`${active.index + 1} / ${data.length}`}</Text> : undefined;

  return (
    <span ref={ref} onPointerMove={tooltip ? onMove : undefined} onPointerLeave={() => { setActive(null); setPos(null); }} style={{ display: "inline-flex", position: "relative", width, height: h, lineHeight: 0, verticalAlign: "middle", ...vars }} {...(axisAttrs({ scale, emphasis, status, concept: ["micro-chart", concept].filter(Boolean).join(" ") }) as object)}>
      {chart}
      {tooltip && active && pos && body ? (
        <span element="overlay--hover-card" concept="data-tooltip" style={{ position: "absolute", left: pos.x + 12, top: pos.y - 8, transform: "translateY(-100%)", pointerEvents: "none", zIndex: 5, lineHeight: "normal", width: "max-content" }}>
          <DataTooltipSurface header={header} content={body} />
        </span>
      ) : null}
    </span>
  );
}

export { MicroChart };
