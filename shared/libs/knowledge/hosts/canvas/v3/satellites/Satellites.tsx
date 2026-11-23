// THE SATELLITES — what gravitates around a node, from its registration's layout (`satellites`): an action at a corner. `edit` opens the editor sheet, `settings` the layout and the switches.
import type { CanvasRegistration, LayoutId, Satellite, Switches } from "../canvas-registration";
import type { CanvasNode } from "../document";
import { RoundButton } from "./RoundButton";
import { Settings } from "./Settings";

const AT: Record<Satellite["where"], React.CSSProperties> = { "top-left": { top: -11, left: -11 }, "top-right": { top: -11, right: -11 }, "bottom-left": { bottom: -11, left: -11 }, "bottom-right": { bottom: -11, right: -11 } };
export function Satellites({ node, registration: r, layout, switches, satellites, canEdit, onEdit, onSwitches }: { node: CanvasNode; registration: CanvasRegistration; layout: LayoutId; switches: Switches; satellites: Satellite[]; canEdit: boolean; onEdit: () => void; onSwitches?: (id: string, layout: LayoutId, switches: Switches) => void }) {
  const corners = new Map<Satellite["where"], React.ReactNode[]>();
  for (const s of satellites) {
    const el = s.action === "edit" ? (canEdit ? <RoundButton key="edit" icon="edit" label={`edit ${r.name}`} testid="edit-button" onClick={onEdit} /> : null)
      : s.action === "settings" ? (onSwitches ? <Settings key="settings" nodeId={node.id} registration={r} layout={layout} switches={switches} onSwitches={onSwitches} /> : null) : null;
    if (el) corners.set(s.where, [...(corners.get(s.where) ?? []), el]);
  }
  return <>{[...corners].map(([where, els]) => <div key={where} className="nodrag nopan" style={{ position: "absolute", zIndex: 5, display: "flex", gap: 4, ...AT[where] }} onMouseDown={(e) => e.stopPropagation()}>{els}</div>)}</>;
}
