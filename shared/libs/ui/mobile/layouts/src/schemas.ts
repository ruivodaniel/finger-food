// The props schema of every layout primitive of the mobile library, for tooling: pure data (see ../../components/src/schemas.ts).
import type { StackProps } from "./components/Stack";
import type { AppBarProps, BodyProps } from "./components/Screen";
import type { DrawerProps } from "./components/Drawer";
import type { TabBarProps } from "./components/TabBar";
type Meta = { kind: string; values?: readonly string[]; default?: unknown; required?: boolean; doc?: string };
const schema = <T,>(component: string, props: { [K in keyof T]-?: Meta }) => ({ component, props }) as const;

export const stackSchema = schema<Pick<StackProps, "dir" | "gap" | "align" | "justify" | "wrap" | "size" | "pad">>("Stack", {
  dir: { kind: "enum", values: ["row", "col"], default: "col" }, gap: { kind: "number", doc: "px between children" }, pad: { kind: "number", doc: "px of padding" },
  align: { kind: "enum", values: ["start", "center", "end", "stretch", "baseline"] }, justify: { kind: "enum", values: ["start", "center", "end", "between", "around"] },
  wrap: { kind: "boolean", default: false }, size: { kind: "enum", values: ["hug", "fill", "fixed"], default: "hug", doc: "how this stack sizes inside its parent stack" },
});
export const screenSchema = schema<Record<never, never>>("Screen", {});
export const screenOverlaySchema = schema<Record<never, never>>("ScreenOverlay", {});
export const appBarSchema = schema<Pick<AppBarProps, "title" | "start" | "end" | "align">>("AppBar", {
  title: { kind: "node", doc: "The title: a text, or a node" }, start: { kind: "node", doc: "Before the title: back, menu" }, end: { kind: "node", doc: "After the title: the screen's actions" }, align: { kind: "enum", values: ["start", "center"], default: "start" },
});
export const bodySchema = schema<Pick<BodyProps, "scroll">>("Body", { scroll: { kind: "boolean", default: true, doc: "false: the content fills the body and lays itself out" } });
export const actionBarSchema = schema<Record<never, never>>("ActionBar", {});
export const drawerSchema = schema<Pick<DrawerProps, "open" | "onClose" | "header" | "footer">>("Drawer", {
  open: { kind: "boolean", required: true }, onClose: { kind: "function", doc: "() — dismissed" }, header: { kind: "node" }, footer: { kind: "node" },
});
export const tabBarSchema = schema<Pick<TabBarProps, "value" | "onChange" | "items">>("TabBar", {
  value: { kind: "string", required: true }, onChange: { kind: "function", doc: "(value) — the tab the user chose" }, items: { kind: "other", required: true, doc: "[{ value, label, icon, disabled?, testID? }]" },
});
