/**
 * Route Tree — the core mounts what the slices declare.
 *
 * Three shells, one per access (@libs/web-routing RouteAccess): public (no session), signed-in (a session, the gate not
 * asked: accepting an invitation, resolving the requirements), gated (a session and the gate passed: every page after
 * sign-in, by default). Each shell is a route with its guard; the slices' route trees are mounted under the shell their
 * top-level nodes name. The core knows no page and no layout of a slice; it has no page of its own. The tooling (sandbox,
 * theme editor) hangs under the root, apart.
 */

import { createRoute, redirect } from "@tanstack/react-router";
import type { AnyRoute } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { RouteAccess, RouteNode } from "@libs/web-routing";
import { SidebarShell } from "@/shells/SidebarShell";
import { NoNavShell } from "@/shells/NoNavShell";
import { Route as rootRoute } from "./__root";
import { mountTree } from "@/routes/build-route-tree";
import { createGateBeforeLoad } from "@/routes/gate-before-load";
import { toolingRoutes } from "@/routes/tooling-routes";
import { SIGNED_IN_HOME } from "@/config/navigation.config";

// The slices' declarations
import { getChatbotRoutes } from "@modules/chatbot/web";
import { getCollaborationRoutes } from "@modules/collaboration/web";
import { getCreditsRoutes, personalCreditsRoute } from "@modules/credits/web";
import { getNotificationsRoutes } from "@modules/notifications/web";
import { getPaymentRoutes, personalBillingRoute } from "@modules/payment/web";
import { authenticationService, getUserOrgMgmtRoutes } from "@modules/user-organization-mgmt/web";
import { getImplementationPatternsRoutes } from "@product/implementation-patterns/web";

const mountedSlices: RouteNode[][] = [
  // the person's billing and credits are the payment and credits slices' pages, placed in the settings
  getUserOrgMgmtRoutes({ homePath: SIGNED_IN_HOME, settingsPages: [personalBillingRoute, personalCreditsRoute] }),
  getNotificationsRoutes(),
  getCreditsRoutes(),
  getPaymentRoutes(),
  getChatbotRoutes(),
  getImplementationPatternsRoutes({ patternsPath: "/implementation-patterns", publicPath: "/public/meteors" }),
  getCollaborationRoutes({ locksPath: "/locks" }),
];

// Session lookup for route guards: always asked afresh (a guard decides on the server's answer, never a cached one).
type GuardContext = { context: { queryClient: QueryClient }; location: { pathname: string; searchStr?: string } };
const fetchSession = ({ context }: GuardContext) =>
  context.queryClient.fetchQuery({ ...authenticationService.getSession(), staleTime: 0 });

// =============================================================================
// THE SHELLS, one per access
// =============================================================================

const publicShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_public",
  component: NoNavShell,
} as never);

// A session, the gate not asked: a signed-out visitor signs in and comes back.
const signedInShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_signed-in",
  component: NoNavShell,
  beforeLoad: async (args: GuardContext) => {
    const { session } = await fetchSession(args);
    if (!session) {
      throw redirect({
        to: "/login" as never,
        search: { intention: args.location.pathname + (args.location.searchStr ?? "") } as never,
      });
    }
  },
} as never);

// A session and the gate passed.
const gatedShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_gated",
  component: SidebarShell,
  beforeLoad: createGateBeforeLoad(),
} as never);

const shellOf: Record<RouteAccess, AnyRoute> = {
  public: publicShellRoute as never,
  "signed-in": signedInShellRoute as never,
  gated: gatedShellRoute as never,
};

// =============================================================================
// MOUNT what the slices declare
// =============================================================================

const under: Record<RouteAccess, AnyRoute[]> = { public: [], "signed-in": [], gated: [] };
for (const routes of mountedSlices) {
  for (const node of routes) {
    if (!node.access) throw new Error(`a top-level route node declares its access (${node.path ?? node.id ?? "?"})`);
    under[node.access].push(mountTree(node, shellOf[node.access]));
  }
}

export const routeTree = rootRoute._addFileChildren([
  publicShellRoute.addChildren(under.public as never),
  signedInShellRoute.addChildren(under["signed-in"] as never),
  gatedShellRoute.addChildren(under.gated as never),
  toolingRoutes(rootRoute as never),
] as never);
