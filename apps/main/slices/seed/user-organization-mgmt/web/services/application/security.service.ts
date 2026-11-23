/** Two-factor authentication and sessions: enroll, confirm, step up, turn off. */

import { queryOptions } from "@tanstack/react-query";
import { securityApi } from "../api/security.api";

const keys = {
  security: ["uom", "security"] as const,
};

export const securityService = {
  keys,
  getStatus: () => queryOptions({ queryKey: keys.security, queryFn: () => securityApi.getSecurityStatus() }),
  startTotp: securityApi.enrollTotp,
  confirmTotp: securityApi.confirmTotp,
  disableTotp: securityApi.disableTotp,
  regenerateBackupCodes: securityApi.regenerateBackupCodes,
  stepUp: securityApi.securityStepUp,
  signOutOtherSessions: securityApi.revokeOtherSessions,
};
