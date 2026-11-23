// Public api surface — the mount, its types, the provider port and the two
// implementations of it (Stripe for the app, the fake for tests). Models live
// under `./models`; the wire types under `../shared`.
export { mountPaymentApi, WEBHOOK_BASE_PATH } from "./mount";
export type { MountPaymentApiOptions, MountPaymentApiResult } from "./mount-types";
export type { CreditGrantReason, CreditGrantRequest, CreditsPort, VendorCreditsIssued } from "./shared/credits-port";
export type { PaymentEnv } from "./types";
export type { PaymentProvider, ProviderEvent, WebhookEndpoint } from "./stripe/provider";
export { ProviderSignatureError } from "./stripe/provider";
export { createStripeProvider, type StripeProviderConfig } from "./stripe/stripe-adapter";
export { FakeProvider } from "./testing/fake-provider";
