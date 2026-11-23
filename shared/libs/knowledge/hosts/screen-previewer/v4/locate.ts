// WHERE A UI SNAPSHOT OR A UI PROTOTYPE OPENS: its row, the UI document it opens on, the UI node of that document, the route of that node; and the URL built from them.
// The screen previewer reads it to build the URL it mounts. The live screen reads it when a URL names a UI snapshot and no path: a UI snapshot is one page, so its URL is its own.
import type { Route, UiNode, UiPrototype, UiSnapshot } from "./model";
import type { DataReader } from "./reader";
import { build } from "./url";

export type Located = { row: UiSnapshot | UiPrototype; node: UiNode; route: Route };
export const isSnapshot = (row: UiSnapshot | UiPrototype): row is UiSnapshot => "uiDataId" in row;

/** /ui-snapshot/<id>/organizations?page=2: the route's path with the row's initial params in its names, the rest as the query */
export function buildUrl(row: UiSnapshot | UiPrototype, route: Route, theme?: string, themeMode?: string): string {
  const values = { ...(row.initialParams ?? {}) }, used = new Set<string>();
  const path = route.path.replace(/:([A-Za-z][A-Za-z0-9]*)/g, (_m, name: string) => {
    if (values[name] === undefined) throw new Error(`the route ${route.path} names ${name}; the initial params give no value for it`);
    used.add(name); return encodeURIComponent(values[name]);
  });
  return build({ kind: isSnapshot(row) ? "ui-snapshot" : "ui-prototype", id: row.id, path, query: Object.fromEntries(Object.entries(values).filter(([k]) => !used.has(k))), ...(themeMode ? { mode: themeMode } : {}), ...(theme ? { theme } : {}) });
}

async function locateRow(reader: DataReader, row: UiSnapshot | UiPrototype): Promise<Located> {
  const uiData = await reader.uiData(isSnapshot(row) ? row.uiDataId : row.initialUiDataId);
  const node = await reader.uiNode(uiData.uiNodeId);
  const route = (await reader.routes(node.surface ?? "web")).find((r) => r.uiNodeId === node.id);
  if (!route) throw new Error(`the UI node ${node.title ?? node.id} has no route`);
  return { row, node, route };
}
/** by an id: a UI snapshot with that id, else a UI prototype */
export const locate = async (reader: DataReader, id: string): Promise<Located> => locateRow(reader, await reader.uiSnapshot(id).catch(() => reader.uiPrototype(id)));
export const locateSnapshot = async (reader: DataReader, id: string): Promise<Located> => locateRow(reader, await reader.uiSnapshot(id));
