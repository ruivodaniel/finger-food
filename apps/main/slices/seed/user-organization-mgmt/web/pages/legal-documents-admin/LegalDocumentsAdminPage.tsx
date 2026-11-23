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
 * Not gated: the page renders for any signed-in user and shows what the
 * server returns. The catalog is config, the same for everyone; the versions
 * are the rows the caller's grants can read, and saving or publishing is
 * refused (an error under the editor) for a caller who can't author.
 */

import { Alert, AlertDescription, EmptyState, Icon } from "@libs/web-components";
import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useLegalAdminSelection } from "../../shared/hooks/use-legal-admin-selection";
import { LegalDocumentEditor } from "./components/LegalDocumentEditor";
import { LegalVersionList } from "./components/LegalVersionList";
import { legalDocumentsService } from "../../services/application/legal-documents.service";
import { isApiError } from "../../shared/helpers/api-error";

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
  const { catalogError, selection } = useLegalAdminSelection(type, scope);
  const { data: versions } = useQuery({
    ...legalDocumentsService.getVersions(selection?.type ?? "", selection?.orgTypeId ?? null),
    enabled: !!selection,
  });

  return (
    <Stack
      dir="col" scale="xl"
      data-testid="legal-admin-page"
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
        // A failed request is not an empty catalog — say what the
        // server said.
        <Alert status="error" data-testid="legal-admin-error"><AlertDescription>
          {isApiError(catalogError) ? catalogError.message : "something went wrong"}
        </AlertDescription></Alert>
      ) : (
        <EmptyState emphasis="quiet"
          data-testid="legal-admin-empty"
          icon={<Icon name="fileText" />}
          title="Select a document"
          description="Pick a document from the list on the left to view or edit it."
        />
      )}
    </Stack>
  );
}
