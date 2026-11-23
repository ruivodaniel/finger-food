// THE CONTRACT OF A COMPONENT WRITTEN AS DATA, for whoever uses it: what it is at its root, and the element each of its slots stands in.
// Its parameters, events and slot names are already in the document (params, emits, slots). Nothing below the root is part of the contract.
import type { Doc, Node, Registry } from "../types";

export type Contract = { /** the component at the root, or none when it cannot be told (a root that names nothing known) */ root?: string; /** slot name → the component the slot stands in */ slots: Record<string, string | undefined> };

const versionOf = (reg: Registry, name: string, asked: number | "latest" | undefined): Doc | undefined => {
  const versions = reg.components[name]; if (!versions) return undefined;
  return versions[asked === undefined || asked === "latest" ? Math.max(...Object.keys(versions).map(Number)) : asked];
};
/** what a node is: its own component, or the root of the component it uses (followed, a few levels at most) */
export function rootOf(n: Node | undefined, reg: Registry, depth = 0): string | undefined {
  if (!n || depth > 8) return undefined;
  if (n.type) return n.type;
  if (n.use) return rootOf(versionOf(reg, n.use.component, n.use.version)?.root, reg, depth + 1);
  return undefined;
}
export function contractOf(name: string, version: number | "latest" | undefined, reg: Registry): Contract | undefined {
  const doc = versionOf(reg, name, version); if (!doc) return undefined;
  const slots: Record<string, string | undefined> = {};
  const walk = (n: Node, host: string | undefined): void => {
    if (n.type === "Slot") { slots[String(n.props?.name)] = host; return; }
    const here = n.type ?? host;
    for (const c of Array.isArray(n.children) ? n.children : []) if (c && typeof c === "object") walk(c as Node, here);
  };
  if (doc.root) walk(doc.root, undefined);
  return { root: rootOf(doc.root, reg), slots };
}
