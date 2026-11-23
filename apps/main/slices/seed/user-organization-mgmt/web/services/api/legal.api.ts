import type { ConsentRecordView, LegalDocumentView, PendingConsentGroupView } from "../../../shared/types/domain";
import { clientUrl, post, request } from "./http";

export const legalApi = {
  getCurrentLegalDocument: (type: string, orgTypeId?: string): Promise<LegalDocumentView> =>
    request(
      clientUrl(`/legal/documents/current?type=${type}${orgTypeId ? `&orgTypeId=${encodeURIComponent(orgTypeId)}` : ""}`),
    ),
  getLegalDocument: (id: string): Promise<LegalDocumentView> =>
    request(clientUrl(`/legal/documents/${encodeURIComponent(id)}`)),
  getPendingConsents: (): Promise<PendingConsentGroupView[]> => request(clientUrl("/legal/consent/pending")),
  getConsentHistory: (): Promise<ConsentRecordView[]> => request(clientUrl("/legal/consent/history")),
  submitConsent: (body: {
    orgTypeId: string | null;
    decisions: Array<{ type: string; accepted: boolean }>;
  }): Promise<void> => post(clientUrl("/legal/consent"), body).then(() => undefined),
};
