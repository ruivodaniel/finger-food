/**
 * The inviter hears back when their invitation is accepted.
 *
 * Acceptance is the clean moment for a notification: it guarantees the
 * accepter has an account, so the message is addressed to a user rather than
 * to an address.
 */

import { defineInAppTemplate } from "@modules/notifications/shared";

export const invitationAcceptedInApp = defineInAppTemplate({
  name: "invitation_accepted",
  type: "organization",
  args: { accepterName: "string", orgName: "string", role: "string" },
  title: "Invitation accepted",
  body: "{{accepterName}} accepted your invitation to join {{orgName}} as {{role}}.",
});
