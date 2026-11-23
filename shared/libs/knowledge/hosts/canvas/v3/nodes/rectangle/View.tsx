// A shape: a rectangle, an oval, a diamond or a triangle, with its text; in the labelled layouts a title (or an icon) beside or above the content. The style is the node's.
import { useState } from "react";
import { Icon, Popover, PopoverContent, PopoverTrigger, iconRegistry, type IconName } from "@libs/web-components";
import type { CanvasViewProps } from "../../canvas-registration";
import { EditableText } from "../../style/EditableText";
import { SHAPE_DEFAULT, TEXT_DEFAULT, fillCss, type ShapeStyle } from "../../style/types";
import { IconGrid } from "../../tools/IconGrid";

export type ShapeForm = "rectangle" | "oval" | "diamond" | "triangle";
export type RectangleData = { form?: ShapeForm; text?: string; /** a label in its own column on the left, before the text (an id: GG3, G9); in the labelled layouts the title */ badge?: string; /** an icon box: the icon that stands where the title would */ labelIcon?: string };

/** the outline of a form other than the rectangle, drawn as SVG over the whole box (stretched with it); the stroke keeps its thickness */
function FormOutline({ form, sh }: { form: "oval" | "diamond" | "triangle"; sh: Required<ShapeStyle> }) {
  const dash = sh.strokeStyle === "dashed" ? "8 5" : sh.strokeStyle === "dotted" ? "1.5 4" : undefined;
  const common = { fill: fillCss(sh), stroke: sh.strokeWidth ? sh.stroke : "none", strokeWidth: sh.strokeWidth, strokeDasharray: dash, vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} aria-hidden>
      {form === "oval" ? <ellipse cx="50" cy="50" rx="50" ry="50" {...common} /> : form === "diamond" ? <polygon points="50,0 100,50 50,100 0,50" {...common} /> : <polygon points="50,0 100,100 0,100" {...common} />}
    </svg>
  );
}
/** an icon box's icon: in a box padded like the text; a double click opens the icon grid to change it */
function LabelIcon({ name, color, pad, size, onPick }: { name: string; color: string; pad: number; size: number; onPick?: (name: string) => void }) {
  const shown = (name in iconRegistry ? name : "add") as IconName;
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span onDoubleClick={(e) => { if (!onPick) return; e.stopPropagation(); setOpen(true); }} onClick={(e) => e.preventDefault()} className="canvas-icon" style={{ color, display: "inline-flex", boxSizing: "content-box", width: size, height: size, padding: pad, cursor: onPick ? "pointer" : undefined }}><Icon name={shown} scale="xl" /></span>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="nodrag nopan" style={{ width: "auto", padding: 8 }}><IconGrid value={name} onPick={(n) => { onPick?.(n); setOpen(false); }} /></PopoverContent>
    </Popover>
  );
}
export function RectangleView({ data, layout, style, editable, onChange, onStyle }: CanvasViewProps<RectangleData>) {
  const sh = { ...SHAPE_DEFAULT, ...style?.shape };
  const ts = { ...TEXT_DEFAULT, ...style?.text };
  const form = data.form ?? "rectangle";
  const labelAt = layout === "labelled-top" ? "top" : layout === "labelled" ? "left" : undefined;
  const box: React.CSSProperties = form === "rectangle" ? { border: `${sh.strokeWidth}px ${sh.strokeStyle} ${sh.stroke}`, borderRadius: sh.radius, background: sh.fill === "transparent" ? "var(--background)" : fillCss(sh) } : {};
  const inset = form === "diamond" ? "22% 22%" : form === "triangle" ? "45% 22% 8% 22%" : form === "oval" ? "15% 12%" : 8;
  // a double click anywhere on the shape starts typing in it, not only on the line of text
  const [typing, setTyping] = useState(0);
  const bold = onStyle ? () => onStyle({ ...style, text: { ...style?.text, bold: !ts.bold } }) : undefined;
  return (
    <div onDoubleClick={() => { if (editable) setTyping((n) => n + 1); }} style={{ width: "100%", height: "100%", position: "relative", boxSizing: "border-box", ...box }}>
      {form !== "rectangle" ? <FormOutline form={form} sh={sh} /> : null}
      {labelAt ? (
        <div style={{ position: "absolute", inset: 8, display: "flex", flexDirection: labelAt === "top" ? "column" : "row", alignItems: labelAt === "top" ? "stretch" : "center", justifyContent: "center", gap: labelAt === "top" ? 6 : 16, overflow: "hidden", textAlign: "left" }}>
          <div style={{ flex: "0 0 auto", minWidth: labelAt === "left" ? 44 : undefined }}>{data.labelIcon ? <LabelIcon name={data.labelIcon} color={ts.color} pad={8} size={Math.round(ts.fontSize * 2.6)} onPick={editable ? (labelIcon) => onChange?.({ ...data, labelIcon }) : undefined} /> : <EditableText request={typing} value={data.badge ?? ""} onBold={bold} style={{ ...ts, bold: true, align: "left" }} editable={editable} onCommit={(badge) => onChange?.({ ...data, badge })} placeholder="title" />}</div>
          <div style={{ flex: labelAt === "left" ? 1 : undefined, minWidth: 0 }}><EditableText request={typing} value={data.text ?? ""} style={{ ...ts, align: "left" }} onBold={bold} editable={editable} onCommit={(text) => onChange?.({ ...data, text })} placeholder="content" /></div>
        </div>
      ) : <div style={{ position: "absolute", inset, display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>{data.badge ? <span style={{ flex: "0 0 auto", minWidth: 44, fontSize: ts.fontSize, fontWeight: 700, color: ts.color }}>{data.badge}</span> : null}<EditableText request={typing} value={data.text ?? ""} style={ts} editable={editable} onCommit={(text) => onChange?.({ ...data, text })} placeholder="double click to type" /></div>}
    </div>
  );
}
