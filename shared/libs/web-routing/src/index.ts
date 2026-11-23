/**
 * @libs/web-routing — the route declaration. A slice exposes its pages as a tree of nodes, as data; the core iterates the mounted
 * slices and mounts what each declares, under the shell its `access` names. The core knows no page and no layout of a slice.
 * (Web scaffolding & import boundaries › Web: routing and layouting.)
 */
import type { ComponentType } from "react";

/** public: no session · signed-in: a session, the gate not asked (accept an invitation, resolve the requirements) · gated: a session and the gate passed (every page after sign-in, by default) */
export type RouteAccess = "public" | "signed-in" | "gated";

/** URL data the route layer extracts and hands to `makeProps`. */
export interface RouteContext {
  params: Record<string, string | undefined>;
  search: Record<string, unknown>;
  hash?: string;
}

// A tree mixes pages with different prop shapes; the boundary stays loose on purpose — strictness lives inside each page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPage = ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMakeProps = (ctx: RouteContext) => any;

export interface RouteNode {
  /** The path, in the router's syntax (`$param`), relative to the parent node; absolute at the top level. A layout node may have none (an id instead). */
  path?: string;
  /** The id of a pathless layout node; defaults to the layout component's name. */
  id?: string;
  /** Required on a top-level node: which shell and guard the core mounts it under. Children inherit. */
  access?: RouteAccess;
  /** A page node: the component, and how the URL data becomes its props (defaults to spreading params and search). */
  page?: AnyPage;
  makeProps?: AnyMakeProps;
  /** A layout node: a slice layout (it renders the router outlet); its `children` are mounted under it. */
  layout?: ComponentType;
  children?: RouteNode[];
  /** What a navigation shows for this node: the title. Icons are the navigation's own, by path. */
  nav?: { title: string };
  /** A redirect node: an absolute path, with the same params. */
  redirectTo?: string;
}

/** What a navigation draws for a section: the children that carry `nav`. */
export interface NavEntry {
  title: string;
  /** The child's own path segment. */
  path: string;
  /** The absolute path, to navigate to. */
  to: string;
}

const join = (base: string, path: string): string => {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/" ? b || "/" : `${b}${p}`;
};

/** The navigation projection of a section node: title and path of every child that carries `nav`, in declaration order. */
export function navOf(section: RouteNode, base: string = section.path ?? ""): NavEntry[] {
  return (section.children ?? [])
    .filter((c): c is RouteNode & { nav: { title: string }; path: string } => !!c.nav && typeof c.path === "string")
    .map((c) => ({ title: c.nav.title, path: c.path, to: join(base, c.path) }));
}
