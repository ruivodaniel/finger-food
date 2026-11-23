/**
 * OrgMeteorPage — /meteors/:meteorId: the view of one of the organization's
 * meteors, draft or published, with edit (a link), publish / unpublish and delete.
 * A denied write comes back forbidden; the page shows the controls regardless.
 */

import * as React from "react";
import { Button, Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { mounted } from "../../services/application/mount";
import { meteorsService } from "../../services/application/meteors.service";
import type { UpdateMeteorInput } from "../../../shared/types";
import { isApiError } from "../../shared/helpers/api-error";
import { MeteorDetail } from "../../shared/components/MeteorDetail";
import { MeteorHistory } from "./components/MeteorHistory";
import { LockToggle } from "@modules/collaboration/web";

export interface OrgMeteorPageProps { meteorId: string; meteorsPath: string }

export function OrgMeteorPage({ meteorId, meteorsPath }: OrgMeteorPageProps): React.ReactElement | null {
  const { router, toast } = mounted();
  const { data, isPending, isError } = useQuery(meteorsService.getOrgMeteor(meteorId));
  const update = useMutation({ mutationFn: (input: UpdateMeteorInput) => meteorsService.update(meteorId, input) });
  const remove = useMutation({ mutationFn: meteorsService.remove });
  const [showHistory, setShowHistory] = React.useState(false);
  // a locked meteor isn't edited, published or deleted: the server refuses, and the page says why. LockToggle watches
  // the meteor, so a lock by anyone refreshes this query.
  const lock = useQuery(meteorsService.getLockState(meteorId)).data?.lock ?? null;
  const lockedTitle = lock ? `Locked by ${lock.lockedByName}` : undefined;
  const fail = (e: unknown) => toast?.error(isApiError(e) ? e.message : "something went wrong");

  if (isPending) return null;
  if (isError || !data) return <span element="type--body-small" data-testid="meteor-not-found">This meteor is not available.</span>;

  const published = data.status === "published";
  return (
    <Stack dir="col" scale="lg" data-testid="org-meteor-page" className="w-full max-w-2xl">
      <Stack dir="row" justify="between" align="center">
        <Button buttonType="icon-text" startIcon="arrowLeft" emphasis="secondary" scale="sm" onClick={() => void router?.navigate({ to: meteorsPath })}>All meteors</Button>
        <Stack dir="row" scale="sm">
          <Button emphasis="secondary" scale="sm" data-testid="meteor-history-btn" onClick={() => setShowHistory((shown) => !shown)}>
            {showHistory ? "Hide history" : "History"}
          </Button>
          <Button emphasis="secondary" scale="sm" data-testid="meteor-edit-btn" disabled={Boolean(lock)} title={lockedTitle} onClick={() => void router?.navigate({ to: `${meteorsPath}/${meteorId}/edit` })}>Edit</Button>
          <Button emphasis="secondary" scale="sm" data-testid="meteor-publish-btn" disabled={update.isPending || Boolean(lock)} title={lockedTitle}
            onClick={() => update.mutate({ status: published ? "draft" : "published" }, { onError: fail })}>
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button emphasis="secondary" scale="sm" data-testid="meteor-delete-btn" disabled={remove.isPending || Boolean(lock)} title={lockedTitle}
            onClick={() => { if (window.confirm(`Delete ${data.name}?`)) remove.mutate(meteorId, { onSuccess: () => void router?.navigate({ to: meteorsPath }), onError: fail }); }}>
            Delete
          </Button>
        </Stack>
      </Stack>
      <Stack dir="row" justify="end"><LockToggle kind="meteor" documentId={meteorId} /></Stack>
      <Card><Content><MeteorDetail meteor={data} /></Content></Card>
      {/* keyed by the meteor's last change, so that a change made here reads the history again */}
      {showHistory && <Card><Content><MeteorHistory key={data.updatedAt} meteorId={meteorId} onRestored={() => void meteorsService.refresh()} /></Content></Card>}
    </Stack>
  );
}
