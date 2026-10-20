/**
 * LegalDocumentViewerPage — public read of a legal document: the current
 * published version of a type (optionally org-type-scoped) or one immutable
 * version by id. The stored HTML is sanitized at write time — it is the
 * render source of record. Drafts 404 server-side and land on the empty
 * state.
 *
 * A heading block (title over the quiet version · published line), then the
 * document in a Card — its blocks a type--body column with a paragraph gap.
 * Nothing published is an EmptyState. No inline styles.
 */

import * as React from "react";
import { Card, CardContent } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { queryKeys } from "../../lib/query-keys";
import { EmptyState } from "../../components/EmptyState";

export interface LegalDocumentViewerPageProps {
  /** Consent type (e.g. termsAndConditions) — current published version. */
  type?: string;
  /** Narrow the type lookup to an org type's document. */
  orgTypeId?: string;
  /** A specific version by id — wins over type. */
  documentId?: string;
}

export function LegalDocumentViewerPage({
  type,
  orgTypeId,
  documentId,
}: LegalDocumentViewerPageProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();

  const { data: doc, isLoading } = useQuery({
    queryKey: documentId
      ? queryKeys.legalDocumentById(documentId)
      : queryKeys.legalDocument(type ?? "", orgTypeId ?? null),
    queryFn: () =>
      documentId
        ? client.getLegalDocument(documentId)
        : client.getCurrentLegalDocument(type ?? "", orgTypeId),
    enabled: !!(documentId || type),
    retry: false, // nothing published → 404 → empty state
  });

  return (
    <Stack dir="col" gap={24} data-testid="legal-document-page" className="w-full max-w-3xl">
      {isLoading ? (
        <span element="type--body-small" emphasis="quiet">
          Loading…
        </span>
      ) : doc ? (
        <>
          <Stack dir="col" gap={6}>
            <h1 element="type--heading2">{doc.title}</h1>
            <span element="type--body-small" emphasis="quiet">
              Version {doc.version}
              {doc.publishedAt
                ? ` — published ${new Date(doc.publishedAt).toLocaleDateString()}`
                : ""}
            </span>
          </Stack>
          <Card position="fill">
            <CardContent>
              <Stack
                dir="col"
                gap={12}
                element="type--body"
                data-testid="legal-document-content"
                dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          kind="nothing-yet"
          testId="legal-document-empty"
          icon="fileText"
          title="Nothing here yet"
          description="This document hasn't been published."
        />
      )}
    </Stack>
  );
}
