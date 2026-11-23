// The text inside a shape or a text box: a double click starts typing in place, as in Miro; a click outside or ⌘ Enter keeps it, Escape keeps it too and lets the selection go (the canvas hears it).
import { useEffect, useRef, useState } from "react";
import { textCss, type TextStyle } from "./types";

export function EditableText({ value, style, editable, onCommit, onBold, placeholder = "" }: { value: string; style: Required<TextStyle>; editable: boolean; onCommit: (next: string) => void; /** ⌘B while typing: the box's text turns bold, or back */ onBold?: () => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  const css = textCss(style);
  if (editing) {
    return (
      <textarea ref={ref} autoFocus data-canvas-text className="nodrag nopan nowheel" value={draft} onChange={(e) => setDraft(e.target.value)} onFocus={(e) => { const t = e.target; t.setSelectionRange(t.value.length, t.value.length); t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }}
        onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }}
        onBlur={() => { setEditing(false); if (draft !== value) onCommit(draft); }}
        onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); else { setEditing(false); if (draft !== value) onCommit(draft); } if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ref.current?.blur(); if (onBold && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); onBold(); } }}
        onMouseDown={(e) => e.stopPropagation()}
        rows={1} style={{ ...css, width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", padding: 0, margin: 0, fontFamily: "inherit", overflow: "hidden" }} />
    );
  }
  return (
    <div onDoubleClick={(e) => { if (!editable) return; e.stopPropagation(); setEditing(true); }} style={{ ...css, width: "100%" }} data-testid="editable-text">
      {value || (editable ? <span style={{ opacity: 0.35 }}>{placeholder}</span> : null)}
    </div>
  );
}
