/** OrgMeteorsPage — /meteors: the active organization's meteors, drafts included. */

import * as React from "react";
import { Button, Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { mounted } from "../../services/application/mount";
import { meteorsService } from "../../services/application/meteors.service";
import { ListPagination } from "@libs/list-query/client";
import { MeteorList } from "../../shared/components/MeteorList";
import { EditingNow } from "@modules/collaboration/web";

const PAGE_SIZE = 20;

export interface OrgMeteorsPageProps { page: number; search: string; meteorsPath: string }

export function OrgMeteorsPage({ page, search, meteorsPath }: OrgMeteorsPageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data, isPending, isError } = useQuery(meteorsService.getOrgMeteors({ page, pageSize: PAGE_SIZE, search: search || undefined }));
  // the page's meteors' locks, in one request beside the list's; who is editing each, live, from each row (EditingNow)
  const { data: locked } = useQuery(meteorsService.getLocksOf(data?.rows.map((row) => row.id) ?? []));
  const locks = new Map((locked ?? []).map((lock) => [lock.documentId, lock]));
  if (isPending) return null;
  if (isError) return <span element="type--body-small">Your organization's meteors are not available right now.</span>;
  return (
    <Stack dir="col" scale="xl" data-testid="org-meteors-page" className="w-full max-w-4xl">
      <Card><Content>
        <Stack dir="col" scale="lg">
          <Stack dir="row" justify="end">
            <Button buttonType="icon-text" startIcon="add" data-testid="meteor-new-btn" onClick={() => void router?.navigate({ to: `${meteorsPath}/new` })}>Add meteor</Button>
          </Stack>
          <MeteorList rows={data.rows} emptyText="No meteors yet. Add the first one." lockedBy={(id) => locks.get(id)?.lockedByName} besideName={(id) => <EditingNow kind="meteor" id={id} />} onOpen={(id) => void router?.navigate({ to: `${meteorsPath}/${id}` })} />
          <ListPagination query={{ page, pageSize: PAGE_SIZE }} total={data.total} onPageChange={(next) => void router?.navigate({ to: `${meteorsPath}?page=${next}` })} />
        </Stack>
      </Content></Card>
    </Stack>
  );
}
