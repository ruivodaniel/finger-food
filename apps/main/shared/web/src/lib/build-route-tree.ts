/**
 * Route Tree Builder
 *
 * Converts a module RouteDefinition into a TanStack Router route object.
 *
 * The route layer is dumb: it extracts URL data from TanStack Router and
 * hands it to the module's `makeProps` (or spreads `{...params, ...search}`
 * if `makeProps` is omitted). The page receives plain props.
 *
 * Pages never call useParams/useSearch — that's enforced by this boundary.
 */

import { createRoute, useParams, useSearch } from "@tanstack/react-router";
import type { AnyRoute, StaticDataRouteOption } from "@tanstack/react-router";
import type { RouteDefinition, RouteContext } from "@modules/user-organization-mgmt/web";
import { createElement } from "react";

/**
 * Convert a single RouteDefinition into a TanStack Router route. `staticData`
 * is the app's own per-route data (e.g. the frame's header band) — the module
 * never sees it.
 */
export function createModuleRoute(
  def: RouteDefinition,
  parent: AnyRoute,
  pathOverride?: string,
  staticData?: StaticDataRouteOption,
) {
  const Page = def.page;

  return createRoute({
    getParentRoute: () => parent,
    path: pathOverride ?? def.path,
    staticData,
    component: function ModuleRouteComponent() {
      const params = (useParams({ strict: false }) ?? {}) as Record<string, string | undefined>;
      const search = (useSearch({ strict: false }) ?? {}) as Record<string, unknown>;

      const ctx: RouteContext = { params, search };
      const props = def.makeProps
        ? def.makeProps(ctx)
        : { ...params, ...search };

      return createElement(Page as React.ComponentType<Record<string, unknown>>, props as Record<string, unknown>);
    },
  } as never);
}

/**
 * Find a route definition by path from a list.
 */
export function findRoute(routes: RouteDefinition[], path: string): RouteDefinition | undefined {
  return routes.find((r) => r.path === path);
}
