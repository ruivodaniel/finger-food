/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing). The core mounts what it reads,
 * under the shell each top-level node's `access` names; it knows no page and no layout of this slice. A section's pages hang
 * under the slice layout they share; a child carries `nav` (its title) when a navigation shows it. Paths follow the baseline
 * sitemap: the home at `/`, settings under `/my/settings/*`, recovery split across /forgot-password + /reset-password, the
 * invitation capability URL at /accept-invitation?id= continuing on the signed-in /my/invitations/accept?id=, the public legal
 * viewer at /legal-documents?type=. The notification preferences page is the notifications slice's, placed in the settings
 * here: the user settings are this slice's section.
 */

import { createElement } from "react";
import type { RouteContext, RouteNode } from "@libs/web-routing";
import { NotificationPreferencesPage } from "@modules/notifications/web";
import { LoginPage } from "../pages/login/LoginPage";
import { RegisterPage } from "../pages/register/RegisterPage";
import { ForgotPasswordPage } from "../pages/forgot-password/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/reset-password/ResetPasswordPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { SecurityPage } from "../pages/security/SecurityPage";
import { AccountSettingsPage } from "../pages/account-settings/AccountSettingsPage";
import { LegalAgreementsPage } from "../pages/legal-agreements/LegalAgreementsPage";
import { PreferencesPage } from "../pages/preferences/PreferencesPage";
import { ResolvePage } from "../pages/resolve/ResolvePage";
import { MembershipsPage } from "../pages/memberships/MembershipsPage";
import { MyInvitationsPage } from "../pages/my-invitations/MyInvitationsPage";
import { OrganizationsDirectoryPage } from "../pages/organizations-directory/OrganizationsDirectoryPage";
import { OrgInfoPage } from "../pages/org-info/OrgInfoPage";
import { OrgMembersPage } from "../pages/org-members/OrgMembersPage";
import { InvitationAcceptPage } from "../pages/invitation-accept/InvitationAcceptPage";
import { InvitationLandingPage } from "../pages/invitation-landing/InvitationLandingPage";
import { LegalDocumentViewerPage } from "../pages/legal-document-viewer/LegalDocumentViewerPage";
import { LegalDocumentsAdminPage } from "../pages/legal-documents-admin/LegalDocumentsAdminPage";
import { legalSlugToType, legalTypeFromSearch } from "../shared/helpers/legal-doc-paths";
import { SettingsLayout, registerSettingsSection } from "../shared/layouts/SettingsLayout";
import { OrganizationLayout } from "../shared/layouts/OrganizationLayout";
import { LegalAdminLayout } from "../shared/layouts/LegalAdminLayout";
import { StandaloneLayout } from "../shared/layouts/StandaloneLayout";
import { CardLayout } from "../shared/layouts/CardLayout";
import { DocumentLayout } from "../shared/layouts/DocumentLayout";
import { SETTINGS_BASE_PATH } from "./sections";

export interface GetRoutesOptions {
  /** App paths for cross-page links (defaults match the route paths). */
  loginPath?: string;
  registerPath?: string;
  forgotPasswordPath?: string;
  resetPasswordPath?: string;
  /** Where successful login/registration lands (the application's signed-in home). */
  homePath?: string;
  /** Base path for the organizations DIRECTORY; org pages hang under `${it}/$organizationId/{info,members}`, where the literal
   * segment `current` is a frontend alias for the session's active org. */
  organizationsPath?: string;
  /** The caller's memberships page. */
  membershipsPath?: string;
  /** The caller's pending-invitations page. */
  myInvitationsPath?: string;
  /** The invitation capability URL (`?id=` carries the invitation). */
  acceptInvitationPath?: string;
  /** The signed-in accept page (`?id=`); defaults under myInvitationsPath. */
  myInvitationAcceptPath?: string;
  /** More pages of the settings section, from the slices the app mounts. */
  settingsPages?: RouteNode[];
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export function getUserOrgMgmtRoutes(options: GetRoutesOptions = {}): RouteNode[] {
  const {
    loginPath = "/login",
    registerPath = "/register",
    forgotPasswordPath = "/forgot-password",
    resetPasswordPath = "/reset-password",
    homePath = "/",
    organizationsPath = "/organizations",
    membershipsPath = "/my/memberships",
    myInvitationsPath = "/my/invitations",
    acceptInvitationPath = "/accept-invitation",
    myInvitationAcceptPath = `${myInvitationsPath}/accept`,
    settingsPages = [],
  } = options;
  const settingsBasePath = SETTINGS_BASE_PATH;
  const profilePath = `${settingsBasePath}/profile`;
  const securityPath = `${settingsBasePath}/security`;

  // The card with no navigation: a signed-in caller is sent home from the sign-in pages; the pages that need the session keep it.
  const AuthCardLayout = () => createElement(CardLayout, { redirectSignedInTo: homePath });
  const PlainCardLayout = () => createElement(CardLayout);

  const settings: RouteNode = {
    access: "gated",
    path: settingsBasePath,
    layout: SettingsLayout,
    children: [
      { path: "account", page: AccountSettingsPage, makeProps: () => ({ loginPath }), nav: { title: "Account" } },
      { path: "profile", page: ProfilePage, makeProps: () => ({ loginPath, securityPath }), nav: { title: "Profile" } },
      { path: "security", page: SecurityPage, makeProps: () => ({ loginPath, profilePath }), nav: { title: "Security" } },
      { path: "legal", page: LegalAgreementsPage, makeProps: () => ({ loginPath }), nav: { title: "Legal agreements" } },
      { path: "preferences", page: PreferencesPage, makeProps: () => ({}), nav: { title: "Preferences" } },
      // the notifications slice's page, placed in this section
      { path: "notifications", page: NotificationPreferencesPage, makeProps: () => ({}), nav: { title: "Notifications" } },
      ...settingsPages,
    ],
  };
  registerSettingsSection(settings);

  return [
    // ── public: the card, no navigation ──────────────────────────────────────
    {
      access: "public",
      id: "auth-card",
      layout: AuthCardLayout,
      children: [
        {
          path: loginPath,
          page: LoginPage,
          makeProps: (ctx: RouteContext) => ({ intention: str(ctx.search.intention), registerPath, recoveryPath: forgotPasswordPath, homePath }),
        },
        {
          path: registerPath,
          page: RegisterPage,
          // register-and-join lands signed in — straight on the accept page
          makeProps: (ctx: RouteContext) => ({ loginPath, homePath, invitationId: str(ctx.search.invitationId), acceptInvitationPath: myInvitationAcceptPath }),
        },
        {
          // Recovery, step one: prove the address via a delivered code. The proof signs the caller in; /reset-password acts on that session.
          path: forgotPasswordPath,
          page: ForgotPasswordPage,
          makeProps: () => ({ loginPath, resetPasswordPath }),
        },
      ],
    },
    {
      access: "public",
      id: "plain-card",
      layout: PlainCardLayout,
      children: [
        {
          // Recovery, step two: needs the recovery session, so no redirect of a signed-in caller here.
          path: resetPasswordPath,
          page: ResetPasswordPage,
          makeProps: () => ({ loginPath, forgotPasswordPath }),
        },
        {
          // Capability URL, public; the invitation travels as ?id=. Accepting continues on the signed-in accept page.
          path: acceptInvitationPath,
          page: InvitationLandingPage,
          makeProps: (ctx: RouteContext) => ({ invitationId: str(ctx.search.id) ?? "", loginPath, registerPath, acceptInvitationPath: myInvitationAcceptPath }),
        },
      ],
    },
    {
      // Public viewer: current published version of ?type= (terms when absent); ?docId= pins a specific immutable version (wins), ?orgTypeId= narrows the scope.
      access: "public",
      id: "legal-document",
      layout: DocumentLayout,
      children: [
        {
          path: "/legal-documents",
          page: LegalDocumentViewerPage,
          makeProps: (ctx: RouteContext) => ({ type: legalTypeFromSearch(ctx.search.type), orgTypeId: str(ctx.search.orgTypeId), documentId: str(ctx.search.docId) }),
        },
      ],
    },

    // ── signed in, the gate not asked: accepting an invitation works while requirements are owed ──
    {
      access: "signed-in",
      id: "invitation-accept",
      layout: PlainCardLayout,
      children: [
        {
          path: myInvitationAcceptPath,
          page: InvitationAcceptPage,
          makeProps: (ctx: RouteContext) => ({ invitationId: str(ctx.search.id) ?? "", homePath }),
        },
      ],
    },

    // ── gated: every page after sign-in ──────────────────────────────────────
    {
      access: "gated",
      id: "standalone",
      layout: StandaloneLayout,
      children: [
        { path: "/", page: DashboardPage },
        {
          // The gated-caller destination. Never itself gated: the core's guard self-exempts this path (see ResolvePage).
          path: "/resolve",
          page: ResolvePage,
          makeProps: (ctx: RouteContext) => ({ loginPath, homePath, intention: str(ctx.search.intention) }),
        },
        { path: membershipsPath, page: MembershipsPage, makeProps: () => ({ loginPath, organizationsPath }) },
        { path: myInvitationsPath, page: MyInvitationsPage, makeProps: () => ({ loginPath, acceptInvitationPath: myInvitationAcceptPath }) },
        // The platform directory (table + create); membership rows OPEN an org (navigate) — only the OrgSwitcher activates one.
        { path: organizationsPath, page: OrganizationsDirectoryPage, makeProps: () => ({ loginPath, organizationsPath }) },
      ],
    },
    settings,
    {
      // One organization's area. `$organizationId` is an id or the literal `current` (frontend alias for the active org — the backend never sees it).
      access: "gated",
      path: `${organizationsPath}/$organizationId`,
      layout: OrganizationLayout,
      children: [
        { path: "/", redirectTo: `${organizationsPath}/$organizationId/info` },
        { path: "info", page: OrgInfoPage, makeProps: (ctx: RouteContext) => ({ organizationId: ctx.params.organizationId ?? "current", loginPath }) },
        { path: "members", page: OrgMembersPage, makeProps: (ctx: RouteContext) => ({ organizationId: ctx.params.organizationId ?? "current", loginPath }) },
      ],
    },
    {
      // Legal authoring: the index selects nothing; the deep link names the type slug and the scope ("platform" or an org type id).
      access: "gated",
      path: "/manage-legal-documents",
      layout: LegalAdminLayout,
      children: [
        { path: "/", page: LegalDocumentsAdminPage, makeProps: () => ({}) },
        {
          path: "$documentType/$orgTypeKey",
          page: LegalDocumentsAdminPage,
          makeProps: (ctx: RouteContext) => ({ type: legalSlugToType(ctx.params.documentType) ?? ctx.params.documentType, scope: ctx.params.orgTypeKey }),
        },
      ],
    },
  ];
}
