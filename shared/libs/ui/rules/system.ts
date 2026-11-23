// ── THE UI, IN THE CHECK SYSTEM ──────────────────────────────────
// What the check system (shared/libs/check) needs to check the UI: its kinds of item, its resolver, the data schemas its rules name,
// and how what the resolver gives reads as a contract. The processors are the system's own: nothing here knows a rule. The rule sets are found by where they are.
// The storage is the caller's (a source); so is what only a runtime has: the components the hosts add, and a component written as code at a version.
import { contractProcessor, discoverRuleSets, fromZod, limitProcessor, versionProcessor, ownerByPlace, referenceProcessor, schemaProcessor, treeProcessor, type Contract, type DataSchema, type Declared, type Named, type Source, type System, type ValueKind } from "../../check/index.ts";
import type { FileSource } from "../../check/file-source.ts";
import { contractOf } from "../ui-data/v2/validate/contract";
import type { Kind as PropKind, Prim, Registry } from "../ui-data/v2/types";
import { builtinsOf, isInteractable, libraryOf } from "../ui-data/v2/schema";
import { Document, placeOf } from "../ui-data/v2/schema/document";
import { themeSchema as themeSchemaV1 } from "../types/schema/theme";
import { WebTheme as WebThemeV2 } from "../types/schema/v2/theme";
/** the schema of a theme, by the theme language it says it is written in (dsl: 2), else by its platform */
const themeSchema = (theme: unknown) => ((theme as { dsl?: unknown } | null)?.dsl === 2 ? WebThemeV2 : themeSchemaV1(theme));
import { libraryDocuments, writes } from "./finders";
import { isThemeValue, uiKinds, type UiRow } from "./kinds";
import type { UiContract } from "./document-facts";
import type { Declaration } from "./declarations";

export type UiParts = {
  source: FileSource;
  /** the components the hosts add to the library's */
  hosted: Record<string, Prim>;
  /** what a component written as code declares, at its latest version or at the one asked: read from its own types (declarations.ts) */
  declared(name: string, version?: number): Declaration | undefined;
};
/** the names code imports the UI library by */
const LIBRARY_ALIASES = ["@libs/web-components", "@libs/web-layouts"];
/** where a rule set may be */
export const RULE_SET_PLACES = ["shared/libs/*/rules/rule-set.ts", "apps/main/slices/*/*/rules/rule-set.ts"];

export async function uiSystem(parts: UiParts): Promise<System> {
  // DATA SCHEMAS: the shape of what is stored as a row
  const theme = fromZod("theme", themeSchema), document = fromZod("ui-document", () => Document, placeOf);
  const schemas: DataSchema[] = [
    { name: "theme", check: (value, context) => { const themes = (Array.isArray(value) ? value : [value]).filter(isThemeValue); return themes.length ? themes.flatMap((t) => theme.check(t, context)) : [{ message: "the file exports no theme", severity: "info" }]; } },
    { name: "ui-document", check: (value, context) => document.check((value as UiRow).document, context) },
  ];

  // CONTRACTS: what a thing a UI document names declares, by facet, in the words of the contract processor
  const names = (list: readonly string[] | undefined): Record<string, ValueKind> => Object.fromEntries((list ?? []).map((n) => [n, true as const]));
  const kindOf = (k: PropKind | true): ValueKind => (k === true ? true : k === "string" || k === "number" || k === "boolean" ? k : k === "position" ? "string" : k === "template" ? "node" : typeof k === "object" ? { enum: k.enum } : true);
  const view = (resolved: unknown): Contract | undefined => {
    const c = resolved as UiContract | undefined;
    if (c?.component) { const prim = c.component as Prim; return {
      props: { names: Object.fromEntries(Object.entries(prim.props).map(([k, v]) => [k, kindOf(v)])), open: !!prim.open },
      events: { names: names(prim.events), open: !!prim.open },
      children: { names: {}, open: prim.container } }; }
    if (c?.document) return { args: { names: names(c.document.params) }, events: { names: names(c.document.emits) }, slots: { names: names(c.document.slots) } } satisfies Record<string, Declared>;
    return undefined;
  };
  let registry: Registry = { pages: {}, components: {} };

  return {
    source: parts.source,
    kinds: uiKinds,
    // RESOLVER: a name → its contract. It asks the source for the library's UI documents; the documents being checked are found first.
    // A name resolves to the version the item names, else the latest.
    resolver: ({ source, items }: { source: Source; items: readonly { kind: string; value: unknown }[] }) => {
      registry = { pages: {}, components: {} };
      const register = (r: UiRow) => { if (r.kind === "page") registry.pages[r.name] = r.document; else (registry.components[r.name] ??= {})[r.document.version] = r.document; };
      for (const id of libraryDocuments(parts.source)) register(JSON.parse(source.read(id)) as UiRow);
      for (const i of items) if (i.kind === "data") register(i.value as UiRow);
      return (named: Named): UiContract | undefined => {
        if (named.as === "document") {
          const has = registry.components[named.name]; if (!has) return undefined;
          const v = named.version ?? Math.max(...Object.keys(has).map(Number)); if (!has[v]) return undefined;
          const c = contractOf(named.name, v, registry); return { document: has[v], root: c?.root, slots: c?.slots };
        }
        // a component. In a UI document, a built-in first. Then what the library's component declares in its own types; then one of another package or of the hosts.
        // In code, a name is the library's only when the file imports it from the library: by its alias, or from a file of a primitive
        const surface = named.in === "mobile" ? "mobile" : "web", inCode = named.in === "code";
        const prim = inCode ? undefined : builtinsOf(surface)[named.name];
        if (prim) return { component: prim, interactable: (wired) => isInteractable(named.name, prim, wired) };
        // the registry asked for a name alone: is there a component of the library called so, written somewhere else than in the file that asks?
        if (named.in === "registry") { const own = named.by !== undefined && writes(parts.source, named.by, named.name) ? undefined : parts.declared(named.name); return own ? { component: { props: {}, events: [], container: own.container } } : undefined; }
        if (inCode) {
          if (named.from === undefined) return undefined;
          const library = LIBRARY_ALIASES.some((a) => named.from!.startsWith(a)) || (named.from.startsWith(".") && named.by !== undefined && source.find({ as: "import", name: named.from }, named.by).some((id) => "primitive" in source.what(id)));
          if (!library) return undefined;
        }
        // a test or a play addresses a component by what the library says it hands up, not by every event its element has
        const known = libraryOf(surface)[named.name], addressed = (own: Prim) => (wired: boolean) => isInteractable(named.name, known ?? own, wired);
        const d = surface === "web" ? parts.declared(named.name, named.version) : undefined;
        if (d) { const own: Prim = { props: d.props as Prim["props"], events: d.events, container: d.container }; return { component: own, interactable: addressed({ ...own, open: true }) }; }
        const other = inCode ? undefined : known ?? parts.hosted[named.name];
        return other ? { component: other, interactable: addressed(other) } : undefined;
      };
    },
    processors: [treeProcessor, schemaProcessor(schemas), contractProcessor(view), referenceProcessor, limitProcessor, versionProcessor],
    ruleSets: await discoverRuleSets(parts.source, RULE_SET_PLACES, ownerByPlace),
  };
}
