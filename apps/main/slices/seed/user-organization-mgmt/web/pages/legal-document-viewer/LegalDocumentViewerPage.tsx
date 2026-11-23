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
import { Card, Content, EmptyState, Icon, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { legalDocumentsService } from "../../services/application/legal-documents.service";

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

  // nothing published → 404 → empty state, so neither read retries
  const byId = useQuery({
    ...legalDocumentsService.getDocument(documentId ?? ""),
    enabled: !!documentId,
    retry: false,
  });
  const latest = useQuery({
    ...legalDocumentsService.getLatestVersion(type ?? "", orgTypeId ?? null),
    enabled: !documentId && !!type,
    retry: false,
  });
  const { data: doc, isLoading } = documentId ? byId : latest;

  return (
    <Stack dir="col" scale="xl" data-testid="legal-document-page">
      {isLoading ? (
        <Text type="body-small" emphasis="quiet">
          Loading…
        </Text>
      ) : doc ? (
        <>
          <Stack dir="col" scale="xs">
            <Text as="h1" type="heading2">{doc.title}</Text>
            <Text type="body-small" emphasis="quiet">
              Version {doc.version}
              {doc.publishedAt
                ? ` — published ${new Date(doc.publishedAt).toLocaleDateString()}`
                : ""}
            </Text>
          </Stack>
          <Card position="fill">
            <Content>
              <Text
                type="body"
                data-testid="legal-document-content"
                dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
              />
            </Content>
          </Card>
        </>
      ) : (
        <EmptyState emphasis="quiet"
          data-testid="legal-document-empty"
          icon={<Icon name="fileText" />}
          title="Nothing here yet"
          description="This document hasn't been published."
        />
      )}
    </Stack>
  );
}
