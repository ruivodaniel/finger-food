/** Legal documents: reading the current or one version, and authoring (drafts, publishing). */

import { queryOptions } from "@tanstack/react-query";
import { legalAdminApi } from "../api/legal-admin.api";
import { legalApi } from "../api/legal.api";

const keys = {
  legalDocument: (type: string, orgTypeId?: string | null) => ["uom", "legal-document", type, orgTypeId ?? null] as const,
  legalDocumentById: (id: string) => ["uom", "legal-document-by-id", id] as const,
  legalCatalog: ["uom", "legal-catalog"] as const,
  legalVersions: (type: string, orgTypeId: string | null) => ["uom", "legal-versions", type, orgTypeId] as const,
};

export const legalDocumentsService = {
  keys,
  getLatestVersion: (type: string, orgTypeId?: string | null) =>
    queryOptions({
      queryKey: keys.legalDocument(type, orgTypeId),
      queryFn: () => legalApi.getCurrentLegalDocument(type, orgTypeId ?? undefined),
    }),
  getDocument: (id: string) => queryOptions({ queryKey: keys.legalDocumentById(id), queryFn: () => legalApi.getLegalDocument(id) }),
  getCatalog: () => queryOptions({ queryKey: keys.legalCatalog, queryFn: () => legalAdminApi.getLegalAuthoringCatalog() }),
  getVersions: (type: string, orgTypeId: string | null) =>
    queryOptions({
      queryKey: keys.legalVersions(type, orgTypeId),
      queryFn: () => legalAdminApi.listLegalDocumentVersions(type, orgTypeId),
    }),
  saveDraft: legalAdminApi.saveLegalDraft,
  publishDraft: legalAdminApi.publishLegalDocument,
};
