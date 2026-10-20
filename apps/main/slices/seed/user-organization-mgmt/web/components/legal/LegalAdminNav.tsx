/**
 * LegalAdminNav — the legal authoring catalog as the layout's left panel. The URL
 * names the selection (`/:documentType/:orgTypeKey`, the type as its sitemap slug);
 * this renders it and navigates under `basePath` when one is picked. The hosting app
 * puts it in the left slot of the legal admin layout; the page renders no region tree.
 */
import * as React from "react";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useLegalAdminSelection } from "../../hooks/use-legal-admin-selection";
import { legalSlugToType, legalTypeToSlug } from "../../lib/legal-doc-paths";
import { LegalAdminSidebar } from "./LegalAdminSidebar";
import type { LegalAdminSelection } from "./legal-admin-selection";

export interface LegalAdminNavProps {
  /** The URL's document type, as its slug. */
  documentType?: string;
  /** The URL's scope: "platform" or an org type id. */
  orgTypeKey?: string;
  basePath?: string;
}

export function LegalAdminNav({
  documentType,
  orgTypeKey,
  basePath = "/manage-legal-documents",
}: LegalAdminNavProps): React.ReactElement {
  const { router } = useUserOrgMgmtContext();
  const type = legalSlugToType(documentType) ?? documentType;
  const { catalog, selection } = useLegalAdminSelection(type, orgTypeKey);
  const select = (next: LegalAdminSelection) =>
    void router?.navigate({
      to: `${basePath}/${legalTypeToSlug(next.type)}/${next.orgTypeId ?? "platform"}`,
    });
  return <LegalAdminSidebar catalog={catalog ?? []} selection={selection} onSelect={select} />;
}
