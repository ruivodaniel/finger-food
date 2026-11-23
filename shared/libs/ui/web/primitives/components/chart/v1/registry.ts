// The charts bound together: a chart registers its ECharts instance under its id; a legend, a toolbar or another chart finds it by that id.
// Kept outside React so a legend may mount before or after its chart. One store for the page.
import * as React from "react";
import type { EChartsType } from "echarts/core";
import type { NumberConfig } from "@libs/data-processor";
import type { ChartSeries } from "./types";

export type ChartEntry = { chart: EChartsType; series: ChartSeries[]; colors: Record<string, string>; hidden: Set<string>; format?: NumberConfig; symbol?: string };
const entries = new Map<string, ChartEntry>();
const subs = new Map<string, Set<() => void>>();
const notify = (id: string) => subs.get(id)?.forEach((f) => f());

export const chartRegistry = {
  /** dev: the entries, for a console */
  all: () => entries,
  set(id: string, entry: ChartEntry) { entries.set(id, entry); notify(id); },
  patch(id: string, patch: Partial<ChartEntry>) { const e = entries.get(id); if (e) { Object.assign(e, patch); notify(id); } },
  delete(id: string) { entries.delete(id); notify(id); },
  get: (id: string) => entries.get(id),
  subscribe(id: string, f: () => void) { if (!subs.has(id)) subs.set(id, new Set()); subs.get(id)!.add(f); return () => { subs.get(id)?.delete(f); }; },
};

/** the entry of a chart, live */
export function useChartEntry(id: string | undefined): ChartEntry | undefined {
  return React.useSyncExternalStore(
    (f) => (id ? chartRegistry.subscribe(id, f) : () => {}),
    () => (id ? chartRegistry.get(id) : undefined),
    () => undefined,
  );
}
