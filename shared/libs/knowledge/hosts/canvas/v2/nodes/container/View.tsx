// A container: a dashed box; a node dropped in it is adopted and moves with it. A frame: the same box with a background.
import type { CanvasViewProps } from "../../canvas-registration";
export type ContainerData = { title?: string; background?: string };
export function ContainerView({ data, frame }: CanvasViewProps<ContainerData> & { frame?: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: 10, border: frame ? "1px solid rgba(0,0,0,.12)" : "1.5px dashed #b0b0b0", background: frame ? (data.background ?? "rgba(255,255,255,.6)") : "transparent", padding: 10, boxSizing: "border-box" }}>
      {data.title ? <span element="type--body-small" emphasis="quiet">{data.title}</span> : null}
    </div>
  );
}
export const FrameView = (p: CanvasViewProps<ContainerData>) => <ContainerView {...p} frame />;
