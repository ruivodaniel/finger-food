// THE SPEC OF A PREVIEWER-EDITOR — what every one declares: its layouts, each with its switches (props) and its hover switches. Brought as the entity previewers declare it (entity-previewers/types.ts).
export type Values = Record<string, string | boolean>;
export type Prop = { name: string; kind: "boolean" | "union" | "number"; values?: string[]; default: string | boolean };
/** a layout is a template: its structure, the image it uses and the switches it has */
export type Layout = { id: string; name: string; description: string; image: "avatar" | "bust" | "logo" | "none"; /** the initial state: what shows */ props: Prop[]; /** what happens on hover: `tooltip` (more information) and `expandable` (a button that swaps to the next layout, and back) */ hover: Prop[] };
export type Spec = { id: string; name: string; state: "draft" | "approved" | "deprecated"; /** a previewer shows an entity; an editor lets it be changed, by events. Absent means a previewer. */ kind?: "previewer" | "editor" | "other"; layouts: Layout[] };
/** the switches a layout starts with: its props and its hover switches, by name */
export const defaultsOf = (spec: Spec, layout: string): Values => { const l = spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };
