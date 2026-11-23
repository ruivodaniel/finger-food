/// <reference path="./plantuml-core.d.ts" />
// The PlantUML diagram: ONE component that shows a diagram and edits its text. The engine is PlantUML itself, compiled to JavaScript (@plantuml/core): no server, no Java.
// It is loaded when the first diagram draws (it is large), with the Graphviz layout engine it needs for the diagrams that are not sequence diagrams.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Values } from "../../types";
import type { Edit, EditSource } from "../../editing/types";
import { Previewer as CodeBlock } from "../../code-block/Previewer";
import type { PlantumlDiagram } from "./types";
import { spec } from "./spec";

const defaults = (): Values => Object.fromEntries(spec.layouts[0].props.map((p) => [p.name, p.default]));
type Engine = { renderToString: (lines: string[], ok: (svg: string) => void, err: (message: string) => void, options?: { dark?: boolean; maxSvgSize?: number }) => void };
let engine: Promise<Engine> | null = null;
const load = () => (engine ??= (async () => {
  // the layout engine is a classic script (UMD): bundled, it does not reach the global the engine looks at, so it is handed over
  const viz = (await import("@plantuml/core/viz-global.js")) as { default?: unknown; Viz?: unknown };
  const g = globalThis as { PLANTUML_VIZ?: unknown; Viz?: unknown };
  g.PLANTUML_VIZ ??= viz.Viz ?? viz.default ?? g.Viz;
  return (await import("@plantuml/core")) as unknown as Engine;
})());
/** a sequence diagram's participants, drawn at the top: the band that stays */
const HEAD = ".participant-head", TEST_ID = "diagram-plantuml";
const draw = async (text: string) => { const e = await load(); return new Promise<string>((ok, err) => e.renderToString(text.split(/\r\n|\r|\n/), ok, (m) => err(new Error(m)))); };

/** the drawing in its scroll box. THE STICKY HEADER: the top band (a sequence diagram's participants) is the same SVG drawn a second time, cut at the band's height and stuck to the top; no participants, no band */
function Drawing({ svg, sticky }: { svg: string; sticky: boolean }) {
  const body = useRef<HTMLDivElement>(null);
  const [head, setHead] = useState(0);
  useLayoutEffect(() => {
    const el = body.current?.querySelector("svg"); if (!el || !sticky) return setHead(0);
    // measured on screen, so divided by the scale the host draws at (a canvas zooms)
    const box = body.current!.getBoundingClientRect(), scale = box.height / body.current!.offsetHeight || 1, all = [...el.querySelectorAll(HEAD)];
    setHead(all.length ? Math.ceil(Math.max(...all.map((x) => x.getBoundingClientRect().bottom - box.top)) / scale + 6) : 0);
  }, [svg, sticky]);
  return (
    <div data-testid={TEST_ID} style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "auto", position: "relative", background: "#ffffff" }}>
      {head > 0 ? <div data-part="sticky-header" aria-hidden style={{ position: "sticky", top: 0, zIndex: 1, height: head, width: "max-content", minWidth: "100%", overflow: "hidden", background: "#ffffff", boxShadow: "0 1px 0 #e5e5e5" }} dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      <div ref={body} data-part="drawing" style={{ width: "max-content", marginTop: head > 0 ? -head : 0, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

export function Previewer({ v: given, data, edit: givenEdit, onSubmit, editSource }: { layout?: string; v?: Values; data: PlantumlDiagram; edit?: Edit<PlantumlDiagram>; /** the same as `edit`, said with plain properties: the diagram the person saved, as an event of its own; given without `edit`, it makes the diagram editable */ onSubmit?: (next: PlantumlDiagram) => void; /** where the diagram comes from, when `onSubmit` is given: fixture (default) or live */ editSource?: EditSource }) {
  const edit: Edit<PlantumlDiagram> | undefined = givenEdit ?? (onSubmit ? { source: editSource ?? "fixture", kind: "plantuml diagram", onSubmit } : undefined);
  const v = { ...defaults(), ...given };
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  // a wrong text keeps the last good drawing and says what is wrong
  useEffect(() => { let on = true; if (!data.text.trim()) { setSvg(""); setError(null); return; } draw(data.text).then((s) => { if (on) { setSvg(s); setError(null); } }).catch((e: unknown) => { if (on) setError(e instanceof Error ? e.message : String(e)); }); return () => { on = false; }; }, [data.text]);
  const [open, setOpen] = useState(true);
  const drawing = <Drawing svg={svg} sticky={v.stickyHeader !== false} />;
  if (!edit) return <div style={{ display: "flex", width: "100%", height: "100%", minHeight: 0 }}>{drawing}</div>;
  // editable: the text is a code block (a double click types in it; leaving it hands the text back and the drawing follows)
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", minHeight: 0, gap: 12 }}>
      <div data-part="editor" style={open ? { flex: "0 0 auto", width: 320, minHeight: 0, overflow: "auto" } : { flex: "0 0 auto", width: 34 }}>
        <button type="button" title={open ? "collapse the text" : "expand the text"} onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: open ? "space-between" : "center", width: "100%", padding: "8px 10px", border: 0, background: "none", cursor: "pointer", font: "600 10px/1 var(--font-sans, system-ui)", letterSpacing: 1, color: "#666" }}>
          {open ? <span>TEXT</span> : null}<span aria-hidden>{open ? "‹" : "›"}</span>
        </button>
        {open ? <><CodeBlock layout="block" v={{ language: "plain", fontSize: "12", showLineNumbers: true }} data={{ id: data.id, code: data.text }} edit={{ source: edit.source, kind: edit.kind, onSubmit: (c) => edit.onSubmit({ ...data, text: c.code }) }} />
        {error ? <div data-part="error" style={{ padding: "8px 2px", font: "11px/1.4 'Roboto Mono', 'SF Mono', Menlo, monospace", color: "#c0392b", whiteSpace: "pre-wrap" }}>{error}</div> : null}</> : null}
      </div>
      {drawing}
    </div>
  );
}
