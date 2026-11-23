// A text box: the text, typed in place; a fill, no border
import type { CanvasViewProps } from "../../canvas-registration";
import { EditableText } from "../../style/EditableText";
import { SHAPE_DEFAULT, TEXT_DEFAULT, fillCss } from "../../style/types";

export type TextData = { text: string };
export function TextView({ data, style, editable, onChange }: CanvasViewProps<TextData>) {
  const sh = { ...SHAPE_DEFAULT, stroke: "transparent", strokeWidth: 0, ...style?.shape };
  const ts = { ...TEXT_DEFAULT, align: "left" as const, ...style?.text };
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", padding: 4, boxSizing: "border-box", background: fillCss(sh), borderRadius: sh.radius }}>
      <EditableText value={data.text} style={ts} editable={editable} onCommit={(text) => onChange?.({ ...data, text })} placeholder="double click to type" />
    </div>
  );
}
