// ── WHAT THE PROCESSORS READ OF A UI DOCUMENT ────────────────────
// The parser's half for a UI document: its tree, what each node names and passes (uses), every name it uses with what is in scope there (references),
// the names it declares, and its sizes (measures). It judges nothing: every rule is in the rule set, applied by the processors of the check system.
// It knows how a UI document is written (the dictionary, the expression language), and nothing of what is right or wrong.
import type { Facts, Measure, Prop, Reference, Resolve, TreeNode, Use } from "../../check/index.ts";
import type { Doc, Json, Node } from "../ui-data/v2/types";
import { ACTIONS, OPS, READ_STATES } from "../ui-data/v2/dictionary";
import { STORE_ACTIONS } from "../ui-data/v3/dictionary";
import { bindRoots, depthOf, isExpr, opOf } from "../ui-data/v2/expr";
import { isRequestLine } from "../ui-data/v2/request";
import { POSITION } from "../types/axes";

/** what a name of the UI resolves to: a UI document (what it is at its root, the element each of its slots stands in), or a component written as code */
export type UiContract = {
  document?: Doc; root?: string; slots?: Record<string, string | undefined>;
  component?: { props: Record<string, unknown>; events: string[]; container: boolean; open?: boolean };
  /** a component: a test or a play addresses it when it hands up an input event, or when the document wires an event on it */
  interactable?: (wired: boolean) => boolean;
};

const isNode = (v: unknown): v is Node => !!v && typeof v === "object" && !Array.isArray(v) && ("type" in (v as object) || "use" in (v as object));
const isNodes = (v: unknown): v is Node[] => Array.isArray(v) && v.length > 0 && v.every(isNode);
/** an item of a list prop, as its keys: what `{"obj": {...}}` wraps, or the object itself */
const itemOf = (v: unknown): Record<string, unknown> => { const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}; const k = Object.keys(o); return k.length === 1 && k[0] === "obj" && o.obj && typeof o.obj === "object" ? (o.obj as Record<string, unknown>) : o; };
const typeOf = (v: unknown): string => (isNode(v) ? "node" : isNodes(v) ? "nodes" : isExpr(v) || Array.isArray(v) ? "expression" : v === null ? "null" : typeof v);
/** in the scope of what runs after an action failed: there `error` is the action's */
const ACTION_ERROR = " the action's error";

export function documentFacts(doc: Doc, resolve: Resolve): Facts {
  const mobile = doc.surface === "mobile", TID = mobile ? "testID" : "data-testid";
  const contractOf = (n: Node): UiContract | undefined => (n.type ? resolve({ as: "component", name: n.type, version: n.version, in: mobile ? "mobile" : undefined })
    : n.use ? resolve({ as: "document", name: n.use.component, version: typeof n.use.version === "number" ? n.use.version : undefined }) : undefined) as UiContract | undefined;
  const references: Reference[] = [], uses: Use[] = [], measures: Measure[] = [];
  const name = (space: string, n: string, at: string, more: Partial<Reference> = {}) => references.push({ space, name: n, at, ...more });

  // ── every name an expression uses ──
  const expr = (e: Json | undefined, at: string, scope: Set<string>): void => {
    if (e === undefined || e === null || typeof e !== "object") return;
    if (Array.isArray(e)) return e.forEach((x, i) => expr(x, `${at}[${i}]`, scope));
    measures.push({ name: "expression depth", value: depthOf(e), at });
    const op = opOf(e);
    // an object with more than one key (or none) is a plain object whose values are expressions (a `style`, a `query`)
    if (!op) { Object.entries(e).forEach(([k, v]) => expr(v as Json, `${at}.${k}`, scope)); return; }
    name("operation", op, at);
    if (!(OPS as readonly string[]).includes(op)) return;
    for (const r of bindRoots(e)) name("scope", r, at, { scope: [...scope] });
    // a state of a read (`isLoading.<name>`, `error.<name>`…) names one of the document's reads; after an action that failed, `error` is that action's
    const [root, read = ""] = op === "bind" && typeof e.bind === "string" ? e.bind.split(".") : [""];
    if ((READ_STATES as readonly string[]).includes(root) && !(root === "error" && scope.has(ACTION_ERROR))) name("read", read, at, { shown: String(e.bind) });
  };
  /** a value of any shape (a style, a query): an expression where one is, a plain object otherwise, its values looked at the same way */
  const loose = (v: Json | undefined, at: string, scope: Set<string>): void => {
    if (Array.isArray(v)) return v.forEach((x, i) => loose(x, `${at}[${i}]`, scope));
    if (!isExpr(v)) return;
    const op = opOf(v);
    if (op && (OPS as readonly string[]).includes(op)) { expr(v as Json, at, scope); return; }
    for (const [k, x] of Object.entries(v)) loose(x as Json, `${at}.${k}`, scope);
  };

  // ── every name an action uses ──
  const actions = (list: Json[] | undefined, at: string, scope: Set<string>): void => {
    (Array.isArray(list) ? list : []).forEach((a, i) => {
      const p = `${at}[${i}]`;
      if (!isExpr(a)) return;
      if (Object.keys(a).includes("when")) { expr(a.when as Json, `${p}.when`, scope); actions(a.do as Json[], `${p}.do`, scope); return; }
      const op = opOf(a);
      name("action", String(op), p);
      if (op === "set") { const s = a.set as { state: string; to: Json }; name("state", s.state, p); expr(s.to, p, scope); }
      else if (op === "navigate") expr((a.navigate as { to: Json }).to, p, scope);
      else if (op === "setStorage") expr((a.setStorage as { to?: Json }).to, p, scope);
      else if (op === "moveWorld") { const m = a.moveWorld as { world?: Json; at?: Json }; expr(m.at, p, scope); if (m.world !== undefined) expr(m.world, p, scope); }
      else if (op === "emit") { const e = a.emit as { event: string; payload?: Record<string, Json> }; name("emit", e.event, p); for (const v of Object.values(e.payload ?? {})) expr(v, p, scope); }
      else if (op === "dispatch") {
        const d = a.dispatch as { action: string; args?: Record<string, Json>; pending?: string; then?: Json[]; else?: Json[] };
        if (!isRequestLine(d.action)) name("catalog action", String(d.action), p);
        if (d.pending) name("state", d.pending, p);
        for (const v of Object.values(d.args ?? {})) expr(v, p, scope);
        actions(d.then, `${p}.then`, new Set([...scope, "result"])); actions(d.else, `${p}.else`, new Set([...scope, "error", ACTION_ERROR]));
      }
    });
  };

  // ── the document's own values and reads ──
  const base = new Set<string>([...(doc.params ?? []), "data", ...READ_STATES, "state", "calc", "store"]);
  for (const [k, c] of Object.entries(doc.calc ?? {})) expr(c, `calc.${k}`, base);
  for (const [k, dd] of Object.entries(doc.data ?? {})) {
    if (!isRequestLine(dd.source)) name("data contract", String(dd.source), `data.${k}`);
    for (const p of Object.keys(dd.params ?? {})) expr(dd.params![p], `data.${k}.params.${p}`, base);
    if (dd.when !== undefined) expr(dd.when, `data.${k}.when`, base);
  }

  // ── the tree, what each node names and passes, and the names used along the way ──
  let count = 0, deepest = { value: 0, at: "root" };
  /** the value of a test id, as it is written: a literal, or the parts of a `concat` joined by `|` (a part that is not a literal: {bind} or {computed}) */
  const testId = (v: Json | undefined, at: string): Prop | undefined => {
    if (typeof v === "string") return { name: TID, at, value: v, type: "string" };
    if (isExpr(v) && opOf(v) === "concat" && Array.isArray(v.concat)) return { name: TID, at, dynamic: true, type: "expression", value: (v.concat as Json[]).map((x) => (typeof x === "string" ? x : isExpr(x) && opOf(x) === "bind" ? "{bind}" : "{computed}")).join("|") };
    return undefined;
  };
  const walk = (n: Node, at: string, scope: Set<string>, depth: number, under: string | undefined, structural: boolean): TreeNode => {
    count++; if (depth > deepest.value) deepest = { value: depth, at };
    const place = structural ? {} : { under: under ?? null };
    if (n.when !== undefined) expr(n.when as Json, `${at}.when`, scope);
    let inner = scope;
    if (n.repeat) { name("scope", String(n.repeat.each).split(".")[0], `${at}.repeat`, { scope: [...scope], shown: n.repeat.each }); inner = new Set([...scope, n.repeat.as]); }
    const all = Array.isArray(n.children) ? (n.children as unknown[]) : [], kids = all.filter(isNode);
    const contract = contractOf(n), children: TreeNode[] = [];
    const wired = (ev: string) => actions(n.on![ev], `${at}.on.${ev}`, new Set([...inner, "event"]));

    if (n.type) {
      const prim = contract?.component, props: Prop[] = [], passed: Prop[] = [];
      for (const [k, v] of Object.entries(n.props ?? {})) {
        const where = `${at}.props.${k}`, type = typeOf(v);
        props.push(k === TID ? testId(v as Json, where) ?? { name: k, at: where, type } : { name: k, at: where, type, value: type === "string" || type === "number" || type === "boolean" ? String(v) : undefined });
        passed.push({ name: k, at: where, type, value: type === "string" || type === "number" || type === "boolean" ? String(v) : undefined });
        const kind = prim?.props[k];
        // a template: one node, drawn per item by the component; `item` and `ctx` are in scope inside it
        if (kind === "template") { if (isNode(v)) children.push(walk(v, where, new Set([...inner, "item", "ctx"]), depth + 1, undefined, false)); continue; }
        if (isNode(v)) { children.push(walk(v, where, inner, depth + 1, undefined, false)); continue; }
        if (isNodes(v)) { v.forEach((c, i) => children.push(walk(c, `${where}[${i}]`, inner, depth + 1, undefined, false))); continue; }
        // a list of items that hold templates (RichTable's columns, each with its `render`): a node under a key of an item is drawn per row, `item` and `ctx` in scope; the rest of the item is data
        if (Array.isArray(v) && v.some((it) => Object.values(itemOf(it)).some(isNode))) {
          v.forEach((it, i) => { for (const [key, val] of Object.entries(itemOf(it))) { const w = `${where}[${i}].${key}`; if (isNode(val)) children.push(walk(val, w, new Set([...inner, "item", "ctx"]), depth + 1, undefined, false)); else loose(val as Json, w, inner); } });
          continue;
        }
        if (kind === "node" || kind === "any" || kind === true) { loose(v as Json, where, inner); continue; }
        if (isExpr(v) || Array.isArray(v)) expr(v as Json, where, inner);
        else if (kind === "position" && typeof v === "string") for (const one of v.split(/\s+/)) name("position", one, where);
      }
      if (n.type === "Slot") name("slot", String(n.props?.name), `${at}.props.name`);
      for (const ev of Object.keys(n.on ?? {})) wired(ev);
      uses.push({ as: "component", in: mobile ? "mobile" : undefined, name: n.type, version: n.version, at, passes: {
        props: passed, events: Object.keys(n.on ?? {}).map((ev) => ({ name: ev, at: `${at}.on.${ev}` })), children: kids.length || all.length ? [{ name: "children" }] : [] } });
      kids.forEach((c, i) => children.push(walk(c, `${at}.children[${i}]`, inner, depth + 1, n.type, true)));
      for (const [slot, nodes] of Object.entries(n.slots ?? {})) (Array.isArray(nodes) ? nodes : []).filter(isNode).forEach((c, i) => children.push(walk(c, `${at}.slots.${slot}[${i}]`, inner, depth + 1, undefined, false)));
      const interactable = !!prim && (contract!.interactable?.(Object.keys(n.on ?? {}).length > 0) || (n.type === "Text" && !!n.on?.click));
      return { name: n.type, at, props, children, weight: kids.length === 1 && all.length === 1 && !n.repeat && !kids[0].repeat ? 1 : 2, tags: interactable ? [`interactable:${TID}`] : undefined, ...place };
    }
    // a reference: it stands where it is written as what it is at its root; what is put in one of its slots stands under the element that slot is in
    for (const [k, v] of Object.entries(n.args ?? {})) expr(v as Json, `${at}.args.${k}`, inner);
    for (const ev of Object.keys(n.on ?? {})) wired(ev);
    if (n.use) uses.push({ as: "document", name: n.use.component, version: typeof n.use.version === "number" ? n.use.version : undefined, at, passes: {
      args: Object.keys(n.args ?? {}).map((k) => ({ name: k, at: `${at}.args.${k}` })), events: Object.keys(n.on ?? {}).map((ev) => ({ name: ev, at: `${at}.on.${ev}` })),
      slots: Object.keys(n.slots ?? {}).map((slot) => ({ name: slot, at: `${at}.slots.${slot}` })) } });
    kids.forEach((c, i) => children.push(walk(c, `${at}.children[${i}]`, inner, depth + 1, under, false)));
    for (const [slot, nodes] of Object.entries(n.slots ?? {})) (Array.isArray(nodes) ? nodes : []).filter(isNode).forEach((c, i) => children.push(walk(c, `${at}.slots.${slot}[${i}]`, inner, depth + 1, contract?.slots?.[slot], false)));
    const root = contract?.root;
    return { name: root ?? "", at, props: [], children, weight: 0, note: n.use && root ? `(${n.use.component} is a <${root}> at its root)` : undefined, ...place };
  };
  const tree = isNode(doc.root) ? [walk(doc.root, "root", base, 0, undefined, true)] : [];
  measures.push({ name: "nodes", value: count, at: "root" }, { name: "depth", value: deepest.value, at: deepest.at });

  return {
    tree, uses, references, measures,
    declared: {
      operation: OPS, action: ACTIONS.filter((a) => a !== "when"), position: POSITION,
      read: Object.keys(doc.data ?? {}), state: Object.keys(doc.state ?? {}), emit: doc.emits ?? [], slot: doc.slots ?? [],
      // the project's catalog of reads and actions is not part of a check of the library: a name of it is known to nobody here
      "data contract": [], "catalog action": [...STORE_ACTIONS],
    },
  };
}
