"use client";
import * as React from "react";
import { axisAttrs } from "../../../../lib/axes";
import { chartRegistry, useChartEntry } from "../../chart";
import { DataNumber } from "../../data-number";
import { Stack } from "../../stack";
import { Text } from "../../text";
import type { ChartLegendProps } from "./types";

const last = (d: unknown): number | null => { if (!Array.isArray(d) || !d.length) return null; const v = d[d.length - 1]; return Array.isArray(v) ? (v[v.length - 1] as number) : typeof v === "object" && v ? (v as { value: number }).value : (v as number); };

function ChartLegend({ for: id, layout = "row", values = "none", interactive = true, scale = "md", emphasis, concept }: ChartLegendProps) {
  const entry = useChartEntry(id);
  if (!entry) return null;
  const toggle = (key: string) => { if (!interactive) return; const hidden = new Set(entry.hidden); hidden.has(key) ? hidden.delete(key) : hidden.add(key); chartRegistry.patch(id, { hidden }); };
  const highlight = (name: string | null) => { if (!interactive) return; name ? entry.chart.dispatchAction({ type: "highlight", seriesName: name }) : entry.chart.dispatchAction({ type: "downplay" }); };
  const type = scale === "sm" ? "body-extra-small" : "body-small";
  return (
    <Stack dir={layout === "column" ? "col" : "row"} wrap={layout === "grid"} scale={layout === "column" ? "xs" : "md"} align={layout === "column" ? "start" : "center"} {...(axisAttrs({ scale, emphasis, concept: ["chart-legend", concept].filter(Boolean).join(" ") }) as object)}>
      {entry.series.map((s) => {
        const off = entry.hidden.has(s.key);
        return (
          <button key={s.key} type="button" onClick={() => toggle(s.key)} onMouseEnter={() => highlight(s.name)} onMouseLeave={() => highlight(null)} disabled={!interactive}
            concept="chart-legend-item" className={`inline-flex items-baseline border-0 bg-transparent p-0 font-[inherit] text-inherit disabled:cursor-default${off ? " opacity-40" : ""}`}>
            {/* E1: the colour of the series, given by the chart */}
            <span concept="chart-legend-swatch" className="inline-block self-center" style={{ background: entry.colors[s.key] }} />
            <Text type={type} emphasis="quiet">{s.name}</Text>
            {values === "last" ? <DataNumber value={last(s.data)} config={entry.format} symbol={entry.symbol} scale="xs" tooltip={false} /> : null}
          </button>
        );
      })}
    </Stack>
  );
}

export { ChartLegend };
