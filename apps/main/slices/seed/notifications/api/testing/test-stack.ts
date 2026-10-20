/**
 * The module's service graph over in-memory repositories — what `mount.ts`
 * assembles, minus the database. Tests reach for this instead of rebuilding
 * five constructors each time.
 */

import type { DeliveryOutbox } from "../../shared/types";
import type { ModuleLogger } from "../shared/module-errors";
import { DeliveryService, createInlineDeliveryOutbox } from "../services/delivery.service";
import { DeliveryEventsService } from "../services/delivery-events.service";
import { InboxService } from "../services/inbox.service";
import { PreferenceService } from "../services/preference.service";
import { QueueService } from "../services/queue.service";
import { createTemplateCatalog } from "../shared/template-catalog";
import {
  InMemoryDeliveryRepository,
  InMemoryNotificationRepository,
  InMemoryPreferenceRepository,
  nextId,
  runInFakeTransaction,
  testErrors,
  testLogger,
} from "./in-memory-repos";
import { createFakeEmailTransport, createFakeSmsTransport } from "./fake-transports";
import { testMessageTypes, testTemplates } from "./test-catalog";

export interface MakeNotificationsStackOptions {
  /** Omit for the inline outbox — delivery runs right after the fake commit. */
  deliveryOutbox?: DeliveryOutbox;
  /** Override to assert on what the module logged. */
  logger?: ModuleLogger;
}

export function makeNotificationsStack(
  options: MakeNotificationsStackOptions = {},
) {
  const logger = options.logger ?? testLogger;
  const notificationRepo = new InMemoryNotificationRepository();
  const deliveryRepo = new InMemoryDeliveryRepository();
  deliveryRepo.notifications = notificationRepo;
  const preferenceRepo = new InMemoryPreferenceRepository();

  const catalog = createTemplateCatalog({
    templates: testTemplates,
    messageTypes: testMessageTypes,
    errors: testErrors,
  });

  const email = createFakeEmailTransport();
  const sms = createFakeSmsTransport();

  const preferences = new PreferenceService({
    preferenceRepo,
    catalog,
    errors: testErrors,
  });
  const delivery = new DeliveryService({
    deliveryRepo,
    preferences,
    catalog,
    transports: { email, sms },
    logger,
  });
  const deliveryOutbox =
    options.deliveryOutbox ?? createInlineDeliveryOutbox({ delivery });
  const queue = new QueueService({
    notificationRepo,
    deliveryRepo,
    preferences,
    catalog,
    deliveryOutbox,
    runInTransaction: runInFakeTransaction,
    createId: () => nextId("delivery"),
    errors: testErrors,
    logger,
  });
  const inbox = new InboxService({
    deliveryRepo,
    catalog,
    errors: testErrors,
    logger,
  });
  const deliveryEvents = new DeliveryEventsService({ deliveryRepo });

  return {
    notificationRepo,
    deliveryRepo,
    preferenceRepo,
    catalog,
    email,
    sms,
    queue,
    delivery,
    inbox,
    preferences,
    deliveryEvents,
  };
}
