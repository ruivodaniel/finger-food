/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing). The notification preferences
 * page lives in the caller's settings, a section the user-organization-mgmt slice owns: that slice places the page in its tree
 * (through this slice's web/index.ts). This slice declares no route of its own.
 */
import type { RouteNode } from "@libs/web-routing";

export function getNotificationsRoutes(): RouteNode[] {
  return [];
}
