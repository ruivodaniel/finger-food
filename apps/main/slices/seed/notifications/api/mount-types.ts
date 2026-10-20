/**
 * Mount types — the options an app supplies and the surface it receives.
 */

import type { Hono } from "hono";

import type { MessageTypeRegistry } from "../shared/message-types";
import type { AnyTemplateRef } from "../shared/templates";
import type { DeliveryOutbox, NotificationTransports } from "../shared/types";
import type { DeliveryService } from "./services/delivery.service";
import type { DeliveryEventsService } from "./services/delivery-events.service";
import type { InboxService } from "./services/inbox.service";
import type { PreferenceService } from "./services/preference.service";
import type { QueueService } from "./services/queue.service";
import type { NotificationsDb } from "./shared/executor";
import type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
import type { NotificationsEnv } from "./types";

export interface MountNotificationsApiOptions {
  /** Drizzle database instance (the app's — module tables flow in via ./models). */
  db: NotificationsDb;

  /** Id factory for domain rows (cuid2 in the seed). */
  createId: () => string;

  /** The product's copy. Validated at mount — a bad catalog fails boot. */
  templates: readonly AnyTemplateRef[];

  /** The product's message-type registry (`userPref` per type). */
  messageTypes: MessageTypeRegistry;

  /** Email/SMS drivers — build them from the module's transport factories. */
  transports: NotificationTransports;

  /**
   * Durability seam for email/SMS. Omit and deliveries run inline right after
   * the queue's transaction commits — right for tests and for products with no
   * worker; the seed wires the workflow-intent outbox here.
   */
  deliveryOutbox?: DeliveryOutbox;

  errors: ModuleErrors;
  logger: ModuleLogger;
}

export interface MountNotificationsApiResult {
  /** Inbox + preferences — mount inside the app's authenticated client router. */
  router: Hono<NotificationsEnv>;

  /** Server-side handles for non-HTTP callers (wiring, hooks, the worker). */
  services: {
    queue: QueueService;
    delivery: DeliveryService;
    inbox: InboxService;
    preferences: PreferenceService;
    deliveryEvents: DeliveryEventsService;
  };
}
