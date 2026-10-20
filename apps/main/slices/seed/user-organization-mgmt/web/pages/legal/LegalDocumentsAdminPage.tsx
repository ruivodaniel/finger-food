/**
 * LegalDocumentsAdminPage — the authoring surface: the catalog (Platform +
 * org types) as a settings-style left sidebar, a draft/publish editor for
 * the selected scope, and the scope's version history. Selection lives in
 * the URL as path params (`/:documentType/:orgTypeKey`, where the type is its
 * sitemap slug and the key is "platform" or an org type id); the bare index
 * opens with nothing selected.
 *
 * The catalog sidebar and the title band are the legal admin layout's (the hosting
 * app puts LegalAdminNav in its left slot); the page is the editor and the history.
 *
 * AC(availability-check): legal_document.* — the page renders for any
 * signed-in user until availability-check narrows visibility from the
 * engine's rules; the server enforces.
 */

import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { useLegalAdminSelection } from "../../hooks/use-legal-admin-selection";
import { LegalDocumentEditor } from "../../components/legal/LegalDocumentEditor";
import { LegalVersionList } from "../../components/legal/LegalVersionList";
import { EmptyState } from "../../components/EmptyState";
import { StatusAlert } from "../../components/StatusAlert";

export interface LegalDocumentsAdminPageProps {
  /** Selected document type (path param, already slug-resolved). */
  type?: string;
  /** Selected scope: "platform" or an org type id (path param). */
  scope?: string;
}

export function LegalDocumentsAdminPage({
  type,
  scope,
}: LegalDocumentsAdminPageProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();
  const { catalogError, selection } = useLegalAdminSelection(type, scope);
  const { data: versions } = useQuery({
    queryKey: selection
      ? queryKeys.legalVersions(selection.type, selection.orgTypeId)
      : ["uom", "legal-versions", "none"],
    queryFn: () =>
      client.listLegalDocumentVersions(selection!.type, selection!.orgTypeId),
    enabled: !!selection,
  });

  return (
    <Stack
      dir="col"
      gap={24}
      data-testid="legal-admin-page"
      className="w-full max-w-3xl"
    >
      {selection ? (
        <>
          <LegalDocumentEditor
            key={`${selection.type}:${selection.orgTypeId ?? "platform"}`}
            selection={selection}
          />
          <LegalVersionList versions={versions ?? []} />
        </>
      ) : catalogError ? (
        // A denied verdict is not an empty catalog — say what the
        // server said (e.g. "cannot author legal documents").
        <StatusAlert status="error" testId="legal-admin-error">
          {catalogError instanceof ApiError ? catalogError.message : "something went wrong"}
        </StatusAlert>
      ) : (
        <EmptyState
          kind="nothing-yet"
          testId="legal-admin-empty"
          icon="fileText"
          title="Select a document"
          description="Pick a document from the list on the left to view or edit it."
        />
      )}
    </Stack>
  );
}
