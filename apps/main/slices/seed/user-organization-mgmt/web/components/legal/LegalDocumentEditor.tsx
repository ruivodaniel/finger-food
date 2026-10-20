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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
  Label,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { RichTextEditor } from "@libs/rich-text-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import type { LegalDocumentView } from "../../../shared/types/domain";
import { documentTypeLabel } from "./LegalAdminSidebar";
import type { LegalAdminSelection } from "./legal-admin-selection";
import { StatusAlert } from "../StatusAlert";

export interface LegalDocumentEditorProps {
  selection: LegalAdminSelection;
}

export function LegalDocumentEditor({
  selection,
}: LegalDocumentEditorProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { type, orgTypeId } = selection;

  const { data: versions, isLoading } = useQuery({
    queryKey: queryKeys.legalVersions(type, orgTypeId),
    queryFn: () => client.listLegalDocumentVersions(type, orgTypeId),
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
        queryKey: queryKeys.legalVersions(type, orgTypeId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.legalDocument(type, orgTypeId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.gate }),
    ]);

  const save = useMutation({
    mutationFn: () => client.saveLegalDraft({ type, orgTypeId, title, contentHtml }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "something went wrong"),
  });

  const publish = useMutation({
    mutationFn: (doc: LegalDocumentView) => client.publishLegalDocument(doc.id),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "something went wrong"),
  });

  if (isLoading) {
    return (
      <span element="type--body-small" emphasis="quiet">
        Loading…
      </span>
    );
  }

  const status = published
    ? `Published v${published.version}${draft ? ` — editing draft v${draft.version}` : ""}`
    : draft
      ? `Draft v${draft.version} — nothing published yet`
      : "No document yet";

  return (
    <Stack dir="col" gap={16} data-testid="legal-editor">
      <Card>
        <CardHeader>
          <Stack dir="col" gap={4}>
            <Stack dir="row" align="center" justify="between" gap={12} wrap>
              <h2 element="type--heading4">{documentTypeLabel(type)}</h2>
              <Stack dir="row" align="center" gap={6}>
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
            <span
              element="type--body-small"
              emphasis="quiet"
              data-testid="legal-editor-status"
            >
              {status}
            </span>
          </Stack>
        </CardHeader>
        <CardContent>
          <Stack dir="col" gap={16}>
            <Stack dir="col" gap={6}>
              <Label htmlFor="legal-editor-title">Title</Label>
              <Input
                id="legal-editor-title"
                data-testid="legal-editor-title"
                value={title}
                placeholder="Document title"
                onChange={(e) => setTitle(e.target.value)}
              />
            </Stack>
            <Stack dir="col" gap={6}>
              <Label>Body</Label>
              <RichTextEditor
                key={`${type}:${orgTypeId ?? "platform"}:${base?.id ?? "new"}`}
                content={base?.contentHtml ?? ""}
                onChangeHtml={setContentHtml}
              />
            </Stack>
          </Stack>
        </CardContent>
        <CardFooter position="fill">
          <Stack dir="row" justify="end" gap={8} className="w-full">
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
        </CardFooter>
      </Card>
      {error && (
        <StatusAlert status="error" testId="legal-editor-error">{error}</StatusAlert>
      )}
      {contentHtml.trim() && (
        <Card>
          <CardHeader>
            <span element="type--body-small" emphasis="quiet">
              Preview
            </span>
          </CardHeader>
          <CardContent>
            <Stack dir="col" gap={12} data-testid="legal-editor-preview" element="type--body" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
