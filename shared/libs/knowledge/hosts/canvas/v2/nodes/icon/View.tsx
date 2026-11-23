// An icon of the library's registry, filling its box; its colour and line weight are the node's shape stroke, the square behind it the shape's fill and corners
import { Icon, type IconName } from "@libs/web-components";
import type { CanvasViewProps } from "../../canvas-registration";
import { SHAPE_DEFAULT, fillCss } from "../../style/types";
export type IconData = { name: string };
export function IconView({ data, style }: CanvasViewProps<IconData>) {
  const sh = style?.shape;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", color: sh?.stroke ?? "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", background: sh ? fillCss({ ...SHAPE_DEFAULT, ...sh }) : undefined, borderRadius: sh?.radius, padding: sh?.fill && sh.fill !== "transparent" ? "12%" : 0, boxSizing: "border-box", ["--icon-sw" as string]: String(sh?.strokeWidth ?? 2) }}>
      <div className="canvas-icon" style={{ width: "100%", height: "100%" }}><Icon name={data.name as IconName} scale="xl" /></div>
    </div>
  );
}
