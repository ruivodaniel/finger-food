// THE URL of a live screen: /ui-snapshot/<id>/<real path>?<the page's query>&_t=<moment>&_theme=<theme>, or /ui-prototype/<id>/… Pure.
// The prefix and the id name the UI snapshot or the UI prototype; the rest is the real path of the product. `_t` and `_theme` are not the page's: it never sees them.
import type { Kind, Route } from "./model";

export const PREFIX: Record<Kind, string> = { "ui-snapshot": "/ui-snapshot", "ui-prototype": "/ui-prototype" };
export type Parsed = { kind: Kind; id: string; path: string; query: Record<string, string>; t?: number; theme?: string };

const split = (url: string): [string, Record<string, string>] => {
  const noOrigin = url.replace(/^[a-z]+:\/\/[^/]+/i, "");
  const [p, q = ""] = noOrigin.split("#")[0].split("?");
  return [p, Object.fromEntries(new URLSearchParams(q))];
};
/** a URL into the row it names, the real path, the page's query, the moment and the theme */
export function parse(url: string): Parsed | null {
  const [p, all] = split(url);
  const kind = (Object.keys(PREFIX) as Kind[]).find((k) => p.startsWith(PREFIX[k] + "/"));
  if (!kind) return null;
  const [id, ...rest] = p.slice(PREFIX[kind].length + 1).split("/");
  if (!id) return null;
  const { _t, _theme, ...query } = all;
  return { kind, id, path: "/" + rest.filter(Boolean).join("/"), query, ...(_t !== undefined && _t !== "" ? { t: Number(_t) } : {}), ...(_theme ? { theme: _theme } : {}) };
}
export function build(p: Parsed): string {
  const q = new URLSearchParams(p.query);
  if (p.t !== undefined) q.set("_t", String(p.t));
  if (p.theme) q.set("_theme", p.theme);
  const s = q.toString();
  return PREFIX[p.kind] + "/" + p.id + (p.path === "/" ? "" : p.path) + (s ? "?" + s : "");
}
/** a real path with its query (what a page navigates to) into the two */
export const splitPath = (to: string): { path: string; query: Record<string, string> } => { const [path, query] = split(to); return { path: path || "/", query }; };

const segments = (p: string) => p.split("/").filter(Boolean);
/** the route whose pattern fits a path, with the values of the path. A route with fewer named segments wins */
export function fit(routes: Route[], path: string): { route: Route; values: Record<string, string> } | null {
  const b = segments(path);
  let best: { route: Route; values: Record<string, string>; named: number } | null = null;
  for (const route of routes) {
    const a = segments(route.path);
    if (a.length !== b.length) continue;
    const values: Record<string, string> = {};
    if (!a.every((s, i) => (s.startsWith(":") ? ((values[s.slice(1)] = decodeURIComponent(b[i])), true) : s === b[i]))) continue;
    const named = Object.keys(values).length;
    if (!best || named < best.named) best = { route, values, named };
  }
  return best ? { route: best.route, values: best.values } : null;
}
