// The icons of the library, searchable: what the icon shape and the icon box place
import { useMemo, useState } from "react";
import { Input } from "../../../../../ui/web/primitives/components/input/v1";
import { Icon, iconRegistry, type IconName } from "@libs/web-components";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";

export const toolButtonStyle = (on: boolean): React.CSSProperties => ({ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, cursor: "pointer", background: on ? "var(--primary, #4338ca)" : "transparent", color: on ? "var(--primary-foreground, #fff)" : "var(--foreground, #1a1a1a)" });
export function IconGrid({ value, onPick }: { value: string | null; onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const names = useMemo(() => Object.keys(iconRegistry).filter((n) => n.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <Stack dir="col" gap={8} style={{ width: 268 }}>
      <Input className="w-full" value={q} onChange={setQ} placeholder="search an icon" autoFocus />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 34px)", gap: 2, maxHeight: 220, overflowY: "auto" }} className="nowheel">
        {names.map((n) => <button key={n} type="button" title={n} aria-label={n} onClick={() => onPick(n)} data-testid={`icon-${n}`} style={{ ...toolButtonStyle(value === n), width: 34, height: 34 }}><Icon name={n as IconName} scale="sm" /></button>)}
      </div>
    </Stack>
  );
}
