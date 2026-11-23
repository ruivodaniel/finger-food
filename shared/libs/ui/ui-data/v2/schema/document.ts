// THE GRAMMAR OF A UI DOCUMENT, as a schema: what a document, a node, a read and an action are made of. The vocabulary is the dictionary's.
// What depends on anything outside the document's own shape is not here: what a name is (a value in scope, a state, an operation), what a node names and what it
// declares, and the sizes a document may not pass are rules of the UI rule set (shared/libs/ui/rules/rule-set.ts), applied by the check system.
import { z } from "zod";
import { NODE_KEYS, PLACEHOLDER_DATA, REQUEST } from "../dictionary";
import { isRequestLine, parseRequestLine } from "../request";

const notARequest = (line: string) => `"${line}" is not a request: a method (${REQUEST.methods.join(", ")}), one space, a path starting with /`;
/** a line written as a request follows the request's shape, and every name of its path is given a value beside it */
const requestLine = (line: unknown, values: unknown, ctx: z.RefinementCtx, at: PropertyKey[], more?: (method: string) => string | undefined) => {
  if (!isRequestLine(line)) return;
  const parsed = parseRequestLine(line);
  if (!parsed) { ctx.addIssue({ code: "custom", path: at, message: notARequest(line) }); return; }
  const wrong = more?.(parsed.method);
  if (wrong) { ctx.addIssue({ code: "custom", path: at, message: wrong }); return; }
  for (const n of parsed.names) if (!values || typeof values !== "object" || !(n in values)) ctx.addIssue({ code: "custom", path: at, message: `${line} needs "${n}"` });
};

/** an action: the document's own bookkeeping, the moves on the frame, the product's actions, and a condition */
export const Action: z.ZodType = z.lazy(() => z.looseObject({
  do: z.array(Action).optional(),
  navigate: z.looseObject({ to: z.any().refine((to) => typeof to !== "string" || to.startsWith("/"), "navigate goes to a path of the app") }).optional(),
  setStorage: z.looseObject({ key: z.string("setStorage names a key") }).optional(),
  moveWorld: z.looseObject({ at: z.any().refine((at) => at !== undefined, "moveWorld names the moment (at)") }).optional(),
  dispatch: z.looseObject({ action: z.string(), then: z.array(Action).optional(), else: z.array(Action).optional() })
    .superRefine((d, ctx) => requestLine(d.action, (d as { args?: unknown }).args ?? {}, ctx, [])).optional(),
}, "an action is an object"));

const isNode = (v: unknown) => !!v && typeof v === "object" && !Array.isArray(v) && ("type" in (v as object) || "use" in (v as object));
/** a value a node is given: where it is a node, or a list of nodes, each follows the grammar of a node */
const Given: z.ZodType = z.any().superRefine((v, ctx) => {
  const nodes = isNode(v) ? [[v, [] as PropertyKey[]] as const] : Array.isArray(v) && v.length > 0 && v.every(isNode) ? v.map((n, i) => [n, [i] as PropertyKey[]] as const) : [];
  for (const [n, at] of nodes) { const r = Node.safeParse(n); if (!r.success) for (const i of r.error.issues) ctx.addIssue({ ...i, path: [...at, ...i.path] } as never); }
});

/** a node: a component of the library (type) or a reference to a UI document (use) */
export const Node: z.ZodType = z.lazy(() => z.strictObject({
  type: z.string().optional(),
  version: z.any().optional(),
  use: z.looseObject({ component: z.string() }).optional(),
  props: z.record(z.string(), Given).optional(),
  args: z.record(z.string(), z.any()).optional(),
  slots: z.record(z.string(), z.array(Node)).optional(),
  children: z.array(Node, "children is a list of nodes; a text goes in props.children").optional(),
  when: z.any().optional(),
  repeat: z.looseObject({ each: z.string(), as: z.string() }).optional(),
  on: z.record(z.string(), z.array(Action)).optional(),
} satisfies Record<string, z.ZodType>).superRefine((n, ctx) => {
  if (!!n.type === !!n.use) ctx.addIssue({ code: "custom", message: "a node is either a primitive (type) or a reference (use)" });
  if (n.version !== undefined && (!n.type || !Number.isInteger(n.version) || n.version < 1)) ctx.addIssue({ code: "custom", path: ["version"], message: "a version is a whole number, 1 or more, on a node that names a component with `type`" });
  if (n.use && Array.isArray(n.children) && n.children.length) ctx.addIssue({ code: "custom", message: "a reference takes arguments and slots, not children" });
}));
// the keys of a node are the dictionary's
if ([...NODE_KEYS].sort().join() !== ["type", "version", "use", "props", "args", "slots", "children", "when", "repeat", "on"].sort().join()) throw new Error("schema/document.ts: the keys of a node are not the dictionary's (NODE_KEYS)");

/** a read: a request of the product's API, or a name of the project's catalog */
const Read = z.looseObject({
  source: z.string(),
  params: z.record(z.string(), z.any()).optional(),
  placeholderData: z.enum(PLACEHOLDER_DATA, `placeholderData is ${PLACEHOLDER_DATA.join(", ")}`).optional(),
}).superRefine((r, ctx) => requestLine(r.source, r.params ?? {}, ctx, ["source"], (method) => (method !== "GET" ? `a read is a GET; ${method} is an action (dispatch)` : undefined)));

export const Document = z.looseObject({
  schemaVersion: z.literal(1, "unknown schema version"),
  kind: z.enum(["page", "component"], "kind is page or component"),
  name: z.string("a name and an integer version are required").min(1, "a name and an integer version are required"),
  version: z.number("a name and an integer version are required").int("a name and an integer version are required"),
  data: z.record(z.string(), Read).optional(),
  root: Node,
});

/** how a place in a document is written: root.children[0].props.icon */
export const placeOf = (path: readonly PropertyKey[]): string => path.reduce<string>((s, k) => (typeof k === "number" ? `${s}[${k}]` : s ? `${s}.${String(k)}` : String(k)), "");
