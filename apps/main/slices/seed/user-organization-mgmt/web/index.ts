// Public web surface — what a consuming app imports. Pages travel inside
// the route declaration; everything else under web/ is slice-internal.

// Wiring: the app mounts the module once, and rehydrates its store.
export { mountUserOrgMgmtWeb } from "./services/application/mount";
export type {
  MountUserOrgMgmtWebOptions,
  UserOrgMgmtHttp,
  RoleOption,
  RouterAdapter,
  ToastAdapter,
} from "./services/application/mount";
export { getActiveOrgId, rehydrateActiveOrganization } from "./store/active-organization.store";
export { getUserOrgMgmtRoutes } from "./routes/get-routes";
export type { GetRoutesOptions } from "./routes/get-routes";

// What the app's shell and guards read: the session, the active membership,
// the gate, and the caller's pending invitations.
export { authenticationService } from "./services/application/authentication.service";
export type { SessionResponse } from "./services/application/authentication.service";
export { membershipsService } from "./services/application/memberships.service";
export { onboardingService } from "./services/application/onboarding.service";
export type { GateCheckResponse } from "./services/application/onboarding.service";
export { invitationsService } from "./services/application/invitations.service";
export { useResetOnIdentityChange } from "./shared/hooks/use-reset-on-identity-change";
export { useOrganization } from "./shared/hooks/use-organization";

// Components other slices and the app may render.
export { OrgSwitcher } from "./shared/components/OrgSwitcher";
export { OrgSectionNav } from "./shared/components/OrgSectionNav";
export type { OrgSectionNavProps } from "./shared/components/OrgSectionNav";
export { LegalAdminNav } from "./shared/components/LegalAdminNav";
export type { LegalAdminNavProps } from "./shared/components/LegalAdminNav";
export { UserAvatar } from "./shared/components/UserAvatar";
export { OrganizationAvatar } from "./shared/components/OrganizationAvatar";
export { NamedAvatar } from "./shared/components/NamedAvatar";
export type { NamedAvatarProps } from "./shared/components/NamedAvatar";
