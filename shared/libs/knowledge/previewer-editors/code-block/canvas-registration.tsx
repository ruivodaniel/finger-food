// The code block on a canvas: owned by its node, edited in place (the same component views and edits); two layouts, the block (the width the person's, the height the lines', the corners scale the font, grey bars far away) and the compact chip (no centre handle: it can be grabbed)
import { register, type CanvasViewProps } from "../../hosts/canvas/v3/canvas-registration";
import { Previewer } from "./Previewer";
import { CodeBlockOptions } from "./Options";
import { spec } from "./spec";
import type { CodeSnippet } from "./types";

const View = ({ data, layout, switches, editable, onChange }: CanvasViewProps<CodeSnippet>) => <Previewer layout={layout} v={switches as Record<string, string | boolean>} data={data} edit={editable && onChange ? { source: "fixture", kind: "code block", onSubmit: onChange } : undefined} />;
export const codeBlock = register<CodeSnippet>({
  kind: "code_block", name: "code block", component: View, schema: { parse: (x) => x as CodeSnippet }, spec,
  data: "owned_by_node", edit: "in_place",
  tools: [{ id: "code", name: "code block", group: "complex", placing: "drag_box", size: { width: 320, height: 120 }, data: () => ({ id: crypto.randomUUID(), code: "" }) }],
  layout: { default: "block", editable: ["block", "compact"] },
  layouts: {
    block: { size: { width: "user", height: "content" }, min: { width: 120 }, farAway: "skeleton", scaleSwitch: "fontSize" },
    compact: { size: { width: "content", height: "content" }, handles: ["top", "left", "bottom", "right"] },
  },
  optionsBar: ({ switches, onSwitches }) => <CodeBlockOptions switches={switches} onChange={(p) => onSwitches({ ...switches, ...p })} />,
});
