// Public API surface — what a consuming app (or worker) imports. Everything
// else under api/ is module-internal.

export { mountNotificationsApi } from "./mount";
export type {
  MountNotificationsApiOptions,
  MountNotificationsApiResult,
} from "./mount-types";
export type {
  NotificationsEnv,
  NotificationsContextVariables,
} from "./types";
export type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
export type { NotificationsDb } from "./shared/executor";

// Delivery — the one code path a worker drives, and the worker-less fallback.
export { createInlineDeliveryOutbox } from "./services/delivery.service";
export type {
  DeliverOutcome,
  DeliverPendingOptions,
  DeliverPendingResult,
} from "./services/delivery.service";
export type { ProviderDeliveryEvent } from "./services/delivery-events.service";

// Transports — factories over config; each app builds them from its own env.
export { createSmtpEmailTransport } from "./transports/smtp-email-transport";
export type { SmtpEmailTransportConfig } from "./transports/smtp-email-transport";
export { createTwilioSmsTransport } from "./transports/twilio-sms-transport";
export type { TwilioSmsTransportConfig } from "./transports/twilio-sms-transport";
export { createSmsDevTransport } from "./transports/sms-dev-transport";
export type { SmsDevTransportConfig } from "./transports/sms-dev-transport";
