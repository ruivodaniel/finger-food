// ── THE KINDS OF ITEM OF THE UI ──────────────────────────────────
// How a thing of the UI is recognised, what it names, how it is read (PARSER), and what the processors read of it (its facts).
//   code     markup as code: a .tsx file → trees
//   data     markup as data: a ui_data.json → the row, its document inside
//   theme    a theme file → the themes it exports
//   module   any other TypeScript file: followed through, never checked
// Syntax only: where a named thing is, the source says.
import * as ts from "typescript";
import type { Kind, Named, TreeNode, Use } from "../../check/index.ts";
import type { Doc } from "../ui-data/v2/types";
import { parseCode } from "./parse-code";
import type { Tree } from "./check";
import { documentFacts } from "./document-facts";

export const KINDS = ["code", "data", "theme"] as const;
export type KindName = (typeof KINDS)[number];

/** a row of a UI document, as it is stored */
export type UiRow = { id: string; name: string; kind: string; document: Doc & { version: number } };
const isData = (id: string) => id.endsWith("/ui_data.json");
const isTheme = (id: string) => /(^|\/)themes\/[^/]+\/v\d+\/theme\.ts$/.test(id) || /(^|\/)web\/theme\/[^/]+\.ts$/.test(id);
export const isThemeValue = (x: unknown) => !!x && typeof x === "object" && "colors" in x && "elements" in x;

const imports = (raw: string): Named[] => ts.preProcessFile(raw, true, true).importedFiles.map((i) => ({ as: "import", name: i.fileName }));

/** the documents a UI document names with `use`, and the components written as code it names with `type` */
function namesOfDocument(raw: string): Named[] {
  const out: Named[] = [];
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (!n || typeof n !== "object") return;
    const o = n as { use?: { component?: string; version?: unknown }; type?: unknown; version?: unknown };
    if (o.use?.component) out.push({ as: "document", name: o.use.component, version: typeof o.use.version === "number" ? o.use.version : undefined });
    if (typeof o.type === "string") out.push({ as: "component", name: o.type, version: typeof o.version === "number" ? o.version : undefined });
    Object.values(n).forEach(walk);
  };
  walk((JSON.parse(raw) as { document: unknown }).document);
  return out;
}

/** code → the tree the processors read. An HTML element is tagged `raw` */
const treeOfCode = (trees: Tree[]): TreeNode[] => {
  const one = (n: Tree): TreeNode => ({ name: n.component, at: `line ${n.line}`, props: n.props.map((name) => ({ name })), children: n.children.map(one), weight: n.weight, tags: n.raw ? ["raw"] : undefined, marker: n.excepted, origin: n.origin });
  return trees.map(one);
};

/** code → what each component is given: its properties (with the value, where it is written as a text) and its events (a property `onX` is the event `x`).
 *  A spread gives nothing that can be named */
const usesOfCode = (trees: Tree[]): Use[] => {
  const out: Use[] = [];
  const one = (n: Tree): void => {
    if (!n.raw) {
      const named = n.props.filter((p) => p !== "..."), events = named.filter((p) => /^on[A-Z]/.test(p));
      out.push({ as: "component", in: "code", from: n.origin, name: n.component, at: `line ${n.line}`, passes: {
        props: named.filter((p) => !events.includes(p)).map((name) => (n.values?.[name] !== undefined ? { name, value: n.values[name], type: "string" } : { name })),
        events: events.map((p) => ({ name: p[2].toLowerCase() + p.slice(3) })) } });
    }
    n.children.forEach(one);
  };
  trees.forEach(one);
  return out;
};

export const uiKinds: Kind[] = [
  { name: "data", is: isData, names: namesOfDocument, parse: (raw) => JSON.parse(raw), facts: (value, _id, resolve) => documentFacts((value as UiRow).document, resolve) },
  { name: "theme", is: isTheme, names: imports, parse: async (_raw, id, source) => Object.values((await source.load(id)) as Record<string, unknown>).filter(isThemeValue) },
  { name: "code", is: (id) => id.endsWith(".tsx"), names: imports, parse: (raw, id) => parseCode(id, raw), facts: (value) => ({ tree: treeOfCode(value as Tree[]), uses: usesOfCode(value as Tree[]) }) },
  { name: "module", item: false, is: (id) => id.endsWith(".ts"), names: imports },
];
