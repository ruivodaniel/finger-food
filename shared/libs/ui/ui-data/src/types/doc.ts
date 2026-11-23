// The document model: pages and reusable components, the same shape. A page is a tree of the library's layout regions and components; a value is a literal or an expression; a reference to a component is { use, args, slots, on }. Nothing here is code.
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export interface Node {
  type?: string;
  use?: { component: string; version: "latest" | number };
  props?: Record<string, Json>;
  args?: Record<string, Json>;
  /** a reference only: the content it hands to each of the slots the referenced component declares. It is drawn in the referencing document's scope. */
  slots?: Record<string, Node[]>;
  children?: Node[];
  when?: Json;
  repeat?: { each: string; as: string };
  /** a primitive's events, or the events a referenced component emits */
  on?: Record<string, Json[]>;
}
export interface Doc {
  kind: "page" | "component";
  schemaVersion: 1;
  name: string;
  version: number;
  /** the surface it is for: the library package it is drawn with (absent = web) */
  surface?: "web" | "mobile";
  /** a pattern document: the measure of the invisible container the cockpit's previewer puts each of its fixtures in (absent = md) */
  measure?: "xs" | "sm" | "md" | "lg" | "xl";
  /** a component's inputs; read-only inside it */
  params?: string[];
  /** the events a component can emit to the document that uses it: the only way up */
  emits?: string[];
  /** the named places a referencing document may fill with content (a shell's header, sidebar, children). A `Slot` node draws what was handed in. */
  slots?: string[];
  /** named data contracts the document reads, in order; `when` keeps one from running yet. Where the read of a name stands is in scope by TanStack Query's names (dictionary: READ_STATES): `isLoading.<name>`, `isFetching.<name>`, `isRefetching.<name>`, `isError.<name>`, `error.<name>` (`status`, `message`), `isPlaceholderData.<name>`. `placeholderData: "keepPreviousData"`: while a request with new params is on its way, the read gives the data it had */
  data?: Record<string, { source: string; params?: Record<string, Json>; when?: Json; placeholderData?: "keepPreviousData" }>;
  /** this document's own UI state, with its initial values; every instance has its own copy */
  state?: Record<string, Json>;
  /** derived values, from params, data and state, in order */
  calc?: Record<string, Json>;
  root: Node;
}

/** every document the tool holds for one project: the documents' versions by name. A page is one document per name; a component keeps every version. */
export interface Registry { pages: Record<string, Doc>; components: Record<string, Record<number, Doc>> }
export const latest = (reg: Registry, name: string) => Math.max(...Object.keys(reg.components[name] ?? {}).map(Number));
