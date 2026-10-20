/**
 * The public OrganizationView projection — the one place org rows become the
 * client-facing shape. Shared because both the organization service and the
 * membership service (its `/me/memberships` read) compose it (PRC6).
 */

import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";
import type { OrganizationView } from "../../shared/types/domain";
import type { UomOrganizationSelect } from "../models/organization.model";
import { inviteChannelsFor } from "./invite-channels";
import { orgTypeLabel } from "./org-lifecycle";

export function toOrganizationView(
  org: UomOrganizationSelect,
  orgConfig: OrgLifecycleEntry[],
  authConfig: AuthAndRegistrationConfig,
): OrganizationView {
  return {
    id: org.id,
    type: org.type,
    typeLabel: orgTypeLabel(orgConfig, org.type),
    name: org.name,
    logo: org.logo,
    inviteChannels: inviteChannelsFor(authConfig, org.type),
  };
}
