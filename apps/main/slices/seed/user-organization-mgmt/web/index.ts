// Public web surface — what a consuming app imports. Pages travel inside
// route definitions; everything else under web/ is module-internal.

export {
  UserOrgMgmtProvider,
  useUserOrgMgmtContext,
} from "./providers/UserOrgMgmtProvider";
export { useSession, useInvalidateSession } from "./hooks/use-session";
// The active-org store the module's client stamps on requests — exported so
// app features composing their own clients follow the same convention.
export { getActiveOrgId } from "./lib/active-org";
export { useActiveMembership } from "./hooks/use-active-membership";
export { usePendingInvitationCount } from "./hooks/use-pending-invitation-count";
export { useLogout } from "./hooks/use-logout";
export { OrgSwitcher } from "./components/orgs/OrgSwitcher";
// The org area's pieces — the hosting app builds the org layout from them: the
// organization's name for the header band, the Info · Members panel for the left slot.
export { LegalAdminNav } from "./components/legal/LegalAdminNav";
export type { LegalAdminNavProps } from "./components/legal/LegalAdminNav";
export { OrgSectionNav } from "./components/orgs/OrgSectionNav";
export type { OrgSectionNavProps } from "./components/orgs/OrgSectionNav";
export { useOrganizationName } from "./hooks/use-organization-name";
export { getUserOrgMgmtRoutes } from "./routes/get-routes";
export type { GetRoutesOptions } from "./routes/get-routes";
export type {
  RouteDefinition,
  RouteAccess,
  RouteContext,
} from "./routes/route-definition";
export { createApiClient, ApiError } from "./lib/api-client";
export type { ApiClientHooks } from "./lib/api-client";
export type {
  UserOrgMgmtApiClient,
  SessionResponse,
  GateCheckResponse,
} from "./lib/api-client";
export { queryKeys as userOrgMgmtQueryKeys } from "./lib/query-keys";
export type {
  UserOrgMgmtWebConfig,
  UserOrgMgmtProviderProps,
  RouterAdapter,
  ToastAdapter,
} from "./types";
