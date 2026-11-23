// ── MARKUP AS CODE ───────────────────────────────────────────────
// The rule lists that only code needs: what may not nest, and where a component of a page may come from.
// Brought as they were from the linter (scripts/lint), which reads them here and owns none of them.
// This file imports nothing: the linter reads it with Node's own TypeScript support.

/** an anchor, or what renders one */
export const ANCHOR_TAGS: ReadonlySet<string> = new Set(["a", "Link"]);

/** what renders a <button>, or holds one by default: never inside an anchor, unless it carries `asChild` */
export const BUTTON_TAGS: ReadonlySet<string> = new Set([
  "button",
  "Button",
  "SidebarMenuButton",
  "DropdownMenuTrigger",
  "DialogTrigger",
  "PopoverTrigger",
  "AlertDialogTrigger",
  "SheetTrigger",
  "CollapsibleTrigger",
  "NavigationMenuTrigger",
  "TabsTrigger",
  "AccordionTrigger",
  "ToggleGroupItem",
  "Toggle",
]);

/** a <div> that holds one of these directly is a shell: it is written with Shell and Page of the layouts */
export const SHELL_CHILDREN: ReadonlySet<string> = new Set(["SidebarProvider", "SidebarInset", "main"]);

/** the packages a page, a slice component or a slice layout may take a JSX component from */
export const ALLOWED_JSX_PACKAGES: readonly string[] = [
  // Design system
  "@libs/web-components",
  "@libs/web-layouts",
  "@libs/list-query",
  "@libs/availability-check",
  // React core (Fragment, Suspense, StrictMode, etc.)
  "react",
  "react-dom",
  // Router (Link, Outlet, etc.)
  "@tanstack/react-router",
  "@tanstack/react-router-devtools",
  "@tanstack/react-query",
  // i18n (Trans component)
  "react-i18next",
  // Forms (Controller, FormProvider, etc.)
  "react-hook-form",
];

/** how a file imports the project's own code: by an alias, or from a file beside it. None of them is an outside package */
export const PROJECT_ALIASES: readonly string[] = ["@libs/", "@modules/", "@seed/", "@product/", "@configs/", "@/", "~/", "./", "../"];
