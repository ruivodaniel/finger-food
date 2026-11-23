// The code snippet: ONE component that shows a block of code and edits it. A double click starts typing in place (CodeMirror 6); a click outside, or Escape, ends it and hands the text to
// the consumer's `edit.onSubmit`. Coloured by its language, line numbers on or off, one font size: every measure of the block is in `em`, so the whole block scales with it.
// Far away (the canvas says the text is too small to read) it draws grey bars, one per line, as long as the line.
// Exception to the library rules, named here: the text is drawn by CodeMirror, not by the library's components, and its colours are the code's own.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, StreamLanguage, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import { go } from "@codemirror/legacy-modes/mode/go";
import { rust } from "@codemirror/legacy-modes/mode/rust";
import { java, c, cpp, csharp } from "@codemirror/legacy-modes/mode/clike";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import type { Values } from "../types";
import type { CodeSnippet } from "./types";
import type { Edit } from "../editing/types";
import { useUnreadable } from "../zoom";
import { spec } from "./spec";

const MONO = "'Roboto Mono', 'SF Mono', Menlo, monospace";
const GROUND = "#000030", INK = "#f4f4f8", GUTTER = "#6c6c8e", SELECTION = "#2e2e66";

const LANGS: Record<string, () => Extension> = {
  javascript: () => javascript(), typescript: () => javascript({ typescript: true }), jsx: () => javascript({ jsx: true }), tsx: () => javascript({ jsx: true, typescript: true }),
  json: () => json(), python: () => python(), html: () => html(), css: () => css(), markdown: () => markdown(), sql: () => sql(),
  shell: () => StreamLanguage.define(shell), yaml: () => StreamLanguage.define(yaml), go: () => StreamLanguage.define(go), rust: () => StreamLanguage.define(rust),
  java: () => StreamLanguage.define(java), c: () => StreamLanguage.define(c), cpp: () => StreamLanguage.define(cpp), csharp: () => StreamLanguage.define(csharp),
  ruby: () => StreamLanguage.define(ruby), toml: () => StreamLanguage.define(toml), plain: () => [],
};

/** the colours of the code, as the dark block of the board draws them */
const COLOURS = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "#ff4f8b" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: "#b8dc6c" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "#e6d57c" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#a98bff" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#8d8da8" },
  { tag: [t.propertyName, t.variableName, t.name], color: INK },
  { tag: [t.typeName, t.className, t.namespace], color: "#6ccaf7" },
  { tag: [t.operator, t.punctuation, t.bracket], color: INK },
  { tag: [t.tagName, t.heading], color: "#ff4f8b" },
  { tag: [t.attributeName], color: "#b8dc6c" },
]);

/** the editor's own look: every measure in em, so the font size scales the whole block */
const LOOK = EditorView.theme({
  "&": { background: GROUND, color: INK, fontFamily: MONO, fontSize: "1em", borderRadius: "0.2em" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: MONO, lineHeight: "1.55", overflowX: "hidden", overflowY: "visible" },
  ".cm-content": { padding: "1.1em 1.4em 1.1em 0", caretColor: INK },
  ".cm-line": { padding: "0 0 0 1.2em" },
  ".cm-gutters": { background: GROUND, color: GUTTER, border: "none", paddingLeft: "0.8em" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 0.6em 0 0.4em", minWidth: "1.6em" },
  ".cm-activeLine": { background: "transparent" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { background: SELECTION },
  ".cm-cursor": { borderLeftColor: INK },
});

/** the block's own defaults: the layout's props, so a consumer that passes nothing gets the spec's */
const defaultsOf = (layout: string): Values => Object.fromEntries((spec.layouts.find((l) => l.id === layout)?.props ?? []).map((p) => [p.name, p.default]));

/** far away: one grey bar a line, as long as the line */
function Skeleton({ code, size }: { code: string; size: number }) {
  const lines = code.split("\n");
  return (
    <div style={{ background: GROUND, borderRadius: "0.2em", padding: `${size * 1.1}px ${size * 1.4}px`, fontSize: size }}>
      {lines.map((l, i) => <div key={i} style={{ height: "1.55em", display: "flex", alignItems: "center" }}><div style={{ height: "0.5em", borderRadius: "0.25em", width: `${Math.max(0.5, l.length * 0.6)}em`, background: l.trim() ? "#4a4a78" : "transparent" }} /></div>)}
    </div>
  );
}

/** the block: the text from the host; the language, the size and the line numbers from the switches. With an `edit`, a double click types in place. */
function CodeView({ v, data, edit }: { v: Values; data: CodeSnippet; edit?: Edit<CodeSnippet> }) {
  const size = Math.max(4, Number(v.fontSize) || 14);
  const far = useUnreadable(size);
  const [editing, setEditing] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const live = useRef({ data, edit });
  live.current = { data, edit };
  const parts = useMemo(() => ({ language: new Compartment(), numbers: new Compartment(), editable: new Compartment() }), []);

  // the view: made once; what changes later goes through the compartments
  useEffect(() => {
    if (far || !host.current) return;
    const done = () => {
      const code = view.current?.state.doc.toString() ?? "";
      const { data: d, edit: e } = live.current;
      if (e && code !== d.code) void e.onSubmit({ ...d, code });
      setEditing(false);
    };
    const v0 = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: data.code,
        extensions: [
          LOOK, syntaxHighlighting(COLOURS), history(), indentOnInput(),
          keymap.of([{ key: "Escape", run: () => { done(); return true; } }, indentWithTab, ...defaultKeymap, ...historyKeymap]),
          EditorView.domEventHandlers({ blur: () => { done(); return false; } }),
          parts.language.of((LANGS[String(v.language)] ?? LANGS.plain)()),
          parts.numbers.of(v.showLineNumbers ? lineNumbers() : []),
          parts.editable.of(EditorView.editable.of(false)),
        ],
      }),
    });
    view.current = v0;
    return () => { v0.destroy(); view.current = null; };
  }, [far]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { view.current?.dispatch({ effects: parts.language.reconfigure((LANGS[String(v.language)] ?? LANGS.plain)()) }); }, [v.language, far]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { view.current?.dispatch({ effects: parts.numbers.reconfigure(v.showLineNumbers ? lineNumbers() : []) }); }, [v.showLineNumbers, far]);   // eslint-disable-line react-hooks/exhaustive-deps
  // the width is the user's: text wider than it is cut. While typing it scrolls sideways inside the block; at rest it does not, and shows its start again
  useEffect(() => {
    const w = view.current;
    if (!w) return;
    w.dispatch({ effects: parts.editable.reconfigure(EditorView.editable.of(editing)) });
    w.scrollDOM.style.overflowX = editing ? "auto" : "hidden";
    if (editing) w.focus(); else w.scrollDOM.scrollLeft = 0;
  }, [editing, far]);   // eslint-disable-line react-hooks/exhaustive-deps
  // the text from outside (another viewer, an undo): taken in unless it is being typed
  useEffect(() => { const w = view.current; if (w && !editing && w.state.doc.toString() !== data.code) w.dispatch({ changes: { from: 0, to: w.state.doc.length, insert: data.code } }); }, [data.code, editing, far]);

  return (
    <div className={editing ? "nodrag nopan nowheel" : undefined} data-testid="code-snippet" style={{ width: "100%", minWidth: 0, overflow: "hidden", fontSize: size }}
      onDoubleClick={edit && !far ? (e) => { e.stopPropagation(); setEditing(true); } : undefined}
      onKeyDown={editing ? (e) => e.stopPropagation() : undefined}>
      {far ? <Skeleton code={data.code} size={size} /> : <div ref={host} />}
    </div>
  );
}

const OPEN_AFTER = 300, OFFSET = 12, EDGE = 8, CARD_W = 520;
/** the compact layout: a dark chip with the code icon. The pointer resting on it for 300 ms opens the block beside it (fixed, over everything, read-only); a press shuts it until the pointer has left and come back.
 *  The pointer is watched on the window against the chip's own box: the canvas draws its connection handles over a node, and on a chip this small they cover it, so the chip's own mouse events never settle. */
function Compact({ v, data }: { v: Values; data: CodeSnippet }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [top, setTop] = useState(0);
  const chip = useRef<HTMLDivElement>(null), box = useRef<HTMLDivElement>(null);
  const opening = useRef<number | null>(null), inside = useRef(false), shut = useRef(false);
  useEffect(() => {
    const clear = () => { if (opening.current) window.clearTimeout(opening.current); opening.current = null; };
    const over = (e: PointerEvent) => { const r = chip.current?.getBoundingClientRect(); return !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    const move = (e: PointerEvent) => {
      const now = over(e);
      if (!now) { if (inside.current) { inside.current = false; shut.current = false; clear(); setAt(null); } return; }
      inside.current = true;
      if (shut.current || e.buttons) return;
      clear();
      const x = e.clientX, y = e.clientY;
      opening.current = window.setTimeout(() => setAt((a) => a ?? { x, y }), OPEN_AFTER);
    };
    const down = (e: PointerEvent) => { if (!over(e)) return; clear(); shut.current = true; setAt(null); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerdown", down, true);
    return () => { clear(); window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", down, true); };
  }, []);
  useLayoutEffect(() => { if (!at || !box.current) return; setTop(Math.max(EDGE, Math.min(at.y + OFFSET, window.innerHeight - box.current.offsetHeight - EDGE))); }, [at]);
  const left = at ? (window.innerWidth - at.x < CARD_W + 40 ? at.x - CARD_W - OFFSET : at.x + OFFSET) : 0;
  return (
    <>
      <div ref={chip} data-testid="code-snippet-compact"
        style={{ width: 36, height: 36, borderRadius: 8, background: GROUND, color: INK, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 15, fontWeight: 700, cursor: "default", userSelect: "none" }}>{"{ }"}</div>
      {at ? createPortal(
        <div ref={box} data-testid="code-snippet-card" style={{ position: "fixed", left, top, width: CARD_W, zIndex: 100000, pointerEvents: "none" }}><CodeView v={v} data={data} /></div>,
        document.body,
      ) : null}
    </>
  );
}

/** the code snippet previewer: the block, or the compact chip that shows the block on hover */
export function Previewer({ layout: layoutProp, v: given, data, edit }: { layout?: string; v?: Values; data: CodeSnippet; edit?: Edit<CodeSnippet> }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  return layout === "compact" ? <Compact v={v} data={data} /> : <CodeView v={v} data={data} edit={edit} />;
}
