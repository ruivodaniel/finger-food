// The theme contract of the charts: what a chart component reads from the theme, by CSS variable, on its own root.
// Neither engine ever gets a colour from the instance. The theme sets these under the concept "chart" (and "micro-chart");
// a product concept may redefine them. Read at mount and on a theme change, then handed to the engine as its own theme.
import * as React from "react";

export const SERIES_COUNT = 8;
export type ChartTheme = {
  /** the categorical palette, in order */
  series: string[];
  /** axis lines, tick marks, the zero line */
  ink: string;
  /** grid lines, the area under a sparkline at low emphasis */
  inkSoft: string;
  /** axis labels, legend text */
  label: string;
  /** the plot background (transparent in every theme today) */
  bg: string;
  /** the status colours a series with a status takes */
  status: Record<"success" | "warning" | "error" | "info" | "neutral", string>;
  font: string;
  fontSize: number;
  /** the stroke weight of a line */
  stroke: number;
};

/** a CSS colour as an engine can paint it: a color-mix(), an oklch() or a var() becomes rgb(a) through the browser (a canvas understands none of them) */
const resolveColor = (() => {
  let ctx: CanvasRenderingContext2D | null | undefined;
  const cache = new Map<string, string>();
  return (v: string): string => {
    if (!v || /^(#|rgb|hsl|transparent$)/.test(v)) return v;
    const hit = cache.get(v); if (hit) return hit;
    if (ctx === undefined) ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    if (!ctx) return v;
    ctx.fillStyle = "#000"; ctx.fillStyle = v;
    const out = ctx.fillStyle === "#000000" && v !== "#000" && v !== "black" ? resolveViaDom(v) : String(ctx.fillStyle);
    cache.set(v, out); return out;
  };
})();
/** the browser computes it on an element: works for color-mix() and oklch() where the canvas parser does not */
const resolveViaDom = (v: string): string => { const el = document.createElement("span"); el.style.color = v; document.body.appendChild(el); const out = getComputedStyle(el).color; el.remove(); return out || v; };
const read = (cs: CSSStyleDeclaration, name: string, fallback: string) => resolveColor(cs.getPropertyValue(name).trim() || fallback);
/** the theme as the element sees it: the chart's variables, then the library's colours they fall back on */
export function readChartTheme(el: Element): ChartTheme {
  const cs = getComputedStyle(el);
  const series = Array.from({ length: SERIES_COUNT }, (_, i) => read(cs, `--chart-series-${i + 1}`, "")).filter(Boolean);
  return {
    // no series set by the theme: the five of the compatibility layer (--chart-1 … --chart-5), then the brand
    series: series.length ? series : Array.from({ length: 5 }, (_, i) => read(cs, `--chart-${i + 1}`, "")).filter(Boolean).length ? Array.from({ length: 5 }, (_, i) => read(cs, `--chart-${i + 1}`, "")).filter(Boolean) : [read(cs, "--color-brand-1", "#4a2d8f")],
    ink: read(cs, "--chart-ink", read(cs, "--color-gray-500", "#8a8f98")),
    inkSoft: read(cs, "--chart-ink-soft", read(cs, "--color-gray-200", "#e5e5e5")),
    label: read(cs, "--chart-label", read(cs, "--color-gray-600", "#666")),
    bg: read(cs, "--chart-bg", "transparent"),
    status: {
      success: read(cs, "--color-status-success", "#2f6d4f"), warning: read(cs, "--color-status-warning", "#c99b2a"),
      error: read(cs, "--color-status-error", "#a83232"), info: read(cs, "--color-status-info", "#4a2d8f"), neutral: read(cs, "--color-gray-500", "#8a8f98"),
    },
    font: cs.getPropertyValue("--typography-numbersSmall-font-family").trim() || cs.fontFamily || "ui-monospace, monospace",
    fontSize: parseFloat(cs.getPropertyValue("--typography-numbersSmall-font-size")) || 11.5,
    stroke: parseFloat(cs.getPropertyValue("--chart-stroke")) || 2,
  };
}

/** the theme of the element, re-read when the document's theme attributes change */
export function useChartTheme(ref: React.RefObject<Element | null>): ChartTheme | null {
  const [theme, setTheme] = React.useState<ChartTheme | null>(null);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const apply = () => setTheme(readChartTheme(el));
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode", "data-theme", "class", "style"] });
    for (const link of Array.from(document.querySelectorAll('link[rel="stylesheet"]'))) link.addEventListener("load", apply);
    return () => { mo.disconnect(); for (const link of Array.from(document.querySelectorAll('link[rel="stylesheet"]'))) link.removeEventListener("load", apply); };
  }, [ref]);
  return theme;
}
