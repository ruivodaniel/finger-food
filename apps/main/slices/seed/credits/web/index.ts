// Public web surface — what a consuming app imports, and the sections another
// slice's page may place among its own. Pages travel inside the route
// declaration; everything else under web/ is slice-internal.

export { mountCreditsWeb } from "./services/application/mount";
export type { ActiveOrganization, CreditsHttp, MemberSummary, MountCreditsWebOptions, ToastAdapter } from "./services/application/mount";
export { getCreditsRoutes, personalCreditsRoute } from "./routes/get-routes";
export { CreditsBalance, CreditsLedger, CreditsLots, MemberLimits, OwnLimit } from "./shared/components/CreditsSections";
export type { CreditsSectionProps } from "./shared/components/CreditsSections";
export { CreditsExhaustedAlert } from "./shared/components/CreditsExhaustedAlert";
export type { CreditsExhaustedAlertProps } from "./shared/components/CreditsExhaustedAlert";
export { useCreditsSummary } from "./shared/hooks/use-credits";
export type { CreditsTarget } from "./shared/hooks/use-credits";
export { queryKeys as creditsQueryKeys } from "./shared/helpers/query-keys";
