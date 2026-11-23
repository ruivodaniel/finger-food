// The props schema of every layout primitive, for tooling (the UI-as-data validator and interpreter read them): the same shape as
// @libs/web-components' defineProps — { component, props: { name: { kind, values?, default?, required?, doc? } } }. Every primitive also
// takes the HTML div props and `position` (the markup axis), which are not listed: they are common to all. Every one takes `concept` and `flag` too.
const SCALE3 = ["sm", "md", "lg"] as const;
const region = (component: string, extra: Record<string, unknown> = {}) => ({ component, props: { concept: { kind: "string" }, flag: { kind: "string" }, away: { kind: "boolean" }, ...extra } }) as const;
const scaled = (component: string, extra: Record<string, unknown> = {}) => region(component, { scale: { kind: "enum", values: SCALE3, default: "md" }, ...extra });

// The layout patterns are not here: a layout pattern is a UI document (patterns/layout/<name>), named with `use`, its outlets filled where it is named.
// Only what is in this file can be named by a document as a `type`: the layout primitives.
export const shellSideNavSchema = region("ShellSideNav");
export const shellNavSchema = region("ShellNav");
export const shellTopNavSchema = region("ShellTopNav");
export const shellNoneSchema = region("ShellNone");
export const pageSchema = region("Page");
export const pageHeaderSchema = scaled("PageHeader");
export const secondPageHeaderSchema = scaled("SecondPageHeader");
export const pageBodySchema = region("PageBody");
export const mainSchema = region("Main");
export const mainHeaderSchema = scaled("MainHeader", { sticky: { kind: "boolean", default: false } });
export const secondMainHeaderSchema = scaled("SecondMainHeader", { sticky: { kind: "boolean", default: false } });
export const mainContentSchema = region("MainContent");
export const mainBodySchema = region("MainBody", { fixed: { kind: "boolean", default: false }, onScrollDirection: { kind: "function" } });
export const mainFooterSchema = scaled("MainFooter");
export const pageFooterSchema = scaled("PageFooter");
export const pageLeftSidebarSchema = scaled("PageLeftSidebar", { collapsed: { kind: "boolean", default: false } });
export const pageRightSidebarSchema = scaled("PageRightSidebar");
export const mainRightSidebarSchema = scaled("MainRightSidebar");
export const mainContainerSchema = region("MainContainer", { scale: { kind: "enum", values: ["xs", "sm", "md", "lg", "xl"], default: "lg" }, align: { kind: "enum", values: ["left", "center", "right"] } });
// deprecated names, kept so earlier explorations compile; they describe the new region
export const leftSidebarSchema = pageLeftSidebarSchema;
export const rightSidebarSchema = pageRightSidebarSchema;
export const contextPanelSchema = mainRightSidebarSchema;
export const containerSchema = mainContainerSchema;
export const scrollAreaSchema = region("ScrollArea", { axis: { kind: "enum", values: ["x", "y", "both"], default: "y" } });
export { stackSchema } from "../components/stack";
