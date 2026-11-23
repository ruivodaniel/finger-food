// The size picker of a new rich table: hover the grid to choose rows and columns, click to take them
import { useState } from "react";
import { ToolButton } from "../../hosts/canvas/v3/tools/ToolButton";

/** the size picker of a new table: hover the grid to choose rows and columns, click to take them */
export function SizePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [h, setH] = useState({ r: 3, c: 3 });
  const N = 8;
  return (
    <div style={{ padding: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 18px)`, gap: 3 }} onMouseLeave={() => setH({ r: 3, c: 3 })}>
        {Array.from({ length: N * N }, (_, k) => { const r = Math.floor(k / N) + 1, c = (k % N) + 1, on = r <= h.r && c <= h.c;
          return <ToolButton key={k} label={`${r} by ${c}`} on={on} testid={`table-${r}x${c}`} scale="xs" onMouseEnter={() => setH({ r, c })} onClick={() => onPick(r, c)} style={{ width: 18, height: 18, minWidth: 0, padding: 0 }}>{null}</ToolButton>;; })}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, textAlign: "center" }}>{h.r} × {h.c}</div>
    </div>
  );
}
