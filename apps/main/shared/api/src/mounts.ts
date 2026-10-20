// mount modules (+ features when they exist); inject db + config at mount
// (MOD6). Mounting is not wiring: what a module does WITH another module's
// events is the hook callbacks below — one callback per reaction, guarded by
// the emitting module's mount so a consumer failure never breaks the emitter.
import { createId } from "@paralleldrive/cuid2";
import { createS3Storage } from "@libs/storage";
import { mountNotificationsApi } from "@modules/notifications/api";
import { LocalIdentityProvider, mountUserOrgApi } from "@modules/user-organization-mgmt/api";
import {
  invitationAcceptedInApp,
  messageTypes,
  templates,
} from "@configs/notifications";
import { authenticationAndRegistration } from "@configs/user-organization-mgmt/auth/authentication.config";
import { organizationCreationAndJoining } from "@configs/user-organization-mgmt/auth/org-lifecycle.config";
import { PREFERENCES } from "@configs/product/preferences.config";
import { acEngine, baselineRoles, gatedDb } from "@/access-control";
import { db } from "@/db";
import { Env } from "@/env";
import * as AppError from "@/shared/error";
import { logger } from "@/shared/logger";
import { sendLoginCode } from "@/wiring/identity/send-code";
import { notificationDeliveryOutbox } from "@/wiring/notifications/delivery-outbox";
import { invitationDelivery } from "@/wiring/notifications/invitation-delivery";
import {
  notificationTransports,
  sendTransactionalSms,
} from "@/wiring/notifications/transports";

/** Object storage for module uploads — LocalStack in dev, real S3 elsewhere. */
const storage = createS3Storage({
  region: Env.AWS_REGION,
  bucket: Env.AWS_BUCKET_NAME,
  accessKeyId: Env.AWS_ACCESS_KEY_ID,
  secretAccessKey: Env.AWS_SECRET_ACCESS_KEY,
  endpoint:
    Env.AWS_ENDPOINT ??
    (Env.NODE_ENV === "development"
      ? "https://localhost.localstack.cloud:4568"
      : undefined),
});

// ModuleLogger is (message, meta?) — pino is (meta, message); adapt so meta
// survives instead of being silently dropped.
const moduleLogger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    logger.info(meta ?? {}, message),
  warn: (message: string, meta?: Record<string, unknown>) =>
    logger.warn(meta ?? {}, message),
  error: (message: string, meta?: Record<string, unknown>) =>
    logger.error(meta ?? {}, message),
};

const moduleErrors = {
  notFound: (message?: string) => new AppError.NotFound(message),
  badRequest: (message?: string) => new AppError.BadRequest(message),
  unauthorized: (message?: string) => new AppError.Unauthorized(message),
  forbidden: (message?: string) => new AppError.Forbidden(message),
  internalError: (message?: string) => new AppError.InternalServerError(message),
};

// Mounted first: uom's hooks below queue through it. In outbox mode email and
// SMS deliveries ride the workflow-intent outbox + BullMQ worker, so they
// survive a crash between the commit and the send; inline mode delivers
// in-process right after commit via the module's own inline outbox.
export const notifications = mountNotificationsApi({
  db,
  createId,
  templates,
  messageTypes,
  transports: notificationTransports,
  deliveryOutbox:
    Env.QUEUE_MODE === "outbox" ? notificationDeliveryOutbox : undefined,
  logger: moduleLogger,
  errors: moduleErrors,
});

export const userOrg = mountUserOrgApi({
  db,
  createId,
  // Scoped-AC engine + gated-db + baseline roles (assembled in access-control.ts).
  engine: acEngine,
  gatedDb,
  baselineRoles,
  authConfig: authenticationAndRegistration,
  orgConfig: organizationCreationAndJoining,
  preferences: PREFERENCES,
  identityProvider: new LocalIdentityProvider({ db, createId, sendCode: sendLoginCode }),
  storage,
  cookie: {
    secure: Env.NODE_ENV === "production" || Env.NODE_ENV === "staging",
  },
  socialProviders: {
    google: !!(Env.GOOGLE_CLIENT_ID && Env.GOOGLE_CLIENT_SECRET),
    apple: !!(Env.APPLE_CLIENT_ID && Env.APPLE_CLIENT_SECRET),
  },
  invitationDelivery,
  hooks: {
    // The inviter hears back when their invitation is accepted. dedupeKey makes
    // the row supersede rather than repeat, so a re-emission for the same
    // invitation leaves one entry in the inbox. The mount guards this callback
    // — a failure here costs a log line, never the accepter's response.
    onInvitationAccepted: async (payload) => {
      await notifications.services.queue.queueInApp({
        template: invitationAcceptedInApp,
        args: {
          accepterName: payload.accepterName ?? "Someone",
          orgName: payload.orgName,
          role: payload.role,
        },
        to: [{ userId: payload.inviterUserId }],
        dedupeKey: `invitation-accepted:${payload.invitationId}`,
      });
    },
  },
  logger: moduleLogger,
  errors: moduleErrors,
});
