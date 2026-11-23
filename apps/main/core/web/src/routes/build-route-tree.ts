/**
 * The mounter — turns a slice's route declaration (@libs/web-routing) into TanStack routes. It reads a tree and mounts it:
 * a node with a layout becomes a layout route (the slice layout as component, its children under it); a node with a page
 * becomes a page route whose component hands the page plain props (makeProps over the URL data, or params and search spread);
 * a node with redirectTo becomes a redirect. The core decides nothing here.
 *
 * Pages never call useParams/useSearch — that's enforced by this boundary.
 */

import { createRoute, redirect, useParams, useSearch } from "@tanstack/react-router";
import type { AnyRoute } from "@tanstack/react-router";
import type { RouteContext, RouteNode } from "@libs/web-routing";
import { createElement } from "react";

function createPageRoute(node: RouteNode, parent: AnyRoute): AnyRoute {
  const Page = node.page!;
  return createRoute({
    getParentRoute: () => parent,
    path: node.path ?? "/",
    component: function PageRouteComponent() {
      const params = (useParams({ strict: false }) ?? {}) as Record<string, string | undefined>;
      const search = (useSearch({ strict: false }) ?? {}) as Record<string, unknown>;
      const ctx: RouteContext = { params, search };
      const props = node.makeProps ? node.makeProps(ctx) : { ...params, ...search };
      return createElement(Page as React.ComponentType<Record<string, unknown>>, props as Record<string, unknown>);
    },
  } as never);
}

function createRedirectRoute(node: RouteNode, parent: AnyRoute): AnyRoute {
  return createRoute({
    getParentRoute: () => parent,
    path: node.path ?? "/",
    beforeLoad: ({ params }: { params: Record<string, string> }) => {
      throw redirect({ to: node.redirectTo as never, params: params as never });
    },
  } as never);
}

/** Mounts one node under `parent`: the route, with its children mounted under it. */
export function mountTree(node: RouteNode, parent: AnyRoute): AnyRoute {
  if (node.redirectTo) return createRedirectRoute(node, parent);
  if (node.page) return createPageRoute(node, parent);
  if (!node.layout) throw new Error(`a route node needs a page, a layout or a redirect (${node.path ?? node.id ?? "?"})`);
  const layoutRoute: AnyRoute = createRoute({
    getParentRoute: () => parent,
    ...(node.path ? { path: node.path } : { id: `/_${node.id ?? node.layout.displayName ?? node.layout.name}` }),
    component: node.layout,
  } as never) as unknown as AnyRoute;
  const children = (node.children ?? []).map((child) => mountTree(child, layoutRoute));
  return children.length ? (layoutRoute.addChildren(children as never) as unknown as AnyRoute) : layoutRoute;
}
