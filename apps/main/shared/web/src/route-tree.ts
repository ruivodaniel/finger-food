/**
 * Route Tree — Module-Contributed + App-Specific Assembly
 *
 * The app assembles the final route tree from:
 * 1. Module-contributed route definitions (getUserOrgMgmtRoutes)
 * 2. App-owned layout routes (auth shell, signed-in shell)
 * 3. App-specific routes (dashboard, sandbox playground)
 *
 * The module expresses access intent; the app decides shell structure.
 * Paths follow the baseline sitemap: /dashboard home, settings under
 * /my/settings/*, /my/memberships + /my/invitations, /accept-invitation
 * (public) continuing on /my/invitations/accept (signed in, ungated),
 * the public legal viewer at /legal-documents?type=.
 */

import { createRoute, redirect } from "@tanstack/react-router";
import { SidebarShell } from "@/components/SidebarShell";

// Root route (app-owned — providers, shell wrapper)
import { Route as rootRoute } from "./routes/__root";

// Module route contributions
import { getNotificationsRoutes } from "@modules/notifications/web";
import { getUserOrgMgmtRoutes, createApiClient } from "@modules/user-organization-mgmt/web";
import { uomWebConfig } from "@/config/uom.config";
import { createModuleRoute, findRoute } from "@/lib/build-route-tree";
import { createGateBeforeLoad } from "@/lib/gate-before-load";
import { TitleBandLayout } from "@/components/TitleBandLayout";
import { SettingsLayout } from "@/components/SettingsLayout";
import { OrgLayout } from "@/components/OrgLayout";
import { NoNavShell } from "@/components/NoNavShell";
import { LegalLayout } from "@/components/LegalLayout";
import { LegalAdminLayout } from "@/components/LegalAdminLayout";

// App features (product-specific, registered directly — no module ceremony)
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

// Sandbox routes (theme/component playground)
import { Route as SandboxRoute } from "./routes/sandbox/route";
import { Route as SandboxIndexRoute } from "./routes/sandbox/index";
import { Route as SandboxLayoutsRoute } from "./routes/sandbox/layouts/route";
import { Route as SandboxLayoutsIndexRoute } from "./routes/sandbox/layouts/index";
import { Route as SandboxLayoutsRegionsRoute } from "./routes/sandbox/layouts/regions/index";
import { Route as SandboxLayoutsMapRoute } from "./routes/sandbox/layouts/map/index";
import { Route as SandboxLayoutsSnapshotsRoute } from "./routes/sandbox/layouts/snapshots/index";
import { Route as ThemeEditorRoute } from "./routes/sandbox/theme-editor/route";
import { Route as ThemeEditorIndexRoute } from "./routes/sandbox/theme-editor/index";
import { Route as ThemeEditorThemeIdLayoutRoute } from "./routes/sandbox/theme-editor/$themeId/route";
import { Route as ThemeEditorThemeIdIndexRoute } from "./routes/sandbox/theme-editor/$themeId/index";
import { Route as ThemeEditorFixtureSplatRoute } from "./routes/sandbox/theme-editor/$themeId/$";

// =============================================================================
// MODULE ROUTES
// =============================================================================

const moduleRoutes = getUserOrgMgmtRoutes({
  homePath: "/dashboard",
});

const notificationRoutes = getNotificationsRoutes({
  preferencesPath: "/my/settings/notifications",
});

// Session lookup for route guards — the module client, outside React. No
// gate-blocked hook here: gateCheck returns 428 bodies by contract and the
// beforeLoad guards do their own redirecting.
const uomClient = createApiClient(uomWebConfig);

// =============================================================================
// AUTH LAYOUT (app-owned: redirect authenticated users away)
// =============================================================================

// The card sits at the auth width; the pages inside carry no width of their own.
const authShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_auth",
  component: NoNavShell,
  beforeLoad: async () => {
    const { session } = await uomClient.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" as never });
    }
  },
} as never);

const authLoginRoute = createModuleRoute(findRoute(moduleRoutes, "/login")! as never, authShellRoute, "/login");
const authRegisterRoute = createModuleRoute(
  findRoute(moduleRoutes, "/register")! as never,
  authShellRoute,
  "/register",
);
const authForgotPasswordRoute = createModuleRoute(
  findRoute(moduleRoutes, "/forgot-password")! as never,
  authShellRoute,
  "/forgot-password",
);

const bareShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_bare",
  component: NoNavShell,
} as never);

const invitationRoute = createModuleRoute(
  findRoute(moduleRoutes, "/accept-invitation")! as never,
  bareShellRoute as never,
  "/accept-invitation",
);

// Signed in, but NOT gated: accepting an invitation works while obligations
// are still owed (accept first, then /resolve), so this guard only checks
// the session — a signed-out visitor signs in and comes back.
const signedInBareShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_signed-in-bare",
  component: NoNavShell,
  beforeLoad: async ({
    location,
  }: {
    location: { pathname: string; searchStr?: string };
  }) => {
    const { session } = await uomClient.getSession();
    if (!session) {
      throw redirect({
        to: "/login" as never,
        search: { intention: location.pathname + (location.searchStr ?? "") } as never,
      });
    }
  },
} as never);

const invitationAcceptRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/invitations/accept")! as never,
  signedInBareShellRoute as never,
  "/my/invitations/accept",
);

const resetPasswordRoute = createModuleRoute(
  findRoute(moduleRoutes, "/reset-password")! as never,
  bareShellRoute as never,
  "/reset-password",
);

const sidebarShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_account",
  component: SidebarShell,
  beforeLoad: createGateBeforeLoad(uomClient),
} as never);

const titleBandLayoutRoute = createRoute({
  getParentRoute: () => sidebarShellRoute,
  id: "/_page",
  component: TitleBandLayout,
} as never);

const settingsLayoutRoute = createRoute({
  getParentRoute: () => sidebarShellRoute,
  id: "/_settings",
  component: SettingsLayout,
} as never);

// The TitleBandLayout's header band per page — title + icon (`staticData.header`).
const dashboardRoute = createRoute({
  getParentRoute: () => titleBandLayoutRoute,
  path: "/dashboard",
  staticData: { header: { title: "Home", icon: "home" } },
  component: DashboardPage,
} as never);

const resolveRoute = createModuleRoute(findRoute(moduleRoutes, "/resolve")! as never, titleBandLayoutRoute, "/resolve", {
  header: { title: "Account setup", icon: "lock" },
});

const membershipsRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/memberships")! as never,
  titleBandLayoutRoute,
  "/my/memberships",
  { header: { title: "My memberships", icon: "building" } },
);

const myInvitationsRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/invitations")! as never,
  titleBandLayoutRoute,
  "/my/invitations",
  { header: { title: "My invitations", icon: "mail" } },
);

const accountSettingsRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/settings/account")! as never,
  settingsLayoutRoute,
  "/my/settings/account",
);

const profileRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/settings/profile")! as never,
  settingsLayoutRoute,
  "/my/settings/profile",
);

const securityRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/settings/security")! as never,
  settingsLayoutRoute,
  "/my/settings/security",
);

const legalAgreementsRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/settings/legal")! as never,
  settingsLayoutRoute,
  "/my/settings/legal",
);

const preferencesRoute = createModuleRoute(
  findRoute(moduleRoutes, "/my/settings/preferences")! as never,
  settingsLayoutRoute,
  "/my/settings/preferences",
);

const notificationPreferencesRoute = createModuleRoute(
  findRoute(notificationRoutes, "/my/settings/notifications")! as never,
  settingsLayoutRoute,
  "/my/settings/notifications",
);

const organizationsRoute = createModuleRoute(
  findRoute(moduleRoutes, "/organizations")! as never,
  titleBandLayoutRoute,
  "/organizations",
  { header: { title: "Organizations", icon: "building" } },
);

// The org branch: /organizations/$organizationId/{info,members} inside the
// OrgLayout (the org's name in the header band, Info · Members in its own left
// panel), where the param may be the literal `current` (frontend alias for
// the active org — resolved client-side, the backend only ever sees ids).
const orgLayoutRoute = createRoute({
  getParentRoute: () => sidebarShellRoute,
  path: "/organizations/$organizationId",
  component: OrgLayout,
} as never);

const organizationIndexRoute = createRoute({
  getParentRoute: () => orgLayoutRoute,
  path: "/",
  beforeLoad: ({ params }: { params: { organizationId: string } }) => {
    throw redirect({
      to: "/organizations/$organizationId/info" as never,
      params: params as never,
    });
  },
} as never);

const organizationInfoRoute = createModuleRoute(
  findRoute(moduleRoutes, "/organizations/:organizationId/info")! as never,
  orgLayoutRoute,
  "/info",
);

const organizationMembersRoute = createModuleRoute(
  findRoute(moduleRoutes, "/organizations/:organizationId/members")! as never,
  orgLayoutRoute,
  "/members",
);

// Legal authoring owns its whole region tree (header band + catalog sidebar),
// so it mounts straight under the account shell, not inside the TitleBandLayout.
const legalAdminLayoutRoute = createRoute({
  getParentRoute: () => sidebarShellRoute,
  id: "/_legal-admin",
  component: LegalAdminLayout,
} as never);
const legalAdminRoute = createModuleRoute(
  findRoute(moduleRoutes, "/manage-legal-documents")! as never,
  legalAdminLayoutRoute,
  "/manage-legal-documents",
);

const legalAdminSelectionRoute = createModuleRoute(
  findRoute(moduleRoutes, "/manage-legal-documents/:documentType/:orgTypeKey")! as never,
  legalAdminLayoutRoute,
  "/manage-legal-documents/$documentType/$orgTypeKey",
);

// The public document frame: a centered column, no shell.
const legalLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_legal",
  component: LegalLayout,
} as never);

const legalDocumentRoute = createModuleRoute(
  findRoute(moduleRoutes, "/legal-documents")! as never,
  legalLayoutRoute as never,
  "/legal-documents",
);

// =============================================================================
// INDEX — route by session state
// =============================================================================

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    const { session } = await uomClient.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" as never });
    }
    throw redirect({ to: "/login" as never });
  },
} as never);

// =============================================================================
// SANDBOX (unchanged playground)
// =============================================================================

// File routes need explicit id/path/parent wiring in code-based assembly —
// an unwired createFileRoute registers with root identity and the router
// throws "Duplicate routes found with id: __root__".
SandboxRoute.update({ id: "/sandbox", path: "/sandbox", getParentRoute: () => rootRoute } as never);
SandboxIndexRoute.update({ id: "/", path: "/", getParentRoute: () => SandboxRoute } as never);
SandboxLayoutsRoute.update({ id: "/layouts", path: "/layouts", getParentRoute: () => SandboxRoute } as never);
SandboxLayoutsIndexRoute.update({ id: "/", path: "/", getParentRoute: () => SandboxLayoutsRoute } as never);
SandboxLayoutsRegionsRoute.update({
  id: "/regions",
  path: "/regions",
  getParentRoute: () => SandboxLayoutsRoute,
} as never);
SandboxLayoutsMapRoute.update({ id: "/map", path: "/map", getParentRoute: () => SandboxLayoutsRoute } as never);
SandboxLayoutsSnapshotsRoute.update({
  id: "/snapshots",
  path: "/snapshots",
  getParentRoute: () => SandboxLayoutsRoute,
} as never);

ThemeEditorRoute.update({ id: "/theme-editor", path: "/theme-editor", getParentRoute: () => SandboxRoute } as never);
ThemeEditorIndexRoute.update({ id: "/", path: "/", getParentRoute: () => ThemeEditorRoute } as never);
ThemeEditorThemeIdLayoutRoute.update({
  id: "/$themeId",
  path: "/$themeId",
  getParentRoute: () => ThemeEditorRoute,
} as never);
ThemeEditorThemeIdIndexRoute.update({
  id: "/",
  path: "/",
  getParentRoute: () => ThemeEditorThemeIdLayoutRoute,
} as never);
ThemeEditorFixtureSplatRoute.update({
  id: "/$",
  path: "/$",
  getParentRoute: () => ThemeEditorThemeIdLayoutRoute,
} as never);

const themeEditorThemeIdWithChildren = ThemeEditorThemeIdLayoutRoute._addFileChildren([
  ThemeEditorThemeIdIndexRoute,
  ThemeEditorFixtureSplatRoute,
]);

const themeEditorWithChildren = ThemeEditorRoute._addFileChildren([
  ThemeEditorIndexRoute,
  themeEditorThemeIdWithChildren,
]);

const sandboxLayoutsWithChildren = SandboxLayoutsRoute._addFileChildren([
  SandboxLayoutsIndexRoute,
  SandboxLayoutsRegionsRoute,
  SandboxLayoutsMapRoute,
  SandboxLayoutsSnapshotsRoute,
]);

const sandboxWithChildren = SandboxRoute._addFileChildren([
  SandboxIndexRoute,
  sandboxLayoutsWithChildren,
  themeEditorWithChildren,
]);

// =============================================================================
// TREE ASSEMBLY
// =============================================================================

const authWithChildren = authShellRoute.addChildren([authLoginRoute, authRegisterRoute, authForgotPasswordRoute]);

const bareShellWithChildren = bareShellRoute.addChildren([invitationRoute, resetPasswordRoute]);

const signedInBareShellWithChildren = signedInBareShellRoute.addChildren([invitationAcceptRoute]);

const pageFrameWithChildren = titleBandLayoutRoute.addChildren([
  dashboardRoute,
  resolveRoute,
  membershipsRoute,
  myInvitationsRoute,
  organizationsRoute,
]);

const orgLayoutWithChildren = orgLayoutRoute.addChildren([
  organizationIndexRoute,
  organizationInfoRoute,
  organizationMembersRoute,
]);

const settingsWithChildren = settingsLayoutRoute.addChildren([
  accountSettingsRoute,
  profileRoute,
  securityRoute,
  legalAgreementsRoute,
  preferencesRoute,
  notificationPreferencesRoute,
]);

const legalAdminWithChildren = legalAdminLayoutRoute.addChildren([legalAdminRoute, legalAdminSelectionRoute]);
const accountWithChildren = sidebarShellRoute.addChildren([
  pageFrameWithChildren,
  settingsWithChildren,
  orgLayoutWithChildren,
  legalAdminWithChildren,
]);

const legalWithChildren = legalLayoutRoute.addChildren([legalDocumentRoute]);

export const routeTree = rootRoute._addFileChildren([
  indexRoute,
  authWithChildren,
  accountWithChildren,
  bareShellWithChildren,
  signedInBareShellWithChildren,
  legalWithChildren,
  sandboxWithChildren,
] as never);
