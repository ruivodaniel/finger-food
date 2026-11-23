// mount modules (+ features when they exist); inject db + config at mount
// (MOD6). Mounting is not wiring: what a module does WITH another module's
// events is the hook callbacks below — one callback per reaction, guarded by
// the emitting module's mount so a consumer failure never breaks the emitter.
import { createId } from "@paralleldrive/cuid2";
import { PRIVATE, type ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { Author, VersionedEntry } from "@libs/versioning";
import { createConnectionManager, createPush, createRoomManager } from "@libs/realtime/api";
import { createS3Storage } from "@libs/storage";
import { mountChatbotApi } from "@modules/chatbot/api";
import { mountCollaborationApi } from "@modules/collaboration/api";
import { mountCreditsApi } from "@modules/credits/api";
import { mountNotificationsApi } from "@modules/notifications/api";
import { createStripeProvider, mountPaymentApi } from "@modules/payment/api";
import { LocalIdentityProvider, mountUserOrgApi } from "@modules/user-organization-mgmt/api";
import { sendLoginCode } from "@/wiring/identity/send-code";
import { mountVersioningApi } from "@modules/versioning/api";
import { creditsCatalog } from "@configs/credits";
import { paymentCatalog } from "@configs/payment";
import { meteorVersionedEntry, mountImplementationPatternsApi } from "@product/implementation-patterns/api";
import {
  invitationAcceptedInApp,
  messageTypes,
  templates,
} from "@configs/notifications";
import { authenticationAndRegistration } from "@configs/user-organization-mgmt/auth/authentication.config";
import { organizationCreationAndJoining } from "@configs/user-organization-mgmt/auth/org-lifecycle.config";
import { PREFERENCES } from "@configs/product/preferences.config";
import { acEngine, baselineRoles, createGatedDbOver, gatedDb } from "@/access-control";
import { db } from "@/db";
import { Env, stripePriceIds } from "@/env";
import * as AppError from "@/shared/error";
import { logger } from "@/shared/logger";
import { startRun } from "@/wiring/chatbot/orchestrator-client";
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
      ? "https://localhost.localstack.cloud:4566"
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
  unavailable: (message?: string) => new AppError.ServiceUnavailable(message),
  paymentRequired: (message?: string) => new AppError.PaymentRequired(message),
};

/** Each signed-in user's open realtime streams (one per browser tab), served by routes/realtime.ts. */
export const realtimeConnections = createConnectionManager();

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
  createId,
  // Scoped-AC engine + gated-db + baseline roles (assembled in access-control.ts).
  engine: acEngine,
  gatedDb,
  baselineRoles,
  authConfig: authenticationAndRegistration,
  orgConfig: organizationCreationAndJoining,
  preferences: PREFERENCES,
  // No external identity service: the local provider, on the app's own Postgres, signs in by a code sent by email.
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
    // Welcome credits, once per person and once per organization — the
    // credits slice's own index makes a re-emission a no-op. `credits` is
    // mounted below; a hook only runs once every slice is mounted.
    onUserRegistered: async ({ userId }) => {
      await credits.welcome.user(userId);
    },
    onOrganizationCreated: async ({ organizationId }) => {
      await credits.welcome.organization(organizationId);
    },
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

// Vendors, buyers and credit owners are uom's organizations and people: credits
// and payment name them, and find them by name, through uom's own services.
const people = {
  organization: userOrg.services.organization,
  userProfile: userOrg.services.userProfile,
};

export const credits = mountCreditsApi({
  db,
  createId,
  catalog: creditsCatalog,
  engine: acEngine,
  people,
  logger: moduleLogger,
  errors: moduleErrors,
});

// Grants, take-backs and vendor charges go through the credits ledger, in the
// payment's own transaction. Stripe is on when STRIPE_SECRET_KEY is set (env.ts
// then requires the webhook secret); without it the slice answers 503 on the
// Stripe-backed routes.
export const payment = mountPaymentApi({
  db,
  createId,
  catalog: paymentCatalog,
  engine: acEngine,
  credits: credits.services.ledger,
  webAppUrl: Env.WEB_APP_URL,
  provider: Env.STRIPE_SECRET_KEY
    ? createStripeProvider({
        secretKey: Env.STRIPE_SECRET_KEY,
        webhookSecret: Env.STRIPE_WEBHOOK_SECRET as string,
        connectWebhookSecret: Env.STRIPE_CONNECT_WEBHOOK_SECRET,
      })
    : undefined,
  priceIds: stripePriceIds,
  people,
  logger: moduleLogger,
  errors: moduleErrors,
});

// The chatbot starts a run on the orchestrator for each message, and pushes
// each chat's events to its owner's realtime streams.
export const chatbot = mountChatbotApi({
  db,
  createId,
  startRun,
  push: createPush(realtimeConnections),
  logger: moduleLogger,
  errors: {
    ...moduleErrors,
    conflict: (message?: string) => new AppError.Conflict(message),
  },
});

// Versioning: the capsule tables and every route about history, for the entities the app versions. A slice's entry comes
// from its public surface.
export const versioning = mountVersioningApi({
  db,
  versioned: [meteorVersionedEntry],
  // A meteor's history is read and changed by whoever may read and change the meteor: meteors answers.
  access: {
    meteor: async (scopedAc, meteorId, action) => {
      if (!scopedAc) return false;
      // a locked meteor's history isn't changed either: no restore, release, merge, branch or archive
      if (action === "write" && (await collaboration.services.locks.getCurrentLock("meteor", meteorId))) return false;
      return implementationPatterns.services.meteor.canAccess(scopedAc as ScopedAcRequestContext, PRIVATE, meteorId, action);
    },
  },
  // History shows names: the users' profiles are uom's
  authorNamesOf: async (userIds) => {
    const profiles = await Promise.all(userIds.map(async (userId) => [userId, (await userOrg.services.user.getProfile(PRIVATE, userId))?.name] as const));
    return new Map(profiles.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
  },
  createId,
  errors: {
    ...moduleErrors,
    conflict: (message?: string) => new AppError.Conflict(message),
  },
});

/** A gated-db factory whose writes on these entities are versions, for a slice under scoped AC that adopts versioning:
 * each request's gate runs over a db that versions the entities, with the bag's user as the author, and `ungated()`,
 * for the reads no rule covers, reads their current rows and writes nothing. `ungatedAs(userId)` writes versions on
 * behalf of a user with no request behind it: a live document's checkpoint. Here, where scoped AC and versioning meet. */
const versionedGatedDb = (entries: readonly VersionedEntry[]) => {
  const versionedDb = (author?: () => Author) => versioning.versionedDbFor({ entries, author });
  const currentRows = versionedDb();
  return Object.assign(
    (bag: unknown) => createGatedDbOver(versionedDb(() => ({ id: (bag as ScopedAcRequestContext["bag"]).session.user.id, type: "user" })))(bag),
    { ungated: () => currentRows, ungatedAs: (userId: string) => versionedDb(() => ({ id: userId, type: "user" })) },
  );
};

// The implementation patterns, kept as reference: the company's meteors under scoped AC, published
// ones public, and the minesweeper, public and stored nowhere. Mounted inside the client router behind uom's chain. Every
// meteor write is a new version, a locked meteor isn't changed, and creating
// one spends the company's credits.
export const implementationPatterns = mountImplementationPatternsApi({
  createId,
  engine: acEngine,
  gatedDb: versionedGatedDb([meteorVersionedEntry]),
  isLocked: async (meteorId) => Boolean(await collaboration.services.locks.getCurrentLock("meteor", meteorId)),
  credits: credits.metering,
  logger: moduleLogger,
  errors: { ...moduleErrors, conflict: (message?: string) => new AppError.Conflict(message) },
});

// Collaboration: a document live, for the kinds slices plug in with `collaboration.services.collaboration.registerKind`.
// A document's room is joined by the session's user, once per browser tab. When a user's last stream closes, every tab of
// theirs leaves.
export const collaboration = mountCollaborationApi({
  rooms: createRoomManager(realtimeConnections, createPush(realtimeConnections)),
  actorOf: async (actorId) => {
    const profile = await userOrg.services.user.getProfile(PRIVATE, actorId);
    return { name: profile?.name ?? "Someone", image: profile?.image ?? null };
  },
  // Locks are written and read through a gate whose db reads each meteor's current version: the lock rules join a
  // lock to its meteor's identity.
  engine: acEngine,
  gatedDb: versionedGatedDb([meteorVersionedEntry]),
  createId,
  errors: {
    ...moduleErrors,
    conflict: (message?: string) => new AppError.Conflict(message),
    unprocessable: (message?: string) => new AppError.UnprocessableEntity(message),
  },
});
realtimeConnections.onUserDisconnected((userId) => collaboration.services.collaboration.dropActor(userId));
// A meteor is edited live and can be locked: meteors describes it, collaboration runs it.
collaboration.services.collaboration.registerKind(implementationPatterns.live);
