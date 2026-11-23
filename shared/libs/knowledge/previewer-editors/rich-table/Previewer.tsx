// The rich table on a canvas: the library's RichTable as an authored dataset in the node's data. The box is the node's; the grid scrolls inside it. A strip at the top is where the node is grabbed.
// Until a double click the table is only a node: the canvas zooms and scrolls over it, a click selects it, a drag moves it. After a double click the grid has its clicks, drags and wheel
// (nodrag nopan nowheel); deselecting the node or Escape gives them back to the canvas.
import { useEffect, useState } from "react";
import { RichTable, type RichTableColumn, type RichTableRow } from "@libs/web-components";
import type { CanvasViewProps } from "../../hosts/canvas/v3/canvas-registration";
import type { RichTableData } from "./types";

const letter = (i: number): string => { let n = i, s = ""; do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0); return s; };
const uid = () => Math.random().toString(36).slice(2, 9);
/** an empty table of r rows and c columns */
export const newRichTable = (r: number, c: number): RichTableData => ({
  columns: Array.from({ length: c }, (_, i) => ({ key: `c${i}-${uid()}`, name: letter(i), type: "text", width: 140 }) as RichTableColumn),
  rows: Array.from({ length: r }, (_, i) => ({ id: `r${i}-${uid()}` }) as RichTableRow),
});

export function Previewer({ data, editable, onChange, selected }: CanvasViewProps<RichTableData>) {
  const [active, setActive] = useState(false);
  useEffect(() => { if (!selected) setActive(false); }, [selected]);
  const set = (p: Partial<RichTableData>) => onChange?.({ ...data, ...p });
  return (
    <div onDoubleClick={() => setActive(true)} onKeyDown={(e) => { if (e.key === "Escape") setActive(false); }} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div title={active ? "drag to move" : "drag to move; double click to use the table"} style={{ height: 14, flexShrink: 0, cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, letterSpacing: 2, opacity: 0.4, userSelect: "none" }}>⋯</div>
      <div className={active ? "nodrag nopan nowheel" : undefined} style={{ flex: 1, minHeight: 0, pointerEvents: active ? "auto" : "none" }}>
        <RichTable
          source={{ kind: "authored", rows: data.rows, onChange: (rows) => set({ rows }) }}
          columns={data.columns}
          onColumnsChange={editable ? (columns) => set({ columns }) : undefined}
          newRow={() => ({ id: `r-${uid()}` })}
          editable={editable} selection="row" height="fill"
        />
      </div>
    </div>
  );
}
