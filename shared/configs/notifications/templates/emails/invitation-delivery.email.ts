/**
 * The invitation itself, by email.
 *
 * Rendered off-queue: an invitee has no account yet, so there is no user id to
 * key a delivery row or a preference on. Wiring renders this with the shared
 * helpers and hands the result straight to the transport — the copy still
 * lives here, with the rest of the product's messages.
 */

import { defineEmailTemplate } from "@modules/notifications/shared";

export const invitationDeliveryEmail = defineEmailTemplate({
  name: "invitation_delivery",
  type: "system",
  args: {
    organizationName: "string",
    orgTypeLabel: "string",
    acceptUrl: "string",
  },
  subject: "You're invited to {{organizationName}}",
  text:
    "You've been invited to join {{organizationName}} ({{orgTypeLabel}}).\n\n" +
    "Accept the invitation: {{acceptUrl}}",
  html:
    "<p>You've been invited to join <strong>{{organizationName}}</strong> " +
    "({{orgTypeLabel}}).</p>" +
    '<p><a href="{{acceptUrl}}">Accept the invitation</a></p>',
});
