/** The caller's consents: what they still owe, what they decided, recording a decision. */

import { queryOptions } from "@tanstack/react-query";
import { legalApi } from "../api/legal.api";

const keys = {
  pendingConsents: ["uom", "pending-consents"] as const,
  consentHistory: ["uom", "consent-history"] as const,
};

export const consentsService = {
  keys,
  getPendingConsents: () => queryOptions({ queryKey: keys.pendingConsents, queryFn: () => legalApi.getPendingConsents() }),
  getConsentHistory: () => queryOptions({ queryKey: keys.consentHistory, queryFn: () => legalApi.getConsentHistory() }),
  recordConsent: legalApi.submitConsent,
};
