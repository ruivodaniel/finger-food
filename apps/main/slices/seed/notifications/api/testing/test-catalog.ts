/**
 * A fixture catalog — the shapes a product's `configs/notifications/` would
 * ship, kept independent of it so module tests never depend on the seed's copy.
 */

import {
  defineEmailTemplate,
  defineInAppTemplate,
  defineMessageTypes,
  defineSmsTemplate,
  type AnyTemplateRef,
} from "../../shared";

export const testMessageTypes = defineMessageTypes({
  /** Not negotiable — arrives whatever the recipient prefers. */
  system: { userPref: false },
  /** Silenceable per channel from the settings screen. */
  organization: { userPref: true },
});

export const inviteAcceptedInApp = defineInAppTemplate({
  name: "invitation_accepted",
  type: "organization",
  args: { accepterName: "string", orgName: "string" },
  title: "Invitation accepted",
  body: "{{accepterName}} joined {{orgName}}.",
});

export const memberJoinedEmail = defineEmailTemplate({
  name: "member_joined",
  type: "organization",
  args: { accepterName: "string", orgName: "string" },
  subject: "{{accepterName}} joined {{orgName}}",
  text: "{{accepterName}} joined {{orgName}}.",
  html: "<p>{{accepterName}} joined {{orgName}}.</p>",
});

export const securityAlertSms = defineSmsTemplate({
  name: "security_alert",
  type: "system",
  args: { orgName: "string" },
  body: "Security alert for {{orgName}}.",
});

export const testTemplates: AnyTemplateRef[] = [
  inviteAcceptedInApp,
  memberJoinedEmail,
  securityAlertSms,
];
