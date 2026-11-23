// THE MOCK ROUTER: in place of the product's router. It reads the routes, the UI node of the route that fits and its UI document; it writes the browser's URL.
import type { Doc, Registry } from "@libs/ui-data/types";
import type { Route, Surface } from "../model";
import type { DataReader } from "../reader";
import { build, fit, parse, splitPath, type Parsed } from "../url";

/** the slot of a shell document where the page is put */
export const OUTLET = "outlet";
/** the UI document at a path, the shells its route is under (the outermost first), the documents they use as components, the values of the path */
export type Matched = { uiDocument: Doc; shells: Doc[]; components: Registry["components"]; values: Record<string, string> };
export type Current = Matched & { path: string; query: Record<string, string> };

export interface MockRouter {
  /** on load and on reload: drops the prefix and the id, matches the path, keeps the result for current() */
  receive(url: string): Promise<void>;
  matchRoute(path: string): Promise<Matched>;
  /** the UI document at the URL, the values of the path, the query */
  current(): Current | null;
  /** changes the URL to prefix/id + path, then matches it */
  navigate(path: string): Promise<void>;
  /** the link to write in the page, with the prefix */
  link(path: string): string;
}

/** every component a document names, in its nodes and in the nodes its props hold */
const used = (doc: Doc): string[] => {
  const out = new Set<string>();
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const use = (v as { use?: { component?: unknown } }).use;
    if (use && typeof use.component === "string") out.add(use.component);
    Object.values(v).forEach(walk);
  };
  walk(doc.root);
  return [...out];
};

export function createMockRouter(reader: DataReader, surface: Surface = "web"): MockRouter {
  let current: Current | null = null, at: Parsed | null = null;
  const components = async (doc: Doc, into: Registry["components"] = {}): Promise<Registry["components"]> => {
    for (const name of used(doc)) {
      if (into[name]) continue;
      const versions = await reader.uiDataByName(name);
      if (!versions.length) throw new Error(`no UI document named ${name}`);
      into[name] = Object.fromEntries(versions.map((u) => [u.document.version, u.document]));
      for (const u of versions) await components(u.document, into);
    }
    return into;
  };
  const self: MockRouter = {
    async receive(url) {
      const p = parse(url);
      if (!p) throw new Error(`not a live screen URL: ${url}`);
      const matched = await self.matchRoute(p.path);
      at = p; current = { ...matched, path: p.path, query: p.query };
    },
    async matchRoute(path) {
      const routes = await reader.routes(surface);
      const documentOf = async (route: Route): Promise<Doc> => {
        const node = await reader.uiNode(route.uiNodeId);
        const uiData = await reader.uiDataOfNode(node.id);
        if (!uiData) throw new Error(`the UI node of the route ${route.id} has no UI document`);
        return uiData.document;
      };
      // a page is a route with no route under it
      const hit = fit(routes.filter((r) => !routes.some((c) => c.parentId === r.id)), path);
      if (!hit) throw new Error(`no route fits ${path}`);
      const uiDocument = await documentOf(hit.route), into = await components(uiDocument), shells: Doc[] = [];
      for (let id = hit.route.parentId; id; ) {
        const parent = routes.find((r) => r.id === id);
        if (!parent) throw new Error(`the route ${hit.route.id} is under ${id}; there is no such route`);
        const shell = await documentOf(parent);
        if (!(shell.slots ?? []).includes(OUTLET)) throw new Error(`the shell ${shell.name} has no slot "${OUTLET}"`);
        shells.unshift(shell); (into[shell.name] ??= {})[shell.version] = shell; await components(shell, into);
        id = parent.parentId;
      }
      return { uiDocument, shells, components: into, values: hit.values };
    },
    current: () => current,
    async navigate(path) {
      const url = self.link(path);
      window.history.pushState(null, "", url);
      await self.receive(url);
    },
    link(path) {
      // the prefix and the id of the URL it received; the moment and the theme the browser's URL has now
      if (!at) return path;
      const now = parse(window.location.pathname + window.location.search) ?? at;
      return build({ kind: at.kind, id: at.id, ...splitPath(path), ...(now.t !== undefined ? { t: now.t } : {}), ...(now.theme ? { theme: now.theme } : {}) });
    },
  };
  return self;
}
