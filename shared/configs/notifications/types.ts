/**
 * Message types — what a notification IS, and whether users may silence it.
 * Validated on import, so a misconfig fails at load.
 */

import { defineMessageTypes } from "@modules/notifications/shared";

export const messageTypes = defineMessageTypes({
  /** Security and account lifecycle — arrives whatever the user prefers. */
  system: { userPref: false },
  /** Organization life: invitations, membership, roles. Silenceable. */
  organization: { userPref: true },
});
