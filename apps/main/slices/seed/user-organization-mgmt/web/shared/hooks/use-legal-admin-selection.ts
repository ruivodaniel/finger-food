import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { LegalAdminSelection } from "../helpers/legal-admin-selection";
import { legalDocumentsService } from "../../services/application/legal-documents.service";

/**
 * The legal authoring catalog and the selection the URL names, validated against
 * it (absent or unknown = none). The layout's left panel and the page both read
 * it; the catalog query is shared through the cache.
 */
export function useLegalAdminSelection(type?: string, scope?: string) {
  const { data: catalog, error: catalogError } = useQuery({
    ...legalDocumentsService.getCatalog(),
  });
  const selection: LegalAdminSelection | null = React.useMemo(() => {
    if (!catalog || !type || !scope) return null;
    const orgTypeId = scope === "platform" ? null : scope;
    const group = catalog.find((g) => g.orgTypeId === orgTypeId && g.types.includes(type));
    return group ? { type, orgTypeId } : null;
  }, [catalog, type, scope]);
  return { catalog, catalogError, selection };
}
