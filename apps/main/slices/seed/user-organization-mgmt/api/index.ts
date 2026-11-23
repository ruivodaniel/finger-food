// Public API surface — what a consuming app imports. Everything else under
// api/ is module-internal.

export { mountUserOrgApi } from "./mount";
export type {
  MountUserOrgApiOptions,
  MountUserOrgApiResult,
  AuthMountDescriptor,
  InvitationDelivery,
  InvitationDeliveryPayload,
} from "./mount-types";
export type {
  UserOrgMgmtEnv,
  UserOrgMgmtContextVariables,
  ScopedAcEnv,
} from "./types";
export type {
  IdentityProviderPort,
  IdentitySnapshot,
  SessionSnapshot,
} from "./identity/identity-provider.port";
export { IdentityProviderError } from "./identity/identity-provider.port";
export type { MembershipFacts } from "./services/gate.service";
export type { OrganizationService } from "./services/organization.service";
export type { UserProfileService } from "./services/user-profile.service";
export type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
export type { StoragePort } from "./shared/storage-port";
