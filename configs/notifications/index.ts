/**
 * Notifications — Definitions
 *
 * The product's message-type registry and every message it can send. The
 * catalog validates on import, so a placeholder without an arg (or an arg no
 * body uses, or a type that isn't registered) fails at load — dev, CI, and
 * boot alike.
 *
 * `flows/` arrives with the flow DSL; until then app wiring pairs a module
 * hook with a queue call directly.
 */

import {
  validateMessageTypes,
  validateTemplates,
  type AnyTemplateRef,
} from "@modules/notifications/shared";

import { messageTypes } from "./types";
import { invitationAcceptedInApp } from "./templates/inapps/invitation-accepted.inapp";
import { invitationDeliveryEmail } from "./templates/emails/invitation-delivery.email";
import { invitationDeliverySms } from "./templates/sms/invitation-delivery.sms";

/** What the module mounts. Individual refs stay exported for typed callers. */
export const templates: AnyTemplateRef[] = [
  invitationAcceptedInApp,
  invitationDeliveryEmail,
  invitationDeliverySms,
];

validateMessageTypes(messageTypes);
validateTemplates(templates, messageTypes);

export { messageTypes };
export { invitationAcceptedInApp };
export { invitationDeliveryEmail };
export { invitationDeliverySms };
