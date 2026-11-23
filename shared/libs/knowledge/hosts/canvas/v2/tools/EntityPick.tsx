// The pick of a referenced kind (a tool whose placing is "pick"): a search by name through the registration's `pick`, in the canvas's project; a click places the one picked.
import { useEffect, useState } from "react";
import { Button } from "../../../../../ui/web/primitives/components/button/v1";
import { Input } from "../../../../../ui/web/primitives/components/input/v1";
import { Icon } from "@libs/web-components";
import { useReactFlow } from "@xyflow/react";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import type { CanvasRegistration, Reference, ToolEntry } from "../canvas-registration";
import type { NodeData } from "../nodes/Node";
import { focusNodes } from "./focus";

type Hit = { id: string; name: string; sub?: string };
export function EntityPick({ project, registration: r, entry, onPick, onCancel }: { project: string; registration: CanvasRegistration; entry: ToolEntry; onPick: (ref: Reference) => void; onCancel: () => void }) {
  const flow = useReactFlow();
  // where each row of this kind already sits on the board (a row may sit several times): the target button brings the eye there
  const sites = new Map<string, string[]>();
  for (const n of flow.getNodes()) { const d = n.data as NodeData; if (d.registration?.kind === r.kind && d.registration.data === "referenced") { const id = (d.node.data as Reference).id; sites.set(id, [...(sites.get(id) ?? []), n.id]); } }
  const find = (id: string) => { const ids = sites.get(id); if (!ids?.length) return; onCancel(); window.setTimeout(() => focusNodes(flow, ids, ids, { padding: 0.6, maxZoom: 1 }), 80); };
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  useEffect(() => {
    let dead = false;
    setState("loading");
    const t = setTimeout(() => { entry.pick?.(project, q).then((h) => { if (!dead) { setHits(h); setState("idle"); } }).catch(() => { if (!dead) setState("error"); }); }, 150);
    return () => { dead = true; clearTimeout(t); };
  }, [q, project, entry]);
  return (
    <Stack dir="col" gap={6} pad={8} style={{ width: 560, background: "var(--background, rgba(255,255,255,.97))", border: "1px solid var(--border, rgba(0,0,0,.1))", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.14)" }} data-testid="entity-pick" onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}>
      <Stack dir="row" gap={6} align="center">
        <Input className="w-full" value={q} onChange={setQ} placeholder={`search a ${r.name} by name`} autoFocus />
        <Button scale="sm" emphasis="tertiary" onClick={onCancel}>cancel</Button>
      </Stack>
      <div style={{ maxHeight: 420, overflowY: "auto" }} className="nowheel">
        {state === "error" ? <span element="type--body-small" style={{ color: "var(--color-status-error)" }}>the search did not answer</span> : null}
        {state !== "error" && !hits.length ? <span element="type--body-small" emphasis="quiet" style={{ display: "block", padding: "10px 12px" }}>{state === "loading" ? "searching…" : `no ${r.name} by that name in ${project}`}</span> : null}
        {hits.map((h) => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border, rgba(0,0,0,.08))" }}>
            <button type="button" onClick={() => onPick({ id: h.id, project })} style={{ display: "flex", gap: 12, alignItems: "center", width: "100%", textAlign: "left", padding: "12px 14px", border: "none", flex: 1, background: "transparent", cursor: "pointer" }} className="hover:bg-[var(--bg-3,#f3f3f3)]">
              <span element="type--body" style={{ fontWeight: 500 }}>{h.name}</span>
              {h.sub ? <span element="type--body-extra-small" emphasis="quiet">{h.sub}</span> : null}
              {sites.has(h.id) ? <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", color: "var(--color-status-success, #3a8a5a)", pointerEvents: "none" }}><input type="checkbox" checked readOnly style={{ accentColor: "#3a8a5a" }} /><span element="type--body-extra-small">on the board</span></label> : null}
            </button>
            {sites.get(h.id)?.length ? <button type="button" title={`show ${h.name} on the board`} aria-label={`show ${h.name} on the board`} onClick={() => find(h.id)} style={{ margin: "0 10px", width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid rgba(0,0,0,.14)", background: "#fff", cursor: "pointer" }}><Icon name="target" scale="xs" /></button> : null}
          </div>
        ))}
      </div>
    </Stack>
  );
}
