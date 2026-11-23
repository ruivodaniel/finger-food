// An image on the canvas: it fills its box (resizable, the image keeps its proportions inside)
import type { CanvasViewProps } from "../../canvas-registration";
export type ImageData = { src: string; alt?: string };
export const ImageView = ({ data }: CanvasViewProps<ImageData>) => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <img src={data.src} alt={data.alt ?? ""} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }} />
  </div>
);
