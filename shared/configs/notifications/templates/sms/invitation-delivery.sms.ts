/**
 * The invitation itself, by SMS — the same off-queue transactional send as the
 * email version. One line, so it names the organization and nothing else.
 */

import { defineSmsTemplate } from "@modules/notifications/shared";

export const invitationDeliverySms = defineSmsTemplate({
  name: "invitation_delivery",
  type: "system",
  args: { organizationName: "string", acceptUrl: "string" },
  body: "You're invited to {{organizationName}}: {{acceptUrl}}",
});
