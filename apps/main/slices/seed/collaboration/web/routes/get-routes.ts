/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing). Gated: /locks, the locks the
 * caller may see.
 */
import type { RouteContext, RouteNode } from "@libs/web-routing";
import { LocksPage } from "../pages/locks/LocksPage";
import { LocksLayout } from "../shared/layouts/LocksLayout";

export interface GetCollaborationRoutesOptions {
  /** Where the locks page lives (default /locks). */
  locksPath?: string;
}

export function getCollaborationRoutes(options: GetCollaborationRoutesOptions = {}): RouteNode[] {
  const { locksPath = "/locks" } = options;
  const page = (ctx: RouteContext) => Number(ctx.search.page ?? 1) || 1;
  return [
    {
      access: "gated",
      path: locksPath,
      layout: LocksLayout,
      children: [{ path: "/", page: LocksPage, makeProps: (ctx) => ({ page: page(ctx), locksPath }) }],
    },
  ];
}
