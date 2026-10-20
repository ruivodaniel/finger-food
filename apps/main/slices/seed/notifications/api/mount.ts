/**
 * mountNotificationsApi — the module's single assembly point.
 *
 * Builds the catalog (validating the product's templates and message types
 * loudly, at boot), the repositories, the services, and the router from the
 * app's inputs. The app mounts what it receives; nothing in here reaches for
 * app internals.
 */

import { Hono } from "hono";

import { DrizzleNotificationRepository } from "./repositories/notification.repository";
import { DrizzleDeliveryRepository } from "./repositories/delivery.repository";
import { DrizzlePreferenceRepository } from "./repositories/preference.repository";
import { DeliveryService, createInlineDeliveryOutbox } from "./services/delivery.service";
import { DeliveryEventsService } from "./services/delivery-events.service";
import { InboxService } from "./services/inbox.service";
import { PreferenceService } from "./services/preference.service";
import { QueueService } from "./services/queue.service";
import { createInboxRouter } from "./routes/create-inbox-router";
import { createPreferencesRouter } from "./routes/create-preferences-router";
import { createTemplateCatalog } from "./shared/template-catalog";
import type { RunInTransaction } from "./shared/executor";
import type {
  MountNotificationsApiOptions,
  MountNotificationsApiResult,
} from "./mount-types";
import type { NotificationsEnv } from "./types";

export function mountNotificationsApi(
  options: MountNotificationsApiOptions,
): MountNotificationsApiResult {
  const catalog = createTemplateCatalog({
    templates: options.templates,
    messageTypes: options.messageTypes,
    errors: options.errors,
  });

  const notificationRepo = new DrizzleNotificationRepository({
    db: options.db,
    createId: options.createId,
  });
  const deliveryRepo = new DrizzleDeliveryRepository({ db: options.db });
  const preferenceRepo = new DrizzlePreferenceRepository({
    db: options.db,
    createId: options.createId,
  });

  // Services never see the db handle — only the ability to open a write
  // context around the repositories that do.
  const runInTransaction: RunInTransaction = (run) =>
    options.db.transaction((tx) => run(tx));

  const preferenceService = new PreferenceService({
    preferenceRepo,
    catalog,
    errors: options.errors,
  });
  const deliveryService = new DeliveryService({
    deliveryRepo,
    preferences: preferenceService,
    catalog,
    transports: options.transports,
    logger: options.logger,
  });
  const queueService = new QueueService({
    notificationRepo,
    deliveryRepo,
    preferences: preferenceService,
    catalog,
    deliveryOutbox:
      options.deliveryOutbox ??
      createInlineDeliveryOutbox({ delivery: deliveryService }),
    runInTransaction,
    createId: options.createId,
    errors: options.errors,
    logger: options.logger,
  });
  const inboxService = new InboxService({
    deliveryRepo,
    catalog,
    errors: options.errors,
    logger: options.logger,
  });
  const deliveryEventsService = new DeliveryEventsService({ deliveryRepo });

  const router = new Hono<NotificationsEnv>()
    .route("/", createInboxRouter({ inboxService, errors: options.errors }))
    .route(
      "/",
      createPreferencesRouter({ preferenceService, errors: options.errors }),
    );

  return {
    router,
    services: {
      queue: queueService,
      delivery: deliveryService,
      inbox: inboxService,
      preferences: preferenceService,
      deliveryEvents: deliveryEventsService,
    },
  };
}
