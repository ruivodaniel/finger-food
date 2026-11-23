// Rewrites a theme file from the theme language v1 to v2, keeping the file's order and comments.
// usage: tsx convert-theme-v2.ts <in.ts> <out.ts> <import path of the v2 schema from the out file>
import ts from "typescript";
import { readFileSync, writeFileSync } from "fs";

const [, , inFile, outFile, schemaImport] = process.argv;
const src = ts.createSourceFile(inFile, readFileSync(inFile, "utf-8"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
const f = ts.factory;
const SCALE = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
const NOT_REGIONS = new Set(["surface", "mainContainer", "dialog", "sheet", "scrollArea", "emphasis"]);
const notes: string[] = [];

type Obj = ts.ObjectLiteralExpression;
const nameOf = (p: ts.ObjectLiteralElementLike) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : undefined);
const isObj = (n: ts.Node | undefined): n is Obj => !!n && ts.isObjectLiteralExpression(n);
const get = (o: Obj, k: string) => { const p = o.properties.find((x) => nameOf(x) === k); return p && ts.isPropertyAssignment(p) ? p.initializer : undefined; };
const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? f.createIdentifier(k) : f.createStringLiteral(k));
const prop = (k: string, v: ts.Expression) => f.createPropertyAssignment(key(k), v);
const obj = (props: ts.ObjectLiteralElementLike[]) => f.createObjectLiteralExpression(props, false);
/** an object with some keys dropped and some set (set keys keep their place when they exist, else go at the end) */
const edit = (o: Obj, drop: string[], set: Record<string, ts.Expression> = {}): Obj => {
  const done = new Set<string>(), out: ts.ObjectLiteralElementLike[] = [];
  for (const p of o.properties) {
    const n = nameOf(p);
    if (n && drop.includes(n)) continue;
    if (n && n in set) { out.push(prop(n, set[n])); done.add(n); } else out.push(p);
  }
  for (const [k, v] of Object.entries(set)) if (!done.has(k)) out.push(prop(k, v));
  return f.updateObjectLiteralExpression(o, out);
};
/** a size by scale: {sm: a, md: b}, in the order of the scales */
const byScale = (m: Map<string, ts.Expression>) => obj(SCALE.filter((s) => m.has(s)).map((s) => prop(s, m.get(s)!)));
const text = (n: ts.Node) => n.getText(src);

type Dims = { width: Map<string, ts.Expression>; height: Map<string, ts.Expression> };
const noDims = (): Dims => ({ width: new Map(), height: new Map() });

/** dimensionPosition of one partial surface → what it says of size (at one scale) and its shift */
function splitDP(dp: Obj, scale: string, dims: Dims): ts.Expression | undefined {
  const shift: ts.ObjectLiteralElementLike[] = [];
  for (const p of dp.properties) {
    const n = nameOf(p); if (!n || !ts.isPropertyAssignment(p)) continue;
    if (n === "width" || n === "height") dims[n].set(scale, p.initializer);
    else if (n === "translateX") shift.push(prop("x", p.initializer));
    else if (n === "translateY") shift.push(prop("y", p.initializer));
  }
  return shift.length ? obj([prop("shift", obj(shift))]) : undefined;
}
const dimsExpr = (d: Dims): ts.Expression | undefined => {
  const p: ts.ObjectLiteralElementLike[] = [];
  if (d.width.size) p.push(prop("width", byScale(d.width)));
  if (d.height.size) p.push(prop("height", byScale(d.height)));
  return p.length ? obj(p) : undefined;
};
/** a partial surface with dimensionPosition → the same with dimensions (when `own`) and position; sizes found go to `dims` */
function partial(o: Obj, scale: string, dims: Dims, writeDims: boolean): Obj {
  const dp = get(o, "dimensionPosition");
  if (!isObj(dp)) return o;
  const position = splitDP(dp, scale, dims);
  const out: ts.ObjectLiteralElementLike[] = [];
  for (const p of o.properties) {
    if (nameOf(p) !== "dimensionPosition") { out.push(p); continue; }
    const d = writeDims ? dimsExpr(dims) : undefined;
    if (d) out.push(prop("dimensions", d));
    if (position) out.push(prop("position", position));
  }
  return f.updateObjectLiteralExpression(o, out);
}
/** the per-scale block of v1 */
const isSizes = (v: ts.Expression | undefined): v is Obj => isObj(v) && v.properties.length > 0 && v.properties.every((p) => ts.isPropertyAssignment(p) && isObj(p.initializer) && SCALE.includes(nameOf(p) ?? "") && p.initializer.properties.every((q) => ["partialSurface", "icon"].includes(nameOf(q) ?? "")));
const SURFACE_KEYS = ["interior", "boundary", "dimensionPosition", "defaultTypography", "combined", "transition", "animation", "tint", "cursor", "vars", "breakpoints"];

/** an element or a family that has a per-scale block or collapsed widths: they go into its surface */
function owner(o: Obj, where: string): Obj {
  const sizes = get(o, "sizes"), we = get(o, "widthExpanded"), wc = get(o, "widthCollapsed");
  const hasSizes = isSizes(sizes);
  if (!hasSizes && !we && !wc) return o;
  const wrapped = !!get(o, "surface") || !o.properties.some((p) => SURFACE_KEYS.includes(nameOf(p) ?? ""));
  if (wrapped && !get(o, "surface") && where.startsWith("family") === false) notes.push(`${where}: no surface of its own; one is added to hold its scales`);
  const dims = noDims(), entries: ts.Expression[] = [];
  if (hasSizes) {
    for (const p of sizes.properties) {
      const s = nameOf(p)!, e = (p as ts.PropertyAssignment).initializer as Obj;
      let ps = get(e, "partialSurface"), icon = get(e, "icon");
      if (isObj(ps)) ps = partial(ps, s, dims, false);
      const parts: ts.ObjectLiteralElementLike[] = [prop("where", obj([prop("scale", f.createStringLiteral(s))]))];
      if (isObj(ps) && ps.properties.length) parts.push(prop("partialSurface", ps));
      if (icon) parts.push(prop("icon", icon));
      if (parts.length > 1) entries.push(obj(parts));
    }
  }
  if (wc) entries.push(obj([prop("where", obj([prop("state", f.createStringLiteral("collapsed"))])), prop("partialSurface", obj([prop("dimensions", obj([prop("width", obj([prop("md", wc)]))]))]))]));
  let root: Obj = wrapped ? ((get(o, "surface") as Obj | undefined) ?? obj([])) : o;
  // the root's own size is the size at md, unless the scale md said one
  const own = noDims();
  const dp = get(root, "dimensionPosition");
  let position: ts.Expression | undefined;
  if (isObj(dp)) position = splitDP(dp, "md", own);
  if (we) own.width.set("md", we);
  for (const side of ["width", "height"] as const) for (const [s, v] of own[side]) { if (dims[side].has(s) && text(dims[side].get(s)!) !== text(v)) notes.push(`${where}: ${side} at ${s} is said twice (${text(v)} and ${text(dims[side].get(s)!)}); the scale's is kept`); else dims[side].set(s, v); }
  // a size said only at some scales and not at md: in v1 the other scales had none. In v2 a scale takes the closest declared, so "auto" is
  // written beside what was declared, and the scales further away take it
  for (const side of ["width", "height"] as const) {
    const m = dims[side];
    if (!m.size || m.has("md")) continue;
    for (const sc of [...m.keys()]) for (const near of [SCALE[SCALE.indexOf(sc) - 1], SCALE[SCALE.indexOf(sc) + 1]]) if (near && !m.has(near)) m.set(near, f.createStringLiteral("auto"));
  }
  const d = dimsExpr(dims);
  const combined = get(root, "combined");
  const all = [...(combined && ts.isArrayLiteralExpression(combined) ? combined.elements : []), ...entries];
  const set: Record<string, ts.Expression> = {};
  if (d) set.dimensions = d;
  if (position) set.position = position;
  if (all.length) set.combined = f.createArrayLiteralExpression(all, true);
  // dimensions take the place dimensionPosition had, when it was there
  const props: ts.ObjectLiteralElementLike[] = [];
  let placed = false;
  for (const p of root.properties) {
    const n = nameOf(p);
    if (n === "dimensionPosition") { if (set.dimensions) props.push(prop("dimensions", set.dimensions)); if (set.position) props.push(prop("position", set.position)); placed = true; continue; }
    if (n === "combined") { if (set.combined) props.push(prop("combined", set.combined)); delete set.combined; continue; }
    if (!wrapped && (n === "sizes" || n === "widthExpanded" || n === "widthCollapsed")) continue;
    props.push(p);
  }
  if (!placed) { if (set.dimensions) props.push(prop("dimensions", set.dimensions)); if (set.position) props.push(prop("position", set.position)); }
  if (set.combined) props.push(prop("combined", set.combined));
  root = f.createObjectLiteralExpression(props, true);
  return wrapped ? edit(o, ["sizes", "widthExpanded", "widthCollapsed"], { surface: root }) : root;
}

/** a layout region: its sizes at the root (height, width, sm · md · lg) and its collapsed width go into its surface */
function region(o: Obj, name: string): Obj {
  const dims = noDims();
  let touched = false;
  for (const side of ["width", "height"] as const) { const v = get(o, side); if (v) { dims[side].set("md", v); touched = true; } }
  const we = get(o, "widthExpanded"); if (we) { dims.width.set("md", we); touched = true; }
  for (const s of ["sm", "md", "lg"]) {
    const e = get(o, s); if (!isObj(e)) continue;
    for (const side of ["width", "height"] as const) { const v = get(e, side); if (v) { if (s === "md" && dims[side].has("md") && text(dims[side].get("md")!) !== text(v)) notes.push(`layouts.${name}: ${side} is ${text(dims[side].get("md")!)} and md is ${text(v)}; md is kept`); dims[side].set(s, v); touched = true; } }
  }
  const wc = get(o, "widthCollapsed"), collapsed = get(o, "collapsed");
  if (!touched && !wc && !collapsed) return o;
  let surface = (get(o, "surface") as Obj | undefined) ?? obj([]);
  const extra: ts.Expression[] = [];
  if (wc || collapsed) {
    const inner = isObj(collapsed) ? ((get(collapsed, "surface") as Obj | undefined) ?? collapsed) : obj([]);
    const ps = wc ? edit(inner, [], { dimensions: obj([prop("width", obj([prop("md", wc)]))]) }) : inner;
    extra.push(obj([prop("where", obj([prop("state", f.createStringLiteral("collapsed"))])), prop("partialSurface", ps)]));
  }
  const d = dimsExpr(dims);
  const combined = get(surface, "combined");
  const all = [...(combined && ts.isArrayLiteralExpression(combined) ? combined.elements : []), ...extra];
  surface = edit(surface, [], { ...(d ? { dimensions: d } : {}), ...(all.length ? { combined: f.createArrayLiteralExpression(all, true) } : {}) });
  return edit(o, ["width", "height", "widthExpanded", "widthCollapsed", "collapsed", "sm", "md", "lg"], { surface });
}

let inLayouts = false;
const visit = (ctx: ts.TransformationContext) => {
  const walk = (node: ts.Node, path: string): ts.Node => {
    // the variable `layouts`: each of its keys that is a region
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "layouts" && isObj(node.initializer)) {
      const props = node.initializer.properties.map((p) => {
        const n = nameOf(p);
        // the main container and the dialogs: a max width per scale → a surface's dimensions
        if ((n === "mainContainer" || n === "dialog" || n === "sheet") && ts.isPropertyAssignment(p) && isObj(p.initializer)) {
          // a sheet's `size` was never read by anything: it becomes its width, which a sheet from the left or the right takes
          const word = n === "sheet" ? "size" : "maxWidth", m = new Map<string, ts.Expression>();
          for (const q of p.initializer.properties) { const sc = nameOf(q); const v = sc && ts.isPropertyAssignment(q) && isObj(q.initializer) ? get(q.initializer, word) : undefined; if (sc && v) m.set(sc, v); }
          return f.updatePropertyAssignment(p, p.name, obj([prop("surface", obj([prop("dimensions", obj([prop(n === "sheet" ? "width" : "maxWidth", byScale(m))]))]))]));
        }
        if (n && !NOT_REGIONS.has(n) && ts.isPropertyAssignment(p) && isObj(p.initializer)) return f.updatePropertyAssignment(p, p.name, region(p.initializer, n));
        return p;
      });
      node = f.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, f.updateObjectLiteralExpression(node.initializer, props));
    }
    if (isObj(node)) {
      let o = owner(node, path);
      // any other partial surface: its size is the size at md
      if (isObj(get(o, "dimensionPosition"))) o = partial(o, "md", noDims(), true);
      node = o;
    }
    return ts.visitEachChild(node, (c) => walk(c, ts.isPropertyAssignment(c) && nameOf(c) ? `${path}.${nameOf(c)}` : path), ctx);
  };
  return (sf: ts.SourceFile) => walk(sf, "") as ts.SourceFile;
};
void inLayouts;
const result = ts.transform(src, [visit]);
let out = ts.createPrinter({ removeComments: false }).printFile(result.transformed[0] as ts.SourceFile);
// the theme language it is written in, and its type
out = out.replace(/import type \{\s*WebTheme\s*\} from "[^"]+";/, `import type {WebThemeV2} from "${schemaImport}";`).replace(/\bWebTheme\b(?!V2)/g, "WebThemeV2");
out = out.replace(/(export const \w+: WebThemeV2 = \{\n)/, "$1  dsl: 2,\n");
writeFileSync(outFile, out, "utf-8");
for (const n of notes) console.log("  note:", n);
console.log(`wrote ${outFile}`);
