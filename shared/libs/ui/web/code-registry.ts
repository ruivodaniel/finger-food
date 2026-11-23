// THE CODE REGISTRY OF THE UI LIBRARY: for each component name, its versions by number, each with the component and its props schema when it declares one.
// It is written from the version folders (primitives/components/<name>/v<N>, primitives/layouts/<name>/v<N>): nothing is listed by hand, and no version is picked by hand.
// A UI document names a component by its name (the latest version comes) or by its name and a number; the consumer app hands this registry to what mounts the document.
// Code that imports a component still picks its version by its import: this registry is for UI documents.
import * as components from "./primitives/components";
import * as layouts from "./primitives/layouts";

type Module = Record<string, unknown>;
type Schema = { component: string; props: Record<string, { kind: string; values?: readonly string[] }> };
export type CodeVersion = { component: unknown; schema?: Schema };
export type CodeRegistry = Record<string, Record<number, CodeVersion>>;

const every = import.meta.glob<Module>(["./primitives/components/*/v*/index.ts", "./primitives/layouts/*/v*/index.ts"], { eager: true });
// A primitive that is sunset (its folder holds a sunset.json) leaves the registry: its versions stay on disk for what is pinned to them, and nothing can name it.
const sunset = new Set(Object.keys(import.meta.glob(["./primitives/components/*/sunset.json", "./primitives/layouts/*/sunset.json"])).map((p) => p.replace(/\/sunset\.json$/, "")));
const folders = Object.fromEntries(Object.entries(every).filter(([path]) => !sunset.has(path.replace(/\/v\d+\/index\.ts$/, ""))));
const isComponent = (name: string, v: unknown) => /^[A-Z]/.test(name) && (typeof v === "function" || (!!v && typeof v === "object" && "$$typeof" in (v as object)));
const isSchema = (v: unknown): v is Schema => !!v && typeof v === "object" && "component" in (v as object) && "props" in (v as object);
const given: Module = { ...(layouts as Module), ...(components as Module) };

// ONE NAME, ONE PRIMITIVE: a component name belongs to one folder. Two folders whose latest versions give different components under the same
// name are refused here; it is never settled by an order. (A folder that gives another folder's own component again is not a second primitive.)
{
  const latestOf = new Map<string, { n: number; mod: Module }>();
  for (const [path, mod] of Object.entries(folders)) { const m = /^(.*)\/v(\d+)\/index\.ts$/.exec(path); if (m && Number(m[2]) > (latestOf.get(m[1])?.n ?? 0)) latestOf.set(m[1], { n: Number(m[2]), mod }); }
  const seen = new Map<string, { folder: string; value: unknown }>(), clashes: string[] = [];
  for (const [folder, { mod }] of latestOf) for (const [name, v] of Object.entries(mod)) {
    if (!isComponent(name, v)) continue;
    const first = seen.get(name);
    if (!first) seen.set(name, { folder, value: v });
    else if (first.value !== v) clashes.push(`${name} is given by ${first.folder} and ${folder}`);
  }
  if (clashes.length) throw new Error("UI library: one name, one primitive. " + clashes.join("; "));
}
/** the folder a name belongs to: the one whose component the library itself gives under that name */
const home = new Map<string, string>();
for (const [path, mod] of Object.entries(folders)) { const folder = path.replace(/\/v\d+\/index\.ts$/, ""); for (const [name, v] of Object.entries(mod)) if (isComponent(name, v) && given[name] === v) home.set(name, folder); }

export const UI_CODE_REGISTRY: CodeRegistry = {};
for (const [path, mod] of Object.entries(folders)) {
  const m = /^(.*)\/v(\d+)\/index\.ts$/.exec(path); if (!m) continue;
  const [, folder, n] = m, schemas = Object.values(mod).filter(isSchema);
  for (const [name, v] of Object.entries(mod)) {
    if (!isComponent(name, v) || (home.get(name) ?? folder) !== folder) continue;
    (UI_CODE_REGISTRY[name] ??= {})[Number(n)] = { component: v, ...(schemas.find((s) => s.component === name) ? { schema: schemas.find((s) => s.component === name)! } : {}) };
  }
}
