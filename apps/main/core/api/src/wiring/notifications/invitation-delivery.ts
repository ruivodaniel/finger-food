/**
 * Invitation delivery — the uom module's outbound transport, off the queue.
 *
 * An invitee may not have an account yet, and `Recipient.userId` is required by
 * design, so there is no delivery row to key or preference to honour: wiring
 * renders the copy and hands it straight to a transport. The copy still lives
 * with every other message in `configs/notifications/`, and the module still
 * knows nothing about web paths — the accept URL is composed here.
 */

import { invitationDeliveryEmail, invitationDeliverySms } from "@configs/notifications";
import {
  renderEmailTemplate,
  renderSmsTemplate,
} from "@modules/notifications/shared";
import type { InvitationDelivery } from "@modules/user-organization-mgmt/api";
import { Env } from "@/env";
import {
  sendTransactionalEmail,
  sendTransactionalSms,
} from "./transports";

/** Where web-main renders the invitation-accept page (capability URL). */
const acceptUrl = (invitationId: string) =>
  `${Env.WEB_APP_URL}/accept-invitation?id=${encodeURIComponent(invitationId)}`;

export const invitationDelivery: InvitationDelivery = {
  sendEmail: (to, invitation) =>
    sendTransactionalEmail(
      {
        to,
        ...renderEmailTemplate(invitationDeliveryEmail, {
          organizationName: invitation.organizationName,
          orgTypeLabel: invitation.orgTypeLabel,
          acceptUrl: acceptUrl(invitation.invitationId),
        }),
      },
      "invitation",
    ),

  sendSms: (to, invitation) =>
    sendTransactionalSms({
      to,
      label: "invitation",
      ...renderSmsTemplate(invitationDeliverySms, {
        organizationName: invitation.organizationName,
        acceptUrl: acceptUrl(invitation.invitationId),
      }),
    }),
};
