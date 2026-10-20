/**
 * Route contributions — the module's pages as data. The app mounts them
 * under its own layouts; paths here are relative to wherever the app hangs
 * them (e.g. /v2/login during side-by-side testing, /login at cutover).
 * The path shape follows the baseline sitemap: settings under
 * `/my/settings/*`, recovery split across /forgot-password +
 * /reset-password, the invitation capability URL at /accept-invitation?id=
 * continuing on the signed-in /my/invitations/accept?id=, the public legal
 * viewer at /legal-documents?type=.
 */

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { ProfilePage } from "../pages/account/ProfilePage";
import { SecurityPage } from "../pages/account/SecurityPage";
import { AccountSettingsPage } from "../pages/account/AccountSettingsPage";
import { LegalAgreementsPage } from "../pages/account/LegalAgreementsPage";
import { PreferencesPage } from "../pages/account/PreferencesPage";
import { ResolvePage } from "../pages/account/ResolvePage";
import { MembershipsPage } from "../pages/orgs/MembershipsPage";
import { MyInvitationsPage } from "../pages/orgs/MyInvitationsPage";
import { OrganizationsDirectoryPage } from "../pages/orgs/OrganizationsDirectoryPage";
import { OrgInfoPage } from "../pages/orgs/OrgInfoPage";
import { OrgMembersPage } from "../pages/orgs/OrgMembersPage";
import { InvitationAcceptPage } from "../pages/orgs/InvitationAcceptPage";
import { InvitationLandingPage } from "../pages/orgs/InvitationLandingPage";
import { LegalDocumentViewerPage } from "../pages/legal/LegalDocumentViewerPage";
import { LegalDocumentsAdminPage } from "../pages/legal/LegalDocumentsAdminPage";
import { legalSlugToType, legalTypeFromSearch } from "../lib/legal-doc-paths";
import type { RouteContext, RouteDefinition } from "./route-definition";

export interface GetRoutesOptions {
  /** App paths for cross-page links (defaults match the route paths). */
  loginPath?: string;
  registerPath?: string;
  forgotPasswordPath?: string;
  resetPasswordPath?: string;
  /** Where successful login/registration lands (the app's signed-in home). */
  homePath?: string;
  /** Base path of the caller's settings section (`${it}/profile`, …). */
  settingsBasePath?: string;
  /** Base path for the organizations DIRECTORY; org pages hang under
   * `${it}/:organizationId/{info,members}`, where the literal segment
   * `current` is a frontend alias for the session's active org. */
  organizationsPath?: string;
  /** The caller's memberships page. */
  membershipsPath?: string;
  /** The caller's pending-invitations page. */
  myInvitationsPath?: string;
  /** The invitation capability URL (`?id=` carries the invitation). */
  acceptInvitationPath?: string;
  /** The signed-in accept page (`?id=`); defaults under myInvitationsPath. */
  myInvitationAcceptPath?: string;
}

export function getUserOrgMgmtRoutes(
  options: GetRoutesOptions = {},
): RouteDefinition[] {
  const {
    loginPath = "/login",
    registerPath = "/register",
    forgotPasswordPath = "/forgot-password",
    resetPasswordPath = "/reset-password",
    homePath = "/",
    settingsBasePath = "/my/settings",
    organizationsPath = "/organizations",
    membershipsPath = "/my/memberships",
    myInvitationsPath = "/my/invitations",
    acceptInvitationPath = "/accept-invitation",
    myInvitationAcceptPath = `${myInvitationsPath}/accept`,
  } = options;
  const profilePath = `${settingsBasePath}/profile`;
  const securityPath = `${settingsBasePath}/security`;

  return [
    {
      path: "/login",
      page: LoginPage,
      access: "public",
      makeProps: (ctx: RouteContext) => ({
        intention:
          typeof ctx.search.intention === "string"
            ? ctx.search.intention
            : undefined,
        registerPath,
        recoveryPath: forgotPasswordPath,
        homePath,
      }),
      meta: { title: "Sign in" },
    },
    {
      path: "/register",
      page: RegisterPage,
      access: "public",
      makeProps: (ctx: RouteContext) => ({
        loginPath,
        homePath,
        invitationId:
          typeof ctx.search.invitationId === "string"
            ? ctx.search.invitationId
            : undefined,
        // register-and-join lands signed in — straight on the accept page
        acceptInvitationPath: myInvitationAcceptPath,
      }),
      meta: { title: "Create account" },
    },
    {
      // Recovery, step one: prove the address via a delivered code. The
      // proof signs the caller in; /reset-password acts on that session.
      path: forgotPasswordPath,
      page: ForgotPasswordPage,
      access: "public",
      makeProps: () => ({ loginPath, resetPasswordPath }),
      meta: { title: "Forgot your password?" },
    },
    {
      // Recovery, step two: needs the recovery session, so the app must NOT
      // hang it under a layout that redirects signed-in callers away.
      path: resetPasswordPath,
      page: ResetPasswordPage,
      access: "public",
      makeProps: () => ({ loginPath, forgotPasswordPath }),
      meta: { title: "Reset your password" },
    },
    {
      path: profilePath,
      page: ProfilePage,
      access: "authenticated",
      makeProps: () => ({ loginPath, securityPath }),
      meta: { title: "Profile" },
    },
    {
      path: securityPath,
      page: SecurityPage,
      access: "authenticated",
      makeProps: () => ({ loginPath, profilePath }),
      meta: { title: "Security" },
    },
    {
      // Sign-in identifiers — emails/phones with verify + remove.
      path: `${settingsBasePath}/account`,
      page: AccountSettingsPage,
      access: "authenticated",
      makeProps: () => ({ loginPath }),
      meta: { title: "Account" },
    },
    {
      // Accepted-documents history; re-consent lives in the /resolve wizard.
      path: `${settingsBasePath}/legal`,
      page: LegalAgreementsPage,
      access: "authenticated",
      makeProps: () => ({ loginPath }),
      meta: { title: "Legal agreements" },
    },
    {
      // Language / timezone (+ what the product sets) — the policy comes in
      // through the web config, the values from /me/preferences.
      path: `${settingsBasePath}/preferences`,
      page: PreferencesPage,
      access: "authenticated",
      makeProps: () => ({}),
      meta: { title: "Preferences" },
    },
    {
      // The gated-caller destination. Never itself gated: the app's guard
      // self-exempts this path (see ResolvePage).
      path: "/resolve",
      page: ResolvePage,
      access: "authenticated",
      makeProps: (ctx: RouteContext) => ({
        loginPath,
        homePath,
        intention:
          typeof ctx.search.intention === "string"
            ? ctx.search.intention
            : undefined,
      }),
      meta: { title: "Finish setting up" },
    },
    {
      // The platform directory (table + create); membership rows OPEN an
      // org (navigate) — only the OrgSwitcher activates one.
      path: organizationsPath,
      page: OrganizationsDirectoryPage,
      access: "authenticated",
      makeProps: () => ({
        loginPath,
        organizationsPath,
      }),
      meta: { title: "Organizations" },
    },
    {
      // The caller's own memberships.
      path: membershipsPath,
      page: MembershipsPage,
      access: "authenticated",
      makeProps: () => ({
        loginPath,
        organizationsPath,
      }),
      meta: { title: "My memberships" },
    },
    {
      // The caller's pending invitations.
      path: myInvitationsPath,
      page: MyInvitationsPage,
      access: "authenticated",
      makeProps: () => ({
        loginPath,
        acceptInvitationPath: myInvitationAcceptPath,
      }),
      meta: { title: "My invitations" },
    },
    {
      // Accept one invitation, signed in (`?id=`). The app must mount it
      // OUTSIDE the gate: accepting works while obligations are owed.
      path: myInvitationAcceptPath,
      page: InvitationAcceptPage,
      access: "authenticated",
      makeProps: (ctx: RouteContext) => ({
        invitationId: typeof ctx.search.id === "string" ? ctx.search.id : "",
        homePath,
      }),
      meta: { title: "Accept invitation" },
    },
    {
      // One org's info. `:organizationId` is an id or the literal `current`
      // (frontend alias for the active org — the backend never sees it).
      path: `${organizationsPath}/:organizationId/info`,
      page: OrgInfoPage,
      access: "authenticated",
      makeProps: (ctx: RouteContext) => ({
        organizationId: ctx.params.organizationId ?? "current",
        loginPath,
      }),
      meta: { title: "Organization" },
    },
    {
      // One org's members + invitations, same param convention.
      path: `${organizationsPath}/:organizationId/members`,
      page: OrgMembersPage,
      access: "authenticated",
      makeProps: (ctx: RouteContext) => ({
        organizationId: ctx.params.organizationId ?? "current",
        loginPath,
      }),
      meta: { title: "Organization members" },
    },
    {
      // Capability URL, public; the invitation travels as ?id=. Accepting
      // continues on the signed-in accept page.
      path: acceptInvitationPath,
      page: InvitationLandingPage,
      access: "public",
      makeProps: (ctx: RouteContext) => ({
        invitationId: typeof ctx.search.id === "string" ? ctx.search.id : "",
        loginPath,
        registerPath,
        acceptInvitationPath: myInvitationAcceptPath,
      }),
      meta: { title: "Invitation" },
    },
    {
      // Public viewer: current published version of ?type= (terms when
      // absent); ?docId= pins a specific immutable version (wins),
      // ?orgTypeId= narrows the scope.
      path: "/legal-documents",
      page: LegalDocumentViewerPage,
      access: "public",
      makeProps: (ctx: RouteContext) => ({
        type: legalTypeFromSearch(ctx.search.type),
        orgTypeId:
          typeof ctx.search.orgTypeId === "string"
            ? ctx.search.orgTypeId
            : undefined,
        documentId:
          typeof ctx.search.docId === "string" ? ctx.search.docId : undefined,
      }),
      meta: { title: "Legal document" },
    },
    {
      // Authoring index — nothing selected until a sidebar item is picked;
      // selecting navigates to the deep-linkable params route below.
      path: "/manage-legal-documents",
      page: LegalDocumentsAdminPage,
      access: "authenticated",
      makeProps: () => ({}),
      meta: { title: "Legal documents" },
    },
    {
      // Authoring, deep-linked: type slug + scope ("platform" or org type id).
      path: "/manage-legal-documents/:documentType/:orgTypeKey",
      page: LegalDocumentsAdminPage,
      access: "authenticated",
      makeProps: (ctx: RouteContext) => ({
        type:
          legalSlugToType(ctx.params.documentType) ?? ctx.params.documentType,
        scope: ctx.params.orgTypeKey,
      }),
      meta: { title: "Legal documents" },
    },
  ];
}
