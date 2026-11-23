// Public web surface — what a consuming app imports. Pages travel inside
// the route declaration; everything else under web/ is slice-internal except
// the past-due notice a consumer places on its own screens.

export { mountPaymentWeb, usePaymentContext } from "./services/application/mount";
export { getPaymentRoutes, personalBillingRoute } from "./routes/get-routes";
export { createPaymentApiClient, ApiError, isForbidden, isUnavailable, ACTIVE_ORGANIZATION_HEADER } from "./lib/api-client";
export type { PaymentApiClient, ProductChange, ProductInput } from "./lib/api-client";
export { queryKeys as paymentQueryKeys } from "./lib/query-keys";
export { useBillingSummary } from "./hooks/use-billing";
export { PastDueNotice } from "./components/PastDueNotice";
export type { ActiveOrganization, CreditsAdapter, MountPaymentWebOptions, PaymentWebConfig, ToastAdapter, VendorHoldings } from "./types";
