/**
 * LegalDocumentEditor — draft/publish authoring for one (type, scope):
 * title + rich text, "Save draft" upserts the scope's single draft,
 * "Publish v{n}" makes it current — which re-gates every consent-bound
 * caller, so the preview is the last look before that happens.
 *
 * A Card: the header names the document (its type) with the published /
 * draft version Badges and the status line; the content is the fields; the
 * footer holds the actions. Errors as an Alert; the preview a second Card.
 */

import * as React from "react";
import { Badge, Button, Card, Content, Footer, Header, Input, Label, Alert, AlertDescription, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { RichTextEditor } from "@libs/rich-text-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LegalDocumentView } from "../../../../shared/types/domain";
import { documentTypeLabel } from "../../../shared/components/LegalAdminSidebar";
import type { LegalAdminSelection } from "../../../shared/helpers/legal-admin-selection";
import { onboardingService } from "../../../services/application/onboarding.service";
import { legalDocumentsService } from "../../../services/application/legal-documents.service";
import { isApiError } from "../../../shared/helpers/api-error";

export interface LegalDocumentEditorProps {
  selection: LegalAdminSelection;
}

export function LegalDocumentEditor({
  selection,
}: LegalDocumentEditorProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { type, orgTypeId } = selection;

  const { data: versions, isLoading } = useQuery({
    ...legalDocumentsService.getVersions(type, orgTypeId),
  });

  const draft = versions?.find((v) => v.publishedAt === null) ?? null;
  const published = versions?.find((v) => v.publishedAt !== null) ?? null;
  // The editor starts from the draft, else the published text (editing it
  // opens the next version), else empty.
  const base = draft ?? published;

  const [title, setTitle] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setTitle(base?.title ?? "");
    setContentHtml(base?.contentHtml ?? "");
    setError(null);
    // re-seed when the scope or the loaded base document changes
  }, [type, orgTypeId, base?.id]);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: legalDocumentsService.keys.legalVersions(type, orgTypeId),
      }),
      queryClient.invalidateQueries({
        queryKey: legalDocumentsService.keys.legalDocument(type, orgTypeId),
      }),
      queryClient.invalidateQueries({ queryKey: onboardingService.keys.gate }),
    ]);

  const save = useMutation({
    mutationFn: () => legalDocumentsService.saveDraft({ type, orgTypeId, title, contentHtml }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (e) =>
      setError(isApiError(e) ? e.message : "something went wrong"),
  });

  const publish = useMutation({
    mutationFn: (doc: LegalDocumentView) => legalDocumentsService.publishDraft(doc.id),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (e) =>
      setError(isApiError(e) ? e.message : "something went wrong"),
  });

  if (isLoading) {
    return (
      <Text type="body-small" emphasis="quiet">
        Loading…
      </Text>
    );
  }

  const status = published
    ? `Published v${published.version}${draft ? ` — editing draft v${draft.version}` : ""}`
    : draft
      ? `Draft v${draft.version} — nothing published yet`
      : "No document yet";

  return (
    <Stack dir="col" scale="lg" data-testid="legal-editor">
      <Card>
        <Header>
          <Stack dir="col" scale="2xs">
            <Stack dir="row" align="center" justify="between" scale="md" wrap>
              <Text as="h2" type="heading4">{documentTypeLabel(type)}</Text>
              <Stack dir="row" align="center" scale="xs">
                {published && (
                  <Badge emphasis="quiet" status="success">
                    Published v{published.version}
                  </Badge>
                )}
                {draft && (
                  <Badge emphasis="quiet" status="warning">
                    Draft v{draft.version}
                  </Badge>
                )}
                {!published && !draft && <Badge emphasis="quiet">No document yet</Badge>}
              </Stack>
            </Stack>
            <Text type="body-small"
emphasis="quiet"
              data-testid="legal-editor-status"
            >
              {status}
            </Text>
          </Stack>
        </Header>
        <Content>
          <Stack dir="col" scale="lg">
            <Stack dir="col" scale="xs">
              <Label htmlFor="legal-editor-title">Title</Label>
              <Input
                id="legal-editor-title"
                data-testid="legal-editor-title"
                value={title}
                placeholder="Document title"
                onChange={(value) => setTitle(value)}
              />
            </Stack>
            <Stack dir="col" scale="xs">
              <Label>Body</Label>
              <RichTextEditor
                key={`${type}:${orgTypeId ?? "platform"}:${base?.id ?? "new"}`}
                content={base?.contentHtml ?? ""}
                onChangeHtml={setContentHtml}
              />
            </Stack>
          </Stack>
        </Content>
        <Footer position="fill">
          <Stack dir="row" justify="end" scale="sm" size="fill">
            <Button
              data-testid="legal-editor-save"
              emphasis="secondary"
              disabled={!title.trim() || !contentHtml.trim() || save.isPending}
              onClick={() => save.mutate()}
            >
              Save draft
            </Button>
            {draft && (
              <Button
                data-testid="legal-editor-publish"
                disabled={publish.isPending}
                onClick={() => publish.mutate(draft)}
              >
                Publish v{draft.version}
              </Button>
            )}
          </Stack>
        </Footer>
      </Card>
      {error && (
        <Alert status="error" data-testid="legal-editor-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
      {contentHtml.trim() && (
        <Card>
          <Header>
            <Text type="body-small" emphasis="quiet">
              Preview
            </Text>
          </Header>
          <Content>
            <Text type="body" data-testid="legal-editor-preview" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </Content>
        </Card>
      )}
    </Stack>
  );
}
