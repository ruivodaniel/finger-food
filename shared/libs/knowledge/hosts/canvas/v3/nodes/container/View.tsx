// A container: a dashed box; a node dropped in it is adopted and moves with it. A frame: the same box with a background.
import type { CanvasViewProps } from "../../canvas-registration";
import { EditableText } from "../../style/EditableText";
import { SHAPE_DEFAULT, TEXT_DEFAULT, fillCss } from "../../style/types";
export type ContainerData = { title?: string; background?: string };
/** a container's colour is always translucent: its opacity never goes above this */
const MAX_OPACITY = 50;
export function ContainerView({ data, frame, style, editable, onChange }: CanvasViewProps<ContainerData> & { frame?: boolean }) {
  const tint = { ...SHAPE_DEFAULT, fill: "var(--primary)", fillOpacity: 15, ...style?.shape };
  tint.fillOpacity = Math.min(tint.fillOpacity, MAX_OPACITY);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: 10, border: frame ? `1px solid var(--border)` : `1.5px dashed var(--color-gray-400)`, background: frame ? (data.background ?? "color-mix(in srgb, var(--background) 60%, transparent)") : fillCss(tint), padding: 10, boxSizing: "border-box" }}>
      {!frame && editable ? <EditableText value={data.title ?? ""} style={{ ...TEXT_DEFAULT, align: "left", fontSize: 12 }} editable onCommit={(title) => onChange?.({ ...data, title })} /> : data.title ? <span element="type--body-small" emphasis="quiet">{data.title}</span> : null}
    </div>
  );
}
export const FrameView = (p: CanvasViewProps<ContainerData>) => <ContainerView {...p} frame />;
