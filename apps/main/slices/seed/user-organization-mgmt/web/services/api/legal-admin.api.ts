import type { LegalDocumentView } from "../../../shared/types/domain";
import { clientUrl, post, request } from "./http";

export const legalAdminApi = {
  getLegalAuthoringCatalog: (): Promise<Array<{ orgTypeId: string | null; label: string; types: string[] }>> =>
    request(clientUrl("/legal-admin/catalog")),
  listLegalDocumentVersions: (type: string, orgTypeId: string | null): Promise<LegalDocumentView[]> =>
    request(
      clientUrl(`/legal-admin/documents?type=${type}${orgTypeId ? `&orgTypeId=${encodeURIComponent(orgTypeId)}` : ""}`),
    ),
  saveLegalDraft: (body: {
    type: string;
    orgTypeId: string | null;
    title: string;
    contentHtml: string;
  }): Promise<LegalDocumentView> =>
    request(clientUrl("/legal-admin/documents/draft"), { method: "PUT", body: JSON.stringify(body) }),
  publishLegalDocument: (id: string): Promise<LegalDocumentView> =>
    post(clientUrl(`/legal-admin/documents/${encodeURIComponent(id)}/publish`)),
};
