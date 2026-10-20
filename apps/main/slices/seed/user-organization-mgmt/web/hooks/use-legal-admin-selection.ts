import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";
import { queryKeys } from "../lib/query-keys";
import type { LegalAdminSelection } from "../components/legal/legal-admin-selection";

/**
 * The legal authoring catalog and the selection the URL names, validated against
 * it (absent or unknown = none). The layout's left panel and the page both read
 * it; the catalog query is shared through the cache.
 */
export function useLegalAdminSelection(type?: string, scope?: string) {
  const { client } = useUserOrgMgmtContext();
  const { data: catalog, error: catalogError } = useQuery({
    queryKey: queryKeys.legalCatalog,
    queryFn: () => client.getLegalAuthoringCatalog(),
  });
  const selection: LegalAdminSelection | null = React.useMemo(() => {
    if (!catalog || !type || !scope) return null;
    const orgTypeId = scope === "platform" ? null : scope;
    const group = catalog.find((g) => g.orgTypeId === orgTypeId && g.types.includes(type));
    return group ? { type, orgTypeId } : null;
  }, [catalog, type, scope]);
  return { catalog, catalogError, selection };
}
