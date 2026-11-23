// ── PROCESSOR · tree ─────────────────────────────────────────────
// What may stand where in a tree, the same for code and for data. It knows nothing of what the names mean: a rule says the names.
//   child        a node directly under another
//   descendant   a node under another, at any depth
//   node         a node by itself: what it carries, how many things it holds
//   unique       no two nodes carry the same value of a property
import { z } from "zod";
import { defineProcessor, type Found } from "./processor.ts";
import type { Prop, TreeNode } from "./facts.ts";

/** which nodes: by name (a list, a pattern), by tag, by the properties it carries. Every part given must hold; none given: any node */
export const Match = z.strictObject({
  in: z.array(z.string()).optional(),
  notIn: z.array(z.string()).optional(),
  pattern: z.string().optional(),
  notPattern: z.string().optional(),
  tag: z.string().optional(),
  notTag: z.string().optional(),
  /** it carries one of these properties */
  has: z.array(z.string()).optional(),
  /** it carries none of these properties */
  lacks: z.array(z.string()).optional(),
  /** it comes from outside the item (`origin`), from somewhere that does not fit this pattern */
  originNot: z.string().optional(),
  /** it carries a property whose name fits this pattern */
  hasPattern: z.string().optional(),
  /** it carries this property with a value written in the item, and the value fits (`pattern`) or does not fit (`notPattern`); `dynamic`: only a value built from parts, or only a literal */
  value: z.strictObject({ prop: z.string(), pattern: z.string().optional(), notPattern: z.string().optional(), dynamic: z.boolean().optional() }).optional(),
});
export type Match = z.infer<typeof Match>;

/** `message`: {child} {parent} {ancestor} {descendant} {node} are the names, {ancestorAt} where the ancestor is */
export const TreeParams = z.discriminatedUnion("check", [
  z.strictObject({ check: z.literal("child"), pairs: z.array(z.strictObject({ parent: Match, child: Match, message: z.string() })), /** where the finding is said to be; the child when absent */ report: z.enum(["child", "parent"]).optional() }),
  z.strictObject({ check: z.literal("descendant"), pairs: z.array(z.strictObject({ ancestor: Match, descendant: Match, message: z.string() })) }),
  z.strictObject({ check: z.literal("node"), nodes: z.array(z.strictObject({ node: Match, /** it holds exactly this many things */ weight: z.number().optional(), message: z.string() })) }),
  /** no two nodes of the item carry this property with the same value. {value} */
  z.strictObject({ check: z.literal("unique"), prop: z.string(), /** among these nodes; any when absent */ node: Match.optional(), message: z.string() }),
]);
export type TreeParams = z.infer<typeof TreeParams>;

const regex = new Map<string, RegExp>();
const re = (p: string) => { if (!regex.has(p)) regex.set(p, new RegExp(p)); return regex.get(p)!; };
type Seen = { name: string; props: Prop[]; tags?: string[]; origin?: string };
const fits = (n: Seen, m: Match): boolean =>
  n.name !== ""
  && (!m.in || m.in.includes(n.name)) && (!m.notIn || !m.notIn.includes(n.name))
  && (!m.pattern || re(m.pattern).test(n.name)) && (!m.notPattern || !re(m.notPattern).test(n.name))
  && (!m.tag || !!n.tags?.includes(m.tag)) && (!m.notTag || !n.tags?.includes(m.notTag))
  && (!m.has || n.props.some((p) => m.has!.includes(p.name))) && (!m.lacks || !n.props.some((p) => m.lacks!.includes(p.name)))
  && (!m.originNot || (n.origin !== undefined && !re(m.originNot).test(n.origin)))
  && (!m.hasPattern || n.props.some((p) => re(m.hasPattern!).test(p.name)))
  && (!m.value || n.props.some((p) => p.name === m.value!.prop && p.value !== undefined && (m.value!.dynamic === undefined || !!p.dynamic === m.value!.dynamic)
    && (!m.value!.pattern || re(m.value!.pattern).test(p.value)) && (!m.value!.notPattern || !re(m.value!.notPattern).test(p.value))));
const say = (message: string, names: Record<string, string>) => message.replace(/\{(\w+)\}/g, (all, k: string) => names[k] ?? all);

export const treeProcessor = defineProcessor({
  name: "tree",
  params: TreeParams,
  run(work) {
    const out: Found[] = [];
    for (const { item, rules } of work) {
      const roots = item.facts?.tree ?? [];
      const seen = new Map<string, Set<string>>();
      const walk = (n: TreeNode, parent: Seen | undefined, above: TreeNode[]): void => {
        // what it stands under: the node it is written in, or the one the parser names
        const under: Seen | undefined = n.under === undefined ? parent : n.under === null ? undefined : { name: n.under, props: [] };
        for (const rule of rules) {
          const p = rule.params!;
          if (p.check === "child" && under) {
            for (const pair of p.pairs) if (fits(under, pair.parent) && fits(n, pair.child))
              out.push({ rule: rule.id, item: item.id, at: p.report === "parent" && parent && "at" in parent ? (parent as TreeNode).at : n.at, marker: n.marker, message: say(pair.message, { child: n.name, parent: under.name }) + (n.note ? ` ${n.note}` : "") });
          } else if (p.check === "descendant") {
            for (const pair of p.pairs) if (fits(n, pair.descendant)) for (const a of above) if (fits(a, pair.ancestor))
              out.push({ rule: rule.id, item: item.id, at: n.at, marker: n.marker, message: say(pair.message, { descendant: n.name, ancestor: a.name, ancestorAt: a.at }) });
          } else if (p.check === "unique") {
            const prop = !p.node || fits(n, p.node) ? n.props.find((x) => x.name === p.prop && x.value !== undefined && !x.dynamic) : undefined;
            if (prop) { const values = seen.get(rule.id) ?? seen.set(rule.id, new Set()).get(rule.id)!; if (values.has(prop.value!)) out.push({ rule: rule.id, item: item.id, at: prop.at ?? n.at, marker: n.marker, message: say(p.message, { node: n.name, value: prop.value! }) }); values.add(prop.value!); }
          } else if (p.check === "node") {
            for (const one of p.nodes) if (fits(n, one.node) && (one.weight === undefined || n.weight === one.weight)) {
              // a rule about a property is said to be where the property is
              const prop = one.node.has ? n.props.find((x) => one.node.has!.includes(x.name)) : one.node.hasPattern ? n.props.find((x) => re(one.node.hasPattern!).test(x.name)) : one.node.value ? n.props.find((x) => x.name === one.node.value!.prop) : undefined;
              out.push({ rule: rule.id, item: item.id, at: prop?.at ?? n.at, marker: n.marker, subject: one.node.originNot ? n.origin : n.name, message: say(one.message, { node: n.name, origin: n.origin ?? "", prop: prop?.name ?? "", value: prop?.value ?? "" }) });
            }
          }
        }
        n.children.forEach((c) => walk(c, n, [...above, n]));
      };
      roots.forEach((r) => walk(r, undefined, []));
    }
    return out;
  },
});
