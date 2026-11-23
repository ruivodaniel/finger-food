"use client";
import * as React from "react";
import { axisAttrs } from "../../../../lib/axes";
import { chartRegistry } from "../../chart";
import { Button } from "../../button";
import { Stack } from "../../stack";
import { ToggleGroup, ToggleGroupItem } from "../../toggle";
import type { ChartToolbarProps } from "./types";

function ChartToolbar({ for: ids, presets = [], defaultPreset, reset = true, export: exp = false, children, onWindow, scale = "md", emphasis, concept }: ChartToolbarProps) {
  const targets = Array.isArray(ids) ? ids : [ids];
  const [active, setActive] = React.useState<string>(defaultPreset ?? "");
  const setWindow = (w: [number, number]) => {
    for (const id of targets) chartRegistry.get(id)?.chart.dispatchAction({ type: "dataZoom", start: w[0], end: w[1] });
    onWindow?.(w);
  };
  const download = () => {
    const e = chartRegistry.get(targets[0]); if (!e) return;
    const url = e.chart.getDataURL({ pixelRatio: 2, backgroundColor: "#fff" });
    const a = document.createElement("a"); a.href = url; a.download = `${targets[0]}.${url.startsWith("data:image/svg") ? "svg" : "png"}`; a.click();
  };
  return (
    <Stack dir="row" scale="sm" align="center" {...(axisAttrs({ scale, emphasis, concept: ["chart-toolbar", concept].filter(Boolean).join(" ") }) as object)}>
      {presets.length ? (
        <ToggleGroup type="single" scale={scale} value={active} onValueChange={(v: string) => { if (!v) return; setActive(v); const p = presets.find((x) => x.label === v); if (p) setWindow(p.window); }}>
          {presets.map((p) => <ToggleGroupItem key={p.label} value={p.label} scale={scale}>{p.label}</ToggleGroupItem>)}
        </ToggleGroup>
      ) : null}
      {reset ? <Button emphasis="quiet" scale={scale} onClick={() => { setActive(""); setWindow([0, 100]); }}>Reset</Button> : null}
      {children}
      {exp ? <Button emphasis="secondary" scale={scale} onClick={download}>Export</Button> : null}
    </Stack>
  );
}

export { ChartToolbar };
