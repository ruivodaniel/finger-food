// ── FACTS ────────────────────────────────────────────────────────
// What a parser hands the processors: the item in shapes that mean the same for code and for data. A processor reads only these.

/** a thing a node carries or passes. `at`: where it is, when that is finer than the node. `value`: what it is given, when that is written in the item
 *  (a literal; for a value built from parts, the parts joined by `|`, a part that is not a literal written `{…}`, and `dynamic` true).
 *  `type`: the type of what it is given (string, number, boolean, node, expression, object…) */
export type Prop = { name: string; at?: string; value?: string; dynamic?: boolean; type?: string };

/** a node of a tree: a component in code, a node of a UI document */
export type TreeNode = {
  name: string;
  /** where in the item: a line, a path */
  at: string;
  props: Prop[];
  children: TreeNode[];
  /** how many things it holds (an expression or a repeat can give many: it counts two) */
  weight: number;
  /** what the parser says about it (`raw`: an HTML element, not a component) */
  tags?: string[];
  /** the exception the item names at this node */
  marker?: string;
  /** where it comes from, when the item takes it from outside itself by name (the package a component is imported from) */
  origin?: string;
  /** the name of what it stands under, when that is not the node it is written in (what is put in a slot stands under the element the slot is in); null: under nothing */
  under?: string | null;
  /** said after a finding on this node (what it is at its root, when it is a reference) */
  note?: string;
};

/** a thing the item names and what it passes to it, by facet (its properties, its events, its slots…) */
export type Use = { as: string; name: string; version?: number; in?: string; /** where the item takes it from, when it says */ from?: string; at: string; passes: Record<string, Prop[]> };

/** a size of the item that a rule may cap (how many nodes, how deep) */
export type Measure = { name: string; value: number; at: string };

/** a name the item uses, of some space of names (a value in scope, a state, an operation…). `scope`: the names it may be, when they depend on where it is used;
 *  absent: the names the item declares for that space. `shown`: how the item writes it, when that is more than the name */
export type Reference = { space: string; name: string; at: string; scope?: readonly string[]; shown?: string };

/** a versioned thing the item names: the version the item gets and the latest that exists. `through`: what stands between, when the item does not
 *  name the version itself (the thing's default). Said by the run, which asks the source: a parser does not know versions */
export type NamedVersion = { as: string; name: string; thing: string; version: number; latest: number; at?: string; through?: string };

export type Facts = { tree?: TreeNode[]; uses?: Use[]; references?: Reference[]; measures?: Measure[]; named?: NamedVersion[]; /** the names the item declares, by space */ declared?: Record<string, readonly string[]> };
