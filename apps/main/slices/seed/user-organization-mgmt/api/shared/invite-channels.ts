import type { AuthAndRegistrationConfig } from "../../shared/auth-config/types";
import { resolveIdentifiers } from "../../shared/auth-config/resolver";

const INVITE_CHANNELS = ["email", "phone"] as const;
export type InviteChannel = (typeof INVITE_CHANNELS)[number];

export function inviteChannelsFor(
  authConfig: AuthAndRegistrationConfig,
  orgType: string,
): InviteChannel[] {
  const allowed = resolveIdentifiers(authConfig, {
    orgAction: "join",
    membershipOrgType: orgType,
  });
  return INVITE_CHANNELS.filter((channel) => allowed.includes(channel));
}