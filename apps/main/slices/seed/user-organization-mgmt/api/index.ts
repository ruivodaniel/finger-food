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
  ScopedAcRequestContext,
  ScopedAcBag,
} from "./shared/scoped-ac";
export type {
  IdentityProviderPort,
  IdentitySnapshot,
  SessionSnapshot,
} from "./identity/identity-provider.port";
export { IdentityProviderError } from "./identity/identity-provider.port";
export { LocalIdentityProvider } from "./identity/local/local-identity-provider";
export type { CodePurpose, LocalIdentityProviderOptions } from "./identity/local/local-identity-provider";
export type { MembershipFacts } from "./services/gate.service";
export type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
export type { StoragePort } from "./shared/storage-port";
