import type { Layout, Prop, Spec } from "../types";

const b = (name: string, def: boolean): Prop => ({ name, kind: "boolean", default: def });
const u = (name: string, values: string[], def: string): Prop => ({ name, kind: "union", values, default: def });

export const LANGUAGES = ["javascript", "typescript", "jsx", "tsx", "json", "python", "html", "css", "markdown", "sql", "shell", "yaml", "go", "rust", "java", "c", "cpp", "csharp", "ruby", "toml", "plain"];

/** A code snippet is a block of code: dark, monospaced, coloured by its language. One layout. The text is the entity's; the language, the font size and the line numbers are the instance's switches.
 *  `width` is fill (the node's width, set by its side handles); the height follows the lines. The font size is one number: the corner handles and the toolbar both change it, and the block scales with it. */
const options: Prop[] = [u("language", LANGUAGES, "javascript"), { name: "fontSize", kind: "number", default: "14" }, b("showLineNumbers", true)];
const layouts: Layout[] = [
  { id: "block", name: "code block", description: "a block of code: line numbers and coloured text on a dark ground; a double click edits it in place (the previewer and the editor are the same component)", image: "none", props: [
    u("width", ["fill"], "fill"), ...options,
  ], hover: [] },
  { id: "compact", name: "compact", description: "a small dark chip with a code icon; the pointer resting on it for 300 ms opens the block beside it, read-only; a click closes it until the pointer leaves and comes back", image: "none", props: [
    u("width", ["fixed"], "fixed"), ...options,
  ], hover: [] },
];

export const spec: Spec = { id: "code-snippet-previewer", name: "code-snippet-previewer", state: "draft", layouts };
