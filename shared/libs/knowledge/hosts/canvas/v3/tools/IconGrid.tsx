// The icons of the library, searchable: what the icon shape and the icon box place
import { useMemo, useState } from "react";
import { Icon, Input, iconRegistry, type IconName } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ToolButton } from "./ToolButton";

export function IconGrid({ value, onPick }: { value: string | null; onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const names = useMemo(() => Object.keys(iconRegistry).filter((n) => n.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <Stack dir="col" scale="sm" concept="knowledge-canvas-icon-grid">
      <Input className="w-full" value={q} onChange={setQ} placeholder="search an icon" autoFocus />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 34px)", gap: 2, maxHeight: 220, overflowY: "auto" }} className="nowheel">
        {names.map((n) => <ToolButton key={n} label={n} on={value === n} testid={`icon-${n}`} onClick={() => onPick(n)}><Icon name={n as IconName} scale="sm" /></ToolButton>)}
      </div>
    </Stack>
  );
}
